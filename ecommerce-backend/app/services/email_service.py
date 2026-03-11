import asyncio
import logging
import resend

from app.config import settings

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY


async def send_email(to: str, subject: str, html_content: str) -> dict:
    """Envoie un email via Resend (non-bloquant)."""
    params = {
        "from": settings.SENDER_EMAIL,
        "to": [to],
        "subject": subject,
        "html": html_content,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Erreur envoi email à {to}: {str(e)}")
        raise


async def send_welcome_email(to: str, first_name: str = None) -> dict:
    """Envoie un email de bienvenue après inscription."""
    name = first_name or "Cher(e) client(e)"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2d3748;">Bienvenue !</h1>
        <p>Bonjour {name},</p>
        <p>Votre compte a été créé avec succès. Bienvenue sur notre plateforme.</p>
        <p>Cordialement,<br/>L'équipe {settings.APP_NAME}</p>
    </body>
    </html>
    """
    return await send_email(to, f"Bienvenue sur {settings.APP_NAME}", html)


async def send_verification_email(to: str, verification_link: str) -> dict:
    """Envoie un email de vérification d'adresse."""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2d3748;">Vérifiez votre email</h1>
        <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
        <a href="{verification_link}"
           style="display:inline-block; background-color: #48bb78; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Vérifier mon email
        </a>
        <p style="color: #718096;">Ce lien expire dans 24 heures.</p>
    </body>
    </html>
    """
    return await send_email(to, "Vérification de votre email", html)


async def send_password_reset_email(to: str, reset_link: str) -> dict:
    """Envoie un email de réinitialisation de mot de passe."""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2d3748;">Réinitialisation du mot de passe</h1>
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <a href="{reset_link}"
           style="display:inline-block; background-color: #4299e1; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Réinitialiser mon mot de passe
        </a>
        <p style="color: #718096;">Ce lien expire dans 1 heure.<br/>
        Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </body>
    </html>
    """
    return await send_email(to, "Réinitialisation de votre mot de passe", html)


async def send_invoice_email(
    to: str,
    customer_name: str,
    order_id: str,
    total_amount: float,
    pdf_bytes: bytes,
) -> dict:
    """Envoie la confirmation de commande avec la facture PDF en pièce jointe."""
    order_number = order_id[:8].upper()
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2d3748;">Confirmation de commande</h1>
        <p>Bonjour {customer_name},</p>
        <p>Votre commande a bien été enregistrée. Vous trouverez votre facture en pièce jointe.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background-color: #f7fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">
                    Numéro de commande
                </td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">#{order_number}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">
                    Montant total
                </td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{total_amount:.2f} EUR</td>
            </tr>
            <tr style="background-color: #f7fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">
                    Statut
                </td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">En attente de paiement</td>
            </tr>
        </table>
        <p>Notre équipe vous contactera prochainement pour finaliser le règlement.</p>
        <p>Merci pour votre confiance !<br/>L'équipe {settings.APP_NAME}</p>
    </body>
    </html>
    """
    params = {
        "from": settings.SENDER_EMAIL,
        "to": [to],
        "subject": f"Confirmation de votre commande #{order_number} — {settings.APP_NAME}",
        "html": html,
        "attachments": [
            {
                "filename": f"facture_{order_number}.pdf",
                "content": list(pdf_bytes),
            }
        ],
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Erreur envoi facture commande #{order_number} à {to}: {str(e)}")
        raise
