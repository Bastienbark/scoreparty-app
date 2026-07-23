import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, gradients, radii, shadows } from '../theme/tokens';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  size?: 'lg' | 'md' | 'sm';
}

export function Button({ label, onPress, disabled, variant = 'primary', style, fullWidth = true, size = 'lg' }: Props) {
  const padding = size === 'lg' ? 18 : size === 'md' ? 14 : 10;
  const fontSize = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;

  if (variant === 'primary') {
    if (disabled) {
      return (
        <PressableScale
          disabled
          style={[styles.base, { padding, backgroundColor: colors.disabled, opacity: 0.6 }, fullWidth && styles.fullWidth, style]}
        >
          <Text style={[styles.label, { fontSize }]}>{label}</Text>
        </PressableScale>
      );
    }
    return (
      <PressableScale onPress={onPress} style={[fullWidth && styles.fullWidth, style]}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, { padding }, shadows.cta]}>
          <Text style={[styles.label, { fontSize }]}>{label}</Text>
        </LinearGradient>
      </PressableScale>
    );
  }

  const bg = disabled
    ? colors.disabled
    : variant === 'accent'
      ? colors.teal
      : variant === 'danger'
        ? colors.red
        : variant === 'secondary'
          ? colors.surface
          : 'transparent';
  const fg = variant === 'accent' ? colors.onAccent : variant === 'secondary' ? colors.textMuted : colors.textPrimary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        { padding, backgroundColor: bg, opacity: disabled ? 0.6 : 1 },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Text style={[styles.label, { fontSize, color: fg, fontWeight: variant === 'accent' ? '700' : '600' }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  label: {
    fontFamily: fonts.headingMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
