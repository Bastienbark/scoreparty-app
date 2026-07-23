import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  scaleTo?: number;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export function PressableScale({ scaleTo = 0.96, style, children, disabled, ...rest }: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && { transform: [{ scale: scaleTo }] },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
