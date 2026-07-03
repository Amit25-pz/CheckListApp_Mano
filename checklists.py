# -*- coding: utf-8 -*-
"""תבניות צ'ק-ליסט לפי אתר — מתומלל ממסמכי "יומן בדיקות ואחזקה בתא לחץ".

קובץ נתונים בלבד (ללא לוגיקה). כל אתר מקבל את רשימת הסעיפים המדויקת שלו:
  - Arison / Segol — התבנית המלאה (כולל מערכות LP)
  - אלישע / חיל הים — תבנית מצומצמת (ללא מדחסי LP, בנק אוויר LP וצנרת LP)
  - כללי — התבנית המלאה + "בדיקת פריקה" לשסתומי ביטחון

kind="check"  ⇒ תת-בדיקה עם סטטוס (תקין / לא תקין / הערה)
kind="value"  ⇒ שדה הזנת ערך (תאריך / שעות עבודה)
internal=True ⇒ מופיע רק בדוח הפנימי, מוסתר מדוח הלקוח
                (לפי הסימון "לא צריך להיות חשוף ללקוח בדו\"ח השבועי" במסמך הכללי;
                 המדיניות מוחלת על אותם שדות בכל האתרים)
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Check:
    description: str
    kind: str = "check"        # "check" | "value"
    internal: bool = False


@dataclass(frozen=True)
class Section:
    name: str
    checks: tuple[Check, ...]


def _c(desc: str) -> Check:
    return Check(description=desc)


def _v(label: str, internal: bool = False) -> Check:
    return Check(description=label, kind="value", internal=internal)


# ---------------------------------------------------------------------------
# סעיפים משותפים לכל האתרים (זהים בכל חמשת המסמכים)
# ---------------------------------------------------------------------------

_UPS = Section("UPS", (
    _c("בדיקה של סטטוס תפקוד בצג"),
    _c("בדיקת זמן עבודה"),
    _v("תאריך בדיקה אחרון"),
))

_BODY = Section("גוף התא חיצונית ופנימית", (
    _c("מצב צבע"),
    _c("סימני חלודה"),
))

_WINDOWS = Section("חלונות התא", (
    _c("בדיקת שריטות"),
    _c("רטיבות או צבע מוזר באטם"),
    _c("עננות / עכירות בחלון"),
))

_MEDICAL_LOCK = Section("שרוול רפואי", (
    _c("בדיקת אטמים"),
    _c("בדיקת משטחי אטימה"),
    _c("בדיקת ברגי צירים"),
    _c("בדיקת תפקוד מנגנון בטיחות"),
    _c("בדיקת חופשים"),
))

_EXTINGUISHERS = Section("מטפי כיבוי אש", (
    _c("בדיקת לחץ בשעון"),
    _c("בדיקת תאריך לתחזוקה"),
    _c("בדיקת ניצרה ושלמות פלומבה"),
))

_DEMAND_REGULATORS = Section("ווסתי דרישה", (
    _c("בדיקת דליפות, זרימה חופשית"),
    _c("חופש על פיית חיבור הצינור"),
    _c("בדיקת התנגדות נשימתית"),
    _v("תאריך בדיקה אחרון", internal=True),
))

_PLATE_REGULATORS = Section("ווסתי פלטה", (
    _c("בדיקת דליפות, זרימה חופשית"),
    _c("חופש על פיית חיבור הצינור"),
    _c("בדיקת התנגדות נשימתית"),
    _v("תאריך בדיקה אחרון", internal=True),
))

_COMMS = Section("מערכת קשר חירום", (
    _c("בדיקת חוגת הקריאה"),
    _c("דיבור ושמע תקינים"),
))

_CAMERAS = Section("מצלמות", (
    _c("בדיקה שכל העמדות נראות"),
    _c("כל המצלמות בפוקוס"),
))

_MONITORING = Section("מערכת מוניטורינג", (
    _c("ניקוי פילטרים"),
))

_HVAC = Section("מערכת מיזוג", (
    _c("ניקוי מגש ניקוז"),
    _c("בדיקת ספיקת אוויר"),
    _c("ניקוי אבק מהרדיאטור במידת הצורך"),
    _c("בדיקת תפקוד מפוח"),
    _c("בדיקת מערכת מים קרים"),
    _c("בדיקת משאבות מים קרים"),
    _c("בדיקת מערכת מים חמים"),
    _c("בדיקת משאבות סחרור מים חמים"),
))

_HP_AIR_BANK = Section("בנק אוויר HP (Operation/Reserve)", (
    _c("בדיקת דליפות"),
    _c("בדיקת מדי לחץ"),
))

_HP_TO_LP_PANEL = Section("פנל אספקה מ-HP ל-LP", (
    _c("בדיקת תפקוד ברזי MASTERVALVE"),
    _c("אילוץ שסתום ביטחון"),
    _c("בדיקת מדי לחץ גבוה/נמוך"),
    _c("בדיקת דליפות"),
))

# ---------------------------------------------------------------------------
# וריאציות של סעיפים (הבדלים בין המסמכים)
# ---------------------------------------------------------------------------

def _main_electric(breaker_wording: str) -> Section:
    """לוח חשמל ראשי — Arison/אלישע/חיל הים: מאמ"ת; Segol/כללי: ממט."""
    return Section("לוח חשמל ראשי", (
        _c("בדיקת נורות חיווי פזות ו-UPS"),
        _c("בדיקת פילטרים כניסת אוויר"),
        _c("בדיקת טרמוסטט ומאווררים"),
        _c("בדיקת ריח, רעש, סימני חריכה וסימנים מעידים אחרים"),
        _c(breaker_wording),
    ))

