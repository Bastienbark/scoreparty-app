export interface Player {
  id: string;
  name: string;
  color: string;
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
}

export type LiveGame = CinqRoisLiveGame | TrouDuCulLiveGame;
export type HistoryEntry = CinqRoisHistoryEntry | TrouDuCulHistoryEntry;

export interface SetupState {
  gameId: string | null;
  selectedPlayerIds: string[];
  variants: TrouDuCulVariants;
  newPlayerName: string;
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
