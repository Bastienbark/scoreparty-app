import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  activeBg?: string;
  activeFg?: string;
  dotColor?: string;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, activeBg = colors.teal, activeFg = colors.onAccent, dotColor, style }: Props) {
  return (
    <PressableScale
      scaleTo={0.95}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? activeBg : colors.surface }, style]}
    >
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.label, { color: active ? activeFg : colors.textPrimary }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, fontWeight: '600' },
});
