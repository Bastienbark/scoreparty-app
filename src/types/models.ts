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
  segment: number | 'bull' | 'miss';
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

/** slot1-6 carry a variable face value under Crazy Cricket (fixed at 20..15 otherwise); bull is always fixed. */
export type CricketSlotKey = 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5' | 'slot6' | 'bull';
export type CricketMarks = Record<CricketSlotKey, number>;
export type CricketSlotValues = Record<CricketSlotKey, number>;

export interface CricketTurn {
  playerId: string;
  throws: DartThrow[];
  /** The slot -> face value mapping in effect while this turn was played (Crazy Cricket can reshuffle it afterward). */
  slotValues: CricketSlotValues;
}

export interface CricketLiveGame {
  gameId: 'darts-cricket';
  playerIds: string[];
  cutThroat: boolean;
  teamMode: boolean;
  crazyMode: boolean;
  /** playerId -> teamId. Without team mode, every player is their own team (teamOf[pid] === pid). */
  teamOf: Record<string, string>;
  turns: CricketTurn[];
  currentThrows: DartThrow[];
  currentSlotValues: CricketSlotValues;
}

export interface CricketHistoryEntry {
  id: string;
  gameId: 'darts-cricket';
  date: string;
  playerIds: string[];
  cutThroat: boolean;
  teamMode: boolean;
  crazyMode: boolean;
  teamOf: Record<string, string>;
  turns: CricketTurn[];
  finalMarks: Record<string, CricketMarks>;
  finalScores: Record<string, number>;
  finalTeamScores: Record<string, number>;
  ranking: string[];
  /** Parallel to ranking; equal values mean tied (e.g. teammates sharing a team win). */
  rankGroups: number[];
  winnerId: string;
  winnerTeamId: string;
  contestId?: string | null;
}

export type AtcHitType = 'any' | 'single' | 'double';

export interface AtcTurn {
  playerId: string;
  throws: DartThrow[];
}

export interface AtcLiveGame {
  gameId: 'darts-atc';
  playerIds: string[];
  hitType: AtcHitType;
  includeBull: boolean;
  turns: AtcTurn[];
  currentThrows: DartThrow[];
}

export interface AtcHistoryEntry {
  id: string;
  gameId: 'darts-atc';
  date: string;
  playerIds: string[];
  hitType: AtcHitType;
  includeBull: boolean;
  turns: AtcTurn[];
  finalProgress: Record<string, number>;
  ranking: string[];
  winnerId: string;
  contestId?: string | null;
}

export interface ShanghaiTurn {
  playerId: string;
  round: number;
  throws: DartThrow[];
}

export interface ShanghaiLiveGame {
  gameId: 'darts-shanghai';
  playerIds: string[];
  totalRounds: number;
  turns: ShanghaiTurn[];
  currentThrows: DartThrow[];
}

export interface ShanghaiHistoryEntry {
  id: string;
  gameId: 'darts-shanghai';
  date: string;
  playerIds: string[];
  totalRounds: number;
  turns: ShanghaiTurn[];
  finalScores: Record<string, number>;
  /** Set when won by an instant Shanghai (single + double + triple of the round's number in one turn); null for a normal high-score finish. */
  shanghaiWinnerId: string | null;
  ranking: string[];
  rankGroups: number[];
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
  | CricketLiveGame
  | AtcLiveGame
  | ShanghaiLiveGame;
export type HistoryEntry =
  | CinqRoisHistoryEntry
  | TrouDuCulHistoryEntry
  | SkyjoHistoryEntry
  | QwirkleHistoryEntry
  | Trek12HistoryEntry
  | DartsX01HistoryEntry
  | CricketHistoryEntry
  | AtcHistoryEntry
  | ShanghaiHistoryEntry;

export interface SetupState {
  gameId: string | null;
  selectedPlayerIds: string[];
  variants: TrouDuCulVariants;
  newPlayerName: string;
  countsForContest: boolean;
  /** Cricket team-mode overrides (teams of 2); players not listed default to pairing by selection order (A, B, C…). */
  dartsTeams: Record<string, string>;
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
