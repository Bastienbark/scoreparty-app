import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import React from 'react';
import { colors } from '../theme/tokens';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RulesScreen } from '../screens/RulesScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { CustomTabBar } from './CustomTabBar';
import { HomeStackNavigator } from './HomeStackNavigator';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.textPrimary,
    border: colors.surface,
    primary: colors.teal,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
        <Tab.Screen name="HistoryTab" component={HistoryScreen} />
        <Tab.Screen name="StatsTab" component={StatsScreen} />
        <Tab.Screen name="RulesTab" component={RulesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
