/**
 * תבניות צ'ק-ליסט לפי אתר — מקביל ל-checklists.py בגרסת המחשב.
 * מתומלל ממסמכי "יומן בדיקות ואחזקה בתא לחץ".
 *
 * kind="check"  ⇒ תת-בדיקה עם סטטוס (תקין / לא תקין / הערה)
 * kind="value"  ⇒ שדה הזנת ערך (תאריך / שעות עבודה)
 * internal=true ⇒ מופיע רק בדוח הפנימי, מוסתר מדוח הלקוח
 */

export type CheckKind = 'check' | 'value';

export interface CheckDef {
  description: string;
  kind: CheckKind;
  internal: boolean;
}

export interface SectionDef {
  name: string;
  checks: CheckDef[];
}

export interface SiteTemplate {
  site: string;
  sections: SectionDef[];
  hasQuarter: boolean;
}

const c = (description: string): CheckDef => ({ description, kind: 'check', internal: false });
const v = (description: string, internal = false): CheckDef => ({ description, kind: 'value', internal });

// ── סעיפים משותפים לכל האתרים ──────────────────────────────────────────────

const UPS: SectionDef = {
  name: 'UPS',
  checks: [
    c('בדיקה של סטטוס תפקוד בצג'),
    c('בדיקת זמן עבודה'),
    v('תאריך בדיקה אחרון'),
  ],
};

const BODY: SectionDef = {
  name: 'גוף התא חיצונית ופנימית',
  checks: [c('מצב צבע'), c('סימני חלודה')],
};

const WINDOWS: SectionDef = {
  name: 'חלונות התא',
  checks: [
    c('בדיקת שריטות'),
    c('רטיבות או צבע מוזר באטם'),
    c('עננות / עכירות בחלון'),
  ],
};

const MEDICAL_LOCK: SectionDef = {
  name: 'שרוול רפואי',
  checks: [
    c('בדיקת אטמים'),
    c('בדיקת משטחי אטימה'),
    c('בדיקת ברגי צירים'),
    c('בדיקת תפקוד מנגנון בטיחות'),
    c('בדיקת חופשים'),
  ],
};

const EXTINGUISHERS: SectionDef = {
  name: 'מטפי כיבוי אש',
  checks: [
    c('בדיקת לחץ בשעון'),
    c('בדיקת תאריך לתחזוקה'),
    c('בדיקת ניצרה ושלמות פלומבה'),
  ],
};

const DEMAND_REGULATORS: SectionDef = {
  name: 'ווסתי דרישה',
  checks: [
    c('בדיקת דליפות, זרימה חופשית'),
    c('חופש על פיית חיבור הצינור'),
    c('בדיקת התנגדות נשימתית'),
    v('תאריך בדיקה אחרון', true),
  ],
};

const PLATE_REGULATORS: SectionDef = {
  name: 'ווסתי פלטה',
  checks: [
    c('בדיקת דליפות, זרימה חופשית'),
    c('חופש על פיית חיבור הצינור'),
    c('בדיקת התנגדות נשימתית'),
    v('תאריך בדיקה אחרון', true),
  ],
};

const COMMS: SectionDef = {
  name: 'מערכת קשר חירום',
  checks: [c('בדיקת חוגת הקריאה'), c('דיבור ושמע תקינים')],
};

const CAMERAS: SectionDef = {
  name: 'מצלמות',
  checks: [c('בדיקה שכל העמדות נראות'), c('כל המצלמות בפוקוס')],
};

const MONITORING: SectionDef = {
  name: 'מערכת מוניטורינג',
  checks: [c('ניקוי פילטרים')],
};

const HVAC: SectionDef = {
  name: 'מערכת מיזוג',
  checks: [
    c('ניקוי מגש ניקוז'),
    c('בדיקת ספיקת אוויר'),
    c('ניקוי אבק מהרדיאטור במידת הצורך'),
    c('בדיקת תפקוד מפוח'),
    c('בדיקת מערכת מים קרים'),
    c('בדיקת משאבות מים קרים'),
    c('בדיקת מערכת מים חמים'),
    c('בדיקת משאבות סחרור מים חמים'),
  ],
};

const HP_AIR_BANK: SectionDef = {
  name: 'בנק אוויר HP (Operation/Reserve)',
  checks: [c('בדיקת דליפות'), c('בדיקת מדי לחץ')],
};

