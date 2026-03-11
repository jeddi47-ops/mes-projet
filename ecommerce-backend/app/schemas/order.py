from pydantic import BaseModel
from typing import Optional, List, Any
import uuid
from datetime import datetime
from app.models.order import OrderStatus


class ShippingAddress(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    postal_code: Optional[str] = None
    country: str


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    notes: Optional[str] = None
    payment_method: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_option_id: Optional[uuid.UUID] = None
    quantity: int
    unit_price: float
    product_name: str
    selected_options: Optional[Any] = None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    total_amount: float
    shipping_address: Optional[Any] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    invoice_url: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
