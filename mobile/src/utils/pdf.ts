import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { ChecklistItem } from '../types';

interface ReportData {
  technician: string;
  hospital: string;
  machineId: string;
  items: ChecklistItem[];
  itemImagePaths: Record<number, string>;
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

function statusLabel(status: string | null): string {
  if (status === 'תקין') return 'תקין';
  if (status === 'לא תקין') return 'לא תקין';
  return 'ממתין';
}

function statusClass(status: string | null): string {
  if (status === 'תקין') return 'status-ok';
  if (status === 'לא תקין') return 'status-fail';
  return 'status-pending';
}

async function buildHtml(data: ReportData): Promise<string> {
  const { technician, hospital, machineId, items, itemImagePaths } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const okCount = items.filter((i) => i.status === 'תקין').length;
  const failCount = items.filter((i) => i.status === 'לא תקין').length;
  const pendingCount = items.filter((i) => i.status === null).length;

  const logoBase64 = await getLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="data:image/jpeg;base64,${logoBase64}" style="height:56px;object-fit:contain;margin-bottom:8px;" />`
    : '';

  // Pre-load all item photos as base64
  const imageBase64Map: Record<number, string> = {};
  await Promise.all(
    items.map(async (item) => {
      const uri = itemImagePaths[item.id];
      if (uri) {
        try {
          imageBase64Map[item.id] = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          // photo missing — skip
        }
      }
    })
  );

  const rows = items
    .map((item) => {
      const cls = statusClass(item.status);
      const imgBase64 = imageBase64Map[item.id];
      const imgCell = imgBase64
        ? `<td><img src="data:image/jpeg;base64,${imgBase64}" style="max-width:150px;max-height:120px" /></td>`
        : '<td style="text-align:center;color:#999">—</td>';
      return `
        <tr>
          <td>${item.id}</td>
          <td>${item.category}</td>
          <td>${item.description}</td>
          <td class="${cls}">${statusLabel(item.status)}</td>
          <td>${item.note || ''}</td>
          ${imgCell}
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      direction: rtl;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #1A1A2E;
      background: #F5F0E6;
      padding: 16px;
    }
    .header {
      background: #4A4F6E;
      color: #CEC28C;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .header h1 {
      font-size: 18px;
      margin-bottom: 12px;
      color: #CEC28C;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 12px;
      color: #EDE8D5;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      background: white;
    }
    thead tr { background: #4A4F6E; }
    th {
      color: #CEC28C;
      font-weight: bold;
      padding: 8px 6px;
      text-align: right;
      border: 1px solid #9098B8;
      font-size: 12px;
    }
    td {
      padding: 7px 6px;
      border: 1px solid #9098B8;
      text-align: right;
      font-size: 11px;
    }
    tr:nth-child(even) td { background: #F5F0E6; }
    tr:nth-child(odd) td { background: #FFFFFF; }
    .status-ok { background: #D5F5E3 !important; font-weight: bold; }
    .status-fail { background: #FADBD8 !important; font-weight: bold; }
    .status-pending { background: #F0F0F0 !important; color: #888; }
    .summary {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    .summary-card {
      flex: 1;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #9098B8;
    }
    .summary-ok { background: #D5F5E3; }
    .summary-fail { background: #FADBD8; }
    .summary-pending { background: #F0F0F0; }
    .summary-count { font-size: 32px; font-weight: bold; color: #1A1A2E; }
    .summary-label { font-size: 13px; color: #4A4F6E; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <h1>יומן תחזוקה — תא היפרברי</h1>
    <div class="meta-grid">
      <div><strong>טכנאי:</strong> ${technician}</div>
      <div><strong>תאריך:</strong> ${dateStr}</div>
      <div><strong>בית חולים:</strong> ${hospital}</div>
      <div><strong>מזהה מכשיר:</strong> ${machineId}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th style="width:100px">קטגוריה</th>
        <th>תיאור</th>
        <th style="width:70px">סטטוס</th>
        <th style="width:120px">הערה</th>
        <th style="width:160px">תמונה</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-card summary-ok">
      <div class="summary-count">${okCount}</div>
      <div class="summary-label">תקין ✅</div>
    </div>
    <div class="summary-card summary-fail">
      <div class="summary-count">${failCount}</div>
      <div class="summary-label">לא תקין ❌</div>
    </div>
    <div class="summary-card summary-pending">
      <div class="summary-count">${pendingCount}</div>
      <div class="summary-label">ממתין ⏳</div>
    </div>
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
