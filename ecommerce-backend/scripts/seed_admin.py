#!/usr/bin/env python3
"""
Script de seed — Crée le premier administrateur et les rôles de base.

Usage :
    # Depuis le répertoire ecommerce-backend/
    python scripts/seed_admin.py

    # Ou via Docker
    docker-compose exec backend python scripts/seed_admin.py

Variables d'environnement requises (dans .env) :
    DATABASE_URL, SECRET_KEY
"""
import asyncio
import sys
import os
import getpass
import uuid
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext

from app.models.user import User, Role
from app.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERREUR : DATABASE_URL non défini dans .env")
    sys.exit(1)


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as db:
        # 1. Créer les rôles si absents
        for role_name, role_desc in [
            ("admin", "Administrateur — accès complet"),
            ("user", "Utilisateur standard — accès boutique"),
        ]:
            result = await db.execute(select(Role).where(Role.name == role_name))
            if not result.scalar_one_or_none():
                role = Role(id=uuid.uuid4(), name=role_name, description=role_desc)
                db.add(role)
                print(f"  Rôle créé : {role_name}")
            else:
                print(f"  Rôle existant : {role_name}")

        await db.flush()

        # 2. Récupérer le rôle admin
        result = await db.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one()

        # 3. Demander les informations du compte admin
        print("\n── Création du compte administrateur ──")
        print("(Appuyez sur Entrée pour utiliser la valeur par défaut)")

        email = input("Email admin [admin@example.com] : ").strip() or "admin@example.com"
        first_name = input("Prénom [Admin] : ").strip() or "Admin"
        last_name = input("Nom [Shop] : ").strip() or "Shop"

        # Vérifier si l'admin existe déjà
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"\n  L'utilisateur {email} existe déjà.")
            if existing.role and existing.role.name == "admin":
                print("  Ce compte est déjà administrateur. Aucune modification.")
            else:
                existing.role_id = admin_role.id
                await db.commit()
                print("  Rôle admin assigné au compte existant.")
            return

        password = getpass.getpass("Mot de passe (min. 8 caractères) : ")
        if len(password) < 8:
            print("ERREUR : Le mot de passe doit contenir au moins 8 caractères.")
            sys.exit(1)

        # 4. Créer l'utilisateur admin
        admin_user = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password=pwd_context.hash(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=True,
            role_id=admin_role.id,
        )
        db.add(admin_user)
        await db.commit()

        print("\n  Administrateur créé avec succès !")
        print(f"  Email    : {email}")
        print(f"  Prénom   : {first_name} {last_name}")
        print("\n  Vous pouvez maintenant vous connecter au dashboard admin.")

    await engine.dispose()


if __name__ == "__main__":
    print("═══════════════════════════════════════════")
    print("   E-Commerce — Initialisation Admin")
    print("═══════════════════════════════════════════\n")
    asyncio.run(seed())
