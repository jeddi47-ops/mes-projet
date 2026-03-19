from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import uuid
import bcrypt as _bcrypt

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
import app.models  # noqa: F401 — enregistre tous les modèles dans Base.metadata
from app.models.user import User, Role
from app.routes import auth
from app.routes import products
from app.routes import cart
from app.routes import orders
from app.routes import messages
from app.routes import admin

from sqlalchemy import select


async def _seed_admin() -> None:
    """Crée le compte admin par défaut si aucun utilisateur n'existe."""
    async with AsyncSessionLocal() as db:
        # Vérifier si un utilisateur existe déjà
        result = await db.execute(select(User))
        if result.scalars().first() is not None:
            print("[SEED] Utilisateurs déjà présents — seed ignoré.")
            return

        # Créer le rôle admin s'il n'existe pas
        result = await db.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(
                id=uuid.uuid4(),
                name="admin",
                description="Administrateur",
            )
            db.add(admin_role)
            await db.flush()

        # Créer le rôle user s'il n'existe pas
        result = await db.execute(select(Role).where(Role.name == "user"))
        if not result.scalar_one_or_none():
            db.add(Role(id=uuid.uuid4(), name="user", description="Utilisateur standard"))
            await db.flush()

        # Créer le compte admin par défaut
        hashed = _bcrypt.hashpw(b"123456", _bcrypt.gensalt(rounds=12)).decode("utf-8")
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@test.com",
            hashed_password=hashed,
            first_name="Admin",
            last_name="Test",
            is_active=True,
            is_verified=True,
            role_id=admin_role.id,
        )
        db.add(admin_user)
        await db.commit()
        print("[SEED] Compte admin créé → email: admin@test.com / password: 123456")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — crée les tables puis seed l'admin par défaut si nécessaire
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _seed_admin()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend e-commerce réutilisable — Template professionnel FastAPI + PostgreSQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://mes-projet-production.up.railway.app",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentification"])
app.include_router(products.router, prefix="/api", tags=["Produits"])
app.include_router(cart.router, prefix="/api", tags=["Panier"])
app.include_router(orders.router, prefix="/api", tags=["Commandes"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {"message": f"Bienvenue sur {settings.APP_NAME}", "status": "running"}


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}
