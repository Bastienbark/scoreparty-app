import type { TrouDuCulHistoryEntry, TrouDuCulLiveGame, TrouDuCulVariants } from '../types/models';
import type { GameDef, VariantDef } from './types';

export const TDC_TOTAL_ROUNDS = 5;

export const VARIANT_DEF: VariantDef[] = [
  { key: 'revolution', label: 'Révolution' },
  { key: 'bombes', label: 'Bombes / Carrés' },
  { key: 'putsch', label: 'Putsch' },
  { key: 'suites', label: 'Suites' },
];

export function roleForPosition(index: number, total: number): string {
  if (total <= 1) return 'Trou du Cul';
  if (index === 0) return 'Président';
  if (index === total - 1) return 'Trou du Cul';
  if (total === 3) return 'Vice-Président';
  if (total === 4) return index === 1 ? 'Vice-Président' : 'Vice-Trou du Cul';
  if (index === 1) return 'Vice-Président';
  if (index === total - 2) return 'Vice-Trou du Cul';
  return 'Neutre';
}

/** The four "named" roles shown in per-player stats (Neutre is excluded — it only exists at 5+ players and isn't a distinct achievement). */
export const ROLE_STATS_ORDER = ['Président', 'Vice-Président', 'Vice-Trou du Cul', 'Trou du Cul'];

export interface RoleBreakdown {
  counts: Record<string, number>;
  totalRounds: number;
}

/** Counts, for a given player, how many rounds (across all their Trou du Cul games) ended with each role. */
export function playerRoleCounts(entries: TrouDuCulHistoryEntry[], playerId: string): RoleBreakdown {
  const counts: Record<string, number> = {};
  let totalRounds = 0;
  entries.forEach((entry) => {
    entry.rounds.forEach((round) => {
      const idx = round.order.indexOf(playerId);
      if (idx === -1) return;
      totalRounds++;
      const role = round.roles[idx];
      counts[role] = (counts[role] ?? 0) + 1;
    });
  });
  return { counts, totalRounds };
}

export function rolePercent(breakdown: RoleBreakdown, role: string): number {
  if (!breakdown.totalRounds) return 0;
  return Math.round(((breakdown.counts[role] ?? 0) / breakdown.totalRounds) * 100);
}

export function roleStyle(role: string): { bg: string; fg: string } {
  switch (role) {
    case 'Président':
      return { bg: '#FFC300', fg: '#0A1420' };
    case 'Trou du Cul':
      return { bg: '#FF3864', fg: '#FFFFFF' };
    case 'Vice-Président':
      return { bg: '#00E0B8', fg: '#0A1420' };
    case 'Vice-Trou du Cul':
      return { bg: '#FF7A1A', fg: '#0A1420' };
    default:
      return { bg: '#7B61FF', fg: '#0A1420' };
  }
}

function computeCumulative(playerIds: string[], rounds: TrouDuCulLiveGame['rounds']): Record<string, number> {
  const cum: Record<string, number> = {};
  playerIds.forEach((id) => (cum[id] = 0));
  rounds.forEach((r) => {
    r.order.forEach((id, idx) => {
      cum[id] += r.order.length - idx;
    });
  });
  return cum;
}

function defaultVariants(): TrouDuCulVariants {
  const v: TrouDuCulVariants = {};
  VARIANT_DEF.forEach((d) => (v[d.key] = false));
  return v;
}

export function activeVariantLabels(variants: TrouDuCulVariants): string[] {
  return VARIANT_DEF.filter((v) => variants[v.key]).map((v) => v.label);
}

