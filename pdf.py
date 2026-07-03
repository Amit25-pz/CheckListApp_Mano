# -*- coding: utf-8 -*-
"""הפקת דוחות PDF בעברית — דוח פנימי מלא או דוח לקוח מסונן.

include_internal=True  ⇒ דוח פנימי: כל השדות, כולל תאריכי טיפול ושעות עבודה.
include_internal=False ⇒ דוח לקוח: השדות המסומנים internal מושמטים לחלוטין.
"""

from __future__ import annotations

import io
from pathlib import Path

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

from models import MaintenanceReport, Status

# צבעי המותג (מהלוגו)
NAVY  = colors.HexColor("#4A4F6E")
GOLD  = colors.HexColor("#CEC28C")
CREAM = colors.HexColor("#EDE8D5")
LIGHT = colors.HexColor("#F5F0E6")
RED_BG    = colors.HexColor("#FADBD8")
YELLOW_BG = colors.HexColor("#FCF3CF")
GRID      = colors.HexColor("#9098B8")

_FONTS_REGISTERED = False
_FONT_REG  = "ArialHeb"
_FONT_BOLD = "ArialHeb-Bold"


def _register_fonts() -> tuple[str, str]:
    """רישום פונט Arial (תומך עברית); נסיגה ל-Helvetica אם חסר."""
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return _FONT_REG, _FONT_BOLD
    try:
        pdfmetrics.registerFont(TTFont(_FONT_REG,  r"C:\Windows\Fonts\arial.ttf"))
        pdfmetrics.registerFont(TTFont(_FONT_BOLD, r"C:\Windows\Fonts\arialbd.ttf"))
        _FONTS_REGISTERED = True
        return _FONT_REG, _FONT_BOLD
    except Exception:
        return "Helvetica", "Helvetica-Bold"


def _h(text: str) -> str:
    """אלגוריתם BiDi — כדי שעברית תוצג נכון במנוע ה-PDF (שהוא LTR)."""
    return get_display(str(text))