const HP_TO_LP_PANEL: SectionDef = {
  name: 'פנל אספקה מ-HP ל-LP',
  checks: [
    c('בדיקת תפקוד ברזי MASTERVALVE'),
    c('אילוץ שסתום ביטחון'),
    c('בדיקת מדי לחץ גבוה/נמוך'),
    c('בדיקת דליפות'),
  ],
};

// ── וריאציות בין אתרים ─────────────────────────────────────────────────────

const mainElectric = (breakerWording: string): SectionDef => ({
  name: 'לוח חשמל ראשי',
  checks: [
    c('בדיקת נורות חיווי פזות ו-UPS'),
    c('בדיקת פילטרים כניסת אוויר'),
    c('בדיקת טרמוסטט ומאווררים'),
    c('בדיקת ריח, רעש, סימני חריכה וסימנים מעידים אחרים'),
    c(breakerWording),
  ],
});

const ELECTRIC_MAMAT = mainElectric('כל מפסקי מאמ"ת על מצב דולק');
const ELECTRIC_MAMAT_ALT = mainElectric('כל מפסקי ממט על מצב דולק');

const DOORS_FULL: SectionDef = {
  name: 'דלתות התא',
  checks: [
    c('בדיקת אטמים'),
    c('בדיקת משטחי אטימה'),
    c('בדיקת ברגי צירים'),
    c('בדיקה של המיסבים ורולרים'),
    c('בדיקה של בלמים ומעצורים'),
  ],
};

const DOORS_REDUCED: SectionDef = {
  name: 'דלתות התא',
  checks: [
    c('בדיקת אטמים'),
    c('בדיקת משטחי אטימה'),
    c('בדיקת ברגי צירים'),
    c('בדיקה של המיסבים'),
    c('בדיקה של בלמים ומעצורים'),
  ],
};

const LIGHTING_STRIPS: SectionDef = {
  name: 'תאורת התא',
  checks: [c('בדיקת ריצודים'), c('אחידות בעוצמת תאורת הפסים')],
};

const LIGHTING_BULBS: SectionDef = {
  name: 'תאורת התא',
  checks: [c('בדיקת נורות דולקות'), c('אחידות בעוצמת תאורת הנורות')],
};

const safetyValves = (wording: string, withDischarge = false): SectionDef => ({
  name: 'שסתומי ביטחון של התא',
  checks: withDischarge
    ? [c(wording), c('בדיקת פריקה'), v('תאריך בדיקה אחרון', true)]
    : [c(wording)],
});

const MANUAL_PANEL_FULL: SectionDef = {
  name: 'פנל הפעלה ידנית',
  checks: [
    c('בדיקת תפקוד מסך מגע'),
    c('בדיקה וכיול מד חמצן'),
    c('בדיקת ברזי MASTERVALVE'),
    c('בדיקת ברזי STARVALVE, תפקוד מנועים ורצועות הנעה'),
    c('בדיקת מערכת אוורור, תפקוד מנועים ורצועות הנעה'),
    c('בדיקת caisson gauge'),
    c('בדיקת ברזי שחרור מהיר, תפקוד מנועים וחיווי נכון במערכת ה-BUS'),
  ],
};

const MANUAL_PANEL_REDUCED: SectionDef = {
  name: 'פנל הפעלה ידנית',
  checks: [
    c('בדיקה וכיול מד חמצן'),
    c('בדיקת ברזי MASTERVALVE'),
    c('בדיקת ברזי STARVALVE, תפקוד מנועים ורצועות הנעה'),
    c('בדיקת מערכת אוורור, תפקוד מנועים ורצועות הנעה'),
    c('בדיקת caisson gauge'),
    c('בדיקת ברזי שחרור מהיר, תפקוד מנועים וחיווי נכון במערכת ה-BUS'),
  ],
};

const MAIN_PANEL_FULL: SectionDef = {
  name: 'פנל הפעלה ראשי',
  checks: [
    c('בדיקת מחשבים וניקוי פילטרים'),
    c('בדיקת תפקוד מערכת התראות'),
    c('תפקוד מערכת DECOMAT'),
    c('תפקוד מערכת BUS'),
  ],
};

