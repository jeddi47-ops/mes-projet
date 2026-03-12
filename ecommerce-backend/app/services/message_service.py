import logging
import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.message import Message
from app.models.notification import NotificationType
from app.models.user import User, Role
from app.schemas.message import MessageResponse, ConversationSummary
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)


def _user_display_name(user: User) -> str:
    """Retourne le nom d'affichage d'un utilisateur."""
    name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    return name or user.email


async def _find_first_admin(db: AsyncSession) -> User:
    """Retourne le premier admin actif. Lève une exception si aucun admin n'existe."""
    result = await db.execute(
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(Role.name == "admin", User.is_active == True)  # noqa: E712
        .limit(1)
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Aucun administrateur disponible pour le moment",
        )
    return admin


async def send_message(
    sender: User,
    receiver_id: Optional[uuid.UUID],
    content: str,
    db: AsyncSession,
) -> Message:
    """
    Envoie un message et crée une notification pour le destinataire.

    Règles :
    - Utilisateur normal : envoie automatiquement à l'admin (receiver_id ignoré).
    - Admin : receiver_id est obligatoire.
    """
    is_admin = sender.role and sender.role.name == "admin"

    if not is_admin:
        # L'utilisateur envoie toujours à l'admin
        admin = await _find_first_admin(db)
        actual_receiver_id = admin.id
    else:
        if not receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'admin doit spécifier un destinataire (receiver_id)",
            )
        # Vérification que le destinataire existe
        result = await db.execute(select(User).where(User.id == receiver_id))
        receiver = result.scalar_one_or_none()
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destinataire non trouvé",
            )
        actual_receiver_id = receiver_id

    message = Message(
        sender_id=sender.id,
        receiver_id=actual_receiver_id,
        content=content,
    )
    db.add(message)
    await db.flush()

    # Notification pour le destinataire
    sender_name = _user_display_name(sender)
    await create_notification(
        user_id=actual_receiver_id,
        type=NotificationType.MESSAGE,
        title=f"Nouveau message de {sender_name}",
        content=content[:100] + ("..." if len(content) > 100 else ""),
        data={"sender_id": str(sender.id), "message_id": str(message.id)},
        db=db,
    )

    await db.commit()
    await db.refresh(message)
    return message


async def get_conversation(
    current_user: User,
    other_user_id: uuid.UUID,
    db: AsyncSession,
) -> List[Message]:
    """
    Retourne les messages entre l'utilisateur courant et other_user_id.
    Marque automatiquement les messages reçus non lus comme lus.

    Sécurité :
    - Un utilisateur normal ne peut accéder qu'à sa conversation avec l'admin.
    - L'admin peut accéder à n'importe quelle conversation.
    """
    is_admin = current_user.role and current_user.role.name == "admin"

    if not is_admin:
        # Valider que other_user_id est bien un admin
        result = await db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .where(User.id == other_user_id, Role.name == "admin")
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous pouvez uniquement consulter votre conversation avec l'admin",
            )

    # Récupération des messages
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.created_at)
    )
    messages = list(result.scalars().all())

    # Marquer comme lus les messages reçus non lus
    unread_ids = [m.id for m in messages if m.receiver_id == current_user.id and not m.is_read]
    if unread_ids:
        for message in messages:
            if message.id in unread_ids:
                message.is_read = True
        await db.commit()

    return messages


async def get_conversations(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> List[ConversationSummary]:
    """
    Retourne la liste des conversations (résumé par interlocuteur).
    Triées par date du dernier message, les plus récentes en premier.
    """
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver),
        )
        .where(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        )
        .order_by(desc(Message.created_at))
    )
    messages = list(result.scalars().all())

    # Regroupement par interlocuteur (ordre : dernier message en tête)
    seen: dict[uuid.UUID, ConversationSummary] = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        other_user = msg.receiver if msg.sender_id == user_id else msg.sender

        if other_id not in seen:
            seen[other_id] = ConversationSummary(
                user_id=other_id,
                user_name=_user_display_name(other_user),
                user_email=other_user.email,
                last_message=msg.content,
                last_message_at=msg.created_at,
                unread_count=0,
            )

        # Compter les messages non lus envoyés PAR l'autre vers moi
        if msg.receiver_id == user_id and not msg.is_read:
            seen[other_id].unread_count += 1

    return list(seen.values())
