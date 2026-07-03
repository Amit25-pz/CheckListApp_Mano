import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { templateForSite, checkKey, APP_VERSION } from '../data/checklists';
import { CheckState } from '../types';

interface CsvData {
  technician: string;
  site: string;          // ערך ה-store
  displaySite: string;   // שם להצגה
  machineId: string;
  quarter: string;
  checkStates: Record<string, CheckState>;
}

function escapeCell(value: string | number): string {
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCsv(data: CsvData): string {
  const template = templateForSite(data.site);
  const now = new Date();
  const dateStr = now.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const headers = [
    'תאריך',
    'רבעון',
    'טכנאי',
    'אתר',
    'מזהה מכונה',
    'סעיף',
    'תת-בדיקה',
    'סוג',
    'סטטוס',
    'ערך',
    'הערה',
    'פנימי בלבד',
    'גרסת אפליקציה',
  ];

  const rows: (string | number)[][] = [];
  template.sections.forEach((section, si) => {
    section.checks.forEach((check, ci) => {
      const key = checkKey(data.site, si, ci);
      const state = data.checkStates[key] ?? { status: null, note: '', value: '' };
      rows.push([
        dateStr,
        data.quarter,
        data.technician,
        data.displaySite,
        data.machineId,
        section.name,
        check.description,
        check.kind === 'value' ? 'שדה ערך' : 'בדיקה',
        check.kind === 'value' ? '' : state.status ?? 'לא נבדק',
        state.value,
        state.note,
        check.internal ? 'כן' : '',
        APP_VERSION,
      ]);
    });
  });

  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));

  // UTF-8 BOM — כדי שעברית תיפתח נכון באקסל
  return '\uFEFF' + lines.join('\r\n');
}

function buildFilename(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  return `report_${ts}.csv`;
}

export async function generateAndShareCsv(data: CsvData): Promise<void> {
  const csv = buildCsv(data);
  const filename = buildFilename();
  const uri = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory) + filename;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'שתף קובץ CSV',
    UTI: 'public.comma-separated-values-text',
  });
}
