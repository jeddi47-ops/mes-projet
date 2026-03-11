import uuid
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services import order_service

router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=201, tags=["Commandes"])
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crée une commande à partir du panier actuel.

    - Le panier doit contenir au moins un article.
    - Tous les produits doivent être actifs et en stock.
    - Le panier est vidé automatiquement après la création.
    - La facture PDF est générée et envoyée par email.
    - Statut initial : **pending_payment**.
    - Le stock n'est PAS décrémenté à ce stade.
    """
    return await order_service.create_order(current_user, data, db)


@router.get("/orders", response_model=List[OrderResponse], tags=["Commandes"])
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Liste les commandes.
    - **Utilisateur** : uniquement ses propres commandes, de la plus récente à la plus ancienne.
    - **Admin** : toutes les commandes de tous les utilisateurs.
    """
    return await order_service.list_orders(current_user, db, page=page, per_page=per_page)


@router.get("/orders/{order_id}", response_model=OrderResponse, tags=["Commandes"])
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère le détail d'une commande.
    - Un utilisateur ne peut consulter que ses propres commandes.
    - Un admin peut consulter n'importe quelle commande.
    """
    return await order_service.get_order(order_id, current_user, db)


@router.put(
    "/orders/{order_id}/status",
    response_model=OrderResponse,
    tags=["Commandes"],
)
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Met à jour le statut d'une commande. **Réservé aux administrateurs.**

    Flux de statuts :
    - `pending_payment` → En attente de paiement (statut initial)
    - `payment_discussion` → Paiement en cours de discussion avec le client
    - `paid` → **Paiement confirmé** — le stock est décrémenté à ce moment
    - `cancelled` → Commande annulée

    Le stock n'est décrémenté qu'au passage vers `paid`.
    """
    return await order_service.update_status(order_id, data, db)
