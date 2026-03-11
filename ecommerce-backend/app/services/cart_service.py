import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductOption
from app.schemas.cart import CartItemAdd, CartItemUpdate

logger = logging.getLogger(__name__)


async def get_cart_with_items(user_id: uuid.UUID, db: AsyncSession) -> Cart:
    """Récupère le panier de l'utilisateur avec tous ses articles chargés."""
    result = await db.execute(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product),
            selectinload(Cart.items).selectinload(CartItem.product_option),
        )
        .where(Cart.user_id == user_id)
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        cart.items = []
    return cart


async def add_item(
    user_id: uuid.UUID,
    data: CartItemAdd,
    db: AsyncSession,
) -> CartItem:
    """
    Ajoute un article au panier.
    - Vérifie que le produit est actif.
    - Vérifie le stock disponible.
    - Si le même article existe déjà, incrémente la quantité.
    """
    # Vérification du produit
    result = await db.execute(
        select(Product).where(
            Product.id == data.product_id,
            Product.is_active == True,  # noqa: E712
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé ou désactivé",
        )

    # Détermination du prix de base
    price = float(product.discount_price) if product.discount_price else float(product.price)

    # Vérification de l'option si fournie
    option: ProductOption | None = None
    if data.product_option_id:
        opt_result = await db.execute(
            select(ProductOption).where(
                ProductOption.id == data.product_option_id,
                ProductOption.product_id == data.product_id,
            )
        )
        option = opt_result.scalar_one_or_none()
        if not option:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Option produit non trouvée",
            )
        price += float(option.price_modifier or 0)

    # Vérification du stock
    available_stock = (
        int(option.stock) if option and option.stock is not None else int(product.stock)
    )
    if available_stock < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuffisant. Disponible : {available_stock}",
        )

    # Récupération ou création du panier
    cart = await get_cart_with_items(user_id, db)

    # Vérification d'un article identique déjà présent
    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == data.product_id,
            CartItem.product_option_id == data.product_option_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        new_qty = existing.quantity + data.quantity
        if available_stock < new_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant. Disponible : {available_stock}",
            )
        existing.quantity = new_qty
        await db.commit()
        await db.refresh(existing)
        return existing

    # Création d'un nouvel article
    item = CartItem(
        cart_id=cart.id,
        product_id=data.product_id,
        product_option_id=data.product_option_id,
        quantity=data.quantity,
        price=price,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_item(
    user_id: uuid.UUID,
    data: CartItemUpdate,
    db: AsyncSession,
) -> CartItem:
    """Met à jour la quantité d'un article du panier (appartenant à cet utilisateur)."""
    result = await db.execute(
        select(CartItem)
        .join(Cart, CartItem.cart_id == Cart.id)
        .options(selectinload(CartItem.product), selectinload(CartItem.product_option))
        .where(
            CartItem.id == data.item_id,
            Cart.user_id == user_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article non trouvé dans votre panier",
        )

    # Vérification du stock
    available_stock = (
        int(item.product_option.stock)
        if item.product_option and item.product_option.stock is not None
        else int(item.product.stock)
    )
    if available_stock < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuffisant. Disponible : {available_stock}",
        )

    item.quantity = data.quantity
    await db.commit()
    await db.refresh(item)
    return item


async def remove_item(
    user_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Supprime un article du panier (appartenant à cet utilisateur)."""
    result = await db.execute(
        select(CartItem)
        .join(Cart, CartItem.cart_id == Cart.id)
        .where(
            CartItem.id == item_id,
            Cart.user_id == user_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article non trouvé dans votre panier",
        )
    await db.delete(item)
    await db.commit()
