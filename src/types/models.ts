export interface Player {
  id: string;
  name: string;
  color: string;
}

export interface Contest {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
}

export interface CinqRoisRound {
  round: number;
  scores: Record<string, number>;
}

export interface CinqRoisLiveGame {
  gameId: 'cinq-rois';
  playerIds: string[];
  currentRound: number;
  rounds: CinqRoisRound[];
}

export interface CinqRoisHistoryEntry {
  id: string;
  gameId: 'cinq-rois';
  date: string;
  playerIds: string[];
  rounds: { round: number; label: string; scores: Record<string, number> }[];
  totals: Record<string, number>;
  ranking: string[];
  roundsPlayed: number;
  contestId?: string | null;
}

export interface TrouDuCulRound {
  order: string[];
}

export type TrouDuCulVariants = Record<string, boolean>;

export interface TrouDuCulLiveGame {
  gameId: 'trou-du-cul';
  playerIds: string[];
  variants: TrouDuCulVariants;
  currentRound: number;
  rounds: TrouDuCulRound[];
}

export interface TrouDuCulHistoryEntry {
  id: string;
  gameId: 'trou-du-cul';
  date: string;
  playerIds: string[];
  rounds: { round: number; order: string[]; roles: string[] }[];
  cumulative: Record<string, number>;
  ranking: string[];
  variants: TrouDuCulVariants;
  contestId?: string | null;
}

export interface SkyjoRound {
  round: number;
  scores: Record<string, number>;
}

export interface SkyjoLiveGame {
  gameId: 'skyjo';
  playerIds: string[];
  currentRound: number;
  rounds: SkyjoRound[];
}

export interface SkyjoHistoryEntry {
  id: string;
  gameId: 'skyjo';
  date: string;
  playerIds: string[];
  rounds: SkyjoRound[];
  totals: Record<string, number>;
  ranking: string[];
  roundsPlayed: number;
  contestId?: string | null;
}

export interface QwirkleTurn {
  playerId: string;
  points: number;
}

export interface QwirkleLiveGame {
  gameId: 'qwirkle';
  playerIds: string[];
  turns: QwirkleTurn[];
}

export interface QwirkleHistoryEntry {
  id: string;
  gameId: 'qwirkle';
  date: string;
  playerIds: string[];
  turns: QwirkleTurn[];
  totals: Record<string, number>;
  ranking: string[];
  contestId?: string | null;
}

export interface Trek12LiveGame {
  gameId: 'trek-12';
  playerIds: string[];
  scores: Record<string, number>;
}

export interface Trek12HistoryEntry {
  id: string;
  gameId: 'trek-12';
  date: string;
  playerIds: string[];
  totals: Record<string, number>;
  ranking: string[];
  contestId?: string | null;
}

export interface DartThrow {
  segment: number | 'bull';
  multiplier: 1 | 2 | 3;
  points: number;
}

export interface DartTurn {
  playerId: string;
  throws: DartThrow[];
  turnScore: number;
  isBust: boolean;
}

export interface DartsX01LiveGame {
  gameId: 'darts-x01';
  playerIds: string[];
  startScore: number;
  doubleOut: boolean;
  doubleIn: boolean;
  turns: DartTurn[];
  /** Throws entered so far for the turn in progress (0-3), not yet committed. */
  currentThrows: DartThrow[];
}

export interface DartsX01HistoryEntry {
  id: string;
  gameId: 'darts-x01';
  date: string;
  playerIds: string[];
  startScore: number;
  doubleOut: boolean;
  doubleIn: boolean;
  turns: DartTurn[];
  finalScores: Record<string, number>;
  ranking: string[];
  winnerId: string;
  contestId?: string | null;
}

export type CricketTarget = 15 | 16 | 17 | 18 | 19 | 20 | 'bull';
export type CricketMarks = Record<CricketTarget, number>;

export interface CricketTurn {
  playerId: string;
  throws: DartThrow[];
}

export interface CricketLiveGame {
  gameId: 'darts-cricket';
  playerIds: string[];
  cutThroat: boolean;
  turns: CricketTurn[];
  currentThrows: DartThrow[];
}

export interface CricketHistoryEntry {
  id: string;
  gameId: 'darts-cricket';
  date: string;
  playerIds: string[];
  cutThroat: boolean;
  turns: CricketTurn[];
  finalMarks: Record<string, CricketMarks>;
  finalScores: Record<string, number>;
  ranking: string[];
  winnerId: string;
  contestId?: string | null;
}

export type LiveGame =
  | CinqRoisLiveGame
  | TrouDuCulLiveGame
  | SkyjoLiveGame
  | QwirkleLiveGame
  | Trek12LiveGame
  | DartsX01LiveGame
  | CricketLiveGame;
export type HistoryEntry =
  | CinqRoisHistoryEntry
  | TrouDuCulHistoryEntry
  | SkyjoHistoryEntry
  | QwirkleHistoryEntry
  | Trek12HistoryEntry
  | DartsX01HistoryEntry
  | CricketHistoryEntry;

export interface SetupState {
  gameId: string | null;
  selectedPlayerIds: string[];
  variants: TrouDuCulVariants;
  newPlayerName: string;
  countsForContest: boolean;
}

export interface KeypadModalState {
  round: number;
  pid: string;
  value: string;
}

export interface RulesTheme {
  id: string;
  title: string;
  items: { q: string; a: string }[];
}
