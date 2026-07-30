import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';
import { PressableScale } from '../components/PressableScale';
import { clampBottomInset } from '../utils/safeArea';

const TAB_META: Record<string, { icon: string; label: string }> = {
  HomeTab: { icon: '🏠', label: 'Accueil' },
  HistoryTab: { icon: '📜', label: 'Historique' },
  StatsTab: { icon: '📊', label: 'Stats' },
  RulesTab: { icon: '📖', label: 'Règles' },
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index];
  const nestedRouteName = activeRoute.name === 'HomeTab' ? getFocusedRouteNameFromRoute(activeRoute) ?? 'HomeRoot' : undefined;
  const hidden = activeRoute.name === 'HomeTab' && nestedRouteName !== 'HomeRoot';

  if (hidden) return null;

  return (
    <View style={[styles.bar, { paddingBottom: 6 + clampBottomInset(insets.bottom) }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        const focused = state.index === index;
        const color = focused ? colors.amber : colors.textMutedDark;
        return (
          <PressableScale
            key={route.key}
            scaleTo={0.92}
            style={styles.tab}
            onPress={() => {
              if (focused) return;
              navigation.navigate(route.name as never);
            }}
          >
            <Text style={styles.icon}>{meta.icon}</Text>
            <Text style={[styles.label, { color }]}>{meta.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    paddingTop: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,224,184,0.15)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  icon: { fontSize: 19 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 10, fontWeight: '600' },
});
