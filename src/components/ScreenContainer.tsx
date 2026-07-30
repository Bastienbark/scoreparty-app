import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { clampTopInset } from '../utils/safeArea';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({ children, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const outer = { paddingTop: clampTopInset(insets.top) };

  if (!scroll) {
    return (
      <View style={[styles.flex, outer]}>
        <View style={[styles.padding, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <View style={[styles.flex, outer]}>
      <ScrollView
        contentContainerStyle={[styles.padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  padding: { padding: 20, paddingBottom: 32 },
});
