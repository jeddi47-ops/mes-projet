import logging
import uuid
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.config import settings

logger = logging.getLogger(__name__)


async def create_order(
    user: User,
    data: OrderCreate,
    db: AsyncSession,
) -> Order:
    """
    Convertit le panier de l'utilisateur en commande.
    - Vérifie que chaque produit est actif et en stock.
    - Crée un snapshot des articles (nom, prix, options).
    - Vide le panier après création.
    - Génère la facture PDF et l'envoie par email.
    Le stock n'est PAS décrémenté ici (uniquement lors du passage au statut 'paid').
    """
    # 1. Chargement du panier avec tous les articles
    result = await db.execute(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product),
            selectinload(Cart.items).selectinload(CartItem.product_option),
        )
        .where(Cart.user_id == user.id)
    )
    cart = result.scalar_one_or_none()

    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Votre panier est vide",
        )

    # 2. Validation : produits actifs et stock suffisant
    for item in cart.items:
        if not item.product or not item.product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le produit '{item.product.name if item.product else item.product_id}' n'est plus disponible",
            )
        stock = (
            item.product_option.stock
            if item.product_option and item.product_option.stock is not None
            else item.product.stock
        )
        if stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant pour '{item.product.name}'. Disponible : {stock}",
            )

    # 3. Calcul du total
    total = sum(item.price * item.quantity for item in cart.items)

    # 4. Création de la commande
    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING_PAYMENT,
        total_amount=total,
        shipping_address=data.shipping_address.model_dump(),
        notes=data.notes,
        payment_method=data.payment_method,
    )
    db.add(order)
    await db.flush()  # Obtenir l'ID de la commande

    # 5. Création des articles de commande (snapshot)
    for item in cart.items:
        options_snapshot = None
        if item.product_option:
            options_snapshot = {
                "name": item.product_option.name,
                "value": item.product_option.value,
                "price_modifier": float(item.product_option.price_modifier or 0),
            }

        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_option_id=item.product_option_id,
            quantity=item.quantity,
            unit_price=item.price,
            product_name=item.product.name,
            selected_options=options_snapshot,
        )
        db.add(order_item)

    # 6. Vidage du panier
    for item in cart.items:
        await db.delete(item)

    await db.commit()

    # 7. Rechargement de la commande avec ses articles
    order_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    order = order_result.scalar_one()

    # 8. Génération de la facture PDF
    addr = data.shipping_address
    invoice_items = [
        {
            "name": oi.product_name,
            "option": (
                f"{oi.selected_options['name']}: {oi.selected_options['value']}"
                if oi.selected_options
                else None
            ),
            "quantity": oi.quantity,
            "unit_price": oi.unit_price,
            "subtotal": oi.unit_price * oi.quantity,
        }
        for oi in order.items
    ]

    try:
        from app.services.pdf_service import generate_invoice_pdf
        pdf_bytes = generate_invoice_pdf(
            order_id=str(order.id),
            order_date=order.created_at,
            customer_name=addr.full_name,
            customer_phone=addr.phone,
            shipping_address=addr.model_dump(),
            items=invoice_items,
            total_amount=order.total_amount,
            app_name=settings.APP_NAME,
        )
    except Exception as e:
        logger.error(f"Erreur génération PDF commande {order.id}: {e}")
        pdf_bytes = None

    # 9. Envoi de l'email avec la facture en pièce jointe
    if pdf_bytes:
        try:
            from app.services.email_service import send_invoice_email
            await send_invoice_email(
                to=user.email,
                customer_name=addr.full_name,
                order_id=str(order.id),
                total_amount=order.total_amount,
                pdf_bytes=pdf_bytes,
            )
        except Exception as e:
            logger.error(f"Erreur envoi email facture commande {order.id}: {e}")
            # On ne bloque pas la création de commande si l'email échoue

    # 10. Notification pour l'admin
    try:
        from app.services.notification_service import get_first_admin_id, create_notification
        from app.models.notification import NotificationType
        admin_id = await get_first_admin_id(db)
        if admin_id:
            order_number = str(order.id)[:8].upper()
            customer_name_str = addr.full_name
            await create_notification(
                user_id=admin_id,
                type=NotificationType.ORDER,
                title=f"Nouvelle commande #{order_number}",
                content=f"Commande de {customer_name_str} — Total : {order.total_amount:.2f} EUR",
                data={"order_id": str(order.id), "total": order.total_amount},
                db=db,
            )
            await db.commit()
    except Exception as e:
        logger.error(f"Erreur création notification commande {order.id}: {e}")

    return order


async def list_orders(
    user: User,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
) -> List[Order]:
    """
    Liste les commandes :
    - Utilisateur connecté → ses propres commandes uniquement.
    - Admin → toutes les commandes.
    """
    is_admin = user.role and user.role.name == "admin"

    base_query = select(Order).options(selectinload(Order.items))
    if not is_admin:
        base_query = base_query.where(Order.user_id == user.id)

    base_query = base_query.order_by(Order.created_at.desc())

    # Pagination
    offset = (page - 1) * per_page
    result = await db.execute(base_query.offset(offset).limit(per_page))
    orders = list(result.scalars().all())

    return orders


async def get_order(
    order_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Order:
    """
    Récupère le détail d'une commande.
    - L'utilisateur ne peut voir que ses propres commandes.
    - L'admin peut voir toutes les commandes.
    """
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée",
        )

    is_admin = user.role and user.role.name == "admin"
    if not is_admin and order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cette commande",
        )

    return order


async def update_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: AsyncSession,
) -> Order:
    """
    Met à jour le statut d'une commande (admin uniquement).
    Décrémente le stock des produits uniquement lors du passage au statut 'paid'.
    """
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée",
        )

    old_status = order.status
    new_status = data.status

    # Décrémenter le stock uniquement lors du passage à 'paid'
    if new_status == OrderStatus.PAID and old_status != OrderStatus.PAID:
        for item in order.items:
            product = item.product
            if not product:
                continue
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuffisant pour '{product.name}'. "
                           f"Disponible : {product.stock}, requis : {item.quantity}",
                )
            product.stock -= item.quantity

    order.status = new_status
    await db.commit()

    # Rechargement
    order_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    return order_result.scalar_one()
