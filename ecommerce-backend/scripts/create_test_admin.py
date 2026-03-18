#!/usr/bin/env python3
"""
Script de création du compte administrateur de test.

Identifiants créés :
  Email    : Jedidiadinga47@gmail.com
  Password : 12345678

Usage :
    docker-compose exec backend python scripts/create_test_admin.py

Ce script est idempotent : il peut être relancé sans risque.
Si le compte existe déjà, il vérifie et corrige le rôle admin.
"""
import asyncio
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext
import uuid

from app.models.user import User, Role

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Identifiants du compte de test ──────────────────────────────────────────
TEST_EMAIL    = "Jedidiadinga47@gmail.com"
TEST_PASSWORD = "123456"
TEST_FIRST    = "Admin"
TEST_LAST     = "Test"
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERREUR : DATABASE_URL non défini dans .env")
    sys.exit(1)


async def create_test_admin():
    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # 1. Créer le rôle admin s'il n'existe pas
        result = await db.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(
                id=uuid.uuid4(),
                name="admin",
                description="Administrateur — accès complet",
            )
            db.add(admin_role)
            await db.flush()
            print("  Rôle 'admin' créé.")
        else:
            print("  Rôle 'admin' existant.")

        # 2. Créer le rôle user s'il n'existe pas
        result = await db.execute(select(Role).where(Role.name == "user"))
        if not result.scalar_one_or_none():
            db.add(Role(
                id=uuid.uuid4(),
                name="user",
                description="Utilisateur standard",
            ))
            await db.flush()
            print("  Rôle 'user' créé.")

        # 3. Vérifier si le compte existe déjà
        result = await db.execute(select(User).where(User.email == TEST_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            # Met à jour le rôle et le mot de passe si nécessaire
            existing.role_id = admin_role.id
            existing.hashed_password = pwd_context.hash(TEST_PASSWORD)
            existing.is_active = True
            existing.is_verified = True
            await db.commit()
            print(f"\n  Compte mis à jour : {TEST_EMAIL}")
            print(f"  Rôle admin assigné et mot de passe réinitialisé.")
        else:
            # Crée le compte admin de test
            admin_user = User(
                id=uuid.uuid4(),
                email=TEST_EMAIL,
                hashed_password=pwd_context.hash(TEST_PASSWORD),
                first_name=TEST_FIRST,
                last_name=TEST_LAST,
                is_active=True,
                is_verified=True,
                role_id=admin_role.id,
            )
            db.add(admin_user)
            await db.commit()
            print(f"\n  Compte créé avec succès !")

        print(f"\n  Email    : {TEST_EMAIL}")
        print(f"  Password : {TEST_PASSWORD}")
        print(f"\n  Connectez-vous sur : http://localhost:3001")

    await engine.dispose()


if __name__ == "__main__":
    print("═══════════════════════════════════════════════")
    print("   Création du compte administrateur de test")
    print("═══════════════════════════════════════════════\n")
    asyncio.run(create_test_admin())