export const trouDuCulGame: GameDef<TrouDuCulLiveGame, TrouDuCulHistoryEntry> = {
  id: 'trou-du-cul',
  name: 'Trou du Cul',
  badge: 'TDC',
  color: '#00E0B8',
  tagline: '5 manches · rôles & classement',
  totalRounds: TDC_TOTAL_ROUNDS,
  hasVariants: true,
  variantDefs: VARIANT_DEF,
  rulesContent: [
    {
      id: 'roles',
      title: 'Rôles et classement',
      items: [
        { q: 'Quels sont les rôles possibles ?', a: "Président, Vice-Président, Neutre(s) (à partir de 5 joueurs), Vice-Trou du Cul et Trou du Cul, attribués selon l'ordre dans lequel les joueurs se débarrassent de leurs cartes." },
        { q: 'Comment est attribué un rôle ?', a: 'Le premier joueur à finir devient Président, le dernier devient Trou du Cul ; les positions intermédiaires reçoivent Vice-Président, Neutre(s) ou Vice-Trou du Cul selon le nombre de joueurs.' },
        { q: 'Combien de manches dans une partie ?', a: 'Une partie de Trou du Cul se joue en 5 manches fixes, avec un classement cumulé à la fin.' },
      ],
    },
    {
      id: 'special',
      title: 'Cartes spéciales',
      items: [
        { q: 'Que se passe-t-il si je finis par un 2 ?', a: 'Dans la plupart des variantes, le 2 est une carte forte qui peut être jouée à tout moment et "brûle" le pli — terminer sur un 2 est donc autorisé et souvent stratégique.' },
      ],
    },
    {
      id: 'variantes',
      title: 'Variantes',
      items: [
        { q: "Qu'est-ce que la Révolution ?", a: 'Jouer un carré retourne temporairement la hiérarchie des cartes (les plus faibles deviennent les plus fortes).' },
        { q: 'Que sont les Bombes / Carrés ?', a: "Jouer les 4 cartes de même valeur d'un coup permet de couper la main en cours, quelle que soit la carte jouée précédemment." },
        { q: "Qu'est-ce que le Putsch ?", a: 'Règle permettant à deux joueurs de même valeur de cartes de "renverser" le Président en cours de partie.' },
        { q: 'Que sont les Suites ?', a: 'Autorise de jouer plusieurs cartes qui se suivent (ex. 5-6-7) en une seule fois.' },
        { q: 'Les variantes changent-elles le classement ?', a: "Non — les variantes activées sont enregistrées à titre indicatif, elles n'affectent pas le calcul des rôles ni du classement." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    return {
      gameId: 'trou-du-cul',
      playerIds,
      variants: variants ?? defaultVariants(),
      currentRound: 1,
      rounds: Array.from({ length: TDC_TOTAL_ROUNDS }, () => ({ order: [] })),
    };
  },

  isRoundComplete(live, roundNum) {
    const round = live.rounds[roundNum - 1];
    return round.order.length === live.playerIds.length;
  },

  isLastRound(live) {
    return live.currentRound === TDC_TOTAL_ROUNDS;
  },

  liveRanking(live) {
    const cum = computeCumulative(live.playerIds, live.rounds);
    return [...live.playerIds]
      .sort((a, b) => cum[b] - cum[a])
      .map((id) => ({ id, total: cum[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const cumulative = computeCumulative(live.playerIds, live.rounds);
    const ranking = [...live.playerIds].sort((a, b) => cumulative[b] - cumulative[a]);
    return {
      id,
      gameId: 'trou-du-cul',
      date,
      playerIds: live.playerIds,
      rounds: live.rounds.map((r, i) => ({
        round: i + 1,
        order: r.order,
        roles: r.order.map((_, idx) => roleForPosition(idx, r.order.length)),
      })),
      cumulative,
      ranking,
      variants: live.variants,
    };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  scoreValue(entry, playerId) {
    return entry.cumulative[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return `${entry.cumulative[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => `${idx + 1}. ${players[id]?.name ?? '?'} — ${entry.cumulative[id]} pts`);
  },
  activeVariantsLabel(entry) {
    const labels = activeVariantLabels(entry.variants);
    return labels.length ? labels.join(', ') : 'aucune';
  },
  resultLabel(_entry, winnerName) {
    return winnerName;
  },
};
