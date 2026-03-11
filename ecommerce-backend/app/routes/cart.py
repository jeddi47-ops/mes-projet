import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartItemResponse, CartResponse
from app.services import cart_service

router = APIRouter()


def _build_cart_response(cart) -> CartResponse:
    """Construit la réponse du panier à partir de l'ORM avec les relations chargées."""
    items = []
    for item in cart.items:
        option_label = None
        if item.product_option:
            option_label = f"{item.product_option.name}: {item.product_option.value}"

        items.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_option_id=item.product_option_id,
                quantity=item.quantity,
                price=item.price,
                product_name=item.product.name if item.product else None,
                option_label=option_label,
            )
        )

    total = sum(i.price * i.quantity for i in cart.items)

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        items=items,
        total=round(total, 2),
        created_at=cart.created_at,
    )


@router.get("/cart", response_model=CartResponse, tags=["Panier"])
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Récupère le panier de l'utilisateur connecté (créé automatiquement s'il n'existe pas)."""
    cart = await cart_service.get_cart_with_items(current_user.id, db)
    return _build_cart_response(cart)


@router.post("/cart/add", response_model=CartResponse, status_code=201, tags=["Panier"])
async def add_to_cart(
    data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ajoute un article au panier.
    Si le même produit/option est déjà présent, la quantité est incrémentée.

    - Vérifie que le produit est actif.
    - Vérifie la disponibilité du stock.
    - Le prix est capturé au moment de l'ajout (prix remisé en priorité).
    """
    await cart_service.add_item(current_user.id, data, db)
    cart = await cart_service.get_cart_with_items(current_user.id, db)
    return _build_cart_response(cart)


@router.put("/cart/update", response_model=CartResponse, tags=["Panier"])
async def update_cart_item(
    data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour la quantité d'un article du panier."""
    await cart_service.update_item(current_user.id, data, db)
    cart = await cart_service.get_cart_with_items(current_user.id, db)
    return _build_cart_response(cart)


@router.delete("/cart/remove/{item_id}", response_model=CartResponse, tags=["Panier"])
async def remove_from_cart(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Supprime un article du panier."""
    await cart_service.remove_item(current_user.id, item_id, db)
    cart = await cart_service.get_cart_with_items(current_user.id, db)
    return _build_cart_response(cart)
