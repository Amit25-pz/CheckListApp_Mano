# -*- coding: utf-8 -*-
"""מודלי נתונים לדוח תחזוקת תא לחץ — גרסה 2 (מבנה היררכי לפי אתר)."""

from __future__ import annotations

import re
from datetime import datetime
from enum import Enum

import pandas as pd
from pydantic import BaseModel, Field

from checklists import SiteTemplate

APP_VERSION = "2.0.0"


class Status(str, Enum):
    OK = "תקין"
    FAILED = "לא תקין"
    NOTE = "הערה"


# סימוני המקרא כפי שמופיעים בטופס המקורי
STATUS_SYMBOLS = {
    Status.OK: "☑",
    Status.FAILED: "☒",
    Status.NOTE: "✱",
}


class CheckResult(BaseModel):
    description: str
    kind: str = "check"          # "check" | "value"
    internal: bool = False       # מוסתר מדוח הלקוח
    status: Status = Status.OK   # רלוונטי רק ל-kind="check"
    note: str = ""
    value: str = ""              # רלוונטי רק ל-kind="value"


class SectionResult(BaseModel):
    name: str
    checks: list[CheckResult]

    @property
    def failed_count(self) -> int:
        return sum(1 for c in self.checks if c.kind == "check" and c.status == Status.FAILED)

    @property
    def note_count(self) -> int:
        return sum(1 for c in self.checks if c.kind == "check" and c.status == Status.NOTE)


class MaintenanceReport(BaseModel):
    technician: str = "עמנואל גוטמן"
    site: str
    machine_id: str
    quarter: str = ""
    timestamp: datetime = Field(default_factory=datetime.now)
    sections: list[SectionResult]
    image_paths: dict[str, str] = {}   # שם סעיף -> נתיב תמונה
    general_comments: str = ""
    app_version: str = APP_VERSION


def results_from_template(template: SiteTemplate) -> list[SectionResult]:
    """בניית עץ תוצאות ריק (הכל 'תקין') מתוך תבנית אתר."""
    return [
        SectionResult(
            name=section.name,
            checks=[
                CheckResult(
                    description=check.description,
                    kind=check.kind,
                    internal=check.internal,
                )
                for check in section.checks
            ],
        )
        for section in template.sections
    ]


def quarter_from_date(dt: datetime) -> str:
    """חישוב רבעון מתאריך: Q1 = ינואר-מרץ וכן הלאה."""
    return f"Q{(dt.month - 1) // 3 + 1}"


# ---------------------------------------------------------------------------
# שמות קבצים
# ---------------------------------------------------------------------------

def sanitize_filename_part(text: str) -> str:
    """ניקוי רכיב של שם קובץ: רווחים לקו תחתון, הסרת תווים אסורים ב-Windows
    ותווי ניווט נתיב (הגנה מ-path traversal בשמות שהוזנו חופשית)."""
    text = text.strip().replace(" ", "_")
    text = re.sub(r'[\\/:*?"<>|]', "", text)
    text = text.replace("..", "")
    return text or "ללא_שם"


def generate_filename(report: MaintenanceReport) -> str:
    """שם קובץ בסיס (ללא סיומת): YYYY-MM-DD_HH-MM_טכנאי_אתר_מכונה."""
    ts = report.timestamp.strftime("%Y-%m-%d_%H-%M")
    parts = [
        sanitize_filename_part(report.technician),
        sanitize_filename_part(report.site),
        sanitize_filename_part(report.machine_id),
    ]
    return "_".join([ts, *parts])


# ---------------------------------------------------------------------------
# ייצוא טבלאי (CSV)
# ---------------------------------------------------------------------------

def report_to_dataframe(report: MaintenanceReport) -> pd.DataFrame:
    """שורה אחת לכל תת-בדיקה/שדה ערך; המטא-דאטה חוזר בכל שורה."""
    rows = []
    for section in report.sections:
        for check in section.checks:
            rows.append({
                "תאריך": report.timestamp.strftime("%Y-%m-%d %H:%M"),
                "רבעון": report.quarter,
                "טכנאי": report.technician,
                "אתר": report.site,
                "מזהה מכונה": report.machine_id,
                "סעיף": section.name,
                "תת-בדיקה": check.description,
                "סוג": "שדה ערך" if check.kind == "value" else "בדיקה",
                "סטטוס": "" if check.kind == "value" else check.status.value,
                "ערך": check.value,
                "הערה": check.note,
                "פנימי בלבד": "כן" if check.internal else "",
                "הערות כלליות": report.general_comments,
                "גרסת אפליקציה": report.app_version,
            })
    return pd.DataFrame(rows)
