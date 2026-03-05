import { ChecklistItem } from '../types';

/** 38 default checklist items — mirrors models.py DEFAULT_ITEMS exactly */
export const DEFAULT_ITEMS: ChecklistItem[] = [
  // ─── חשמל (1–8) ───
  { id: 1,  category: 'חשמל', description: 'לוח חשמל ראשי',    status: null, note: '' },
  { id: 2,  category: 'חשמל', description: 'מפסקי זרם',         status: null, note: '' },
  { id: 3,  category: 'חשמל', description: 'כבלים ומוליכים',    status: null, note: '' },
  { id: 4,  category: 'חשמל', description: 'מנורות חירום',       status: null, note: '' },
  { id: 5,  category: 'חשמל', description: 'אדמה חשמלית',        status: null, note: '' },
  { id: 6,  category: 'חשמל', description: 'ספק כוח',            status: null, note: '' },
  { id: 7,  category: 'חשמל', description: 'שקעים חשמליים',      status: null, note: '' },
  { id: 8,  category: 'חשמל', description: 'מערכת UPS',          status: null, note: '' },

  // ─── מבנה (9–15) ───
  { id: 9,  category: 'מבנה', description: 'דלת הלחץ הראשית',   status: null, note: '' },
  { id: 10, category: 'מבנה', description: 'איטום הלחץ',         status: null, note: '' },
  { id: 11, category: 'מבנה', description: 'חלונות תצפית',       status: null, note: '' },
  { id: 12, category: 'מבנה', description: 'מנעולי בטיחות',      status: null, note: '' },
  { id: 13, category: 'מבנה', description: 'מסגרת התא',          status: null, note: '' },
  { id: 14, category: 'מבנה', description: 'ציר הדלת',           status: null, note: '' },
  { id: 15, category: 'מבנה', description: 'צינורות חיצוניים',   status: null, note: '' },

  // ─── בטיחות (16–23) ───
  { id: 16, category: 'בטיחות', description: 'שסתום בטיחות',       status: null, note: '' },
  { id: 17, category: 'בטיחות', description: 'מד לחץ',              status: null, note: '' },
  { id: 18, category: 'בטיחות', description: 'מערכת כיבוי אש',      status: null, note: '' },
  { id: 19, category: 'בטיחות', description: 'חיישן עשן',            status: null, note: '' },
  { id: 20, category: 'בטיחות', description: 'ציוד חירום',           status: null, note: '' },
  { id: 21, category: 'בטיחות', description: 'נוהל חירום',           status: null, note: '' },
  { id: 22, category: 'בטיחות', description: 'מנות חמצן חירום',      status: null, note: '' },
  { id: 23, category: 'בטיחות', description: 'תאורת חירום',          status: null, note: '' },

  // ─── מערכת גז (24–31) ───
  { id: 24, category: 'מערכת גז', description: 'קווי חמצן',           status: null, note: '' },
  { id: 25, category: 'מערכת גז', description: 'קווי אוויר',           status: null, note: '' },
  { id: 26, category: 'מערכת גז', description: 'שסתומי גז',            status: null, note: '' },
  { id: 27, category: 'מערכת גז', description: 'מד זרימת גז',          status: null, note: '' },
  { id: 28, category: 'מערכת גז', description: 'חיישן ריכוז חמצן',     status: null, note: '' },
  { id: 29, category: 'מערכת גז', description: 'מסנני גז',             status: null, note: '' },
  { id: 30, category: 'מערכת גז', description: 'לחץ מיכלי גז',         status: null, note: '' },
  { id: 31, category: 'מערכת גז', description: 'חיבורי גז',            status: null, note: '' },

  // ─── דחיסת לחץ גבוה (32–35) ───
  { id: 32, category: 'דחיסת לחץ גבוה', description: 'קומפרסור HP',        status: null, note: '' },
  { id: 33, category: 'דחיסת לחץ גבוה', description: 'שמן קומפרסור',        status: null, note: '' },
  { id: 34, category: 'דחיסת לחץ גבוה', description: 'מסנן אוויר כניסה',    status: null, note: '' },
  { id: 35, category: 'דחיסת לחץ גבוה', description: 'מד לחץ HP',           status: null, note: '' },

  // ─── דחיסת לחץ נמוך (36–38) ───
  { id: 36, category: 'דחיסת לחץ נמוך', description: 'קומפרסור LP',         status: null, note: '' },
  { id: 37, category: 'דחיסת לחץ נמוך', description: 'שמן קומפרסור LP',     status: null, note: '' },
  { id: 38, category: 'דחיסת לחץ נמוך', description: 'מד לחץ LP',           status: null, note: '' },
];

export function getDefaultItems(): ChecklistItem[] {
  return DEFAULT_ITEMS.map(item => ({ ...item }));
}
