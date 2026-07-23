import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

interface Props {
  label: string;
  color: string;
  size?: number;
}

export function IconBadge({ label, color, size = 38 }: Props) {
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: color, borderRadius: radii.md }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.headingBold, fontWeight: '700', fontSize: 11, color: colors.bg },
});
