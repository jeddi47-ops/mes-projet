import logging
from datetime import datetime, timezone, date
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.models.message import Message
from app.schemas.admin import AdminStats

logger = logging.getLogger(__name__)


async def get_stats(db: AsyncSession) -> AdminStats:
    """Calcule les statistiques globales pour le dashboard admin."""
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    # Total commandes
    total_orders = await db.scalar(select(func.count(Order.id))) or 0

    # Revenu total (uniquement les commandes au statut 'paid')
    total_revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0.0))
        .where(Order.status == OrderStatus.PAID)
    ) or 0.0

    # Total utilisateurs actifs
    total_users = await db.scalar(
        select(func.count(User.id)).where(User.is_active == True)  # noqa: E712
    ) or 0

    # Total produits (actifs uniquement)
    total_products = await db.scalar(
        select(func.count(Product.id)).where(Product.is_active == True)  # noqa: E712
    ) or 0

    # Commandes créées aujourd'hui
    orders_today = await db.scalar(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    ) or 0

    return AdminStats(
        total_orders=int(total_orders),
        total_revenue=float(total_revenue),
        total_users=int(total_users),
        total_products=int(total_products),
        orders_today=int(orders_today),
    )


async def get_all_orders(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
) -> List[Order]:
    """Retourne toutes les commandes avec les informations utilisateur, paginées."""
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.user),
        )
        .order_by(desc(Order.created_at))
        .offset(offset)
        .limit(per_page)
    )
    return list(result.scalars().all())


async def get_all_products(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
) -> List[Product]:
    """Retourne tous les produits (y compris inactifs), paginés, du plus récent au plus ancien."""
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.options))
        .order_by(desc(Product.created_at))
        .offset(offset)
        .limit(per_page)
    )
    return list(result.scalars().all())


async def get_all_conversations(db: AsyncSession) -> list:
    """
    Retourne la liste de toutes les conversations (groupées par utilisateur non-admin).
    Utilisé par l'admin pour voir tous les échanges.
    """
    from app.models.user import Role
    from app.services.message_service import get_conversations, _user_display_name
    from sqlalchemy import or_

    # Trouver l'admin
    from app.services.notification_service import get_first_admin_id
    admin_id = await get_first_admin_id(db)
    if not admin_id:
        return []

    # Utiliser le service de messages pour obtenir toutes les conversations de l'admin
    return await get_conversations(admin_id, db)
