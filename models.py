from __future__ import annotations

from datetime import datetime
from enum import Enum
from pathlib import Path

import pandas as pd
from pydantic import BaseModel, Field


class Status(str, Enum):
    OK = "תקין"
    FAILED = "לא תקין"
    NOTE = "הערה"


class Category(str, Enum):
    ELECTRICAL = "חשמל"
    STRUCTURE = "מבנה"
    SAFETY = "בטיחות"
    GAS = "מערכת גז"
    HP = "דחיסת לחץ גבוה"
    LP = "דחיסת לחץ נמוך"


class ChecklistItem(BaseModel):
    id: int
    category: Category
    description: str
    status: Status = Status.OK
    note: str = ""


class MaintenanceReport(BaseModel):
    technician: str = "עמנואל גוטמן"
    timestamp: datetime = Field(default_factory=datetime.now)
    hospital: str
    machine_id: str
    items: list[ChecklistItem]
    image_paths: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Default 38-item checklist
# ---------------------------------------------------------------------------

DEFAULT_ITEMS: list[ChecklistItem] = [
    # --- חשמל (1-8) ---
    ChecklistItem(id=1,  category=Category.ELECTRICAL, description="לוח חשמל ראשי"),
    ChecklistItem(id=2,  category=Category.ELECTRICAL, description="מפסקי זרם"),
    ChecklistItem(id=3,  category=Category.ELECTRICAL, description="כבלים ומוליכים"),
    ChecklistItem(id=4,  category=Category.ELECTRICAL, description="מנורות חירום"),
    ChecklistItem(id=5,  category=Category.ELECTRICAL, description="אדמה חשמלית"),
    ChecklistItem(id=6,  category=Category.ELECTRICAL, description="ספק כוח"),
    ChecklistItem(id=7,  category=Category.ELECTRICAL, description="שקעים חשמליים"),
    ChecklistItem(id=8,  category=Category.ELECTRICAL, description="מערכת UPS"),

    # --- מבנה (9-15) ---
    ChecklistItem(id=9,  category=Category.STRUCTURE,  description="דלת הלחץ הראשית"),
    ChecklistItem(id=10, category=Category.STRUCTURE,  description="איטום הלחץ"),
    ChecklistItem(id=11, category=Category.STRUCTURE,  description="חלונות תצפית"),
    ChecklistItem(id=12, category=Category.STRUCTURE,  description="מנעולי בטיחות"),
    ChecklistItem(id=13, category=Category.STRUCTURE,  description="מסגרת התא"),
    ChecklistItem(id=14, category=Category.STRUCTURE,  description="ציר הדלת"),
    ChecklistItem(id=15, category=Category.STRUCTURE,  description="צינורות חיצוניים"),

    # --- בטיחות (16-23) ---
    ChecklistItem(id=16, category=Category.SAFETY,     description="שסתום בטיחות"),
    ChecklistItem(id=17, category=Category.SAFETY,     description="מד לחץ"),
    ChecklistItem(id=18, category=Category.SAFETY,     description="מערכת כיבוי אש"),
    ChecklistItem(id=19, category=Category.SAFETY,     description="חיישן עשן"),
    ChecklistItem(id=20, category=Category.SAFETY,     description="ציוד חירום"),
    ChecklistItem(id=21, category=Category.SAFETY,     description="נוהל חירום"),
    ChecklistItem(id=22, category=Category.SAFETY,     description="מנות חמצן חירום"),
    ChecklistItem(id=23, category=Category.SAFETY,     description="תאורת חירום"),

    # --- מערכת גז (24-31) ---
    ChecklistItem(id=24, category=Category.GAS,        description="קווי חמצן"),
    ChecklistItem(id=25, category=Category.GAS,        description="קווי אוויר"),
    ChecklistItem(id=26, category=Category.GAS,        description="שסתומי גז"),
    ChecklistItem(id=27, category=Category.GAS,        description="מד זרימת גז"),
    ChecklistItem(id=28, category=Category.GAS,        description="חיישן ריכוז חמצן"),
    ChecklistItem(id=29, category=Category.GAS,        description="מסנני גז"),
    ChecklistItem(id=30, category=Category.GAS,        description="לחץ מיכלי גז"),
    ChecklistItem(id=31, category=Category.GAS,        description="חיבורי גז"),

    # --- דחיסת לחץ גבוה (32-35) ---
    ChecklistItem(id=32, category=Category.HP,         description="קומפרסור HP"),
    ChecklistItem(id=33, category=Category.HP,         description="שמן קומפרסור"),
    ChecklistItem(id=34, category=Category.HP,         description="מסנן אוויר כניסה"),
    ChecklistItem(id=35, category=Category.HP,         description="מד לחץ HP"),

    # --- דחיסת לחץ נמוך (36-38) ---
    ChecklistItem(id=36, category=Category.LP,         description="קומפרסור LP"),
    ChecklistItem(id=37, category=Category.LP,         description="שמן קומפרסור LP"),
    ChecklistItem(id=38, category=Category.LP,         description="מד לחץ LP"),
]


