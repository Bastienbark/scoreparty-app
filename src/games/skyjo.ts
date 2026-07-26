import type { SkyjoHistoryEntry, SkyjoLiveGame } from '../types/models';
import type { GameDef } from './types';

/** A round is scored once a player empties their grid; the game ends once someone's cumulative total reaches this. */
export const SKYJO_END_THRESHOLD = 100;

function computeTotals(playerIds: string[], rounds: SkyjoLiveGame['rounds']): Record<string, number> {
  const totals: Record<string, number> = {};
  playerIds.forEach((id) => (totals[id] = 0));
  rounds.forEach((r) => {
    playerIds.forEach((id) => {
      if (r.scores[id] !== undefined) totals[id] += r.scores[id];
    });
  });
  return totals;
}

export const skyjoGame: GameDef<SkyjoLiveGame, SkyjoHistoryEntry> = {
  id: 'skyjo',
  name: 'Skyjo',
  badge: 'SKY',
  color: '#7B61FF',
  tagline: 'Manches illimitées · le premier à 100 pts termine · le moins de points gagne',
  totalRounds: Infinity,
  hasVariants: false,
  variantDefs: [],
  rulesContent: [
    {
      id: 'cartes',
      title: 'Les cartes',
      items: [
        { q: 'Quelles cartes compose le jeu ?', a: 'Des cartes numérotées de -2 à 12 : cinq -2, dix -1, quinze 0, et dix exemplaires de chaque valeur de 1 à 12 (150 cartes au total).' },
        { q: 'Comment est disposée la main de chaque joueur ?', a: "Chaque joueur dispose de 12 cartes face cachée en grille (3 lignes × 4 colonnes), dont 2 sont révélées au début de la manche." },
      ],
    },
    {
      id: 'manche',
      title: "Déroulement d'une manche",
      items: [
        { q: 'Que fait-on à son tour ?', a: 'Piocher la carte du dessus de la pioche ou prendre celle de la défausse, puis soit l\'échanger contre une carte de sa grille (qui est défaussée), soit la défausser directement et révéler une carte cachée de sa grille.' },
        { q: 'Que se passe-t-il si une colonne a 3 cartes identiques ?', a: "Dès qu'une colonne de la grille affiche 3 cartes de même valeur, toutes révélées, cette colonne est retirée du jeu et défaussée — elle ne compte plus dans le score." },
        { q: 'Comment se termine une manche ?', a: "Dès qu'un joueur révèle sa dernière carte cachée, tous les autres joueurs jouent un dernier tour puis révèlent toute leur grille." },
        { q: 'Qu\'est-ce que la pénalité de doublement ?', a: "Si le joueur qui a terminé la manche en premier n'a pas le score le plus bas de la manche, son score de cette manche est doublé." },
      ],
    },
    {
      id: 'fin',
      title: 'Fin de partie et classement',
      items: [
        { q: 'Quand la partie se termine-t-elle ?', a: "Dès qu'un joueur atteint ou dépasse 100 points de total cumulé à la fin d'une manche, la partie s'arrête." },
        { q: 'Qui gagne ?', a: 'Le joueur ayant le total de points le plus bas sur l\'ensemble des manches remporte la partie — comme au golf, moins on a de points, mieux c\'est.' },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return {
      gameId: 'skyjo',
      playerIds,
      currentRound: 1,
      rounds: [{ round: 1, scores: {} }],
    };
  },

  isRoundComplete(live, roundNum) {
    const round = live.rounds[roundNum - 1];
    if (!round) return false;
    return live.playerIds.every((pid) => round.scores[pid] !== undefined);
  },

  isLastRound(live) {
    const totals = computeTotals(live.playerIds, live.rounds);
    return live.playerIds.some((pid) => totals[pid] >= SKYJO_END_THRESHOLD);
  },

  liveRanking(live) {
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
      gameId: 'skyjo',
      date,
      playerIds: live.playerIds,
      rounds: live.rounds,
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
