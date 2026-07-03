import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { sizes, useColors } from '../theme';

interface Props {
  subtitle?: string;
}

export const LogoHeader: React.FC<Props> = ({ subtitle }) => {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image
        source={require('../../assets/logo.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.accent }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: sizes.spacingMD,
    alignItems: 'center',
  },
  logo: {
    height: 56,
    width: 180,
  },
  subtitle: {
    fontSize: sizes.fontSizeMedium,
    fontWeight: 'bold',
    marginTop: 6,
  },
});
