import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system/legacy';
import { CheckState, CheckStatus, EMPTY_CHECK_STATE } from '../types';
import { checkKey, quarterFromDate, templateForSite } from '../data/checklists';
import { asyncStorage } from '../utils/storage';

// מפתח אחסון חדש לגרסה 2 — מבנה הנתונים השתנה לחלוטין,
// כך שמצב ישן של גרסה 1 לא ייטען בטעות
export const STORAGE_KEY_V2 = 'mano-report-v2';

interface ReportState {
  // Metadata
  technician: string;
  site: string;            // 'Arison' | 'Segol' | 'אלישע' | 'חיל הים' | 'אחר...'
  customSiteName: string;  // בשימוש כאשר site === 'אחר...'
  machineId: string;
  quarter: string;
  // מצב כל תת-בדיקה, ממופתח לפי checkKey(site, si, ci)
  checkStates: Record<string, CheckState>;
  // תמונות לפי אותו מפתח
  checkImagePaths: Record<string, string>;
  // UI
  darkMode: boolean;
  isSetupComplete: boolean;

  // Actions
  setStatus: (key: string, status: CheckStatus) => void;
  setNote: (key: string, note: string) => void;
  setValue: (key: string, value: string) => void;
  markSectionOk: (sectionIndex: number) => void;
  setCheckImagePath: (key: string, uri: string) => void;
  updateMeta: (
    patch: Partial<
      Pick<ReportState, 'technician' | 'site' | 'customSiteName' | 'machineId' | 'quarter'>
    >
  ) => void;
  toggleDarkMode: () => void;
  completeSetup: () => void;
  reset: () => void;

  // Derived helpers
  effectiveSite: () => string;
  getCheckState: (key: string) => CheckState;
}

export const useReport = create<ReportState>()(
  persist(
    (set, get) => ({
      technician: 'עמנואל גוטמן',
      site: '',
      customSiteName: '',
      machineId: '',
      quarter: quarterFromDate(new Date()),
      checkStates: {},
      checkImagePaths: {},
      darkMode: false,
      isSetupComplete: false,

      setStatus: (key, status) =>
        set((s) => ({
          checkStates: {
            ...s.checkStates,
            [key]: {
              ...(s.checkStates[key] ?? EMPTY_CHECK_STATE),
              status,
              // חזרה ל"תקין" מנקה את ההערה
              note: status === 'תקין' ? '' : (s.checkStates[key]?.note ?? ''),
            },
          },
        })),

      setNote: (key, note) =>
        set((s) => ({
          checkStates: {
            ...s.checkStates,
            [key]: { ...(s.checkStates[key] ?? EMPTY_CHECK_STATE), note },
          },
        })),

      setValue: (key, value) =>
        set((s) => ({
          checkStates: {
            ...s.checkStates,
            [key]: { ...(s.checkStates[key] ?? EMPTY_CHECK_STATE), value },
          },
        })),

      markSectionOk: (sectionIndex) =>
        set((s) => {
          const site = s.site;
          const template = templateForSite(site);
          const section = template.sections[sectionIndex];
          if (!section) return {};
          const next = { ...s.checkStates };
          section.checks.forEach((check, ci) => {
            if (check.kind !== 'check') return;
            const key = checkKey(site, sectionIndex, ci);
            next[key] = { ...(next[key] ?? EMPTY_CHECK_STATE), status: 'תקין', note: '' };
          });
          return { checkStates: next };
        }),

      setCheckImagePath: (key, uri) =>
        set((s) => ({
          checkImagePaths: { ...s.checkImagePaths, [key]: uri },
        })),

      updateMeta: (patch) => set(patch),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      completeSetup: () => set({ isSetupComplete: true }),

      reset: () => {
        Object.values(get().checkImagePaths).forEach((uri) => {
          FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        });
        set({
          site: '',
          customSiteName: '',
          machineId: '',
          quarter: quarterFromDate(new Date()),
          checkStates: {},
          checkImagePaths: {},
          isSetupComplete: false,
          // darkMode נשאר — העדפת תצוגה, לא נתוני דוח
        });
      },

      effectiveSite: () => {
        const s = get();
        return s.site === 'אחר...' ? s.customSiteName : s.site;
      },

      getCheckState: (key) => get().checkStates[key] ?? EMPTY_CHECK_STATE,
    }),
    {
      name: STORAGE_KEY_V2,
      storage: asyncStorage,
    }
  )
);
