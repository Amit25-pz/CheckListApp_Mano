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
import { ItemRow } from '../components/ItemRow';
import { LogoHeader } from '../components/LogoHeader';
import { theme } from '../theme';

type Props = NativeStackScreenProps<ChecklistStackParamList, 'Category'>;

export const CategoryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { category } = route.params;
  const { items, updateItem, setItemImagePath, itemImagePaths } = useReport();

  const categoryItems = items.filter((i) => i.category === category);

  const okCount = categoryItems.filter((i) => i.status === 'תקין').length;
  const failCount = categoryItems.filter((i) => i.status === 'לא תקין').length;

  return (
    <View style={styles.container}>
      <LogoHeader subtitle={category} />

      {/* Sub-header with back and badges */}
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
        {categoryItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onUpdate={updateItem}
            imageUri={itemImagePaths[item.id]}
            onSetImage={(uri) => setItemImagePath(item.id, uri)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.lightBg,
  },
  header: {
    backgroundColor: theme.primary,
    paddingBottom: theme.spacingMD,
    paddingHorizontal: theme.spacingMD,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: theme.spacingXS,
  },
  backBtnText: {
    color: theme.textDark,
    fontSize: theme.fontSizeBody,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: theme.spacingXS,
  },
  badgeOk: {
    backgroundColor: theme.ok,
    color: '#1a7a4a',
    fontWeight: 'bold',
    fontSize: theme.fontSizeSmall,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeFail: {
    backgroundColor: theme.fail,
    color: '#a93226',
    fontWeight: 'bold',
    fontSize: theme.fontSizeSmall,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacingMD,
    paddingBottom: theme.spacingXL,
  },
});
