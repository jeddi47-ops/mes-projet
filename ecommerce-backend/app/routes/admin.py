from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import require_admin
from app.models.user import User
from app.schemas.admin import AdminStats
from app.schemas.order import OrderResponse
from app.schemas.product import ProductResponse
from app.schemas.message import ConversationSummary
from app.services import admin_service

router = APIRouter()


@router.get("/admin/stats", response_model=AdminStats, tags=["Admin"])
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Statistiques globales du site. **Réservé aux administrateurs.**

    Retourne :
    - `total_orders` : nombre total de commandes
    - `total_revenue` : revenu total (commandes au statut `paid`)
    - `total_users` : nombre d'utilisateurs actifs
    - `total_products` : nombre de produits actifs
    - `orders_today` : commandes créées aujourd'hui
    """
    return await admin_service.get_stats(db)


@router.get("/admin/orders", response_model=List[OrderResponse], tags=["Admin"])
async def get_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Liste toutes les commandes avec les informations client. **Réservé aux administrateurs.**
    Paginée, triée du plus récent au plus ancien.
    """
    return await admin_service.get_all_orders(db, page=page, per_page=per_page)


@router.get("/admin/products", response_model=List[ProductResponse], tags=["Admin"])
async def get_all_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Liste tous les produits y compris les inactifs. **Réservé aux administrateurs.**
    Paginée, triée du plus récent au plus ancien.
    """
    return await admin_service.get_all_products(db, page=page, per_page=per_page)


@router.get("/admin/messages", response_model=List[ConversationSummary], tags=["Admin"])
async def get_all_messages(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Liste toutes les conversations avec les utilisateurs. **Réservé aux administrateurs.**
    Triées par date du dernier message (plus récent en tête).
    """
    return await admin_service.get_all_conversations(db)
