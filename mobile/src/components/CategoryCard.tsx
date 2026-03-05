import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category, ChecklistItem } from '../types';
import { theme } from '../theme';

interface Props {
  category: Category;
  items: ChecklistItem[];
  onPress: () => void;
  photoCount: number;
}

export const CategoryCard: React.FC<Props> = ({ category, items, onPress, photoCount }) => {
  const total = items.length;
  const okCount = items.filter((i) => i.status === 'תקין').length;
  const failCount = items.filter((i) => i.status === 'לא תקין').length;
  const doneCount = items.filter((i) => i.status !== null).length;
  const progress = total > 0 ? doneCount / total : 0;

  const hasFailures = failCount > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={[styles.badge, hasFailures ? styles.badgeFail : styles.badgeOk]}>
          {hasFailures ? `${failCount} כשלים` : `${okCount}/${total}`}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%` as any },
            hasFailures ? styles.progressFail : styles.progressOk,
          ]}
        />
      </View>

      <Text style={styles.subtitle}>
        {okCount} תקין · {failCount} לא תקין · {total - okCount - failCount} ממתין · 📷 {photoCount}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    marginBottom: theme.spacingMD,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacingSM,
  },
  categoryName: {
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
  },
  badge: {
    fontSize: theme.fontSizeSmall,
    fontWeight: 'bold',
    paddingHorizontal: theme.spacingSM,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOk: {
    backgroundColor: theme.ok,
    color: '#1a7a4a',
  },
  badgeFail: {
    backgroundColor: theme.fail,
    color: '#a93226',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacingXS,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressOk: {
    backgroundColor: '#2ecc71',
  },
  progressFail: {
    backgroundColor: '#e74c3c',
  },
  subtitle: {
    fontSize: theme.fontSizeSmall,
    color: '#666',
    textAlign: 'right',
  },
});
