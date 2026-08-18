import { azulGame } from './azul';
import { cinqRoisGame } from './cinqRois';
import { dartsAtcGame } from './dartsAroundTheClock';
import { dartsCricketGame } from './dartsCricket';
import { dartsShanghaiGame } from './dartsShanghai';
import { dartsX01Game } from './dartsX01';
import { lostCitiesRwGame } from './lostCitiesRollWrite';
import { milleSaborsGame } from './milleSabords';
import { qwirkleGame } from './qwirkle';
import { skyjoGame } from './skyjo';
import { trek12Game } from './trek12';
import { trouDuCulGame } from './trouDuCul';
import type { GameDef } from './types';

/**
 * Central list of playable games. To add a new game:
 *   1. Create `src/games/<newGame>.ts` implementing `GameDef`.
 *   2. Add it to this array.
 *   3. Add its live-screen component to `LIVE_SCREENS` wiring in
 *      `src/navigation/LiveScreenRouter.tsx`.
 * Home, Setup, History, Stats and Rules all read from this registry and
 * need no further changes.
 */
export const GAMES: GameDef[] = [
  cinqRoisGame,
  trouDuCulGame,
  skyjoGame,
  qwirkleGame,
  trek12Game,
  azulGame,
  lostCitiesRwGame,
  milleSaborsGame,
  dartsX01Game,
  dartsCricketGame,
  dartsAtcGame,
  dartsShanghaiGame,
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGameOrThrow(id: string): GameDef {
  const g = getGame(id);
  if (!g) throw new Error(`Unknown game id: ${id}`);
  return g;
}
