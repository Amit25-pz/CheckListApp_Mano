import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useReport } from '../store/useReport';
import { SITE_NAMES, APP_VERSION } from '../data/checklists';
import { Colors, sizes, useColors } from '../theme';
import { LogoHeader } from '../components/LogoHeader';

const SITE_OPTIONS = [...SITE_NAMES, 'אחר...'];

export const ReportInfoScreen: React.FC = () => {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const {
    technician,
    site,
    customSiteName,
    machineId,
    quarter,
    darkMode,
    updateMeta,
    toggleDarkMode,
    completeSetup,
    isSetupComplete,
    effectiveSite,
  } = useReport();

  const canStart =
    technician.trim() !== '' &&
    effectiveSite().trim() !== '' &&
    machineId.trim() !== '';

  const isSetupMode = !isSetupComplete;

  return (
    <View style={styles.wrapper}>
      <LogoHeader subtitle={isSetupMode ? 'הגדרת דוח חדש' : undefined} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!isSetupMode && (
          <>
            <Text style={styles.pageTitle}>פרטי הדוח</Text>
            <Text style={styles.pageSubtitle}>מלא את הפרטים לפני ייצוא הדוח</Text>
          </>
        )}

        {/* מצב לילה */}
        <View style={styles.darkModeRow}>
          <Text style={styles.label}>🌙 מצב לילה</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#ccc', true: colors.accent }}
            thumbColor={darkMode ? '#4A4F6E' : '#f4f3f4'}
          />
        </View>

        {/* טכנאי */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>שם הטכנאי</Text>
          <TextInput
            style={styles.textInput}
            value={technician}
            onChangeText={(t) => updateMeta({ technician: t })}
            placeholder="הזן שם טכנאי"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
        </View>

        {/* אתר — בחירת תבנית */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>אתר / תא לחץ</Text>
          <Text style={styles.hint}>
            בחירת האתר טוענת את רשימת הבדיקה המתאימה לו
          </Text>
          <View style={styles.siteChips}>
            {SITE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.siteChip, site === s && styles.siteChipActive]}
                onPress={() => updateMeta({ site: s })}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.siteChipText, site === s && styles.siteChipTextActive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {site === 'אחר...' && (
            <TextInput
              style={[styles.textInput, styles.customInput]}
              value={customSiteName}
              onChangeText={(t) => updateMeta({ customSiteName: t })}
              placeholder="הזן שם אתר (ייטען צ'ק-ליסט כללי)"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
          )}
        </View>

        {/* מזהה מכונה */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>מזהה מכונה / תא</Text>
          <TextInput
            style={styles.textInput}
            value={machineId}
            onChangeText={(t) => updateMeta({ machineId: t })}
            placeholder="לדוגמה: תא לחץ 1"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
        </View>

        {/* רבעון */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>רבעון</Text>
          <Text style={styles.hint}>מחושב אוטומטית לפי התאריך — ניתן לשינוי</Text>
          <TextInput
            style={styles.textInput}
            value={quarter}
            onChangeText={(t) => updateMeta({ quarter: t })}
            placeholder="Q1 / Q2 / Q3 / Q4"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
        </View>

        {/* סיכום במצב עריכה */}
        {!isSetupMode && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>סיכום פרטים</Text>
            <SummaryRow styles={styles} label="טכנאי" value={technician} />
            <SummaryRow styles={styles} label="אתר" value={effectiveSite()} />
            <SummaryRow styles={styles} label="מזהה מכונה" value={machineId} />
            <SummaryRow styles={styles} label="רבעון" value={quarter} />
          </View>
        )}

        {/* כפתור התחלה */}
        {isSetupMode && (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={completeSetup}
            disabled={!canStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>התחל בדיקה ←</Text>
          </TouchableOpacity>
        )}

        {isSetupMode && !canStart && (
          <Text style={styles.hintCenter}>יש למלא טכנאי, אתר ומזהה מכונה כדי להמשיך</Text>
        )}

        <Text style={styles.versionText}>גרסת אפליקציה: {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
};

const SummaryRow: React.FC<{ styles: any; label: string; value: string }> = ({
  styles,
  label,
  value,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}:</Text>
    <Text style={styles.summaryValue}>{value || '—'}</Text>
  </View>
);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1 },
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
    darkModeRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: sizes.radiusSM,
      borderWidth: 1,
      borderColor: colors.border,
      padding: sizes.spacingSM,
      marginBottom: sizes.spacingMD,
    },
    fieldGroup: { marginBottom: sizes.spacingMD },
    label: {
      fontSize: sizes.fontSizeBody,
      fontWeight: '600',
      color: colors.textBody,
      textAlign: 'right',
      marginBottom: 6,
    },
    hint: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      textAlign: 'right',
      marginBottom: 6,
    },
    hintCenter: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: sizes.spacingSM,
    },
    textInput: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: sizes.radiusSM,
      padding: sizes.spacingSM,
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      height: 48,
    },
    customInput: { marginTop: sizes.spacingXS },
    siteChips: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: sizes.spacingXS,
    },
    siteChip: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: sizes.spacingMD,
      paddingVertical: sizes.spacingSM,
      backgroundColor: colors.card,
    },
    siteChipActive: {
      backgroundColor: '#4A4F6E',
      borderColor: colors.accent,
    },
    siteChipText: {
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      fontWeight: '500',
    },
    siteChipTextActive: {
      color: colors.accent,
      fontWeight: 'bold',
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: sizes.spacingSM,
    },
    summaryTitle: {
      fontSize: sizes.fontSizeMedium,
      fontWeight: 'bold',
      color: colors.textBody,
      textAlign: 'right',
      marginBottom: sizes.spacingSM,
    },
    summaryRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: { fontSize: sizes.fontSizeBody, color: colors.textMuted },
    summaryValue: {
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      fontWeight: '500',
    },
    startBtn: {
      backgroundColor: '#4A4F6E',
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
      marginTop: sizes.spacingMD,
      minHeight: 52,
      justifyContent: 'center',
    },
    startBtnDisabled: { opacity: 0.4 },
    startBtnText: {
      color: '#CEC28C',
      fontSize: sizes.fontSizeMedium,
      fontWeight: 'bold',
    },
    versionText: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: sizes.spacingLG,
    },
  });
