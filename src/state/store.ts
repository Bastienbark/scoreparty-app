import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState as RNAppState, Platform } from 'react-native';
import { create } from 'zustand';
import { deleteSnapshot, fetchSnapshot, firebaseConfigured, generateSyncCode, normalizeSyncCode, pushSnapshot } from './cloudSync';
import { buildTeamOf, deriveCricketState, previewCricketThrow, rerollSlotValues, resolveTeamId, TEAM_LETTERS } from '../games/dartsCricket';
import { deriveAtcState } from '../games/dartsAroundTheClock';
import { deriveShanghaiState } from '../games/dartsShanghai';
import { dartPoints, deriveX01State, evaluateX01Turn } from '../games/dartsX01';
import { deriveMilleSaborsState } from '../games/milleSabords';
import { getGame, getGameOrThrow } from '../games/registry';
import { playerColors } from '../theme/tokens';
import type {
  Contest,
  HistoryEntry,
  KeypadModalState,
  LiveGame,
  Player,
  SetupState,
  TrouDuCulLiveGame,
  TrouDuCulVariants,
} from '../types/models';
import { uid } from '../utils/id';
import { seedHistory, seedPlayers } from './seed';

const PLAYERS_KEY = 'scoreparty_players';
const HISTORY_KEY = 'scoreparty_history';
const SYNC_CODE_KEY = 'scoreparty_sync_code';
const LIVE_GAME_KEY = 'scoreparty_live_game';
const CONTESTS_KEY = 'scoreparty_contests';

interface LiveGameSnapshot {
  liveGame: LiveGame;
  recapSaved: boolean;
  countsForContest: boolean;
}

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'synced' | 'error';

async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

async function saveJSON(key: string, val: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore persistence failures — live state remains usable this session
  }
}

