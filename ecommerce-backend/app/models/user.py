import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relations
    users: Mapped[List["User"]] = relationship("User", back_populates="role")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("roles.id"), nullable=True
    )

    # Relations
    role: Mapped[Optional["Role"]] = relationship("Role", back_populates="users")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="user")
    cart: Mapped[Optional["Cart"]] = relationship("Cart", back_populates="user", uselist=False)
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
    sent_messages: Mapped[List["Message"]] = relationship(
        "Message", foreign_keys="Message.sender_id", back_populates="sender"
    )
    received_messages: Mapped[List["Message"]] = relationship(
        "Message", foreign_keys="Message.receiver_id", back_populates="receiver"
    )
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    page_views: Mapped[List["PageView"]] = relationship("PageView", back_populates="user")


class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    device_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
