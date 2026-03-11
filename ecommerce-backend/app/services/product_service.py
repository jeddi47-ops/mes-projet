from typing import Optional, List
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc, or_, update as sql_update
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.product import Product, ProductOption, ProductImage, Review
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOptionCreate,
    ProductImageCreate,
    ReviewCreate,
    ProductCatalogItem,
)
from app.utils.helpers import slugify


# ──────────────────────────────────────────────────────────────────────────────
# Helpers internes
# ──────────────────────────────────────────────────────────────────────────────

async def _unique_slug(
    slug: str,
    db: AsyncSession,
    exclude_id: Optional[uuid.UUID] = None,
) -> str:
    """Garantit l'unicité du slug en ajoutant un suffixe numérique si nécessaire."""
    base = slug
    counter = 1
    while True:
        query = select(Product).where(Product.slug == slug)
        if exclude_id:
            query = query.where(Product.id != exclude_id)
        if not (await db.execute(query)).scalar_one_or_none():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


async def _product_stats(product_id: uuid.UUID, db: AsyncSession) -> dict:
    """Calcule la note moyenne et le nombre d'avis d'un produit."""
    result = await db.execute(
        select(
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("reviews_count"),
        ).where(Review.product_id == product_id)
    )
    row = result.one()
    return {
        "average_rating": round(float(row.avg_rating), 2) if row.avg_rating else None,
        "reviews_count": row.reviews_count or 0,
    }


# ──────────────────────────────────────────────────────────────────────────────
# CRUD Produits
# ──────────────────────────────────────────────────────────────────────────────

async def create_product(data: ProductCreate, db: AsyncSession) -> Product:
    slug = await _unique_slug(data.slug or slugify(data.name), db)

    product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        discount_price=data.discount_price or None,
        stock=data.stock,
        category=data.category,
        slug=slug,
        is_active=data.is_active,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def list_products(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
) -> List[Product]:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images), selectinload(Product.options))
        .order_by(desc(Product.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_product_by_id(product_id: uuid.UUID, db: AsyncSession) -> Product:
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.options),
            selectinload(Product.reviews).selectinload(Review.user),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé",
        )
    return product


async def get_product_detail(product_id: uuid.UUID, db: AsyncSession) -> dict:
    """Retourne le produit avec ses statistiques d'avis."""
    product = await get_product_by_id(product_id, db)
    stats = await _product_stats(product_id, db)
    return {"product": product, **stats}


async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession,
) -> dict:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    update_data = data.model_dump(exclude_unset=True)

    # Gestion du slug : régénéré si le nom change
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = await _unique_slug(
            slugify(update_data["name"]), db, product_id
        )
    elif "slug" in update_data and update_data["slug"]:
        update_data["slug"] = await _unique_slug(
            update_data["slug"], db, product_id
        )

    # discount_price = 0 → supprime la remise
    if update_data.get("discount_price") == 0:
        update_data["discount_price"] = None

    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    return await get_product_detail(product_id, db)


