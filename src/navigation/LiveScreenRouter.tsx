import React from 'react';
import { useAppStore } from '../state/store';
import { CinqRoisLiveScreen } from '../screens/live/CinqRoisLiveScreen';
import { TrouDuCulLiveScreen } from '../screens/live/TrouDuCulLiveScreen';

/**
 * Dispatches to the right live-scoring screen based on the in-progress
 * game's id. Adding a 3rd game means adding one entry here.
 */
const LIVE_SCREENS: Record<string, React.ComponentType> = {
  'cinq-rois': CinqRoisLiveScreen,
  'trou-du-cul': TrouDuCulLiveScreen,
};

export function LiveScreenRouter() {
  const liveGame = useAppStore((s) => s.liveGame);
  if (!liveGame) return null;
  const Screen = LIVE_SCREENS[liveGame.gameId];
  if (!Screen) return null;
  return <Screen />;
}
