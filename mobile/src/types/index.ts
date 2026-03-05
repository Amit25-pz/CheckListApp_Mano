import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Domain types ──────────────────────────────────────────────────────────

export type Status = 'תקין' | 'לא תקין' | null;

export type Category =
  | 'חשמל'
  | 'מבנה'
  | 'בטיחות'
  | 'מערכת גז'
  | 'דחיסת לחץ גבוה'
  | 'דחיסת לחץ נמוך';

export const CATEGORIES: Category[] = [
  'חשמל',
  'מבנה',
  'בטיחות',
  'מערכת גז',
  'דחיסת לחץ גבוה',
  'דחיסת לחץ נמוך',
];

export interface ChecklistItem {
  id: number;
  category: Category;
  description: string;
  status: Status;
  note: string;
}

export interface MaintenanceReport {
  technician: string;
  hospital: string;
  machineId: string;
  items: ChecklistItem[];
  imagePaths: Record<string, string>;
  itemImagePaths: Record<number, string>;
}

// ─── Navigation types ──────────────────────────────────────────────────────

export type ChecklistStackParamList = {
  ChecklistMain: undefined;
  Category: { category: Category };
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
