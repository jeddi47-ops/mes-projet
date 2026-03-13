from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime


class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    role: Optional[RoleResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    created_at: datetime
    orders_count: int = 0

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
