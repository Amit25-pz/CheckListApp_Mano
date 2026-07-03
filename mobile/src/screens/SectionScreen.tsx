import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChecklistStackParamList } from '../types';
import { useReport } from '../store/useReport';
import { checkKey, templateForSite } from '../data/checklists';
import { CheckRow } from '../components/CheckRow';
import { LogoHeader } from '../components/LogoHeader';
import { Colors, sizes, useColors } from '../theme';

type Props = NativeStackScreenProps<ChecklistStackParamList, 'Section'>;

export const SectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sectionIndex } = route.params;
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const site = useReport((s) => s.site);
  const checkStates = useReport((s) => s.checkStates);
  const checkImagePaths = useReport((s) => s.checkImagePaths);
  const markSectionOk = useReport((s) => s.markSectionOk);
  const getCheckState = useReport((s) => s.getCheckState);

  const template = templateForSite(site);
  const section = template.sections[sectionIndex];

  if (!section) {
    return (
      <View style={styles.container}>
        <LogoHeader />
        <Text style={styles.name}>סעיף לא נמצא</Text>
      </View>
    );
  }

  const keys = section.checks.map((_, ci) => checkKey(site, sectionIndex, ci));
  const okCount = keys.filter((k, i) => section.checks[i].kind === 'check' && checkStates[k]?.status === 'תקין').length;
  const failCount = keys.filter((k, i) => section.checks[i].kind === 'check' && checkStates[k]?.status === 'לא תקין').length;

  return (
    <View style={styles.container}>
      <LogoHeader subtitle={`${sectionIndex + 1}. ${section.name}`} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>→ חזרה</Text>
        </TouchableOpacity>
        <View style={styles.headerBadges}>
          <Text style={styles.badgeOk}>✓ {okCount}</Text>
          <Text style={styles.badgeFail}>✗ {failCount}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.allOkBtn}
          onPress={() => markSectionOk(sectionIndex)}
          activeOpacity={0.8}
        >
          <Text style={styles.allOkBtnText}>✔ סמן הכל תקין</Text>
        </TouchableOpacity>

        {section.checks.map((check, ci) => {
          const key = keys[ci];
          return (
            <CheckRow
              key={key}
              check={check}
              checkKey={key}
              state={getCheckState(key)}
              imageUri={checkImagePaths[key]}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.primary,
      paddingBottom: sizes.spacingMD,
      paddingHorizontal: sizes.spacingMD,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: { padding: sizes.spacingXS },
    backBtnText: { color: colors.textOnDark, fontSize: sizes.fontSizeBody },
    headerBadges: { flexDirection: 'row', gap: sizes.spacingXS },
    badgeOk: {
      backgroundColor: '#D5F5E3',
      color: '#1a7a4a',
      fontWeight: 'bold',
      fontSize: sizes.fontSizeSmall,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgeFail: {
      backgroundColor: '#FADBD8',
      color: '#a93226',
      fontWeight: 'bold',
      fontSize: sizes.fontSizeSmall,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    name: {
      fontSize: sizes.fontSizeLarge,
      color: colors.textBody,
      textAlign: 'center',
      marginTop: sizes.spacingXL,
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: sizes.spacingMD,
      paddingBottom: sizes.spacingXL,
    },
    allOkBtn: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: '#2ecc71',
      borderRadius: sizes.radiusMD,
      padding: sizes.spacingSM,
      alignItems: 'center',
      marginBottom: sizes.spacingMD,
    },
    allOkBtnText: {
      color: '#2ecc71',
      fontWeight: 'bold',
      fontSize: sizes.fontSizeBody,
    },
  });
