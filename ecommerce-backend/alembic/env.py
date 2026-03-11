import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import de tous les modèles pour les migrations automatiques
from app.database import Base
from app.models import (  # noqa: F401
    User, Role, RefreshToken,
    Product, ProductOption, ProductImage, Review,
    Cart, CartItem,
    Order, OrderItem,
    Message,
    Notification,
    PageView,
)

target_metadata = Base.metadata


def get_sync_url() -> str:
    """Retourne l'URL synchrone pour Alembic (psycopg2)."""
    url = os.environ.get("SYNC_DATABASE_URL")
    if not url:
        url = os.environ.get("DATABASE_URL", "").replace("+asyncpg", "+psycopg2")
    return url


def run_migrations_offline() -> None:
    """Exécute les migrations en mode offline (sans connexion active)."""
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Exécute les migrations en mode online (avec connexion active)."""
    config_section = config.get_section(config.config_ini_section, {})
    config_section["sqlalchemy.url"] = get_sync_url()

    connectable = engine_from_config(
        config_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
