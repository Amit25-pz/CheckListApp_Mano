from __future__ import annotations

from datetime import datetime
from enum import Enum

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

    The DataFrame contains one row per checklist item, followed by a
    metadata row that records technician, hospital, machine_id, and timestamp.
    """
    rows = []
    for item in report.items:
        rows.append({
            "מזהה": item.id,
            "קטגוריה": item.category.value,
            "תיאור": item.description,
            "סטטוס": item.status.value,
            "הערה": item.note,
        })

    df_items = pd.DataFrame(rows)

    # Metadata appended as extra rows with a separator
    meta = pd.DataFrame([
        {
            "מזהה": "",
            "קטגוריה": "--- פרטי דוח ---",
            "תיאור": "",
            "סטטוס": "",
            "הערה": "",
        },
        {
            "מזהה": "טכנאי",
            "קטגוריה": report.technician,
            "תיאור": "",
            "סטטוס": "",
            "הערה": "",
        },
        {
            "מזהה": "בית חולים",
            "קטגוריה": report.hospital,
            "תיאור": "",
            "סטטוס": "",
            "הערה": "",
        },
        {
            "מזהה": "מזהה מכשיר",
            "קטגוריה": report.machine_id,
            "תיאור": "",
            "סטטוס": "",
            "הערה": "",
        },
        {
            "מזהה": "תאריך ושעה",
            "קטגוריה": report.timestamp.strftime("%Y-%m-%d %H:%M"),
            "תיאור": "",
            "סטטוס": "",
            "הערה": "",
        },
    ])

    return pd.concat([df_items, meta], ignore_index=True)


def generate_filename(report: MaintenanceReport) -> str:
    """Generate a timestamped filename for a maintenance report CSV."""
    ts = report.timestamp.strftime("%Y-%m-%d_%H-%M")
    tech = report.technician.replace(" ", "_")
    hospital = report.hospital.replace(" ", "_")
    machine = report.machine_id.replace(" ", "_")
    return f"{ts}_{tech}_{hospital}_{machine}.csv"
