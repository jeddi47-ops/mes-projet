from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductDetailResponse,
    ProductOptionCreate,
    ProductOptionResponse,
    ProductImageCreate,
    ProductImageResponse,
    ReviewCreate,
    ReviewResponse,
    ReviewDetailResponse,
    CatalogResponse,
)
from app.services import product_service
from app.services.cloudinary_service import generate_upload_signature

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# Catalogue
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/catalog", response_model=CatalogResponse, tags=["Catalogue"])
async def get_catalog(
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(20, ge=1, le=100, description="Résultats par page"),
    min_price: Optional[float] = Query(None, ge=0, description="Prix minimum"),
    max_price: Optional[float] = Query(None, ge=0, description="Prix maximum"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    search: Optional[str] = Query(None, description="Recherche dans nom et description"),
    sort_by: str = Query(
        "newest",
        enum=["newest", "oldest", "price_asc", "price_desc", "best_rated"],
        description="Critère de tri",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Catalogue public avec pagination, tri et filtres prix/catégorie/recherche."""
    return await product_service.get_catalog(
        db=db,
        page=page,
        per_page=per_page,
        min_price=min_price,
        max_price=max_price,
        category=category,
        search=search,
        sort_by=sort_by,
    )


# ──────────────────────────────────────────────────────────────────────────────
# CRUD Produits
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/products",
    response_model=ProductDetailResponse,
    status_code=201,
    tags=["Produits"],
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Crée un produit. Réservé aux administrateurs."""
    product = await product_service.create_product(data, db)
    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        discount_price=product.discount_price,
        stock=product.stock,
        category=product.category,
        slug=product.slug,
        is_active=product.is_active,
        images=[],
        options=[],
        reviews=[],
        average_rating=None,
        reviews_count=0,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.get("/products", response_model=List[ProductResponse], tags=["Produits"])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les produits (public)."""
    return await product_service.list_products(db, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductDetailResponse, tags=["Produits"])
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Détails complets d'un produit avec avis et statistiques (public)."""
    detail = await product_service.get_product_detail(product_id, db)
    product = detail["product"]
    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        discount_price=product.discount_price,
        stock=product.stock,
        category=product.category,
        slug=product.slug,
        is_active=product.is_active,
        images=product.images,
        options=product.options,
        reviews=product.reviews,
        average_rating=detail["average_rating"],
        reviews_count=detail["reviews_count"],
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.put("/products/{product_id}", response_model=ProductDetailResponse, tags=["Produits"])
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Met à jour un produit. Réservé aux administrateurs."""
    detail = await product_service.update_product(product_id, data, db)
    product = detail["product"]
    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        discount_price=product.discount_price,
        stock=product.stock,
        category=product.category,
        slug=product.slug,
        is_active=product.is_active,
        images=product.images,
        options=product.options,
        reviews=product.reviews,
        average_rating=detail["average_rating"],
        reviews_count=detail["reviews_count"],
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.delete("/products/{product_id}", status_code=204, tags=["Produits"])
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Supprime un produit et ses images Cloudinary. Réservé aux administrateurs."""
    await product_service.delete_product(product_id, db)


# ──────────────────────────────────────────────────────────────────────────────
# Options produits
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/products/{product_id}/options",
    response_model=ProductOptionResponse,
    status_code=201,
    tags=["Options"],
)
async def add_product_option(
    product_id: uuid.UUID,
    data: ProductOptionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Ajoute une option à un produit (ex: Couleur=Noir). Réservé aux admins."""
    return await product_service.add_product_option(product_id, data, db)


@router.get(
    "/products/{product_id}/options",
    response_model=List[ProductOptionResponse],
    tags=["Options"],
)
async def get_product_options(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Récupère toutes les options d'un produit (public)."""
    return await product_service.get_product_options(product_id, db)


@router.delete("/options/{option_id}", status_code=204, tags=["Options"])
async def delete_product_option(
    option_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Supprime une option produit. Réservé aux administrateurs."""
    await product_service.delete_product_option(option_id, db)


# ──────────────────────────────────────────────────────────────────────────────
# Images produits
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/cloudinary/signature", tags=["Images"])
async def get_cloudinary_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = Query("products/images", description="Dossier Cloudinary (doit commencer par products/, users/ ou uploads/)"),
    _admin: User = Depends(require_admin),
):
    """Génère une signature pour upload signé vers Cloudinary. Réservé aux admins."""
    return generate_upload_signature(resource_type=resource_type, folder=folder)


@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageResponse,
    status_code=201,
    tags=["Images"],
)
async def add_product_image(
    product_id: uuid.UUID,
    data: ProductImageCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Enregistre une image Cloudinary sur un produit. Réservé aux admins.

    Workflow :
    1. Obtenir la signature via GET /api/cloudinary/signature
    2. Uploader le fichier directement sur Cloudinary avec la signature
    3. Envoyer l'url + public_id retournés ici
    """
    return await product_service.add_product_image(product_id, data, db)


@router.delete("/images/{image_id}", status_code=204, tags=["Images"])
async def delete_product_image(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Supprime une image (BDD + Cloudinary). Réservé aux administrateurs."""
    await product_service.delete_product_image(image_id, db)


# ──────────────────────────────────────────────────────────────────────────────
# Avis produits
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewResponse,
    status_code=201,
    tags=["Avis"],
)
async def add_review(
    product_id: uuid.UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Laisse un avis sur un produit. Utilisateur connecté uniquement. Un seul avis par produit."""
    return await product_service.add_review(product_id, current_user.id, data, db)


@router.get(
    "/products/{product_id}/reviews",
    response_model=List[ReviewDetailResponse],
    tags=["Avis"],
)
async def get_product_reviews(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Récupère les avis d'un produit, du plus récent au plus ancien (public)."""
    return await product_service.get_product_reviews(product_id, db)
