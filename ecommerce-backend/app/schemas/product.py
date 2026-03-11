from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime


# ── Réponses imbriquées ──────────────────────────────────────────────────────

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


class ReviewUserInfo(BaseModel):
    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None

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


class ReviewDetailResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    is_verified: bool
    created_at: datetime
    user: Optional[ReviewUserInfo] = None

    model_config = {"from_attributes": True}


# ── Réponses produit ─────────────────────────────────────────────────────────

class ProductResponse(BaseModel):
    """Réponse allégée — utilisée dans les listes."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock: int
    category: Optional[str] = None
    slug: str
    is_active: bool
    images: List[ProductImageResponse] = []
    options: List[ProductOptionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(BaseModel):
    """Réponse complète — utilisée pour un produit unique."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock: int
    category: Optional[str] = None
    slug: str
    is_active: bool
    images: List[ProductImageResponse] = []
    options: List[ProductOptionResponse] = []
    reviews: List[ReviewDetailResponse] = []
    average_rating: Optional[float] = None
    reviews_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductCatalogItem(BaseModel):
    """Item dans le catalogue — avec statistiques d'avis."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock: int
    category: Optional[str] = None
    slug: str
    is_active: bool
    images: List[ProductImageResponse] = []
    average_rating: Optional[float] = None
    reviews_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class CatalogResponse(BaseModel):
    """Réponse paginée du catalogue."""
    items: List[ProductCatalogItem]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


# ── Schémas de requête (entrée) ──────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="Prix en euros")
    discount_price: Optional[float] = Field(None, gt=0, description="Prix remisé")
    stock: int = Field(0, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, description="Auto-généré à partir du nom si absent")
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    discount_price: Optional[float] = Field(None, ge=0, description="0 = supprimer la remise")
    stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOptionCreate(BaseModel):
    name: str = Field(..., description="Nom de l'option (ex: Couleur, Taille, Stockage)")
    value: str = Field(..., description="Valeur de l'option (ex: Noir, XL, 256 Go)")
    price_modifier: float = Field(0.0, description="Supplément de prix pour cette option")
    stock: int = Field(0, ge=0)


class ProductImageCreate(BaseModel):
    url: str = Field(..., description="URL CDN Cloudinary de l'image")
    public_id: str = Field(..., description="ID public Cloudinary (pour suppression)")
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: bool = False
    order: int = Field(0, ge=0)


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Note de 1 à 5")
    comment: Optional[str] = None
