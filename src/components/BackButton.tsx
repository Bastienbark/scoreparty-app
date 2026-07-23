import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/tokens';
import { PressableScale } from './PressableScale';

export function BackButton({ onPress, size = 36 }: { onPress: () => void; size?: number }) {
  return (
    <PressableScale onPress={onPress} style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.arrow, { fontSize: size * 0.45 }]}>←</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: colors.textPrimary },
});
