import { useReport } from './store/useReport';

/** ערכת צבעים — נבחרת לפי מצב יום/לילה */
export interface Colors {
  primary: string;    // רקע כותרות/כפתורים ראשיים
  accent: string;     // זהב — הדגשות
  bg: string;         // רקע מסך
  card: string;       // רקע כרטיסים
  textBody: string;   // טקסט רגיל
  textMuted: string;  // טקסט משני
  textOnDark: string; // טקסט על רקע כהה
  inputBg: string;
  ok: string;
  fail: string;
  noteBg: string;     // צהוב עדין לסטטוס "הערה"
  border: string;
  white: string;
}

export const lightColors: Colors = {
  primary: '#4A4F6E',
  accent: '#CEC28C',
  bg: '#F5F0E6',
  card: '#FFFFFF',
  textBody: '#1A1A2E',
  textMuted: '#666666',
  textOnDark: '#EDE8D5',
  inputBg: '#FFFFFF',
  ok: '#D5F5E3',
  fail: '#FADBD8',
  noteBg: '#FCF3CF',
  border: '#9098B8',
  white: '#FFFFFF',
};

export const darkColors: Colors = {
  primary: '#14161F',
  accent: '#CEC28C',
  bg: '#1B1E2B',
  card: '#232738',
  textBody: '#EDE8D5',
  textMuted: '#A9A9B8',
  textOnDark: '#EDE8D5',
  inputBg: '#2A2E42',
  ok: '#1E4634',
  fail: '#5A2A26',
  noteBg: '#5A5124',
  border: '#3A4060',
  white: '#2A2E42',
};

/** צבעי סטטוס לטקסט על רקע ה-ok/fail/note */
export const statusTextColors = (dark: boolean) => ({
  ok: dark ? '#7FE0A8' : '#1a7a4a',
  fail: dark ? '#F5A79D' : '#a93226',
  note: dark ? '#F5DC7A' : '#8a6d0b',
});

/** hook — מחזיר את ערכת הצבעים הפעילה */
export function useColors(): Colors {
  const dark = useReport((s) => s.darkMode);
  return dark ? darkColors : lightColors;
}

/** מידות קבועות (זהות בשני המצבים) */
export const sizes = {
  fontSizeSmall: 12,
  fontSizeBody: 14,
  fontSizeMedium: 16,
  fontSizeLarge: 20,
  fontSizeXL: 24,
  spacingXS: 4,
  spacingSM: 8,
  spacingMD: 16,
  spacingLG: 24,
  spacingXL: 32,
  radiusSM: 6,
  radiusMD: 10,
  radiusLG: 16,
};

/**
 * תאימות לאחור — האובייקט הסטטי הישן (מצב יום).
 * קומפוננטות שכבר הוסבו משתמשות ב-useColors().
 */
export const theme = {
  ...lightColors,
  lightBg: lightColors.bg,
  textDark: lightColors.textOnDark,
  black: '#000000',
  ...sizes,
};