const MAIN_PANEL_REDUCED: SectionDef = {
  name: 'פנל הפעלה ראשי',
  checks: [
    c('בדיקת מחשב וניקוי פילטר'),
    c('בדיקת תפקוד מערכת התראות'),
    c('תפקוד מערכת DECOMAT'),
    c('תפקוד מערכת BUS'),
  ],
};

const MULTIMEDIA_SCREENS: SectionDef = {
  name: 'מערכת מולטימדיה/בידור',
  checks: [c('בדיקת תושבות מסכים')],
};

const MULTIMEDIA_GENERAL: SectionDef = {
  name: 'מערכת מולטימדיה/בידור',
  checks: [c('בדיקת תקינות מערכת')],
};

const HP_COMPRESSOR_FULL: SectionDef = {
  name: 'מדחס HP',
  checks: [
    c('בדיקת גובה שמן'),
    c('בדיקת דליפות אוויר/שמן'),
    c('בדיקת מצב רווית פילטר'),
  ],
};

const HP_COMPRESSOR_REDUCED: SectionDef = {
  name: 'מדחס HP',
  checks: [c('בדיקת גובה שמן'), c('בדיקת דליפות אוויר/שמן')],
};

const HP_PIPING_FULL: SectionDef = {
  name: 'ברזים וצנרת HP',
  checks: [
    c('בדיקת דליפות'),
    c('הפעלת ברזים כדוריים ווידוא הימצאותם במנח הנכון'),
    c('פלומבות בברזים מגשרים או של מערכות חירום'),
  ],
};

const HP_PIPING_REDUCED: SectionDef = {
  name: 'ברזים וצנרת HP',
  checks: [
    c('בדיקת דליפות'),
    c('הפעלת ברזים כדוריים ווידוא הימצאותם במנח הנכון'),
  ],
};

const FIRE_SYSTEM_FULL: SectionDef = {
  name: 'מערכת כיבוי אש ראשית',
  checks: [
    c('בדיקת לחץ גבוה תקין'),
    c('בדיקת לחץ למיכל מים תקין'),
    c('בדיקת לחץ הפעלה תקין'),
    c('בדיקת חיווי גובה מים תקין'),
    c('בדיקת דליפות מים/אוויר'),
    c('בדיקת פנל הפעלה פניאומטי/חשמלי מאובטח עם פלומבה'),
    c('בדיקת אבטחות פלומבה על ברזי הפעלה ידנית'),
    c('אילוץ שסתום ביטחון'),
    v('תאריך טיפול אחרון', true),
  ],
};

const FIRE_SYSTEM_REDUCED: SectionDef = {
  name: 'מערכת כיבוי אש ראשית',
  checks: [
    c('בדיקת לחץ גבוה תקין'),
    c('בדיקת לחץ למיכל מים תקין'),
    c('בדיקת לחץ הפעלה תקין'),
    c('בדיקת חיווי גובה מים תקין'),
    c('בדיקת דליפות מים/אוויר'),
    c('בדיקת אבטחות על ברזי הפעלה ידנית'),
    c('אילוץ שסתום ביטחון'),
    v('תאריך טיפול אחרון', true),
  ],
};

const LP_COMPRESSORS: SectionDef = {
  name: 'מדחסים LP',
  checks: [
    c('בדיקת גובה שמן'),
    c('בדיקת דליפות אוויר/שמן'),
    c('בדיקת רצועות'),
    c('בדיקת פילטר אוויר'),
    c('ניקוי חלל הקומפרסור והרדיאטור'),
    c('בדיקת תפקוד מדחס (יש להפעיל את המייבש 5 דקות לפני הפעלת מדחס)'),
    v('שעות עבודה', true),
    v('תאריך טיפול אחרון', true),
  ],
};

const LP_FILTERS_FULL: SectionDef = {
  name: 'מערכת פילטרים LP',
  checks: [
    c('בדיקת נקזים אוטומטיים/ידניים'),
    c('בדיקת רווית פחם פעיל'),
    c('לוודא ברזי הפרדה בין המערכות סגורים ומאובטחים בפלומבה'),
    v('תאריך טיפול אחרון', true),
  ],
};

const LP_FILTERS_REDUCED: SectionDef = {
  name: 'מערכת פילטרים',
  checks: [
    c('בדיקת נקז אוטומטי'),
    c('בדיקת רווית פחם פעיל'),
    v('תאריך טיפול אחרון', true),
  ],
};