async function loadString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function saveString(key: string, val: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, val);
  } catch {
    // ignore persistence failures
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

interface HistoryFilters {
  gameIds: string[];
  playerIds: string[];
  dateFrom: string;
  dateTo: string;
  expanded: Record<string, boolean>;
}

interface AppState {
  hydrated: boolean;
  players: Player[];
  history: HistoryEntry[];

  setup: SetupState;
  liveGame: LiveGame | null;
  modal: KeypadModalState | null;
  recapSaved: boolean;
  liveGameCountsForContest: boolean;

  historyFilters: HistoryFilters;

  contests: Contest[];

  statsMode: 'single' | 'compare' | 'contest';
  statsPlayerId: string | null;
  statsCompareIds: string[];
  statsCompareGameId: string | null;
  statsCompareContestId: string | null;
  statsHeadToHeadOnly: boolean;

  rulesGame: string;
  rulesQuery: string;
  rulesOpenTheme: string | null;

  syncCode: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;

  hydrate: () => Promise<void>;
  playerById: (id: string) => Player;

  startContest: (name: string) => void;
  endContest: () => void;

  syncNow: () => Promise<void>;
  restoreFromSyncCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resetAllData: () => Promise<void>;

  openNewGameSetup: () => void;
  selectSetupGame: (gameId: string) => void;
  toggleSetupPlayer: (pid: string) => void;
  setSetupNewPlayerName: (v: string) => void;
  addSetupPlayer: () => void;
  toggleSetupVariant: (key: string) => void;
  selectSetupDartsStartScore: (score: number) => void;
  selectSetupAtcHitType: (type: 'any' | 'single' | 'double') => void;
  selectSetupMilleSaborsThreshold: (threshold: number) => void;
  toggleSetupPlayerTeam: (pid: string, idx: number) => void;
  toggleSetupCountsForContest: () => void;
  startGame: () => boolean;

  openCell: (round: number, pid: string) => void;
  modalDigit: (d: string) => void;
  modalBackspace: () => void;
  modalToggleSign: () => void;
  modalCancel: () => void;
  modalConfirm: () => void;
  crNextRound: () => void;
  skyjoNextRound: () => void;
  azulNextRound: () => void;
  toggleAzulRowCompleted: () => void;

  openQwirkleEntry: (pid: string) => void;
  qwirkleDeleteTurn: (index: number) => void;

  openMilleSaborsPointsEntry: (pid: string) => void;
  openMilleSaborsPenaltyEntry: (pid: string) => void;
  milleSaborsInstantWin: (pid: string) => void;
  milleSaborsDeleteTurn: (index: number) => void;

  openTrek12Score: (pid: string) => void;

  tdcTapPlayer: (pid: string) => void;
  tdcResetRound: () => void;
  tdcNextRound: () => void;

  dartsAddThrow: (segment: number | 'bull' | 'miss', multiplier: 1 | 2 | 3) => void;
  dartsUndoThrow: () => void;

  dartsCricketAddThrow: (segment: number | 'bull' | 'miss', multiplier: 1 | 2 | 3) => void;
  dartsCricketUndoThrow: () => void;

  dartsAtcAddThrow: (segment: number | 'bull' | 'miss', multiplier: 1 | 2 | 3) => void;
  dartsAtcUndoThrow: () => void;

  dartsShanghaiAddThrow: (segment: number | 'bull' | 'miss', multiplier: 1 | 2 | 3) => void;
  dartsShanghaiUndoThrow: () => void;

  saveGame: () => void;
  resetLiveGame: () => void;
  deleteHistoryEntry: (id: string) => void;

  toggleHistGame: (id: string) => void;
  clearHistGameFilter: () => void;
  toggleHistPlayerFilter: (id: string) => void;
  setHistDateFrom: (v: string) => void;
  setHistDateTo: (v: string) => void;
  toggleHistExpand: (id: string) => void;

  setStatsMode: (m: 'single' | 'compare' | 'contest') => void;
  selectStatsPlayer: (id: string) => void;
  toggleStatsCompare: (id: string) => void;
  setStatsCompareGameId: (id: string | null) => void;
  setStatsCompareContestId: (id: string | null) => void;
  toggleStatsHeadToHead: () => void;

  selectRulesGame: (id: string) => void;
  setRulesQuery: (v: string) => void;
  toggleRulesTheme: (id: string) => void;
}

const emptySetup: SetupState = { gameId: null, selectedPlayerIds: [], variants: {}, newPlayerName: '', countsForContest: true, dartsTeams: {} };

function maxPlayersFor(gameId: string | null): number {
  if (!gameId) return 7;
  return getGame(gameId)?.maxPlayers ?? 7;
}

export const useAppStore = create<AppState>((set, get) => {
  const schedulePush = () => {
    if (!firebaseConfigured) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      get().syncNow();
    }, 1500);
  };

  return {
  hydrated: false,
  players: [],
  history: [],

  setup: { ...emptySetup },
  liveGame: null,
  modal: null,
  recapSaved: false,
  liveGameCountsForContest: true,

  historyFilters: { gameIds: [], playerIds: [], dateFrom: '', dateTo: '', expanded: {} },

  contests: [],

  statsMode: 'single',
  statsPlayerId: null,
  statsCompareIds: [],
  statsCompareGameId: null,
  statsCompareContestId: null,
  statsHeadToHeadOnly: false,

  rulesGame: 'cinq-rois',
  rulesQuery: '',
  rulesOpenTheme: null,

  syncCode: null,
  syncStatus: firebaseConfigured ? 'idle' : 'disabled',
  lastSyncedAt: null,
  syncError: null,

  hydrate: async () => {
    let players = await loadJSON<Player[]>(PLAYERS_KEY);
    let history = await loadJSON<HistoryEntry[]>(HISTORY_KEY);
    if (!players) {
      players = seedPlayers();
      await saveJSON(PLAYERS_KEY, players);
    }
    if (!history) {
      history = seedHistory(players);
      await saveJSON(HISTORY_KEY, history);
    }

    const contests = (await loadJSON<Contest[]>(CONTESTS_KEY)) ?? [];

    let syncCode = await loadString(SYNC_CODE_KEY);
    if (!syncCode) {
      syncCode = generateSyncCode();
      await saveString(SYNC_CODE_KEY, syncCode);
    }

    const liveSnapshot = await loadJSON<LiveGameSnapshot>(LIVE_GAME_KEY);

    set({
      players,
      history,
      contests,
      statsPlayerId: players[0]?.id ?? null,
      hydrated: true,
      syncCode,
      liveGame: liveSnapshot?.liveGame ?? null,
      recapSaved: liveSnapshot?.recapSaved ?? false,
      liveGameCountsForContest: liveSnapshot?.countsForContest ?? true,
    });
  },

  playerById: (id) => get().players.find((p) => p.id === id) ?? { id, name: '?', color: '#888' },

  startContest: (name) => {
    if (get().contests.some((c) => !c.endedAt)) return;
    const contest: Contest = {
      id: uid(),
      name: name.trim() || 'Concours',
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    set((s) => {
      const contests = [contest, ...s.contests];
      saveJSON(CONTESTS_KEY, contests);
      return { contests, statsMode: 'contest' };
    });
  },

  endContest: () => {
    set((s) => {
      const contests = s.contests.map((c) => (c.endedAt ? c : { ...c, endedAt: new Date().toISOString() }));
      saveJSON(CONTESTS_KEY, contests);
      return { contests };
    });
  },

  syncNow: async () => {
    const { syncCode, players, history } = get();
    if (!firebaseConfigured || !syncCode) return;
    set({ syncStatus: 'syncing', syncError: null });
    try {
      await pushSnapshot(syncCode, players, history);
      set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch (e) {
      set({ syncStatus: 'error', syncError: e instanceof Error ? e.message : 'Échec de la sauvegarde' });
    }
  },

  restoreFromSyncCode: async (rawCode) => {
    const code = normalizeSyncCode(rawCode);
    if (!firebaseConfigured) return { ok: false, error: "Sauvegarde cloud non configurée." };
    if (!code) return { ok: false, error: 'Code invalide.' };
    set({ syncStatus: 'syncing', syncError: null });
    try {
      const snapshot = await fetchSnapshot(code);
      if (!snapshot) {
        set({ syncStatus: 'error', syncError: 'Aucune sauvegarde trouvée pour ce code.' });
        return { ok: false, error: 'Aucune sauvegarde trouvée pour ce code.' };
      }
      await saveJSON(PLAYERS_KEY, snapshot.players);
      await saveJSON(HISTORY_KEY, snapshot.history);
      await saveString(SYNC_CODE_KEY, code);
      set({
        players: snapshot.players,
        history: snapshot.history,
        statsPlayerId: snapshot.players[0]?.id ?? null,
        syncCode: code,
        syncStatus: 'synced',
        lastSyncedAt: snapshot.updatedAt,
      });
      return { ok: true };
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Échec de la restauration';
      set({ syncStatus: 'error', syncError: error });
      return { ok: false, error };
    }
  },

  resetAllData: async () => {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    const currentCode = get().syncCode;
    if (firebaseConfigured && currentCode) {
      try {
        await deleteSnapshot(currentCode);
      } catch {
        // best-effort — the local reset still proceeds even if the cloud delete fails
      }
    }
    const newCode = generateSyncCode();
    await saveJSON(PLAYERS_KEY, []);
    await saveJSON(HISTORY_KEY, []);
    await saveJSON(CONTESTS_KEY, []);
    await saveString(SYNC_CODE_KEY, newCode);
    set({
      players: [],
      history: [],
      contests: [],
      statsPlayerId: null,
      statsCompareIds: [],
      syncCode: newCode,
      syncStatus: firebaseConfigured ? 'idle' : 'disabled',
      lastSyncedAt: null,
      syncError: null,
      liveGame: null,
      recapSaved: false,
      liveGameCountsForContest: true,
      modal: null,
    });
  },

  openNewGameSetup: () => set({ setup: { ...emptySetup } }),

  selectSetupGame: (gameId) =>
    set((s) => ({
      setup: {
        ...s.setup,
        gameId,
        variants:
          gameId === 'trou-du-cul'
            ? { revolution: false, bombes: false, putsch: false, suites: false }
            : gameId === 'darts-x01'
              ? { '501': true, doubleOut: true, doubleIn: false }
              : gameId === 'darts-cricket'
                ? { cutThroat: false }
                : gameId === 'darts-atc'
                  ? { hitSingle: false, hitDouble: false, includeBull: false }
                  : gameId === 'darts-shanghai'
                    ? { '20': false }
                    : gameId === 'mille-sabords'
                      ? { '6000': true }
                      : ({} as TrouDuCulVariants),
      },
    })),

  toggleSetupPlayer: (pid) =>
    set((s) => {
      const cur = s.setup.selectedPlayerIds;
      const max = maxPlayersFor(s.setup.gameId);
      const sel = cur.includes(pid) ? cur.filter((x) => x !== pid) : cur.length < max ? [...cur, pid] : cur;
      return { setup: { ...s.setup, selectedPlayerIds: sel } };
    }),

  setSetupNewPlayerName: (v) => set((s) => ({ setup: { ...s.setup, newPlayerName: v } })),

  addSetupPlayer: () => {
    const name = get().setup.newPlayerName.trim();
    if (!name) return;
    const player: Player = { id: uid(), name, color: playerColors[get().players.length % playerColors.length] };
    set((s) => {
      const players = [...s.players, player];
      saveJSON(PLAYERS_KEY, players);
      const max = maxPlayersFor(s.setup.gameId);
      return {
        players,
        setup: {
          ...s.setup,
          newPlayerName: '',
          selectedPlayerIds: s.setup.selectedPlayerIds.length < max ? [...s.setup.selectedPlayerIds, player.id] : s.setup.selectedPlayerIds,
        },
      };
    });
    schedulePush();
  },

  toggleSetupVariant: (key) =>
    set((s) => ({ setup: { ...s.setup, variants: { ...s.setup.variants, [key]: !s.setup.variants[key] } } })),

  selectSetupDartsStartScore: (score) =>
    set((s) => ({ setup: { ...s.setup, variants: { ...s.setup.variants, '301': false, '501': false, '701': false, [score]: true } } })),

  selectSetupAtcHitType: (type) =>
    set((s) => ({ setup: { ...s.setup, variants: { ...s.setup.variants, hitSingle: type === 'single', hitDouble: type === 'double' } } })),

  selectSetupMilleSaborsThreshold: (threshold) =>
    set((s) => ({ setup: { ...s.setup, variants: { ...s.setup.variants, '5000': false, '6000': false, '8000': false, [threshold]: true } } })),

  toggleSetupPlayerTeam: (pid, idx) =>
    set((s) => {
      const numTeams = Math.max(1, Math.ceil(s.setup.selectedPlayerIds.length / 2));
      const letters: string[] = TEAM_LETTERS.slice(0, numTeams);
      const current = resolveTeamId(pid, idx, s.setup.dartsTeams);
      const next = letters[(letters.indexOf(current) + 1) % letters.length] ?? letters[0];
      return { setup: { ...s.setup, dartsTeams: { ...s.setup.dartsTeams, [pid]: next } } };
    }),

  toggleSetupCountsForContest: () => set((s) => ({ setup: { ...s.setup, countsForContest: !s.setup.countsForContest } })),

  startGame: () => {
    const { gameId, selectedPlayerIds, variants, countsForContest, dartsTeams } = get().setup;
    if (!gameId) return false;
    const game = getGameOrThrow(gameId);
    const min = game.minPlayers ?? 2;
    const max = game.maxPlayers ?? 7;
    if (selectedPlayerIds.length < min || selectedPlayerIds.length > max) return false;
    const liveGame = game.createLiveGame(selectedPlayerIds, variants);
    if (liveGame.gameId === 'darts-cricket' && liveGame.teamMode) {
      liveGame.teamOf = buildTeamOf(selectedPlayerIds, dartsTeams);
    }
    set({ liveGame, recapSaved: false, liveGameCountsForContest: countsForContest });
    return true;
  },

  openCell: (round, pid) => {
    const live = get().liveGame;
    if (!live || (live.gameId !== 'cinq-rois' && live.gameId !== 'skyjo' && live.gameId !== 'azul')) return;
    const existing = live.rounds[round - 1].scores[pid];
    set({ modal: { round, pid, value: existing !== undefined ? String(existing) : '' } });
  },

  modalDigit: (d) =>
    set((s) => (s.modal ? { modal: { ...s.modal, value: (s.modal.value + d).slice(0, 4) } } : {})),

  modalBackspace: () => set((s) => (s.modal ? { modal: { ...s.modal, value: s.modal.value.slice(0, -1) } } : {})),

  modalToggleSign: () =>
    set((s) => {
      if (!s.modal) return {};
      const v = s.modal.value;
      const toggled = v.startsWith('-') ? v.slice(1) : v ? `-${v}` : '-';
      return { modal: { ...s.modal, value: toggled } };
    }),

  modalCancel: () => set({ modal: null }),

  modalConfirm: () => {
    const modal = get().modal;
    const live = get().liveGame;
    if (!modal || !live) return;
    if (live.gameId === 'qwirkle') {
      const points = Number(modal.value || 0);
      const turns = [...live.turns, { playerId: modal.pid, points }];
      set({ liveGame: { ...live, turns }, modal: null });
      return;
    }
    if (live.gameId === 'trek-12' || live.gameId === 'lost-cities-rw') {
      const scores = { ...live.scores, [modal.pid]: Number(modal.value || 0) };
      set({ liveGame: { ...live, scores }, modal: null });
      return;
    }
    if (live.gameId === 'mille-sabords') {
      const value = Number(modal.value || 0);
      const turn = modal.kind === 'penalty' ? { playerId: modal.pid, points: 0, penaltyToOthers: Math.max(0, value) } : { playerId: modal.pid, points: value, penaltyToOthers: 0 };
      const turns = [...live.turns, turn];
      set({ liveGame: { ...live, turns }, modal: null });
      return;
    }
    if (live.gameId !== 'cinq-rois' && live.gameId !== 'skyjo' && live.gameId !== 'azul') return;
    const { round, pid, value } = modal;
    const rounds = live.rounds.map((r) => (r.round === round ? { ...r, scores: { ...r.scores, [pid]: Number(value || 0) } } : r));
    set({ liveGame: { ...live, rounds } as LiveGame, modal: null });
  },

  crNextRound: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'cinq-rois' || live.currentRound >= live.rounds.length) return {};
      return { liveGame: { ...live, currentRound: live.currentRound + 1 } };
    }),

  skyjoNextRound: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'skyjo') return {};
      const nextRoundNum = live.currentRound + 1;
      const rounds = [...live.rounds, { round: nextRoundNum, scores: {} }];
      return { liveGame: { ...live, rounds, currentRound: nextRoundNum } };
    }),

  azulNextRound: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'azul') return {};
      const nextRoundNum = live.currentRound + 1;
      const rounds = [...live.rounds, { round: nextRoundNum, scores: {}, rowCompleted: false }];
      return { liveGame: { ...live, rounds, currentRound: nextRoundNum } };
    }),

  toggleAzulRowCompleted: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'azul') return {};
      const idx = live.currentRound - 1;
      const rounds = live.rounds.map((r, i) => (i === idx ? { ...r, rowCompleted: !r.rowCompleted } : r));
      return { liveGame: { ...live, rounds } };
    }),

  openQwirkleEntry: (pid) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'qwirkle') return;
    set({ modal: { round: 0, pid, value: '' } });
  },

  qwirkleDeleteTurn: (index) =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'qwirkle') return {};
      const turns = live.turns.filter((_, i) => i !== index);
      return { liveGame: { ...live, turns } };
    }),

  openMilleSaborsPointsEntry: (pid) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'mille-sabords' || deriveMilleSaborsState(live).winnerId) return;
    set({ modal: { round: 0, pid, value: '', kind: 'points' } });
  },

  openMilleSaborsPenaltyEntry: (pid) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'mille-sabords' || deriveMilleSaborsState(live).winnerId) return;
    set({ modal: { round: 0, pid, value: '', kind: 'penalty' } });
  },

  milleSaborsInstantWin: (pid) =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'mille-sabords' || deriveMilleSaborsState(live).winnerId) return {};
      const turns = [...live.turns, { playerId: pid, points: 0, penaltyToOthers: 0, instantWin: true }];
      return { liveGame: { ...live, turns } };
    }),

  milleSaborsDeleteTurn: (index) =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'mille-sabords') return {};
      const turns = live.turns.filter((_, i) => i !== index);
      return { liveGame: { ...live, turns } };
    }),

  openTrek12Score: (pid) => {
    const live = get().liveGame;
    if (!live || (live.gameId !== 'trek-12' && live.gameId !== 'lost-cities-rw')) return;
    const existing = live.scores[pid];
    set({ modal: { round: 0, pid, value: existing !== undefined ? String(existing) : '' } });
  },

  tdcTapPlayer: (pid) =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'trou-du-cul') return {};
      const idx = live.currentRound - 1;
      const rounds = live.rounds.map((r, i) => (i === idx ? { ...r, order: [...r.order, pid] } : r));
      return { liveGame: { ...live, rounds } as TrouDuCulLiveGame };
    }),

  tdcResetRound: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'trou-du-cul') return {};
      const idx = live.currentRound - 1;
      const rounds = live.rounds.map((r, i) => (i === idx ? { ...r, order: [] } : r));
      return { liveGame: { ...live, rounds } as TrouDuCulLiveGame };
    }),

  tdcNextRound: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'trou-du-cul' || live.currentRound >= live.rounds.length) return {};
      return { liveGame: { ...live, currentRound: live.currentRound + 1 } };
    }),

  dartsAddThrow: (segment, multiplier) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'darts-x01') return;
    if (live.currentThrows.length >= 3) return;
    const { winnerId, activePlayerId, scores, opened } = deriveX01State(live);
    if (winnerId || !activePlayerId) return;

    const points = dartPoints(segment, multiplier);
    const newThrows = [...live.currentThrows, { segment, multiplier, points }];
    const remainingBefore = scores[activePlayerId];
    const evalResult = evaluateX01Turn(remainingBefore, opened[activePlayerId], live.doubleOut, live.doubleIn, newThrows);

    if (evalResult.isBust || evalResult.finished || newThrows.length === 3) {
      const turn = { playerId: activePlayerId, throws: newThrows, turnScore: evalResult.turnScore, isBust: evalResult.isBust };
      set({ liveGame: { ...live, turns: [...live.turns, turn], currentThrows: [] } });
    } else {
      set({ liveGame: { ...live, currentThrows: newThrows } });
    }
  },

  dartsUndoThrow: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'darts-x01') return {};
      if (live.currentThrows.length > 0) {
        return { liveGame: { ...live, currentThrows: live.currentThrows.slice(0, -1) } };
      }
      if (live.turns.length === 0) return {};
      const lastTurn = live.turns[live.turns.length - 1];
      return { liveGame: { ...live, turns: live.turns.slice(0, -1), currentThrows: lastTurn.throws.slice(0, -1) } };
    }),

  dartsCricketAddThrow: (segment, multiplier) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'darts-cricket') return;
    if (live.currentThrows.length >= 3) return;
    const { winnerTeamId, activePlayerId } = deriveCricketState(live);
    if (winnerTeamId || !activePlayerId) return;

    const points = dartPoints(segment, multiplier);
    const throwObj = { segment, multiplier, points };
    const preview = previewCricketThrow(live, activePlayerId, throwObj);
    const newThrows = [...live.currentThrows, throwObj];

    if (preview.winnerTeamId || newThrows.length === 3) {
      const turn = { playerId: activePlayerId, throws: newThrows, slotValues: live.currentSlotValues };
      const committedLive = { ...live, turns: [...live.turns, turn], currentThrows: [] };
      if (live.crazyMode && !preview.winnerTeamId) {
        const { marks } = deriveCricketState(committedLive);
        const nextSlotValues = rerollSlotValues(marks, live.playerIds, true, live.currentSlotValues);
        set({ liveGame: { ...committedLive, currentSlotValues: nextSlotValues } });
      } else {
        set({ liveGame: committedLive });
      }
    } else {
      set({ liveGame: { ...live, currentThrows: newThrows } });
    }
  },

  dartsCricketUndoThrow: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'darts-cricket') return {};
      if (live.currentThrows.length > 0) {
        return { liveGame: { ...live, currentThrows: live.currentThrows.slice(0, -1) } };
      }
      if (live.turns.length === 0) return {};
      const lastTurn = live.turns[live.turns.length - 1];
      return {
        liveGame: {
          ...live,
          turns: live.turns.slice(0, -1),
          currentThrows: lastTurn.throws.slice(0, -1),
          currentSlotValues: lastTurn.slotValues,
        },
      };
    }),

  dartsAtcAddThrow: (segment, multiplier) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'darts-atc') return;
    if (live.currentThrows.length >= 3) return;
    const { winnerId, activePlayerId } = deriveAtcState(live);
    if (winnerId || !activePlayerId) return;

    const points = dartPoints(segment, multiplier);
    const newThrows = [...live.currentThrows, { segment, multiplier, points }];
    const { winnerId: previewWinner } = deriveAtcState({ ...live, currentThrows: newThrows });

    if (previewWinner || newThrows.length === 3) {
      const turn = { playerId: activePlayerId, throws: newThrows };
      set({ liveGame: { ...live, turns: [...live.turns, turn], currentThrows: [] } });
    } else {
      set({ liveGame: { ...live, currentThrows: newThrows } });
    }
  },

  dartsAtcUndoThrow: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'darts-atc') return {};
      if (live.currentThrows.length > 0) {
        return { liveGame: { ...live, currentThrows: live.currentThrows.slice(0, -1) } };
      }
      if (live.turns.length === 0) return {};
      const lastTurn = live.turns[live.turns.length - 1];
      return { liveGame: { ...live, turns: live.turns.slice(0, -1), currentThrows: lastTurn.throws.slice(0, -1) } };
    }),

  dartsShanghaiAddThrow: (segment, multiplier) => {
    const live = get().liveGame;
    if (!live || live.gameId !== 'darts-shanghai') return;
    if (live.currentThrows.length >= 3) return;
    const { winnerIds, activePlayerId, round } = deriveShanghaiState(live);
    if (winnerIds || !activePlayerId) return;

    const points = dartPoints(segment, multiplier);
    const newThrows = [...live.currentThrows, { segment, multiplier, points }];

    if (newThrows.length === 3) {
      const turn = { playerId: activePlayerId, round, throws: newThrows };
      set({ liveGame: { ...live, turns: [...live.turns, turn], currentThrows: [] } });
    } else {
      set({ liveGame: { ...live, currentThrows: newThrows } });
    }
  },

  dartsShanghaiUndoThrow: () =>
    set((s) => {
      const live = s.liveGame;
      if (!live || live.gameId !== 'darts-shanghai') return {};
      if (live.currentThrows.length > 0) {
        return { liveGame: { ...live, currentThrows: live.currentThrows.slice(0, -1) } };
      }
      if (live.turns.length === 0) return {};
      const lastTurn = live.turns[live.turns.length - 1];
      return { liveGame: { ...live, turns: live.turns.slice(0, -1), currentThrows: lastTurn.throws.slice(0, -1) } };
    }),

  saveGame: () => {
    const live = get().liveGame;
    if (!live) return;
    const game = getGameOrThrow(live.gameId);
    const entry = game.buildHistoryEntry(live, uid(), new Date().toISOString());
    const activeContest = get().contests.find((c) => !c.endedAt);
    if (activeContest && get().liveGameCountsForContest) entry.contestId = activeContest.id;
    set((s) => {
      const history = [entry, ...s.history];
      saveJSON(HISTORY_KEY, history);
      return { history, recapSaved: true };
    });
    schedulePush();
  },

  resetLiveGame: () => set({ liveGame: null, recapSaved: false, modal: null, liveGameCountsForContest: true }),

  deleteHistoryEntry: (id) => {
    set((s) => {
      const history = s.history.filter((h) => h.id !== id);
      saveJSON(HISTORY_KEY, history);
      return { history };
    });
    schedulePush();
  },

  toggleHistGame: (id) =>
    set((s) => {
      const cur = s.historyFilters.gameIds;
      const v = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { historyFilters: { ...s.historyFilters, gameIds: v } };
    }),
  clearHistGameFilter: () => set((s) => ({ historyFilters: { ...s.historyFilters, gameIds: [] } })),
  toggleHistPlayerFilter: (id) =>
    set((s) => {
      const cur = s.historyFilters.playerIds;
      const v = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { historyFilters: { ...s.historyFilters, playerIds: v } };
    }),
  setHistDateFrom: (v) => set((s) => ({ historyFilters: { ...s.historyFilters, dateFrom: v } })),
  setHistDateTo: (v) => set((s) => ({ historyFilters: { ...s.historyFilters, dateTo: v } })),
  toggleHistExpand: (id) =>
    set((s) => ({ historyFilters: { ...s.historyFilters, expanded: { ...s.historyFilters.expanded, [id]: !s.historyFilters.expanded[id] } } })),

  setStatsMode: (m) => set({ statsMode: m }),
  selectStatsPlayer: (id) => set({ statsPlayerId: id }),
  toggleStatsCompare: (id) =>
    set((s) => {
      const cur = s.statsCompareIds;
      const v = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 4 ? [...cur, id] : cur;
      return { statsCompareIds: v };
    }),
  setStatsCompareGameId: (id) => set({ statsCompareGameId: id }),
  setStatsCompareContestId: (id) => set({ statsCompareContestId: id }),
  toggleStatsHeadToHead: () => set((s) => ({ statsHeadToHeadOnly: !s.statsHeadToHeadOnly })),

  selectRulesGame: (id) => set({ rulesGame: id, rulesQuery: '', rulesOpenTheme: null }),
  setRulesQuery: (v) => set({ rulesQuery: v }),
  toggleRulesTheme: (id) => set((s) => ({ rulesOpenTheme: s.rulesOpenTheme === id ? null : id })),
  };
});

