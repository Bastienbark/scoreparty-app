import type { CinqRoisHistoryEntry, CinqRoisLiveGame, Player } from '../types/models';
import type { GameDef } from './types';

export const CR_LABELS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];
export const CR_TOTAL_ROUNDS = 11;

export function atoutForRound(roundNum: number): string {
  return CR_LABELS[roundNum - 1];
}

export function dealerForRound(roundNum: number, playerIds: string[]): string {
  return playerIds[(roundNum - 1) % playerIds.length];
}

function computeTotals(playerIds: string[], rounds: CinqRoisLiveGame['rounds']): Record<string, number> {
  const totals: Record<string, number> = {};
  playerIds.forEach((id) => (totals[id] = 0));
  rounds.forEach((r) => {
    playerIds.forEach((id) => {
      if (r.scores[id] !== undefined) totals[id] += r.scores[id];
    });
  });
  return totals;
}

export const cinqRoisGame: GameDef<CinqRoisLiveGame, CinqRoisHistoryEntry> = {
  id: 'cinq-rois',
  name: 'Les Cinq Rois',
  badge: '5R',
  color: '#FF3864',
  tagline: '11 manches · le moins de points gagne',
  totalRounds: CR_TOTAL_ROUNDS,
  hasVariants: false,
  variantDefs: [],
  rulesContent: [
    {
      id: 'valeurs',
      title: 'Valeurs des cartes',
      items: [
        { q: 'Combien vaut une carte de 3 à 10 ?', a: 'Elle vaut sa valeur faciale en points de pénalité si elle reste en main (ex. un 7 vaut 7 points).' },
        { q: 'Combien valent Valet, Dame, Roi ?', a: 'Chacune de ces figures vaut 10 points de pénalité.' },
        { q: 'Combien vaut un joker ?', a: 'Le Joker vaut 50 points de pénalité — la carte la plus coûteuse du jeu.' },
        { q: "Combien vaut la carte Atout de la manche ?", a: "La carte correspondant à l'Atout de la manche en cours vaut 20 points si elle reste en main, quelle que soit sa valeur faciale normale." },
      ],
    },
    {
      id: 'atout',
      title: "L'Atout",
      items: [
        { q: "Comment est déterminé l'Atout de chaque manche ?", a: "L'Atout suit le numéro de la manche : manche 1 → Atout 3, manche 2 → Atout 4… jusqu'à manche 8 → Atout 10, puis manche 9 → Valet, manche 10 → Dame, manche 11 → Roi." },
      ],
    },
    {
      id: 'manches',
      title: 'Déroulement des manches',
      items: [
        { q: 'Combien de manches compte une partie ?', a: 'Une partie des Cinq Rois se joue en 11 manches fixes.' },
        { q: 'Qui distribue les cartes ?', a: 'La donne tourne à chaque manche : chaque joueur distribue une fois à tour de rôle.' },
        { q: 'Qui gagne la partie ?', a: 'Le joueur ayant le total de points de pénalité le plus bas après les 11 manches remporte la partie.' },
      ],
    },
    {
      id: 'as',
      title: 'Cartes utilisées',
      items: [
        { q: 'Y a-t-il des As dans ce jeu ?', a: "Non, il n'y a pas d'As aux Cinq Rois. Le jeu utilise les cartes de 3 à Roi, plus les Jokers." },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return {
      gameId: 'cinq-rois',
      playerIds,
      currentRound: 1,
      rounds: Array.from({ length: CR_TOTAL_ROUNDS }, (_, i) => ({ round: i + 1, scores: {} })),
    };
  },

  isRoundComplete(live, roundNum) {
    const round = live.rounds[roundNum - 1];
    return live.playerIds.every((pid) => round.scores[pid] !== undefined);
  },

  isLastRound(live) {
    return live.currentRound === CR_TOTAL_ROUNDS;
  },

  liveRanking(live, players) {
    const totals = computeTotals(live.playerIds, live.rounds);
    return [...live.playerIds]
      .sort((a, b) => totals[a] - totals[b])
      .map((id) => ({ id, total: totals[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const totals = computeTotals(live.playerIds, live.rounds);
    let roundsPlayed = 0;
    live.rounds.forEach((r) => {
      const any = live.playerIds.some((pid) => r.scores[pid] !== undefined);
      if (any) roundsPlayed++;
    });
    const ranking = [...live.playerIds].sort((a, b) => totals[a] - totals[b]);
    return {
      id,
      gameId: 'cinq-rois',
      date,
      playerIds: live.playerIds,
      rounds: live.rounds.map((r) => ({ round: r.round, label: CR_LABELS[r.round - 1], scores: r.scores })),
      totals,
      ranking,
      roundsPlayed,
    };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  scoreValue(entry, playerId) {
    return entry.totals[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return `${entry.totals[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => `${idx + 1}. ${players[id]?.name ?? '?'} — ${entry.totals[id]} pts`);
  },
  activeVariantsLabel() {
    return null;
  },
  resultLabel(entry, winnerName) {
    return `${winnerName} (${entry.totals[entry.ranking[0]]} pts)`;
  },
};
