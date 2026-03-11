# Import de tous les modèles pour enregistrement dans les métadonnées SQLAlchemy
# Cet ordre est important pour respecter les dépendances de clés étrangères

from app.models.user import User, Role, RefreshToken
from app.models.product import Product, ProductOption, ProductImage, Review
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.message import Message
from app.models.notification import Notification, NotificationType
from app.models.analytics import PageView

__all__ = [
    "User",
    "Role",
    "RefreshToken",
    "Product",
    "ProductOption",
    "ProductImage",
    "Review",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentStatus",
    "Message",
    "Notification",
    "NotificationType",
    "PageView",
]
