import type { HistoryEntry, LiveGame, Player, RulesTheme, TrouDuCulVariants } from '../types/models';

export interface VariantDef {
  key: string;
  label: string;
}

/**
 * Contract every game module must implement. Adding a 3rd game means writing
 * one module that satisfies this shape, registering it in `registry.ts`, and
 * adding its live-screen component to the `LIVE_SCREENS` map — no other
 * screen (Home, History, Stats, Setup) needs to change.
 */
export interface GameDef<TLive extends LiveGame = LiveGame, THistory extends HistoryEntry = HistoryEntry> {
  id: string;
  name: string;
  badge: string;
  color: string;
  tagline: string;
  totalRounds: number;
  hasVariants: boolean;
  variantDefs: VariantDef[];
  rulesContent: RulesTheme[];
  /** Selectable player count in Setup. Both default to 2/7 (the app's generic range) when omitted. */
  minPlayers?: number;
  maxPlayers?: number;

  createLiveGame(playerIds: string[], variants: TrouDuCulVariants): TLive;
  isRoundComplete(live: TLive, roundNum: number): boolean;
  isLastRound(live: TLive): boolean;

  /** Live ranking (best first) with a numeric total, used while a game is in progress. */
  liveRanking(live: TLive, players: Record<string, Player>): { id: string; total: number }[];
  /** Optional: overrides the default "{total} pts" row label on the live Recap screen (e.g. darts: "Fini !" / "45 restants"). */
  liveScoreLabel?(total: number, isWinner: boolean): string;

  buildHistoryEntry(live: TLive, id: string, date: string): THistory;

  /** Player ids sorted best to worst for a finished game. */
  rankingIds(entry: THistory): string[];
  scoreValue(entry: THistory, playerId: string): number;
  scoreLabel(entry: THistory, playerId: string): string;
  detailLines(entry: THistory, players: Record<string, Player>): string[];
  activeVariantsLabel(entry: THistory): string | null;
  /** Short "winner" summary for Home/History list rows, e.g. "Alice (42 pts)" or "Alice". */
  resultLabel(entry: THistory, winnerName: string): string;
}
