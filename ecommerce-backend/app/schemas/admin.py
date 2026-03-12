from pydantic import BaseModel
from typing import List
from app.schemas.message import ConversationSummary
from app.schemas.order import OrderResponse
from app.schemas.product import ProductResponse


class AdminStats(BaseModel):
    total_orders: int
    total_revenue: float
    total_users: int
    total_products: int
    orders_today: int
