import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type HomeStackParamList = {
  HomeRoot: undefined;
  Setup: undefined;
  Live: undefined;
  Recap: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  StatsTab: undefined;
  RulesTab: undefined;
};

export type HomeStackNavProp<T extends keyof HomeStackParamList = keyof HomeStackParamList> = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, T>,
  BottomTabNavigationProp<RootTabParamList>
>;