_ELECTRIC_MAMAT = _main_electric('כל מפסקי מאמ"ת על מצב דולק')
_ELECTRIC_MAMAT_ALT = _main_electric("כל מפסקי ממט על מצב דולק")

_DOORS_FULL = Section("דלתות התא", (
    _c("בדיקת אטמים"),
    _c("בדיקת משטחי אטימה"),
    _c("בדיקת ברגי צירים"),
    _c("בדיקה של המיסבים ורולרים"),
    _c("בדיקה של בלמים ומעצורים"),
))

_DOORS_REDUCED = Section("דלתות התא", (
    _c("בדיקת אטמים"),
    _c("בדיקת משטחי אטימה"),
    _c("בדיקת ברגי צירים"),
    _c("בדיקה של המיסבים"),
    _c("בדיקה של בלמים ומעצורים"),
))

_LIGHTING_STRIPS = Section("תאורת התא", (
    _c("בדיקת ריצודים"),
    _c("אחידות בעוצמת תאורת הפסים"),
))

_LIGHTING_BULBS = Section("תאורת התא", (
    _c("בדיקת נורות דולקות"),
    _c("אחידות בעוצמת תאורת הנורות"),
))

def _safety_valves(wording: str, with_discharge: bool = False) -> Section:
    checks: list[Check] = [_c(wording)]
    if with_discharge:
        checks.append(_c("בדיקת פריקה"))
        checks.append(_v("תאריך בדיקה אחרון", internal=True))
    return Section("שסתומי ביטחון של התא", tuple(checks))

_MANUAL_PANEL_FULL = Section("פנל הפעלה ידנית", (
    _c("בדיקת תפקוד מסך מגע"),
    _c("בדיקה וכיול מד חמצן"),
    _c("בדיקת ברזי MASTERVALVE"),
    _c("בדיקת ברזי STARVALVE, תפקוד מנועים ורצועות הנעה"),
    _c("בדיקת מערכת אוורור, תפקוד מנועים ורצועות הנעה"),
    _c("בדיקת caisson gauge"),
    _c("בדיקת ברזי שחרור מהיר, תפקוד מנועים וחיווי נכון במערכת ה-BUS"),
))

_MANUAL_PANEL_REDUCED = Section("פנל הפעלה ידנית", (
    _c("בדיקה וכיול מד חמצן"),
    _c("בדיקת ברזי MASTERVALVE"),
    _c("בדיקת ברזי STARVALVE, תפקוד מנועים ורצועות הנעה"),
    _c("בדיקת מערכת אוורור, תפקוד מנועים ורצועות הנעה"),
    _c("בדיקת caisson gauge"),
    _c("בדיקת ברזי שחרור מהיר, תפקוד מנועים וחיווי נכון במערכת ה-BUS"),
))

