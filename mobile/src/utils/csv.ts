import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ChecklistItem } from '../types';

interface ReportData {
  technician: string;
  hospital: string;
  machineId: string;
  items: ChecklistItem[];
}

function escapeCell(value: string | number): string {
  const str = String(value);
  // Wrap in quotes and escape any internal quotes (RFC 4180)
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCsv(data: ReportData): string {
  const { technician, hospital, machineId, items } = data;
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
    'טכנאי',
    'בית חולים',
    'מזהה מכשיר',
    'מזהה',
    'קטגוריה',
    'תיאור',
    'סטטוס',
    'הערה',
  ];

  const rows = items.map((item) => [
    dateStr,
    technician,
    hospital,
    machineId,
    item.id,
    item.category,
    item.description,
    item.status ?? 'ממתין',
    item.note,
  ]);

  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCell).join(',')
  );

  // UTF-8 BOM (\uFEFF) — makes Hebrew readable when opened in Excel
  return '\uFEFF' + lines.join('\r\n');
}

function buildFilename(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  return `report_${ts}.csv`;
}

/**
 * Generates a CSV file from the report data and shares it via the native share sheet.
 */
export async function generateAndShareCsv(data: ReportData): Promise<void> {
  const csv = buildCsv(data);
  const filename = buildFilename();
  const uri = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory) + filename;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'שתף קובץ CSV',
    UTI: 'public.comma-separated-values-text',
  });
}
