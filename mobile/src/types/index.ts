import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Domain types (v2 — per-site hierarchical checklists) ──────────────────

/** null = טרם נבדק (ממתין) */
export type CheckStatus = 'תקין' | 'לא תקין' | 'הערה' | null;

export interface CheckState {
  status: CheckStatus;
  note: string;
  value: string; // עבור שדות kind="value"
}

export const EMPTY_CHECK_STATE: CheckState = { status: null, note: '', value: '' };

// ─── Navigation types ──────────────────────────────────────────────────────

export type ChecklistStackParamList = {
  ChecklistMain: undefined;
  Section: { sectionIndex: number };
};

export type RootTabParamList = {
  ChecklistTab: NavigatorScreenParams<ChecklistStackParamList>;
  ReportInfo: undefined;
  Export: undefined;
};

export type RootStackParamList = {
  Setup: undefined;
  Main: undefined;
};