_MAIN_PANEL_FULL = Section("פנל הפעלה ראשי", (
    _c("בדיקת מחשבים וניקוי פילטרים"),
    _c("בדיקת תפקוד מערכת התראות"),
    _c("תפקוד מערכת DECOMAT"),
    _c("תפקוד מערכת BUS"),
))

_MAIN_PANEL_REDUCED = Section("פנל הפעלה ראשי", (
    _c("בדיקת מחשב וניקוי פילטר"),
    _c("בדיקת תפקוד מערכת התראות"),
    _c("תפקוד מערכת DECOMAT"),
    _c("תפקוד מערכת BUS"),
))

_MULTIMEDIA_SCREENS = Section("מערכת מולטימדיה/בידור", (
    _c("בדיקת תושבות מסכים"),
))

_MULTIMEDIA_GENERAL = Section("מערכת מולטימדיה/בידור", (
    _c("בדיקת תקינות מערכת"),
))

_HP_COMPRESSOR_FULL = Section("מדחס HP", (
    _c("בדיקת גובה שמן"),
    _c("בדיקת דליפות אוויר/שמן"),
    _c("בדיקת מצב רווית פילטר"),
))

_HP_COMPRESSOR_REDUCED = Section("מדחס HP", (
    _c("בדיקת גובה שמן"),
    _c("בדיקת דליפות אוויר/שמן"),
))

_HP_PIPING_FULL = Section("ברזים וצנרת HP", (
    _c("בדיקת דליפות"),
    _c("הפעלת ברזים כדוריים ווידוא הימצאותם במנח הנכון"),
    _c("פלומבות בברזים מגשרים או של מערכות חירום"),
))

_HP_PIPING_REDUCED = Section("ברזים וצנרת HP", (
    _c("בדיקת דליפות"),
    _c("הפעלת ברזים כדוריים ווידוא הימצאותם במנח הנכון"),
))

_FIRE_SYSTEM_FULL = Section("מערכת כיבוי אש ראשית", (
    _c("בדיקת לחץ גבוה תקין"),
    _c("בדיקת לחץ למיכל מים תקין"),
    _c("בדיקת לחץ הפעלה תקין"),
    _c("בדיקת חיווי גובה מים תקין"),
    _c("בדיקת דליפות מים/אוויר"),
    _c("בדיקת פנל הפעלה פניאומטי/חשמלי מאובטח עם פלומבה"),
    _c("בדיקת אבטחות פלומבה על ברזי הפעלה ידנית"),
    _c("אילוץ שסתום ביטחון"),
    _v("תאריך טיפול אחרון", internal=True),
))

_FIRE_SYSTEM_REDUCED = Section("מערכת כיבוי אש ראשית", (
    _c("בדיקת לחץ גבוה תקין"),
    _c("בדיקת לחץ למיכל מים תקין"),
    _c("בדיקת לחץ הפעלה תקין"),
    _c("בדיקת חיווי גובה מים תקין"),
    _c("בדיקת דליפות מים/אוויר"),
    _c("בדיקת אבטחות על ברזי הפעלה ידנית"),
    _c("אילוץ שסתום ביטחון"),
    _v("תאריך טיפול אחרון", internal=True),
))

_LP_COMPRESSORS = Section("מדחסים LP", (
    _c("בדיקת גובה שמן"),
    _c("בדיקת דליפות אוויר/שמן"),
    _c("בדיקת רצועות"),
    _c("בדיקת פילטר אוויר"),
    _c("ניקוי חלל הקומפרסור והרדיאטור"),
    _c("בדיקת תפקוד מדחס (יש להפעיל את המייבש 5 דקות לפני הפעלת מדחס)"),
    _v("שעות עבודה", internal=True),
    _v("תאריך טיפול אחרון", internal=True),
))

_LP_FILTERS_FULL = Section("מערכת פילטרים LP", (
    _c("בדיקת נקזים אוטומטיים/ידניים"),
    _c("בדיקת רווית פחם פעיל"),
    _c("לוודא ברזי הפרדה בין המערכות סגורים ומאובטחים בפלומבה"),
    _v("תאריך טיפול אחרון", internal=True),
))

_LP_FILTERS_REDUCED = Section("מערכת פילטרים", (
    _c("בדיקת נקז אוטומטי"),
    _c("בדיקת רווית פחם פעיל"),
    _v("תאריך טיפול אחרון", internal=True),
))

