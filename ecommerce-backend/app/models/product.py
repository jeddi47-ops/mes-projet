import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Float, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relations
    options: Mapped[List["ProductOption"]] = relationship(
        "ProductOption", back_populates="product", cascade="all, delete-orphan"
    )
    images: Mapped[List["ProductImage"]] = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="product", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")


class ProductOption(Base, TimestampMixin):
    __tablename__ = "product_options"

    product_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)   # ex: taille, couleur
    value: Mapped[str] = mapped_column(String(100), nullable=False)  # ex: XL, rouge
    price_modifier: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relations
    product: Mapped["Product"] = relationship("Product", back_populates="options")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product_option")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product_option")


class ProductImage(Base, TimestampMixin):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    public_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Cloudinary public_id
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relations
    product: Mapped["Product"] = relationship("Product", back_populates="images")


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    product_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 à 5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relations
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")
    user: Mapped["User"] = relationship("User", back_populates="reviews")
