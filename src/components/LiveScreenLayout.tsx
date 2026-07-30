import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { clampBottomInset, clampTopInset } from '../utils/safeArea';

interface Props {
  /** Back button + title + "Terminer", and any fixed info cards right below it. */
  header: React.ReactNode;
  /** Scrollable content: score grid / role list, live ranking, etc. */
  children: React.ReactNode;
  /** The primary CTA ("Manche suivante →" / "Terminer la partie"), pinned at the bottom. */
  footer: React.ReactNode;
}

/**
 * Layout shared by every live-scoring screen: header and CTA stay fixed on
 * screen, only the middle content scrolls — the "next round" button never
 * requires scrolling to reach, regardless of how many rounds are on screen.
 */
export function LiveScreenLayout({ header, children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: 20 + clampTopInset(insets.top) }]}>{header}</View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: 12 + clampBottomInset(insets.bottom) }]}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: colors.bg,
  },
});
