from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime


class CartItemAdd(BaseModel):
    product_id: uuid.UUID
    product_option_id: Optional[uuid.UUID] = None
    quantity: int = Field(default=1, ge=1, le=999)


class CartItemUpdate(BaseModel):
    item_id: uuid.UUID
    quantity: int = Field(..., ge=1, le=999)


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_option_id: Optional[uuid.UUID] = None
    quantity: int
    price: float
    product_name: Optional[str] = None
    option_label: Optional[str] = None

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    items: List[CartItemResponse] = []
    total: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}
