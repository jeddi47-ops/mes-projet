from pydantic import BaseModel
from typing import Optional, List, Any
import uuid
from datetime import datetime
from app.models.order import OrderStatus, PaymentStatus


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_option_id: Optional[uuid.UUID] = None
    quantity: int
    unit_price: float
    product_name: str

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    total_amount: float
    shipping_address: Optional[Any] = None
    payment_status: PaymentStatus
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
