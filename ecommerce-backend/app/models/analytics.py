import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class PageView(Base, TimestampMixin):
    __tablename__ = "page_views"

    path: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relations
    user: Mapped[Optional["User"]] = relationship("User", back_populates="page_views")