def get_default_items() -> list[ChecklistItem]:
    """Return a fresh copy of the 38 default checklist items."""
    return [item.model_copy() for item in DEFAULT_ITEMS]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def report_to_dataframe(report: MaintenanceReport) -> pd.DataFrame:
    """Convert a MaintenanceReport to a pandas DataFrame.

    One row per checklist item; metadata (technician, hospital, etc.)
    appears as dedicated columns on every row.
    """
    rows = []
    for item in report.items:
        rows.append({
            "תאריך": report.timestamp.strftime("%Y-%m-%d %H:%M"),
            "טכנאי": report.technician,
            "בית חולים": report.hospital,
            "מזהה מכשיר": report.machine_id,
            "מזהה": item.id,
            "קטגוריה": item.category.value,
            "תיאור": item.description,
            "סטטוס": item.status.value,
            "הערה": item.note,
        })
    return pd.DataFrame(rows)


def generate_filename(report: MaintenanceReport) -> str:
    """Generate a timestamped base filename (no extension) for a maintenance report.

    Strips characters that are illegal in Windows file paths: \\ / : * ? " < > |
    """
    import re

    def sanitize(text: str) -> str:
        text = text.replace(" ", "_")
        text = re.sub(r'[\\/:*?"<>|]', "", text)
        return text

    ts       = report.timestamp.strftime("%Y-%m-%d_%H-%M")
    tech     = sanitize(report.technician)
    hospital = sanitize(report.hospital)
    machine  = sanitize(report.machine_id)
    return f"{ts}_{tech}_{hospital}_{machine}"


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

_PDF_FONTS_REGISTERED = False


