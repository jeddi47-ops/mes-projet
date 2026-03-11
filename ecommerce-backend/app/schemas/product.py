from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime


class ProductImageResponse(BaseModel):
    id: uuid.UUID
    url: str
    alt_text: Optional[str] = None
    is_primary: bool
    order: int

    model_config = {"from_attributes": True}


class ProductOptionResponse(BaseModel):
    id: uuid.UUID
    name: str
    value: str
    price_modifier: float
    stock: int

    model_config = {"from_attributes": True}


class ReviewResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category: Optional[str] = None
    slug: str
    is_active: bool
    images: List[ProductImageResponse] = []
    options: List[ProductOptionResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
