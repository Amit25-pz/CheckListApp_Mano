import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { SectionDef, templateForSite, checkKey, APP_VERSION } from '../data/checklists';
import { CheckState } from '../types';

export interface ReportData {
  technician: string;
  site: string;           // ערך ה-store ('Arison' או 'אחר...')
  displaySite: string;    // השם להצגה (כולל שם מותאם)
  machineId: string;
  quarter: string;
  checkStates: Record<string, CheckState>;
  checkImagePaths: Record<string, string>;
  /** true = דוח פנימי מלא; false = דוח ללקוח (שדות internal מוסתרים) */
  includeInternal: boolean;
}

async function getLogoBase64(): Promise<string | null> {
  try {
    const [asset] = await Asset.loadAsync(require('../../assets/logo.jpeg'));
    if (!asset.localUri) return null;
    return await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusCell(status: string | null): string {
  if (status === 'תקין') return '<td class="status-ok">תקין</td>';
  if (status === 'לא תקין') return '<td class="status-fail">לא תקין</td>';
  if (status === 'הערה') return '<td class="status-note">הערה</td>';
  return '<td class="status-pending">לא נבדק</td>';
}

async function buildHtml(data: ReportData): Promise<string> {
  const template = templateForSite(data.site);
  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const logoBase64 = await getLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="data:image/jpeg;base64,${logoBase64}" style="height:56px;object-fit:contain;margin-bottom:8px;" />`
    : '';

  // טעינת תמונות מראש (רק לבדיקות שמוצגות בדוח)
  const imageBase64: Record<string, string> = {};
  const imageLoads: Promise<void>[] = [];
  template.sections.forEach((section, si) => {
    section.checks.forEach((check, ci) => {
      if (!data.includeInternal && check.internal) return;
      const key = checkKey(data.site, si, ci);
      const uri = data.checkImagePaths[key];
      if (!uri) return;
      imageLoads.push(
        FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
          .then((b64) => { imageBase64[key] = b64; })
          .catch(() => {})
      );
    });
  });
  await Promise.all(imageLoads);

  let okCount = 0;
  let failCount = 0;
  let noteCount = 0;
  let pendingCount = 0;

  const sectionsHtml = template.sections
    .map((section: SectionDef, si: number) => {
      const visibleChecks = section.checks
        .map((check, ci) => ({ check, ci }))
        .filter(({ check }) => data.includeInternal || !check.internal);
      if (visibleChecks.length === 0) return '';

      const rows = visibleChecks
        .map(({ check, ci }) => {
          const key = checkKey(data.site, si, ci);
          const state = data.checkStates[key] ?? { status: null, note: '', value: '' };

          if (check.kind === 'value') {
            return `
              <tr class="value-row">
                <td>${esc(check.description)}:</td>
                <td></td>
                <td>${state.value ? esc(state.value) : '—'}</td>
              </tr>`;
          }

          if (state.status === 'תקין') okCount++;
          else if (state.status === 'לא תקין') failCount++;
          else if (state.status === 'הערה') noteCount++;
          else pendingCount++;

          const img = imageBase64[key]
            ? `<div><img src="data:image/jpeg;base64,${imageBase64[key]}" style="max-width:140px;max-height:110px;margin-top:4px;border-radius:4px;" /></div>`
            : '';

          return `
            <tr>
              <td>${esc(check.description)}</td>
              ${statusCell(state.status)}
              <td>${state.note ? esc(state.note) : ''}${img}</td>
            </tr>`;
        })
        .join('');

      return `
        <table>
          <thead>
            <tr>
              <th style="width:48%">${si + 1}. ${esc(section.name)}</th>
              <th style="width:14%">סטטוס</th>
              <th style="width:38%">הערה / ערך</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');

  const reportKind = data.includeInternal ? 'דוח פנימי מלא' : 'דוח ללקוח';

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      direction: rtl;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #1A1A2E;
      background: #FFFFFF;
      padding: 16px;
    }
    .header {
      background: #4A4F6E;
      color: #EDE8D5;
      padding: 16px;
      margin-bottom: 14px;
      border-radius: 8px;
      text-align: center;
    }
    .header h1 { font-size: 17px; margin-bottom: 2px; color: #EDE8D5; }
    .header .kind { font-size: 12px; color: #CEC28C; margin-bottom: 10px; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      font-size: 12px;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    thead tr { background: #4A4F6E; }
    th {
      color: #CEC28C;
      font-weight: bold;
      padding: 7px 6px;
      text-align: right;
      border: 1px solid #9098B8;
      font-size: 12px;
    }
    td {
      padding: 6px;
      border: 1px solid #9098B8;
      text-align: right;
      font-size: 11px;
      background: #FFFFFF;
    }
    .value-row td { background: #F5F0E6; }
    .status-ok   { background: #D5F5E3 !important; font-weight: bold; width: 14%; }
    .status-fail { background: #FADBD8 !important; font-weight: bold; width: 14%; }
    .status-note { background: #FCF3CF !important; font-weight: bold; width: 14%; }
    .status-pending { background: #F0F0F0 !important; color: #888; width: 14%; }
    .summary { display: flex; gap: 12px; margin-top: 14px; }
    .summary-card {
      flex: 1; padding: 12px; border-radius: 8px;
      text-align: center; border: 2px solid #9098B8;
    }
    .summary-count { font-size: 26px; font-weight: bold; color: #1A1A2E; }
    .summary-label { font-size: 12px; color: #4A4F6E; margin-top: 2px; }
    .footer { margin-top: 20px; font-size: 12px; }
    .signature { margin-top: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <h1>יומן בדיקות ואחזקה בתא לחץ — ${esc(data.displaySite)}</h1>
    <div class="kind">${reportKind}</div>
    <div class="meta-grid">
      <div><strong>טכנאי:</strong> ${esc(data.technician)}</div>
      <div><strong>תאריך:</strong> ${dateStr}</div>
      <div><strong>אתר:</strong> ${esc(data.displaySite)}</div>
      <div><strong>מזהה מכונה:</strong> ${esc(data.machineId)}</div>
      ${data.quarter ? `<div><strong>רבעון:</strong> ${esc(data.quarter)}</div>` : ''}
      <div><strong>גרסת אפליקציה:</strong> ${APP_VERSION}</div>
    </div>
  </div>

  ${sectionsHtml}

  <div class="summary">
    <div class="summary-card" style="background:#D5F5E3">
      <div class="summary-count">${okCount}</div>
      <div class="summary-label">תקין</div>
    </div>
    <div class="summary-card" style="background:#FADBD8">
      <div class="summary-count">${failCount}</div>
      <div class="summary-label">לא תקין</div>
    </div>
    <div class="summary-card" style="background:#FCF3CF">
      <div class="summary-count">${noteCount}</div>
      <div class="summary-label">הערות</div>
    </div>
    <div class="summary-card" style="background:#F0F0F0">
      <div class="summary-count">${pendingCount}</div>
      <div class="summary-label">לא נבדק</div>
    </div>
  </div>

  <div class="footer">
    <div class="signature">חתימה: ${esc(data.technician)}</div>
  </div>
</body>
</html>`;
}

export async function generatePdf(data: ReportData): Promise<string> {
  const html = await buildHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function sharePdf(uri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'שתף דוח תחזוקה',
    UTI: 'com.adobe.pdf',
  });
}