def generate_pdf_bytes(report: MaintenanceReport) -> bytes:
    """Render a Hebrew maintenance report as PDF and return the raw bytes."""
    import io

    from bidi.algorithm import get_display
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    global _PDF_FONTS_REGISTERED
    font_reg  = "ArialHeb"
    font_bold = "ArialHeb-Bold"

    if not _PDF_FONTS_REGISTERED:
        try:
            pdfmetrics.registerFont(TTFont(font_reg,  r"C:\Windows\Fonts\arial.ttf"))
            pdfmetrics.registerFont(TTFont(font_bold, r"C:\Windows\Fonts\arialbd.ttf"))
            _PDF_FONTS_REGISTERED = True
        except Exception:
            font_reg  = "Helvetica"
            font_bold = "Helvetica-Bold"

    # Brand colours matching the company logo
    NAVY   = colors.HexColor("#4A4F6E")
    GOLD   = colors.HexColor("#CEC28C")
    CREAM  = colors.HexColor("#EDE8D5")
    LIGHT  = colors.HexColor("#F5F0E6")

    def h(text: str) -> str:
        """Apply Unicode BiDi algorithm so Hebrew renders correctly in LTR engines."""
        return get_display(str(text))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=1.5 * cm, bottomMargin=2 * cm,
    )

    title_style = ParagraphStyle("title", fontName=font_bold, fontSize=15,
                                 alignment=TA_CENTER, textColor=CREAM, spaceAfter=2)
    meta_style  = ParagraphStyle("meta",  fontName=font_reg,  fontSize=10,
                                 alignment=TA_RIGHT, textColor=CREAM, spaceAfter=2)

    story: list = []

    # ── Header banner: logo (right) + title + metadata (left) ──
    LOGO_PATH = Path(__file__).parent / "data" / "images" / "logo.jpeg"
    if LOGO_PATH.exists():
        from reportlab.platypus import Image as RLImage
        logo_img = RLImage(str(LOGO_PATH), width=3 * cm, height=3 * cm)
    else:
        logo_img = Spacer(3 * cm, 3 * cm)

    title_para = Paragraph(h("יומן תחזוקה — תא היפרברי"), title_style)
    meta_lines = [
        f"{h(label)}: {h(value)}" for label, value in [
            ("טכנאי",      report.technician),
            ("בית חולים",  report.hospital),
            ("מזהה מכשיר", report.machine_id),
            ("תאריך",      report.timestamp.strftime("%d/%m/%Y %H:%M")),
        ]
    ]
    meta_block = Paragraph("<br/>".join(meta_lines), meta_style)

    # RTL layout: logo on the right column (index 1), text on left (index 0)
    header_table = Table(
        [[meta_block, logo_img]],
        colWidths=[12.5 * cm, 3.5 * cm],
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",         (0, 0), (0,  -1), "RIGHT"),
        ("ALIGN",         (1, 0), (1,  -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))

    # Checklist table — columns ordered RTL (right→left reading order)
    # Visual left-to-right in PDF:  הערה | סטטוס | תיאור | קטגוריה | #
    # Reads right-to-left as:       #    | קטגוריה | תיאור | סטטוס | הערה
    col_widths = [4.5 * cm, 3 * cm, 5 * cm, 3 * cm, 1 * cm]
    header = [h(c) for c in ["הערה", "סטטוס", "תיאור", "קטגוריה", "#"]]
    tdata  = [header]
    for item in report.items:
        tdata.append([
            h(item.note) if item.note else "",
            h(item.status.value),
            h(item.description),
            h(item.category.value),
            str(item.id),
        ])

    table = Table(tdata, colWidths=col_widths, repeatRows=1)
    ts = TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1,  0), GOLD),
        ("FONTNAME",      (0, 0), (-1, -1), font_reg),
        ("FONTNAME",      (0, 0), (-1,  0), font_bold),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("ALIGN",         (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#9098B8")),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    # Alternating row background using brand light cream
    for i in range(1, len(tdata)):
        if i % 2 == 0:
            ts.add("BACKGROUND", (0, i), (-1, i), LIGHT)

    # Status colour on the Status column (index 1 in RTL order)
    status_colors = {
        Status.OK.value:     colors.HexColor("#D5F5E3"),
        Status.FAILED.value: colors.HexColor("#FADBD8"),
    }
    for i, item in enumerate(report.items, start=1):
        c = status_colors.get(item.status.value)
        if c:
            ts.add("BACKGROUND", (1, i), (1, i), c)

    table.setStyle(ts)
    story.append(table)
    story.append(Spacer(1, 0.5 * cm))

    # Summary table — תקין / לא תקין only
    ok_count     = sum(1 for it in report.items if it.status == Status.OK)
    failed_count = sum(1 for it in report.items if it.status == Status.FAILED)

    sdata = [
        [h("לא תקין"), h("תקין")],
        [str(failed_count), str(ok_count)],
    ]
    stable = Table(sdata, colWidths=[8.25 * cm] * 2)
    stable.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1,  0), GOLD),
        ("BACKGROUND",    (0, 1), (0,   1), colors.HexColor("#FADBD8")),
        ("BACKGROUND",    (1, 1), (1,   1), colors.HexColor("#D5F5E3")),
        ("FONTNAME",      (0, 0), (-1, -1), font_reg),
        ("FONTNAME",      (0, 0), (-1,  0), font_bold),
        ("FONTSIZE",      (0, 0), (-1, -1), 11),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#9098B8")),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(stable)

    doc.build(story)
    return buf.getvalue()
