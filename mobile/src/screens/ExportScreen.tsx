import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useReport } from '../store/useReport';
import { generatePdf, sharePdf } from '../utils/pdf';
import { generateAndShareCsv } from '../utils/csv';
import { LogoHeader } from '../components/LogoHeader';
import { theme } from '../theme';

export const ExportScreen: React.FC = () => {
  const { items, technician, hospital, machineId, reset, itemImagePaths } = useReport();
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCsv, setGeneratingCsv] = useState(false);

  const okCount = items.filter((i) => i.status === 'תקין').length;
  const failCount = items.filter((i) => i.status === 'לא תקין').length;
  const pendingCount = items.filter((i) => i.status === null).length;
  const totalCount = items.length;
  const doneCount = totalCount - pendingCount;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const isReadyToExport = technician.trim() && hospital.trim() && machineId.trim();

  const handleGenerate = async () => {
    if (!isReadyToExport) {
      Alert.alert(
        'פרטים חסרים',
        'יש למלא טכנאי, בית חולים ומזהה מכשיר בלשונית "פרטי דוח" לפני הייצוא.'
      );
      return;
    }
    setGenerating(true);
    try {
      const uri = await generatePdf({ technician, hospital, machineId, items, itemImagePaths });
      setPdfUri(uri);
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן ליצור את הדוח. נסה שוב.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!pdfUri) return;
    try {
      await sharePdf(pdfUri);
    } catch {
      Alert.alert('שגיאה', 'שיתוף הדוח נכשל.');
    }
  };

  const handleCsv = async () => {
    if (!isReadyToExport) {
      Alert.alert(
        'פרטים חסרים',
        'יש למלא טכנאי, בית חולים ומזהה מכשיר בלשונית "פרטי דוח" לפני הייצוא.'
      );
      return;
    }
    setGeneratingCsv(true);
    try {
      await generateAndShareCsv({ technician, hospital, machineId, items });
    } catch {
      Alert.alert('שגיאה', 'לא ניתן ליצור את קובץ ה-CSV. נסה שוב.');
    } finally {
      setGeneratingCsv(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'דוח חדש',
      'האם לאפס את כל הנתונים ולהתחיל דוח חדש?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אפס',
          style: 'destructive',
          onPress: () => {
            reset();
            setPdfUri(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <LogoHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>ייצוא דוח</Text>
        <Text style={styles.pageSubtitle}>סיכום בדיקות ויצירת PDF</Text>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard label="תקין" value={okCount} color={theme.ok} textColor="#1a7a4a" />
          <MetricCard label="לא תקין" value={failCount} color={theme.fail} textColor="#a93226" />
          <MetricCard label="ממתין" value={pendingCount} color={theme.lightBg} textColor="#888" />
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressPct}>{progress}%</Text>
          <Text style={styles.progressLabel}>פריטים שנבדקו</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
        </View>

        {/* Report details preview */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>פרטי הדוח</Text>
          <DetailRow label="טכנאי" value={technician || '—'} />
          <DetailRow label="בית חולים" value={hospital || '—'} />
          <DetailRow label="מזהה מכשיר" value={machineId || '—'} />
        </View>

        {!isReadyToExport && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ יש למלא פרטי דוח (טכנאי, בית חולים, מכשיר) לפני ייצוא
            </Text>
          </View>
        )}

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, !isReadyToExport && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.8}
        >
          {generating ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <Text style={styles.generateBtnText}>📄 צור דוח PDF</Text>
          )}
        </TouchableOpacity>

        {pdfUri && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📤 שתף דוח</Text>
          </TouchableOpacity>
        )}

        {pdfUri && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ הדוח נוצר בהצלחה — לחץ "שתף דוח" לשליחה</Text>
          </View>
        )}

        {/* CSV export button */}
        <TouchableOpacity
          style={[styles.csvBtn, !isReadyToExport && styles.generateBtnDisabled]}
          onPress={handleCsv}
          disabled={generatingCsv}
          activeOpacity={0.8}
        >
          {generatingCsv ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={styles.csvBtnText}>📊 ייצוא CSV (Excel)</Text>
          )}
        </TouchableOpacity>

        {/* New report */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🔄 דוח חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  label: string;
  value: number;
  color: string;
  textColor: string;
}> = ({ label, value, color, textColor }) => (
  <View style={[styles.metricCard, { backgroundColor: color }]}>
    <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.metricLabel, { color: textColor }]}>{label}</Text>
  </View>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.lightBg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.lightBg,
  },
  content: {
    padding: theme.spacingMD,
    paddingBottom: theme.spacingXL,
  },
  pageTitle: {
    fontSize: theme.fontSizeXL,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: theme.fontSizeBody,
    color: '#666',
    textAlign: 'right',
    marginBottom: theme.spacingMD,
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacingSM,
    marginBottom: theme.spacingMD,
  },
  metricCard: {
    flex: 1,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  metricValue: {
    fontSize: theme.fontSizeXL,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: theme.fontSizeSmall,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    marginBottom: theme.spacingMD,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  progressPct: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.primary,
  },
  progressLabel: {
    fontSize: theme.fontSizeBody,
    color: '#666',
    marginBottom: theme.spacingSM,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 5,
  },
  detailsCard: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    marginBottom: theme.spacingMD,
    borderWidth: 1,
    borderColor: theme.border,
  },
  detailsTitle: {
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    marginBottom: theme.spacingSM,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: theme.fontSizeBody,
    color: '#666',
  },
  detailValue: {
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#FEF9E7',
    borderRadius: theme.radiusSM,
    padding: theme.spacingSM,
    marginBottom: theme.spacingMD,
    borderWidth: 1,
    borderColor: '#F0B429',
  },
  warningText: {
    fontSize: theme.fontSizeSmall,
    color: '#856404',
    textAlign: 'right',
  },
  generateBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
    marginBottom: theme.spacingSM,
    minHeight: 52,
    justifyContent: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    color: theme.accent,
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
  },
  shareBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
    marginBottom: theme.spacingSM,
  },
  shareBtnText: {
    color: theme.primary,
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
  },
  successBanner: {
    backgroundColor: '#D5F5E3',
    borderRadius: theme.radiusSM,
    padding: theme.spacingSM,
    marginBottom: theme.spacingMD,
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  successText: {
    fontSize: theme.fontSizeSmall,
    color: '#1a7a4a',
    textAlign: 'right',
  },
  csvBtn: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
    marginBottom: theme.spacingSM,
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  csvBtnText: {
    color: theme.primary,
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
  },
  resetBtn: {
    marginTop: theme.spacingSM,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: theme.fontSizeBody,
    color: '#888',
  },
});
