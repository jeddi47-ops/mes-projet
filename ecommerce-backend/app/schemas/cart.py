from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_option_id: Optional[uuid.UUID] = None
    quantity: int
    price: float

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    items: List[CartItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
