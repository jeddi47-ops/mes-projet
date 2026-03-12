import logging
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification import Notification, NotificationType
from app.models.user import User, Role

logger = logging.getLogger(__name__)


async def get_first_admin_id(db: AsyncSession) -> Optional[uuid.UUID]:
    """Retourne l'UUID du premier utilisateur avec le rôle 'admin'."""
    result = await db.execute(
        select(User.id)
        .join(Role, User.role_id == Role.id)
        .where(Role.name == "admin", User.is_active == True)  # noqa: E712
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create_notification(
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    content: str,
    db: AsyncSession,
    data: Optional[dict] = None,
) -> Notification:
    """Crée une notification pour un utilisateur."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        content=content,
        data=data,
    )
    db.add(notification)
    # Le commit sera géré par l'appelant
    return notification


async def get_user_notifications(
    user_id: uuid.UUID,
    db: AsyncSession,
    unread_only: bool = False,
    limit: int = 50,
) -> list:
    """Retourne les notifications d'un utilisateur, les plus récentes en premier."""
    from sqlalchemy import desc

    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa: E712

    query = query.order_by(desc(Notification.created_at)).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())
