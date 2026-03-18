from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
import app.models  # noqa: F401 — enregistre tous les modèles dans Base.metadata
from app.routes import auth
from app.routes import products
from app.routes import cart
from app.routes import orders
from app.routes import messages
from app.routes import admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — crée les tables si elles n'existent pas encore
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