const LP_AIR_BANK: SectionDef = {
  name: 'בנק אוויר LP',
  checks: [
    c('בדיקת דליפות אוויר'),
    c('בדיקת לחות בברז ניקוז'),
    c('אילוץ שסתום ביטחון'),
  ],
};

const LP_PIPING: SectionDef = {
  name: 'צנרת וברזי LP',
  checks: [c('בדיקת דליפות'), c('הפעלת ברזים כדוריים')],
};

// ── הרכבת התבניות ──────────────────────────────────────────────────────────

const fullTemplate = (electric: SectionDef, safety: SectionDef): SectionDef[] => [
  electric,
  UPS,
  BODY,
  WINDOWS,
  DOORS_FULL,
  MEDICAL_LOCK,
  EXTINGUISHERS,
  DEMAND_REGULATORS,
  PLATE_REGULATORS,
  COMMS,
  LIGHTING_STRIPS,
  CAMERAS,
  safety,
  MANUAL_PANEL_FULL,
  MAIN_PANEL_FULL,
  MONITORING,
  MULTIMEDIA_SCREENS,
  HVAC,
  HP_COMPRESSOR_FULL,
  HP_AIR_BANK,
  HP_PIPING_FULL,
  HP_TO_LP_PANEL,
  FIRE_SYSTEM_FULL,
  LP_COMPRESSORS,
  LP_FILTERS_FULL,
  LP_AIR_BANK,
  LP_PIPING,
];

const reducedTemplate = (safety: SectionDef, hpCompressor: SectionDef): SectionDef[] => [
  ELECTRIC_MAMAT,
  UPS,
  BODY,
  WINDOWS,
  DOORS_REDUCED,
  MEDICAL_LOCK,
  EXTINGUISHERS,
  DEMAND_REGULATORS,
  PLATE_REGULATORS,
  COMMS,
  LIGHTING_BULBS,
  CAMERAS,
  safety,
  MANUAL_PANEL_REDUCED,
  MAIN_PANEL_REDUCED,
  MONITORING,
  MULTIMEDIA_GENERAL,
  HVAC,
  hpCompressor,
  HP_AIR_BANK,
  HP_PIPING_REDUCED,
  HP_TO_LP_PANEL,
  FIRE_SYSTEM_REDUCED,
  LP_FILTERS_REDUCED,
];

export const TEMPLATES: Record<string, SiteTemplate> = {
  Arison: {
    site: 'Arison',
    sections: fullTemplate(ELECTRIC_MAMAT, safetyValves('אילוץ שסתומי ביטחון MC1/AC/MC2')),
    hasQuarter: false,
  },
  Segol: {
    site: 'Segol',
    sections: fullTemplate(ELECTRIC_MAMAT_ALT, safetyValves('אילוץ שסתומי ביטחון MC1/AC/MC2')),
    hasQuarter: false,
  },
  'אלישע': {
    site: 'אלישע',
    sections: reducedTemplate(safetyValves('אילוץ שסתומי MC/AC'), HP_COMPRESSOR_FULL),
    hasQuarter: true,
  },
  'חיל הים': {
    site: 'חיל הים',
    sections: reducedTemplate(safetyValves('אילוץ שסתומי MC1/MC2/AC'), HP_COMPRESSOR_REDUCED),
    hasQuarter: true,
  },
  'כללי': {
    site: 'כללי',
    sections: fullTemplate(
      ELECTRIC_MAMAT_ALT,
      safetyValves('אילוץ שסתומי ביטחון MC1/AC/MC2', true)
    ),
    hasQuarter: true,
  },
};

export const SITE_NAMES: string[] = Object.keys(TEMPLATES);

/** האתר "אחר..." משתמש בתבנית הכללית */
export function templateForSite(site: string): SiteTemplate {
  return TEMPLATES[site] ?? TEMPLATES['כללי'];
}

/** מפתח ייחודי ויציב לכל תת-בדיקה */
export function checkKey(site: string, sectionIndex: number, checkIndex: number): string {
  return `${site}:${sectionIndex}:${checkIndex}`;
}

/** רבעון מתאריך: Q1 = ינואר-מרץ וכן הלאה */
export function quarterFromDate(d: Date): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1}`;
}

export const APP_VERSION = '2.0.0';
