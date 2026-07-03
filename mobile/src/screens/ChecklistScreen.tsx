import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChecklistStackParamList } from '../types';
import { useReport } from '../store/useReport';
import { checkKey, templateForSite } from '../data/checklists';
import { SectionCard, SectionCounts } from '../components/SectionCard';
import { LogoHeader } from '../components/LogoHeader';
import { Colors, sizes, useColors } from '../theme';

type Props = NativeStackScreenProps<ChecklistStackParamList, 'ChecklistMain'>;

export const ChecklistScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const site = useReport((s) => s.site);
  const checkStates = useReport((s) => s.checkStates);
  const checkImagePaths = useReport((s) => s.checkImagePaths);
  const reset = useReport((s) => s.reset);
  const effectiveSite = useReport((s) => s.effectiveSite);

  const template = templateForSite(site);

  // ספירות לכל סעיף
  const sectionCounts: SectionCounts[] = template.sections.map((section, si) => {
    const counts: SectionCounts = { total: 0, ok: 0, fail: 0, note: 0, pending: 0, photos: 0 };
    section.checks.forEach((check, ci) => {
      const key = checkKey(site, si, ci);
      if (checkImagePaths[key]) counts.photos += 1;
      if (check.kind !== 'check') return;
      counts.total += 1;
      const status = checkStates[key]?.status ?? null;
      if (status === 'תקין') counts.ok += 1;
      else if (status === 'לא תקין') counts.fail += 1;
      else if (status === 'הערה') counts.note += 1;
      else counts.pending += 1;
    });
    return counts;
  });

  const totals = sectionCounts.reduce(
    (acc, c) => ({
      total: acc.total + c.total,
      ok: acc.ok + c.ok,
      fail: acc.fail + c.fail,
      note: acc.note + c.note,
      pending: acc.pending + c.pending,
    }),
    { total: 0, ok: 0, fail: 0, note: 0, pending: 0 }
  );
  const done = totals.total - totals.pending;
  const progress = totals.total > 0 ? Math.round((done / totals.total) * 100) : 0;

  const handleReset = () => {
    Alert.alert('דוח חדש', 'האם לאפס את כל הנתונים ולהתחיל דוח חדש?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'אפס', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <LogoHeader subtitle={effectiveSite()} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>רשימת בדיקה</Text>
          <Text style={styles.subtitle}>
            {template.sections.length} סעיפים · {totals.total} תתי-בדיקות
          </Text>
        </View>

        {/* התקדמות כללית */}
        <View style={styles.progressBanner}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>התקדמות כללית</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.chip, { backgroundColor: colors.ok }]}>
              <Text style={styles.chipText}>תקין: {totals.ok}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.fail }]}>
              <Text style={styles.chipText}>לא תקין: {totals.fail}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.noteBg }]}>
              <Text style={styles.chipText}>הערות: {totals.note}</Text>
            </View>
            <View style={[styles.chip, styles.chipPending]}>
              <Text style={styles.chipTextPending}>ממתין: {totals.pending}</Text>
            </View>
          </View>
        </View>

        {/* כרטיסי סעיפים */}
        {template.sections.map((section, si) => (
          <SectionCard
            key={`${site}_${si}`}
            index={si}
            name={section.name}
            counts={sectionCounts[si]}
            onPress={() => navigation.navigate('Section', { sectionIndex: si })}
          />
        ))}

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🔄 דוח חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: sizes.spacingMD, paddingBottom: sizes.spacingXL },
    pageHeader: { marginBottom: sizes.spacingMD },
    title: {
      fontSize: sizes.fontSizeXL,
      fontWeight: 'bold',
      color: colors.textBody,
      textAlign: 'right',
    },
    subtitle: {
      fontSize: sizes.fontSizeBody,
      color: colors.textMuted,
      textAlign: 'right',
    },
    progressBanner: {
      backgroundColor: colors.primary,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      marginBottom: sizes.spacingMD,
    },
    progressRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.spacingXS,
    },
    progressLabel: {
      color: colors.textOnDark,
      fontSize: sizes.fontSizeBody,
      fontWeight: '600',
    },
    progressPct: {
      color: colors.accent,
      fontSize: sizes.fontSizeLarge,
      fontWeight: 'bold',
    },
    progressTrack: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: sizes.spacingSM,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    summaryRow: {
      flexDirection: 'row-reverse',
      gap: sizes.spacingXS,
      flexWrap: 'wrap',
    },
    chip: {
      borderRadius: 12,
      paddingHorizontal: sizes.spacingSM,
      paddingVertical: 3,
    },
    chipPending: { backgroundColor: 'rgba(255,255,255,0.15)' },
    chipText: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textBody,
      fontWeight: 'bold',
    },
    chipTextPending: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textOnDark,
      fontWeight: 'bold',
    },
    resetBtn: {
      marginTop: sizes.spacingMD,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      alignItems: 'center',
    },
    resetBtnText: {
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      fontWeight: '600',
    },
  });
