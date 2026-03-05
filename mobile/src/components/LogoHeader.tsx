import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props {
  subtitle?: string;
}

export const LogoHeader: React.FC<Props> = ({ subtitle }) => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/logo.jpeg')}
      style={styles.logo}
      resizeMode="contain"
    />
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.primary,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: theme.spacingMD,
    alignItems: 'center',
  },
  logo: {
    height: 56,
    width: 180,
  },
  subtitle: {
    color: theme.accent,
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
    marginTop: 6,
  },
});
