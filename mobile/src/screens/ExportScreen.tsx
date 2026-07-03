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
import { templateForSite, checkKey } from '../data/checklists';
import { generatePdf, sharePdf } from '../utils/pdf';
import { generateAndShareCsv } from '../utils/csv';
import { LogoHeader } from '../components/LogoHeader';
import { Colors, sizes, useColors } from '../theme';

type PdfKind = 'internal' | 'customer';

export const ExportScreen: React.FC = () => {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const {
    technician,
    site,
    machineId,
    quarter,
    checkStates,
    checkImagePaths,
    reset,
    effectiveSite,
  } = useReport();

  const [generating, setGenerating] = useState<PdfKind | null>(null);
  const [generatingCsv, setGeneratingCsv] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{ kind: PdfKind; uri: string } | null>(null);

  const template = templateForSite(site);

  // ספירה כללית
  let ok = 0, fail = 0, note = 0, pending = 0;
  template.sections.forEach((section, si) =>
    section.checks.forEach((check, ci) => {
      if (check.kind !== 'check') return;
      const status = checkStates[checkKey(site, si, ci)]?.status ?? null;
      if (status === 'תקין') ok++;
      else if (status === 'לא תקין') fail++;
      else if (status === 'הערה') note++;
      else pending++;
    })
  );
  const total = ok + fail + note + pending;
  const progress = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  const isReadyToExport =
    technician.trim() !== '' && effectiveSite().trim() !== '' && machineId.trim() !== '';

  const missingAlert = () =>
    Alert.alert('פרטים חסרים', 'יש למלא טכנאי, אתר ומזהה מכונה בלשונית "פרטי דוח" לפני הייצוא.');

  const handleGenerate = async (kind: PdfKind) => {
    if (!isReadyToExport) { missingAlert(); return; }
    setGenerating(kind);
    try {
      const uri = await generatePdf({
        technician,
        site,
        displaySite: effectiveSite(),
        machineId,
        quarter,
        checkStates,
        checkImagePaths,
        includeInternal: kind === 'internal',
      });
      setLastGenerated({ kind, uri });
    } catch {
      Alert.alert('שגיאה', 'לא ניתן ליצור את הדוח. נסה שוב.');
    } finally {
      setGenerating(null);
    }
  };

  const handleShare = async () => {
    if (!lastGenerated) return;
    try {
      await sharePdf(lastGenerated.uri);
    } catch {
      Alert.alert('שגיאה', 'שיתוף הדוח נכשל.');
    }
  };

  const handleCsv = async () => {
    if (!isReadyToExport) { missingAlert(); return; }
    setGeneratingCsv(true);
    try {
      await generateAndShareCsv({
        technician,
        site,
        displaySite: effectiveSite(),
        machineId,
        quarter,
        checkStates,
      });
    } catch {
      Alert.alert('שגיאה', 'לא ניתן ליצור את קובץ ה-CSV. נסה שוב.');
    } finally {
      setGeneratingCsv(false);
    }
  };

  const handleReset = () => {
    Alert.alert('דוח חדש', 'האם לאפס את כל הנתונים ולהתחיל דוח חדש?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס',
        style: 'destructive',
        onPress: () => {
          reset();
          setLastGenerated(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <LogoHeader />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>ייצוא דוח</Text>
        <Text style={styles.pageSubtitle}>
          דוח פנימי — הכל · דוח ללקוח — ללא שדות פנימיים 🔒
        </Text>

        {/* מדדים */}
        <View style={styles.metricsRow}>
          <Metric styles={styles} label="תקין" value={ok} bg={colors.ok} />
          <Metric styles={styles} label="לא תקין" value={fail} bg={colors.fail} />
          <Metric styles={styles} label="הערות" value={note} bg={colors.noteBg} />
          <Metric styles={styles} label="ממתין" value={pending} bg={colors.inputBg} />
        </View>

        {/* התקדמות */}
        <View style={styles.progressCard}>
          <Text style={styles.progressPct}>{progress}%</Text>
          <Text style={styles.progressLabel}>תתי-בדיקות שנבדקו</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
        </View>

        {/* פרטי הדוח */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>פרטי הדוח</Text>
          <DetailRow styles={styles} label="טכנאי" value={technician || '—'} />
          <DetailRow styles={styles} label="אתר" value={effectiveSite() || '—'} />
          <DetailRow styles={styles} label="מזהה מכונה" value={machineId || '—'} />
          <DetailRow styles={styles} label="רבעון" value={quarter || '—'} />
        </View>

        {!isReadyToExport && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ יש למלא פרטי דוח (טכנאי, אתר, מכונה) לפני ייצוא
            </Text>
          </View>
        )}

        {/* שני כפתורי PDF */}
        <TouchableOpacity
          style={[styles.generateBtn, !isReadyToExport && styles.disabled]}
          onPress={() => handleGenerate('internal')}
          disabled={generating !== null}
          activeOpacity={0.8}
        >
          {generating === 'internal' ? (
            <ActivityIndicator color="#CEC28C" />
          ) : (
            <Text style={styles.generateBtnText}>📄 צור דוח פנימי (מלא)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.customerBtn, !isReadyToExport && styles.disabled]}
          onPress={() => handleGenerate('customer')}
          disabled={generating !== null}
          activeOpacity={0.8}
        >
          {generating === 'customer' ? (
            <ActivityIndicator color="#4A4F6E" />
          ) : (
            <Text style={styles.customerBtnText}>📄 צור דוח ללקוח</Text>
          )}
        </TouchableOpacity>

        {lastGenerated && (
          <>
            <View style={styles.successBanner}>
              <Text style={styles.successText}>
                ✅ {lastGenerated.kind === 'internal' ? 'הדוח הפנימי' : 'הדוח ללקוח'} נוצר —
                לחץ "שתף דוח" לשליחה
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>📤 שתף דוח</Text>
            </TouchableOpacity>
          </>
        )}

        {/* CSV */}
        <TouchableOpacity
          style={[styles.csvBtn, !isReadyToExport && styles.disabled]}
          onPress={handleCsv}
          disabled={generatingCsv}
          activeOpacity={0.8}
        >
          {generatingCsv ? (
            <ActivityIndicator color={colors.textBody} />
          ) : (
            <Text style={styles.csvBtnText}>📊 ייצוא נתונים (CSV)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🔄 דוח חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Metric: React.FC<{ styles: any; label: string; value: number; bg: string }> = ({
  styles,
  label,
  value,
  bg,
}) => (
  <View style={[styles.metricCard, { backgroundColor: bg }]}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const DetailRow: React.FC<{ styles: any; label: string; value: string }> = ({
  styles,
  label,
  value,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: sizes.spacingMD, paddingBottom: sizes.spacingXL },
    pageTitle: {
      fontSize: sizes.fontSizeXL,
      fontWeight: 'bold',
      color: colors.textBody,
      textAlign: 'right',
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: sizes.fontSizeBody,
      color: colors.textMuted,
      textAlign: 'right',
      marginBottom: sizes.spacingMD,
    },
    metricsRow: {
      flexDirection: 'row-reverse',
      gap: sizes.spacingXS,
      marginBottom: sizes.spacingMD,
    },
    metricCard: {
      flex: 1,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingSM,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricValue: { fontSize: sizes.fontSizeLarge, fontWeight: 'bold', color: colors.textBody },
    metricLabel: { fontSize: sizes.fontSizeSmall, marginTop: 2, color: colors.textBody },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      marginBottom: sizes.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    progressPct: { fontSize: 36, fontWeight: 'bold', color: colors.textBody },
    progressLabel: {
      fontSize: sizes.fontSizeBody,
      color: colors.textMuted,
      marginBottom: sizes.spacingSM,
    },
    progressTrack: {
      width: '100%',
      height: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 5 },
    detailsCard: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      marginBottom: sizes.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailsTitle: {
      fontSize: sizes.fontSizeMedium,
      fontWeight: 'bold',
      color: colors.textBody,
      textAlign: 'right',
      marginBottom: sizes.spacingSM,
    },
    detailRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: { fontSize: sizes.fontSizeBody, color: colors.textMuted },
    detailValue: { fontSize: sizes.fontSizeBody, color: colors.textBody, fontWeight: '500' },
    warningBanner: {
      backgroundColor: colors.noteBg,
      borderRadius: sizes.radiusSM,
      padding: sizes.spacingSM,
      marginBottom: sizes.spacingMD,
      borderWidth: 1,
      borderColor: '#F0B429',
    },
    warningText: { fontSize: sizes.fontSizeSmall, color: colors.textBody, textAlign: 'right' },
    generateBtn: {
      backgroundColor: '#4A4F6E',
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
      marginBottom: sizes.spacingSM,
      minHeight: 52,
      justifyContent: 'center',
    },
    generateBtnText: { color: '#CEC28C', fontSize: sizes.fontSizeMedium, fontWeight: 'bold' },
    customerBtn: {
      backgroundColor: '#CEC28C',
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
      marginBottom: sizes.spacingSM,
      minHeight: 52,
      justifyContent: 'center',
    },
    customerBtnText: { color: '#4A4F6E', fontSize: sizes.fontSizeMedium, fontWeight: 'bold' },
    disabled: { opacity: 0.5 },
    shareBtn: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: '#2ecc71',
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
      marginBottom: sizes.spacingSM,
    },
    shareBtnText: { color: '#2ecc71', fontSize: sizes.fontSizeMedium, fontWeight: 'bold' },
    successBanner: {
      backgroundColor: colors.ok,
      borderRadius: sizes.radiusSM,
      padding: sizes.spacingSM,
      marginBottom: sizes.spacingSM,
      borderWidth: 1,
      borderColor: '#2ecc71',
    },
    successText: { fontSize: sizes.fontSizeSmall, color: colors.textBody, textAlign: 'right' },
    csvBtn: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
      marginBottom: sizes.spacingSM,
      minHeight: 52,
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#4A4F6E',
    },
    csvBtnText: { color: colors.textBody, fontSize: sizes.fontSizeMedium, fontWeight: 'bold' },
    resetBtn: {
      marginTop: sizes.spacingSM,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
    },
    resetBtnText: { fontSize: sizes.fontSizeBody, color: colors.textMuted },
  });
