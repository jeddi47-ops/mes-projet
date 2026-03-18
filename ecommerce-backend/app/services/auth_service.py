from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from passlib.context import CryptContext
from datetime import datetime, timezone
import hashlib
import bcrypt as _bcrypt

from app.models.user import User, RefreshToken
from app.schemas.auth import RegisterRequest, LoginRequest
from app.auth.jwt import create_access_token, create_refresh_token, decode_token, get_token_expiry
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


def hash_password(password: str) -> str:
    """Hash le mot de passe avec bcrypt directement (contourne les problèmes passlib)."""
    password_bytes = password.encode("utf-8")
    hashed = _bcrypt.hashpw(password_bytes, _bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe avec bcrypt directement."""
    try:
        return _bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception as e:
        print(f"[DEBUG] verify_password exception: {e}")
        return False


def hash_token(token: str) -> str:
    """Hash un token pour le stocker en base de données."""
    return hashlib.sha256(token.encode()).hexdigest()


async def register_user(data: RegisterRequest, db: AsyncSession) -> dict:
    """Inscrit un nouvel utilisateur et retourne les tokens JWT."""
    print(type(data.password), data.password)
    if not isinstance(data.password, str):
        raise ValueError("Password must be a string")
    password = str(data.password)
    print(f"[DEBUG] register_user: password length = {len(password)}")

    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cet email existe déjà",
        )

    user = User(
        email=data.email,
        hashed_password=hash_password(password),
        first_name=data.first_name,
        last_name=data.last_name,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token(str(user.id))

    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=get_token_expiry(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token_record)
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


async def authenticate_user(data: LoginRequest, db: AsyncSession) -> dict:
    """Authentifie un utilisateur avec email/mot de passe."""
    print(f"[DEBUG] authenticate_user: email={data.email}, password_length={len(str(data.password))}")

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    print(f"[DEBUG] authenticate_user: user_found={user is not None}, has_hash={bool(user.hashed_password) if user else False}")

    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )

    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token(str(user.id))

    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=get_token_expiry(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token_record)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> dict:
    """Renouvelle l'access token à partir d'un refresh token valide."""
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide",
        )

    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored_token = result.scalar_one_or_none()

    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token révoqué ou expiré",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
        )

    # Rotation du token — révoque l'ancien et émet de nouveaux tokens
    stored_token.is_revoked = True

    new_access_token = create_access_token(str(user.id), user.email)
    new_refresh_token = create_refresh_token(str(user.id))

    new_refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_refresh_token),
        expires_at=get_token_expiry(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_record)
    await db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


async def logout_user(refresh_token: str, db: AsyncSession) -> None:
    """Révoque le refresh token (déconnexion)."""
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored_token = result.scalar_one_or_none()

    if stored_token:
        stored_token.is_revoked = True
        await db.commit()


async def google_oauth_callback(google_user_info: dict, db: AsyncSession) -> dict:
    """Crée ou connecte un utilisateur via Google OAuth."""
    google_id = google_user_info.get("id") or google_user_info.get("sub")
    email = google_user_info.get("email")

    # Cherche d'abord par google_id
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        # Cherche par email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            # Lie le compte Google à l'utilisateur existant
            user.google_id = google_id
            user.avatar_url = user.avatar_url or google_user_info.get("picture")
        else:
            # Crée un nouvel utilisateur
            user = User(
                email=email,
                google_id=google_id,
                first_name=google_user_info.get("given_name"),
                last_name=google_user_info.get("family_name"),
                avatar_url=google_user_info.get("picture"),
                is_verified=True,
            )
            db.add(user)
            await db.flush()

    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token(str(user.id))

    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=get_token_expiry(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token_record)
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }
