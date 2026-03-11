import logging
from datetime import datetime
from typing import Optional, List

from fpdf import FPDF
from fpdf.enums import XPos, YPos

logger = logging.getLogger(__name__)

# Largeurs des colonnes du tableau (total = 185mm)
COL_WIDTHS = [90, 20, 38, 37]
HEADERS = ["Produit", "Qté", "Prix unitaire", "Sous-total"]


class InvoicePDF(FPDF):
    """PDF de facture avec en-tête et pied de page personnalisés."""

    def __init__(self, app_name: str):
        super().__init__()
        self.app_name = app_name
        self.set_margins(left=12, top=12, right=12)

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(30, 30, 30)
        self.cell(0, 10, self.app_name, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, "FACTURE", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(4)
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def generate_invoice_pdf(
    order_id: str,
    order_date: datetime,
    customer_name: str,
    customer_phone: Optional[str],
    shipping_address: dict,
    items: List[dict],
    total_amount: float,
    app_name: str = "E-Commerce",
) -> bytes:
    """
    Génère une facture PDF en mémoire et retourne les bytes.

    Args:
        order_id: UUID de la commande (premier octet utilisé comme numéro).
        order_date: Date de création de la commande.
        customer_name: Nom complet du client.
        customer_phone: Téléphone du client (optionnel).
        shipping_address: Dict avec les champs d'adresse.
        items: Liste de dicts { name, option, quantity, unit_price, subtotal }.
        total_amount: Montant total de la commande.
        app_name: Nom de la boutique.

    Returns:
        Le PDF généré sous forme de bytes.
    """
    pdf = InvoicePDF(app_name=app_name)
    pdf.add_page()

    order_number = order_id[:8].upper()
    date_str = order_date.strftime("%d/%m/%Y")

    # ── Informations commande ──────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 8, f"Commande #{order_number}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, f"Date : {date_str}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(6)

    # ── Informations client ────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 7, "Informations client", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_line_width(0.3)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 80, pdf.get_y())
    pdf.ln(3)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 6, f"Nom : {customer_name}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    if customer_phone:
        pdf.cell(0, 6, f"Téléphone : {customer_phone}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Adresse de livraison
    addr = shipping_address
    parts = [
        addr.get("address_line1", ""),
        addr.get("address_line2") or "",
        f"{addr.get('postal_code', '')} {addr.get('city', '')}".strip(),
        addr.get("country", ""),
    ]
    for part in parts:
        if part.strip():
            pdf.cell(0, 6, part, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(8)

    # ── Tableau des articles ───────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(40, 40, 40)
    pdf.set_text_color(255, 255, 255)
    pdf.set_draw_color(40, 40, 40)

    for header, width in zip(HEADERS, COL_WIDTHS):
        align = "L" if header == "Produit" else "C"
        pdf.cell(width, 9, header, border=1, fill=True, align=align)
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    fill = False
    for item in items:
        pdf.set_fill_color(245, 247, 250) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(30, 30, 30)
        pdf.set_draw_color(200, 200, 200)

        # Nom du produit + option éventuelle
        label = item["name"]
        if item.get("option"):
            label += f" - {item['option']}"
        label = label[:55]  # Troncature pour ne pas déborder

        pdf.cell(COL_WIDTHS[0], 8, label, border=1, fill=fill)
        pdf.cell(COL_WIDTHS[1], 8, str(item["quantity"]), border=1, align="C", fill=fill)
        pdf.cell(COL_WIDTHS[2], 8, f"{item['unit_price']:.2f} EUR", border=1, align="R", fill=fill)
        pdf.cell(COL_WIDTHS[3], 8, f"{item['subtotal']:.2f} EUR", border=1, align="R", fill=fill)
        pdf.ln()
        fill = not fill

    # ── Total ──────────────────────────────────────────────────────────────────
    pdf.ln(3)
    pdf.set_draw_color(40, 40, 40)
    pdf.set_line_width(0.5)
    right_col_x = pdf.l_margin + COL_WIDTHS[0] + COL_WIDTHS[1] + COL_WIDTHS[2]
    pdf.line(right_col_x, pdf.get_y(), pdf.l_margin + sum(COL_WIDTHS), pdf.get_y())
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    # Décaler à droite pour aligner avec la colonne "Sous-total"
    pdf.cell(sum(COL_WIDTHS[:3]), 9, "TOTAL", align="R")
    pdf.cell(COL_WIDTHS[3], 9, f"{total_amount:.2f} EUR", align="R")
    pdf.ln()

    # ── Message de bas de page ─────────────────────────────────────────────────
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(
        0, 6,
        "Merci pour votre commande. Notre équipe vous contactera prochainement pour le règlement.",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
        align="C",
    )

    return bytes(pdf.output())
