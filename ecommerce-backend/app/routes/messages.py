import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.message import MessageSend, MessageResponse, ConversationSummary
from app.services import message_service

router = APIRouter()


@router.post("/messages/send", response_model=MessageResponse, status_code=201, tags=["Messages"])
async def send_message(
    data: MessageSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Envoie un message.

    - **Utilisateur normal** : envoie automatiquement à l'admin (`receiver_id` ignoré).
    - **Admin** : doit renseigner `receiver_id` pour répondre à un utilisateur.

    Une notification est créée pour le destinataire.
    """
    msg = await message_service.send_message(
        sender=current_user,
        receiver_id=data.receiver_id,
        content=data.content,
        db=db,
    )
    sender_name = message_service._user_display_name(current_user)
    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        is_read=msg.is_read,
        sender_name=sender_name,
        created_at=msg.created_at,
    )


@router.get(
    "/messages/conversation/{user_id}",
    response_model=List[MessageResponse],
    tags=["Messages"],
)
async def get_conversation(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne les messages échangés entre l'utilisateur courant et `user_id`.

    - **Utilisateur** : `user_id` doit être l'ID de l'admin.
    - **Admin** : peut consulter la conversation avec n'importe quel utilisateur.

    Les messages reçus non lus sont automatiquement marqués comme lus.
    """
    messages = await message_service.get_conversation(current_user, user_id, db)
    return [
        MessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            receiver_id=m.receiver_id,
            content=m.content,
            is_read=m.is_read,
            sender_name=message_service._user_display_name(m.sender) if m.sender else None,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.get("/messages", response_model=List[ConversationSummary], tags=["Messages"])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne la liste des conversations de l'utilisateur courant.

    - **Utilisateur** : sa conversation avec l'admin.
    - **Admin** : toutes ses conversations avec les utilisateurs.

    Triées par date du dernier message (plus récent en tête).
    """
    return await message_service.get_conversations(current_user.id, db)
