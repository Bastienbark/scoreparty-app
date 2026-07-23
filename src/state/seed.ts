import { CR_LABELS } from '../games/cinqRois';
import { roleForPosition } from '../games/trouDuCul';
import { playerColors } from '../theme/tokens';
import type { CinqRoisHistoryEntry, HistoryEntry, Player, TrouDuCulHistoryEntry } from '../types/models';
import { uid } from '../utils/id';

export function seedPlayers(): Player[] {
  const names = ['Alice', 'Baptiste', 'Chloé', 'David', 'Emma'];
  return names.map((name, i) => ({ id: uid(), name, color: playerColors[i % playerColors.length] }));
}

export function seedHistory(players: Player[]): HistoryEntry[] {
  const p = players;
  const out: HistoryEntry[] = [];

  const crPlayers = [p[0].id, p[1].id, p[2].id, p[3].id];
  const crRounds: CinqRoisHistoryEntry['rounds'] = [];
  const crTotals: Record<string, number> = {};
  crPlayers.forEach((id) => (crTotals[id] = 0));
  for (let n = 1; n <= 11; n++) {
    const scores: Record<string, number> = {};
    crPlayers.forEach((id) => {
      const v = Math.floor(Math.random() * 35);
      scores[id] = v;
      crTotals[id] += v;
    });
    crRounds.push({ round: n, label: CR_LABELS[n - 1], scores });
  }
  const crRanking = [...crPlayers].sort((a, b) => crTotals[a] - crTotals[b]);
  out.push({
    id: uid(),
    gameId: 'cinq-rois',
    date: '2026-07-01T19:00:00',
    playerIds: crPlayers,
    rounds: crRounds,
    totals: crTotals,
    ranking: crRanking,
    roundsPlayed: 11,
  });

  const tdcPlayers = [p[0].id, p[2].id, p[4].id, p[3].id];
  const tdcRounds: TrouDuCulHistoryEntry['rounds'] = [];
  const cum: Record<string, number> = {};
  tdcPlayers.forEach((id) => (cum[id] = 0));
  for (let n = 1; n <= 5; n++) {
    const order = [...tdcPlayers].sort(() => Math.random() - 0.5);
    const roles = order.map((_, idx) => roleForPosition(idx, order.length));
    order.forEach((id, idx) => {
      cum[id] += order.length - idx;
    });
    tdcRounds.push({ round: n, order, roles });
  }
  const tdcRanking = [...tdcPlayers].sort((a, b) => cum[b] - cum[a]);
  out.push({
    id: uid(),
    gameId: 'trou-du-cul',
    date: '2026-07-05T20:30:00',
    playerIds: tdcPlayers,
    rounds: tdcRounds,
    cumulative: cum,
    ranking: tdcRanking,
    variants: { revolution: true, bombes: false, putsch: false, suites: true },
  });

  const crPlayers2 = [p[1].id, p[3].id, p[4].id];
  const crRounds2: CinqRoisHistoryEntry['rounds'] = [];
  const crTotals2: Record<string, number> = {};
  crPlayers2.forEach((id) => (crTotals2[id] = 0));
  for (let n = 1; n <= 11; n++) {
    const scores: Record<string, number> = {};
    crPlayers2.forEach((id) => {
      const v = Math.floor(Math.random() * 30);
      scores[id] = v;
      crTotals2[id] += v;
    });
    crRounds2.push({ round: n, label: CR_LABELS[n - 1], scores });
  }
  const crRanking2 = [...crPlayers2].sort((a, b) => crTotals2[a] - crTotals2[b]);
  out.push({
    id: uid(),
    gameId: 'cinq-rois',
    date: '2026-06-20T18:00:00',
    playerIds: crPlayers2,
    rounds: crRounds2,
    totals: crTotals2,
    ranking: crRanking2,
    roundsPlayed: 11,
  });

  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