// Persist the in-progress game continuously so it survives closing the app —
// only committing to history on "Enregistrer" (saveGame) would otherwise
// mean losing a whole game if the app/tab gets closed mid-way.
useAppStore.subscribe((state, prevState) => {
  if (
    state.liveGame === prevState.liveGame &&
    state.recapSaved === prevState.recapSaved &&
    state.liveGameCountsForContest === prevState.liveGameCountsForContest
  ) {
    return;
  }
  if (state.liveGame) {
    saveJSON(LIVE_GAME_KEY, { liveGame: state.liveGame, recapSaved: state.recapSaved, countsForContest: state.liveGameCountsForContest });
  } else {
    AsyncStorage.removeItem(LIVE_GAME_KEY).catch(() => {});
  }
});

// Retry a failed cloud sync automatically once connectivity is likely back —
// on returning to the app (AppState) and, on web, on the browser's own
// 'online' event — instead of leaving it stuck on "Erreur" until the next
// unrelated change or a manual tap on "Sauvegarder maintenant".
function retryFailedSync() {
  const { syncStatus, syncNow } = useAppStore.getState();
  if (syncStatus === 'error') syncNow();
}

RNAppState.addEventListener('change', (nextState) => {
  if (nextState === 'active') retryFailedSync();
});

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('online', retryFailedSync);
}
