import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { RecapScreen } from '../screens/RecapScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { LiveScreenRouter } from './LiveScreenRouter';
import { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeRoot" component={HomeScreen} />
      <Stack.Screen name="Setup" component={SetupScreen} />
      <Stack.Screen name="Live" component={LiveScreenRouter} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Recap" component={RecapScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
