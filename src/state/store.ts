import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { deleteSnapshot, fetchSnapshot, firebaseConfigured, generateSyncCode, normalizeSyncCode, pushSnapshot } from './cloudSync';
import { getGameOrThrow } from '../games/registry';
import { playerColors } from '../theme/tokens';
import type {
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

interface LiveGameSnapshot {
  liveGame: LiveGame;
  recapSaved: boolean;
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

  historyFilters: HistoryFilters;

  statsMode: 'single' | 'compare';
  statsPlayerId: string | null;
  statsCompareIds: string[];
  statsCompareGameId: string | null;

  rulesGame: string;
  rulesQuery: string;
  rulesOpenTheme: string | null;

  syncCode: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;

  hydrate: () => Promise<void>;
  playerById: (id: string) => Player;

  syncNow: () => Promise<void>;
  restoreFromSyncCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resetAllData: () => Promise<void>;

  openNewGameSetup: () => void;
  selectSetupGame: (gameId: string) => void;
  toggleSetupPlayer: (pid: string) => void;
  setSetupNewPlayerName: (v: string) => void;
  addSetupPlayer: () => void;
  toggleSetupVariant: (key: string) => void;
  startGame: () => boolean;

  openCell: (round: number, pid: string) => void;
  modalDigit: (d: string) => void;
  modalBackspace: () => void;
  modalToggleSign: () => void;
  modalCancel: () => void;
  modalConfirm: () => void;
  crNextRound: () => void;
  skyjoNextRound: () => void;

  tdcTapPlayer: (pid: string) => void;
  tdcResetRound: () => void;
  tdcNextRound: () => void;

  saveGame: () => void;
  resetLiveGame: () => void;
  deleteHistoryEntry: (id: string) => void;

  toggleHistGame: (id: string) => void;
  clearHistGameFilter: () => void;
  toggleHistPlayerFilter: (id: string) => void;
  setHistDateFrom: (v: string) => void;
  setHistDateTo: (v: string) => void;
  toggleHistExpand: (id: string) => void;

  setStatsMode: (m: 'single' | 'compare') => void;
  selectStatsPlayer: (id: string) => void;
  toggleStatsCompare: (id: string) => void;
  setStatsCompareGameId: (id: string | null) => void;

  selectRulesGame: (id: string) => void;
  setRulesQuery: (v: string) => void;
  toggleRulesTheme: (id: string) => void;
}

const emptySetup: SetupState = { gameId: null, selectedPlayerIds: [], variants: {}, newPlayerName: '' };

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

  historyFilters: { gameIds: [], playerIds: [], dateFrom: '', dateTo: '', expanded: {} },

  statsMode: 'single',
  statsPlayerId: null,
  statsCompareIds: [],
  statsCompareGameId: null,

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

    let syncCode = await loadString(SYNC_CODE_KEY);
    if (!syncCode) {
      syncCode = generateSyncCode();
      await saveString(SYNC_CODE_KEY, syncCode);
    }

    const liveSnapshot = await loadJSON<LiveGameSnapshot>(LIVE_GAME_KEY);

    set({
      players,
      history,
      statsPlayerId: players[0]?.id ?? null,
      hydrated: true,
      syncCode,
      liveGame: liveSnapshot?.liveGame ?? null,
      recapSaved: liveSnapshot?.recapSaved ?? false,
    });
  },

  playerById: (id) => get().players.find((p) => p.id === id) ?? { id, name: '?', color: '#888' },

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
    await saveString(SYNC_CODE_KEY, newCode);
    set({
      players: [],
      history: [],
      statsPlayerId: null,
      statsCompareIds: [],
      syncCode: newCode,
      syncStatus: firebaseConfigured ? 'idle' : 'disabled',
      lastSyncedAt: null,
      syncError: null,
      liveGame: null,
      recapSaved: false,
      modal: null,
    });
  },

  openNewGameSetup: () => set({ setup: { ...emptySetup } }),

  selectSetupGame: (gameId) =>
    set((s) => ({
      setup: {
        ...s.setup,
        gameId,
        variants: gameId === 'trou-du-cul' ? { revolution: false, bombes: false, putsch: false, suites: false } : ({} as TrouDuCulVariants),
      },
    })),

  toggleSetupPlayer: (pid) =>
    set((s) => {
      const cur = s.setup.selectedPlayerIds;
      const sel = cur.includes(pid) ? cur.filter((x) => x !== pid) : cur.length < 7 ? [...cur, pid] : cur;
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
      return {
        players,
        setup: {
          ...s.setup,
          newPlayerName: '',
          selectedPlayerIds: s.setup.selectedPlayerIds.length < 7 ? [...s.setup.selectedPlayerIds, player.id] : s.setup.selectedPlayerIds,
        },
      };
    });
    schedulePush();
  },

  toggleSetupVariant: (key) =>
    set((s) => ({ setup: { ...s.setup, variants: { ...s.setup.variants, [key]: !s.setup.variants[key] } } })),

  startGame: () => {
    const { gameId, selectedPlayerIds, variants } = get().setup;
    if (!gameId || selectedPlayerIds.length < 2 || selectedPlayerIds.length > 7) return false;
    const game = getGameOrThrow(gameId);
    const liveGame = game.createLiveGame(selectedPlayerIds, variants);
    set({ liveGame, recapSaved: false });
    return true;
  },

  openCell: (round, pid) => {
    const live = get().liveGame;
    if (!live || (live.gameId !== 'cinq-rois' && live.gameId !== 'skyjo')) return;
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
    if (!modal || !live || (live.gameId !== 'cinq-rois' && live.gameId !== 'skyjo')) return;
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

  saveGame: () => {
    const live = get().liveGame;
    if (!live) return;
    const game = getGameOrThrow(live.gameId);
    const entry = game.buildHistoryEntry(live, uid(), new Date().toISOString());
    set((s) => {
      const history = [entry, ...s.history];
      saveJSON(HISTORY_KEY, history);
      return { history, recapSaved: true };
    });
    schedulePush();
  },

  resetLiveGame: () => set({ liveGame: null, recapSaved: false, modal: null }),

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

  selectRulesGame: (id) => set({ rulesGame: id, rulesQuery: '', rulesOpenTheme: null }),
  setRulesQuery: (v) => set({ rulesQuery: v }),
  toggleRulesTheme: (id) => set((s) => ({ rulesOpenTheme: s.rulesOpenTheme === id ? null : id })),
  };
});

// Persist the in-progress game continuously so it survives closing the app —
// only committing to history on "Enregistrer" (saveGame) would otherwise
// mean losing a whole game if the app/tab gets closed mid-way.
useAppStore.subscribe((state, prevState) => {
  if (state.liveGame === prevState.liveGame && state.recapSaved === prevState.recapSaved) return;
  if (state.liveGame) {
    saveJSON(LIVE_GAME_KEY, { liveGame: state.liveGame, recapSaved: state.recapSaved });
  } else {
    AsyncStorage.removeItem(LIVE_GAME_KEY).catch(() => {});
  }
});