def generate_pdf_bytes(report: MaintenanceReport, include_internal: bool = True) -> bytes:
    font_reg, font_bold = _register_fonts()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=1.5 * cm, leftMargin=1.5 * cm,
        topMargin=1.2 * cm, bottomMargin=1.5 * cm,
    )

    title_style = ParagraphStyle("title", fontName=font_bold, fontSize=14,
                                 alignment=TA_RIGHT, textColor=CREAM, spaceAfter=2)
    subtitle_style = ParagraphStyle("subtitle", fontName=font_reg, fontSize=10,
                                    alignment=TA_RIGHT, textColor=GOLD, spaceAfter=2)
    meta_style = ParagraphStyle("meta", fontName=font_reg, fontSize=10,
                                alignment=TA_RIGHT, textColor=CREAM, spaceAfter=2)

    story: list = []

    # ── כותרת עליונה: לוגו (ימין) + כותרת ומטא-דאטה ──
    logo_path = Path(__file__).parent / "data" / "images" / "logo.jpeg"
    if logo_path.exists():
        from reportlab.platypus import Image as RLImage
        logo_img = RLImage(str(logo_path), width=2.6 * cm, height=2.6 * cm)
    else:
        logo_img = Spacer(2.6 * cm, 2.6 * cm)

    report_kind = "דוח פנימי מלא" if include_internal else "דוח ללקוח"
    title_para = Paragraph(_h(f"יומן בדיקות ואחזקה בתא לחץ — {report.site}"), title_style)
    subtitle_para = Paragraph(_h(report_kind), subtitle_style)

    meta_pairs = [
        ("טכנאי", report.technician),
        ("אתר", report.site),
        ("מזהה מכונה", report.machine_id),
        ("תאריך", report.timestamp.strftime("%d/%m/%Y %H:%M")),
    ]
    if report.quarter:
        meta_pairs.append(("רבעון", report.quarter))
    meta_lines = [f"{_h(v)} :{_h(k)}" for k, v in meta_pairs]
    meta_para = Paragraph("<br/>".join(meta_lines), meta_style)

    header_inner = [[subtitle_para], [meta_para]]
    header_text = Table([[title_para], [Table(header_inner)]], colWidths=[14.4 * cm])
    header_text.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    header = Table([[header_text, logo_img]], colWidths=[14.4 * cm, 3.2 * cm])
    header.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",         (1, 0), (1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    story.append(header)
    story.append(Spacer(1, 0.4 * cm))

    # ── טבלת סעיפים ──
    # סדר עמודות ויזואלי (שמאל→ימין): הערה/ערך | סטטוס | תת-בדיקה
    # סדר קריאה בעברית (ימין→שמאל):   תת-בדיקה | סטטוס | הערה/ערך
    col_widths = [5.6 * cm, 2.6 * cm, 9.4 * cm]

    total_failed = 0
    total_notes = 0

    for section in report.sections:
        checks = section.checks if include_internal else [
            c for c in section.checks if not c.internal
        ]
        if not checks:
            continue

        rows = [[_h("הערה / ערך"), _h("סטטוס"), _h(section.name)]]
        row_styles: list[tuple] = []

        for check in checks:
            r = len(rows)
            if check.kind == "value":
                rows.append([
                    _h(check.value) if check.value else "—",
                    "",
                    _h(f"{check.description}:"),
                ])
                row_styles.append(("BACKGROUND", (0, r), (-1, r), LIGHT))
            else:
                rows.append([
                    _h(check.note) if check.note else "",
                    _h(check.status.value),
                    _h(check.description),
                ])
                if check.status == Status.FAILED:
                    row_styles.append(("BACKGROUND", (1, r), (1, r), RED_BG))
                    total_failed += 1
                elif check.status == Status.NOTE:
                    row_styles.append(("BACKGROUND", (1, r), (1, r), YELLOW_BG))
                    total_notes += 1

        table = Table(rows, colWidths=col_widths, repeatRows=1)
        style = TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR",     (0, 0), (-1, 0), GOLD),
            ("FONTNAME",      (0, 0), (-1, -1), font_reg),
            ("FONTNAME",      (0, 0), (-1, 0), font_bold),
            ("FONTSIZE",      (0, 0), (-1, -1), 9),
            ("ALIGN",         (0, 0), (-1, -1), "RIGHT"),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("GRID",          (0, 0), (-1, -1), 0.5, GRID),
            ("TOPPADDING",    (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            *row_styles,
        ])
        table.setStyle(style)
        story.append(table)
        story.append(Spacer(1, 0.25 * cm))

    # ── סיכום ──
    total_checks = sum(
        1 for s in report.sections for c in s.checks
        if c.kind == "check" and (include_internal or not c.internal)
    )
    ok_count = total_checks - total_failed - total_notes

    summary = Table(
        [
            [_h("הערות"), _h("לא תקין"), _h("תקין")],
            [str(total_notes), str(total_failed), str(ok_count)],
        ],
        colWidths=[5.87 * cm] * 3,
    )
    summary.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), GOLD),
        ("BACKGROUND",    (0, 1), (0, 1), YELLOW_BG),
        ("BACKGROUND",    (1, 1), (1, 1), RED_BG),
        ("BACKGROUND",    (2, 1), (2, 1), colors.HexColor("#D5F5E3")),
        ("FONTNAME",      (0, 0), (-1, -1), font_reg),
        ("FONTNAME",      (0, 0), (-1, 0), font_bold),
        ("FONTSIZE",      (0, 0), (-1, -1), 11),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, GRID),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Spacer(1, 0.2 * cm))
    story.append(summary)

    # ── הערות כלליות + חתימה ──
    body_style = ParagraphStyle("body", fontName=font_reg, fontSize=10,
                                alignment=TA_RIGHT, textColor=colors.black)
    if report.general_comments.strip():
        story.append(Spacer(1, 0.4 * cm))
        story.append(Paragraph(_h(f"הערות: {report.general_comments}"), body_style))

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(_h(f"חתימה: {report.technician}"), body_style))

    doc.build(story)
    return buf.getvalue()
