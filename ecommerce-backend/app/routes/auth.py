# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse
from app.services import auth_service
from app.auth.dependencies import get_current_user
from app.auth.google_oauth import oauth, get_google_user_info
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Inscription d'un nouvel utilisateur."""
    result = await auth_service.register_user(data, db)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Connexion avec email et mot de passe."""
    result = await auth_service.authenticate_user(data, db)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Renouvelle l'access token via le refresh token."""
    result = await auth_service.refresh_access_token(data.refresh_token, db)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Déconnexion — révoque le refresh token."""
    await auth_service.logout_user(data.refresh_token, db)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur connecté."""
    return current_user


@router.get("/google")
async def google_login(request: Request):
    """Redirige vers la page de connexion Google OAuth."""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Callback Google OAuth — crée ou connecte l'utilisateur."""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            user_info = await get_google_user_info(token.get("access_token"))
        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Impossible de récupérer les informations Google",
            )
        result = await auth_service.google_oauth_callback(dict(user_info), db)
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur Google OAuth: {str(e)}")
