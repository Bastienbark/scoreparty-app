import React from 'react';
import { useAppStore } from '../state/store';
import { AzulLiveScreen } from '../screens/live/AzulLiveScreen';
import { CinqRoisLiveScreen } from '../screens/live/CinqRoisLiveScreen';
import { DartsAtcLiveScreen } from '../screens/live/DartsAtcLiveScreen';
import { DartsCricketLiveScreen } from '../screens/live/DartsCricketLiveScreen';
import { DartsShanghaiLiveScreen } from '../screens/live/DartsShanghaiLiveScreen';
import { DartsX01LiveScreen } from '../screens/live/DartsX01LiveScreen';
import { MilleSaborsLiveScreen } from '../screens/live/MilleSaborsLiveScreen';
import { QwirkleLiveScreen } from '../screens/live/QwirkleLiveScreen';
import { SkyjoLiveScreen } from '../screens/live/SkyjoLiveScreen';
import { Trek12LiveScreen } from '../screens/live/Trek12LiveScreen';
import { TrouDuCulLiveScreen } from '../screens/live/TrouDuCulLiveScreen';

/**
 * Dispatches to the right live-scoring screen based on the in-progress
 * game's id. Adding a new game means adding one entry here.
 */
const LIVE_SCREENS: Record<string, React.ComponentType> = {
  'cinq-rois': CinqRoisLiveScreen,
  'trou-du-cul': TrouDuCulLiveScreen,
  skyjo: SkyjoLiveScreen,
  qwirkle: QwirkleLiveScreen,
  'trek-12': Trek12LiveScreen,
  azul: AzulLiveScreen,
  'mille-sabords': MilleSaborsLiveScreen,
  'darts-x01': DartsX01LiveScreen,
  'darts-cricket': DartsCricketLiveScreen,
  'darts-atc': DartsAtcLiveScreen,
  'darts-shanghai': DartsShanghaiLiveScreen,
};

export function LiveScreenRouter() {
  const liveGame = useAppStore((s) => s.liveGame);
  if (!liveGame) return null;
  const Screen = LIVE_SCREENS[liveGame.gameId];
  if (!Screen) return null;
  return <Screen />;
}
