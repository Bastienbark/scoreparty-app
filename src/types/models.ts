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

export type LiveGame = CinqRoisLiveGame | TrouDuCulLiveGame | SkyjoLiveGame | QwirkleLiveGame | Trek12LiveGame;
export type HistoryEntry = CinqRoisHistoryEntry | TrouDuCulHistoryEntry | SkyjoHistoryEntry | QwirkleHistoryEntry | Trek12HistoryEntry;

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
