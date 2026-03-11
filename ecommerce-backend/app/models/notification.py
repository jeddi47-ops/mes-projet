import uuid
from typing import Optional
from enum import Enum as PyEnum
from sqlalchemy import Text, Boolean, ForeignKey, JSON, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class NotificationType(str, PyEnum):
    ORDER = "order"
    MESSAGE = "message"
    REVIEW = "review"
    SYSTEM = "system"
    PROMOTION = "promotion"


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType, name="notification_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Métadonnées extras

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="notifications")