_LP_AIR_BANK = Section("בנק אוויר LP", (
    _c("בדיקת דליפות אוויר"),
    _c("בדיקת לחות בברז ניקוז"),
    _c("אילוץ שסתום ביטחון"),
))

_LP_PIPING = Section("צנרת וברזי LP", (
    _c("בדיקת דליפות"),
    _c("הפעלת ברזים כדוריים"),
))

# ---------------------------------------------------------------------------
# הרכבת התבניות — סעיף אחר סעיף, לפי סדר המסמך המקורי
# ---------------------------------------------------------------------------

def _full_template(electric: Section, safety_valves: Section) -> tuple[Section, ...]:
    """התבנית המלאה (Arison / Segol / כללי) — 27 סעיפים."""
    return (
        electric,
        _UPS,
        _BODY,
        _WINDOWS,
        _DOORS_FULL,
        _MEDICAL_LOCK,
        _EXTINGUISHERS,
        _DEMAND_REGULATORS,
        _PLATE_REGULATORS,
        _COMMS,
        _LIGHTING_STRIPS,
        _CAMERAS,
        safety_valves,
        _MANUAL_PANEL_FULL,
        _MAIN_PANEL_FULL,
        _MONITORING,
        _MULTIMEDIA_SCREENS,
        _HVAC,
        _HP_COMPRESSOR_FULL,
        _HP_AIR_BANK,
        _HP_PIPING_FULL,
        _HP_TO_LP_PANEL,
        _FIRE_SYSTEM_FULL,
        _LP_COMPRESSORS,
        _LP_FILTERS_FULL,
        _LP_AIR_BANK,
        _LP_PIPING,
    )


def _reduced_template(safety_valves: Section, hp_compressor: Section) -> tuple[Section, ...]:
    """התבנית המצומצמת (אלישע / חיל הים) — 24 סעיפים, ללא מערכות LP."""
    return (
        _ELECTRIC_MAMAT,
        _UPS,
        _BODY,
        _WINDOWS,
        _DOORS_REDUCED,
        _MEDICAL_LOCK,
        _EXTINGUISHERS,
        _DEMAND_REGULATORS,
        _PLATE_REGULATORS,
        _COMMS,
        _LIGHTING_BULBS,
        _CAMERAS,
        safety_valves,
        _MANUAL_PANEL_REDUCED,
        _MAIN_PANEL_REDUCED,
        _MONITORING,
        _MULTIMEDIA_GENERAL,
        _HVAC,
        hp_compressor,
        _HP_AIR_BANK,
        _HP_PIPING_REDUCED,
        _HP_TO_LP_PANEL,
        _FIRE_SYSTEM_REDUCED,
        _LP_FILTERS_REDUCED,
    )


@dataclass(frozen=True)
class SiteTemplate:
    site: str
    sections: tuple[Section, ...]
    has_quarter: bool = False   # האם הטופס המקורי כולל שדה "רבעון"


TEMPLATES: dict[str, SiteTemplate] = {
    "Arison": SiteTemplate(
        site="Arison",
        sections=_full_template(
            _ELECTRIC_MAMAT,
            _safety_valves("אילוץ שסתומי ביטחון MC1/AC/MC2"),
        ),
    ),
    "Segol": SiteTemplate(
        site="Segol",
        sections=_full_template(
            _ELECTRIC_MAMAT_ALT,
            _safety_valves("אילוץ שסתומי ביטחון MC1/AC/MC2"),
        ),
    ),
    "אלישע": SiteTemplate(
        site="אלישע",
        sections=_reduced_template(
            _safety_valves("אילוץ שסתומי MC/AC"),
            _HP_COMPRESSOR_FULL,
        ),
        has_quarter=True,
    ),
    "חיל הים": SiteTemplate(
        site="חיל הים",
        sections=_reduced_template(
            _safety_valves("אילוץ שסתומי MC1/MC2/AC"),
            _HP_COMPRESSOR_REDUCED,
        ),
        has_quarter=True,
    ),
    "כללי": SiteTemplate(
        site="כללי",
        sections=_full_template(
            _ELECTRIC_MAMAT_ALT,
            _safety_valves("אילוץ שסתומי ביטחון MC1/AC/MC2", with_discharge=True),
        ),
        has_quarter=True,
    ),
}

SITE_NAMES: list[str] = list(TEMPLATES.keys())