async def delete_product(product_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    # Nettoyage des images Cloudinary
    from app.services.cloudinary_service import delete_asset
    for image in product.images:
        try:
            delete_asset(image.public_id)
        except Exception:
            pass  # Ne pas bloquer la suppression si Cloudinary échoue

    await db.delete(product)
    await db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Options produits
# ──────────────────────────────────────────────────────────────────────────────

async def add_product_option(
    product_id: uuid.UUID,
    data: ProductOptionCreate,
    db: AsyncSession,
) -> ProductOption:
    if not (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    option = ProductOption(
        product_id=product_id,
        name=data.name,
        value=data.value,
        price_modifier=data.price_modifier,
        stock=data.stock,
    )
    db.add(option)
    await db.commit()
    await db.refresh(option)
    return option


async def get_product_options(
    product_id: uuid.UUID,
    db: AsyncSession,
) -> List[ProductOption]:
    result = await db.execute(
        select(ProductOption)
        .where(ProductOption.product_id == product_id)
        .order_by(ProductOption.name, ProductOption.value)
    )
    return list(result.scalars().all())


async def delete_product_option(option_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(ProductOption).where(ProductOption.id == option_id))
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=404, detail="Option non trouvée")
    await db.delete(option)
    await db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Images produits
# ──────────────────────────────────────────────────────────────────────────────

async def add_product_image(
    product_id: uuid.UUID,
    data: ProductImageCreate,
    db: AsyncSession,
) -> ProductImage:
    if not (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    # Désactiver l'image principale actuelle si la nouvelle est principale
    if data.is_primary:
        await db.execute(
            sql_update(ProductImage)
            .where(ProductImage.product_id == product_id)
            .values(is_primary=False)
        )

    image = ProductImage(
        product_id=product_id,
        url=data.url,
        public_id=data.public_id,
        alt_text=data.alt_text,
        is_primary=data.is_primary,
        order=data.order,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


async def delete_product_image(image_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image non trouvée")

    from app.services.cloudinary_service import delete_asset
    try:
        delete_asset(image.public_id)
    except Exception:
        pass

    await db.delete(image)
    await db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Avis produits
# ──────────────────────────────────────────────────────────────────────────────

async def add_review(
    product_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ReviewCreate,
    db: AsyncSession,
) -> Review:
    if not (
        await db.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
    ).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    # Un utilisateur ne peut laisser qu'un seul avis par produit
    existing = await db.execute(
        select(Review).where(
            Review.product_id == product_id,
            Review.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Vous avez déjà laissé un avis pour ce produit",
        )

    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_product_reviews(
    product_id: uuid.UUID,
    db: AsyncSession,
) -> List[Review]:
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.product_id == product_id)
        .order_by(desc(Review.created_at))
    )
    return list(result.scalars().all())


# ──────────────────────────────────────────────────────────────────────────────
# Catalogue
# ──────────────────────────────────────────────────────────────────────────────

async def get_catalog(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "newest",
) -> dict:
    # Construction des filtres
    conditions = [Product.is_active == True]
    if min_price is not None:
        conditions.append(Product.price >= min_price)
    if max_price is not None:
        conditions.append(Product.price <= max_price)
    if category:
        conditions.append(Product.category == category)
    if search:
        conditions.append(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )

    # Nombre total de résultats
    count_result = await db.execute(
        select(func.count(Product.id)).where(*conditions)
    )
    total = count_result.scalar() or 0

    # Requête principale avec tri
    if sort_by == "best_rated":
        avg_sq = (
            select(
                func.avg(Review.rating).label("avg_rating"),
                Review.product_id.label("pid"),
            )
            .group_by(Review.product_id)
            .subquery()
        )
        query = (
            select(Product)
            .outerjoin(avg_sq, avg_sq.c.pid == Product.id)
            .where(*conditions)
            .options(selectinload(Product.images))
            .order_by(desc(func.coalesce(avg_sq.c.avg_rating, 0)))
        )
    else:
        query = (
            select(Product)
            .where(*conditions)
            .options(selectinload(Product.images))
        )
        if sort_by == "price_asc":
            query = query.order_by(asc(Product.price))
        elif sort_by == "price_desc":
            query = query.order_by(desc(Product.price))
        elif sort_by == "oldest":
            query = query.order_by(asc(Product.created_at))
        else:  # newest (par défaut)
            query = query.order_by(desc(Product.created_at))

    # Pagination
    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    products = list(result.scalars().all())

    # Statistiques d'avis pour les produits de la page courante
    review_stats: dict = {}
    if products:
        product_ids = [p.id for p in products]
        stats_result = await db.execute(
            select(
                Review.product_id,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("reviews_count"),
            )
            .where(Review.product_id.in_(product_ids))
            .group_by(Review.product_id)
        )
        for row in stats_result:
            review_stats[row.product_id] = {
                "average_rating": round(float(row.avg_rating), 2) if row.avg_rating else None,
                "reviews_count": row.reviews_count or 0,
            }

    # Construction des items du catalogue
    items = [
        ProductCatalogItem(
            id=p.id,
            name=p.name,
            description=p.description,
            price=p.price,
            discount_price=p.discount_price,
            stock=p.stock,
            category=p.category,
            slug=p.slug,
            is_active=p.is_active,
            images=p.images,
            average_rating=review_stats.get(p.id, {}).get("average_rating"),
            reviews_count=review_stats.get(p.id, {}).get("reviews_count", 0),
            created_at=p.created_at,
        )
        for p in products
    ]

    total_pages = max(1, (total + per_page - 1) // per_page)
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
