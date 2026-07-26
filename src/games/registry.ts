import { cinqRoisGame } from './cinqRois';
import { skyjoGame } from './skyjo';
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
export const GAMES: GameDef[] = [cinqRoisGame, trouDuCulGame, skyjoGame];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGameOrThrow(id: string): GameDef {
  const g = getGame(id);
  if (!g) throw new Error(`Unknown game id: ${id}`);
  return g;
}
