import re
import unicodedata
from typing import TypeVar, Generic
from sqlalchemy.orm import Query

T = TypeVar("T")


def slugify(text: str) -> str:
    """Convertit une chaîne en slug URL-friendly."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-_")
    return text


def paginate(query: Query, page: int = 1, per_page: int = 20) -> Query:
    """Pagine une requête SQLAlchemy."""
    offset = (page - 1) * per_page
    return query.offset(offset).limit(per_page)


def format_price(amount: float, currency: str = "EUR") -> str:
    """Formate un prix avec son symbole de devise."""
    symbols = {"EUR": "€", "USD": "$", "GBP": "£", "CAD": "CA$", "CHF": "CHF"}
    symbol = symbols.get(currency, currency)
    return f"{amount:.2f} {symbol}"


def build_pagination_meta(total: int, page: int, per_page: int) -> dict:
    """Retourne les métadonnées de pagination."""
    total_pages = (total + per_page - 1) // per_page
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
