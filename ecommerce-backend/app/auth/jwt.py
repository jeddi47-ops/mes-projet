from datetime import datetime, timezone, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import settings
import uuid


def create_access_token(user_id: str, email: str) -> str:
    """Crée un access token JWT valide 30 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Crée un refresh token JWT valide 7 jours."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Décode et valide un token JWT. Retourne None si invalide."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def get_token_expiry(days: int = None, minutes: int = None) -> datetime:
    """Calcule la date d'expiration d'un token."""
    if days:
        return datetime.now(timezone.utc) + timedelta(days=days)
    return datetime.now(timezone.utc) + timedelta(
        minutes=minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
