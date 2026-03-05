import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChecklistStackParamList, CATEGORIES } from '../types';
import { useReport } from '../store/useReport';
import { CategoryCard } from '../components/CategoryCard';
import { LogoHeader } from '../components/LogoHeader';
import { theme } from '../theme';

type Props = NativeStackScreenProps<ChecklistStackParamList, 'ChecklistMain'>;

export const ChecklistScreen: React.FC<Props> = ({ navigation }) => {
  const { items, reset, itemImagePaths } = useReport();

  const itemsByCategory = CATEGORIES.reduce<Record<string, typeof items>>(
    (acc, cat) => {
      acc[cat] = items.filter((i) => i.category === cat);
      return acc;
    },
    {}
  );

  const totalOk = items.filter((i) => i.status === 'תקין').length;
  const totalFail = items.filter((i) => i.status === 'לא תקין').length;
  const totalDone = items.filter((i) => i.status !== null).length;
  const progress = items.length > 0 ? Math.round((totalDone / items.length) * 100) : 0;

  return (
    <View style={styles.wrapper}>
      <LogoHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.title}>רשימת בדיקה</Text>
          <Text style={styles.subtitle}>תא היפרברי — {items.length} פריטים</Text>
        </View>

        {/* Overall progress banner */}
        <View style={styles.progressBanner}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>התקדמות כללית</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.chipTextOk}>תקין: {totalOk}</Text>
            </View>
            <View style={[styles.summaryChip, styles.chipFail]}>
              <Text style={styles.chipTextFail}>לא תקין: {totalFail}</Text>
            </View>
            <View style={[styles.summaryChip, styles.chipPending]}>
              <Text style={styles.chipTextPending}>ממתין: {items.length - totalDone}</Text>
            </View>
          </View>
        </View>

        {/* Category cards */}
        {CATEGORIES.map((cat) => {
          const catItems = itemsByCategory[cat] ?? [];
          const photoCount = catItems.filter((i) => !!itemImagePaths[i.id]).length;
          return (
            <CategoryCard
              key={cat}
              category={cat}
              items={catItems}
              onPress={() => navigation.navigate('Category', { category: cat })}
              photoCount={photoCount}
            />
          );
        })}

        {/* New report button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            const { Alert } = require('react-native');
            Alert.alert(
              'דוח חדש',
              'האם לאפס את כל הנתונים ולהתחיל דוח חדש?',
              [
                { text: 'ביטול', style: 'cancel' },
                { text: 'אפס', style: 'destructive', onPress: reset },
              ]
            );
          }}
        >
          <Text style={styles.resetBtnText}>🔄 דוח חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

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
  pageHeader: {
    marginBottom: theme.spacingMD,
  },
  title: {
    fontSize: theme.fontSizeXL,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: theme.fontSizeBody,
    color: '#666',
    textAlign: 'right',
  },
  progressBanner: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    marginBottom: theme.spacingMD,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacingXS,
  },
  progressLabel: {
    color: theme.textDark,
    fontSize: theme.fontSizeBody,
    fontWeight: '600',
  },
  progressPct: {
    color: theme.accent,
    fontSize: theme.fontSizeLarge,
    fontWeight: 'bold',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacingSM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacingXS,
  },
  summaryChip: {
    backgroundColor: theme.ok,
    borderRadius: 12,
    paddingHorizontal: theme.spacingSM,
    paddingVertical: 3,
  },
  chipFail: {
    backgroundColor: theme.fail,
  },
  chipPending: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  chipTextOk: {
    fontSize: theme.fontSizeSmall,
    color: '#1a7a4a',
    fontWeight: 'bold',
  },
  chipTextFail: {
    fontSize: theme.fontSizeSmall,
    color: '#a93226',
    fontWeight: 'bold',
  },
  chipTextPending: {
    fontSize: theme.fontSizeSmall,
    color: theme.textDark,
    fontWeight: 'bold',
  },
  resetBtn: {
    marginTop: theme.spacingMD,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: theme.fontSizeBody,
    color: theme.primary,
    fontWeight: '600',
  },
});
