import time
import cloudinary
import cloudinary.utils
import cloudinary.uploader
from fastapi import HTTPException

from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_FOLDERS = ("products/", "users/", "uploads/")


def generate_upload_signature(resource_type: str = "image", folder: str = "uploads") -> dict:
    """
    Génère une signature Cloudinary pour un upload signé côté client.
    L'API secret ne quitte jamais le serveur.
    """
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail="Dossier non autorisé")

    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": resource_type,
    }

    signature = cloudinary.utils.api_sign_request(
        params,
        settings.CLOUDINARY_API_SECRET,
    )

    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "api_key": settings.CLOUDINARY_API_KEY,
        "folder": folder,
        "resource_type": resource_type,
    }


def delete_asset(public_id: str, resource_type: str = "image") -> bool:
    """
    Supprime un asset Cloudinary par son public_id.
    Doit être appelé uniquement depuis le backend après validation des droits.
    """
    result = cloudinary.uploader.destroy(
        public_id, resource_type=resource_type, invalidate=True
    )
    return result.get("result") == "ok"
