import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, sizes, statusTextColors, useColors } from '../theme';
import { useReport } from '../store/useReport';

export interface SectionCounts {
  total: number;
  ok: number;
  fail: number;
  note: number;
  pending: number;
  photos: number;
}

interface Props {
  index: number;
  name: string;
  counts: SectionCounts;
  onPress: () => void;
}

export const SectionCard: React.FC<Props> = ({ index, name, counts, onPress }) => {
  const colors = useColors();
  const dark = useReport((s) => s.darkMode);
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const stColors = statusTextColors(dark);

  const done = counts.total - counts.pending;
  const progress = counts.total > 0 ? done / counts.total : 0;
  const hasFailures = counts.fail > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <Text style={styles.name}>
          {index + 1}. {name}
        </Text>
        <Text
          style={[
            styles.badge,
            hasFailures
              ? { backgroundColor: colors.fail, color: stColors.fail }
              : { backgroundColor: colors.ok, color: stColors.ok },
          ]}
        >
          {hasFailures ? `${counts.fail} תקלות` : `${done}/${counts.total}`}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%` as any },
            { backgroundColor: hasFailures ? '#e74c3c' : '#2ecc71' },
          ]}
        />
      </View>

      <Text style={styles.subtitle}>
        {counts.ok} תקין · {counts.fail} לא תקין · {counts.note} הערות · {counts.pending} ממתין
        {counts.photos > 0 ? ` · 📷 ${counts.photos}` : ''}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingMD,
      marginBottom: sizes.spacingSM,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.spacingSM,
      gap: sizes.spacingSM,
    },
    name: {
      flex: 1,
      fontSize: sizes.fontSizeBody,
      fontWeight: 'bold',
      color: colors.textBody,
      textAlign: 'right',
    },
    badge: {
      fontSize: sizes.fontSizeSmall,
      fontWeight: 'bold',
      paddingHorizontal: sizes.spacingSM,
      paddingVertical: 3,
      borderRadius: 12,
      overflow: 'hidden',
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: sizes.spacingXS,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    subtitle: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      textAlign: 'right',
    },
  });
