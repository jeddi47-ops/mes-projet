from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime


class MessageSend(BaseModel):
    receiver_id: Optional[uuid.UUID] = None  # Ignoré pour les users normaux, requis pour admin
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    content: str
    is_read: bool
    sender_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    user_id: uuid.UUID
    user_name: str
    user_email: str
    last_message: str
    last_message_at: datetime
    unread_count: int
