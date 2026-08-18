import type { AzulHistoryEntry, AzulLiveGame } from '../types/models';
import type { GameDef } from './types';

function computeTotals(playerIds: string[], rounds: AzulLiveGame['rounds']): Record<string, number> {
  const totals: Record<string, number> = {};
  playerIds.forEach((id) => (totals[id] = 0));
  rounds.forEach((r) => {
    playerIds.forEach((id) => {
      if (r.scores[id] !== undefined) totals[id] += r.scores[id];
    });
  });
  return totals;
}

export const azulGame: GameDef<AzulLiveGame, AzulHistoryEntry> = {
  id: 'azul',
  name: 'Azul',
  badge: '🧩',
  color: '#00D9FF',
  tagline: 'Mosaïque de tuiles · 2 à 4 joueurs · le plus haut score gagne',
  totalRounds: Infinity,
  hasVariants: false,
  variantDefs: [],
  minPlayers: 2,
  maxPlayers: 4,
  rulesContent: [
    {
      id: 'but',
      title: 'But du jeu',
      items: [
        { q: 'Comment se déroule un tour ?', a: "À tour de rôle, chaque joueur prend toutes les tuiles d'une même couleur sur une fabrique (les autres couleurs rejoignent le centre) ou sur le centre de la table, puis les place sur une seule de ses lignes de motif." },
        { q: 'Comment remplir une ligne de motif ?', a: "Une ligne ne peut contenir qu'une seule couleur à la fois et sa capacité correspond à son numéro (la ligne 1 ne prend qu'une tuile, la ligne 5 en prend cinq). Les tuiles en trop tombent sur la ligne de pénalité." },
        { q: 'Quand la manche se termine-t-elle ?', a: "Dès que toutes les fabriques et le centre sont vides." },
      ],
    },
    {
      id: 'mur',
      title: 'La phase de mur',
      items: [
        { q: 'Que se passe-t-il pour une ligne complète ?', a: "Une tuile rejoint le mur (grille 5×5 à motif fixe) sur la case correspondante ; les tuiles restantes de la ligne sont défaussées. Une ligne incomplète reste en l'état pour la manche suivante." },
        { q: 'Comment sont comptés les points ?', a: "Chaque tuile posée rapporte 1 point, plus 1 point par tuile déjà connectée horizontalement et 1 point par tuile connectée verticalement (les deux se cumulent si la tuile touche des voisins dans les deux directions)." },
        { q: 'Et la ligne de pénalité ?', a: "Chaque tuile qui y tombe retire des points croissants (−1, −1, −2, −2, −2, −3, −3) ; le score total d'un joueur ne descend jamais sous zéro." },
      ],
    },
    {
      id: 'fin',
      title: 'Fin de partie',
      items: [
        { q: 'Quand la partie se termine-t-elle ?', a: "Dès qu'un joueur complète une ligne horizontale entière (5 tuiles) sur son mur lors de la phase de mur, cette manche est la dernière." },
        { q: 'Quels sont les bonus de fin de partie ?', a: "+2 points par ligne horizontale complète, +7 points par colonne verticale complète, et +10 points par couleur entièrement placée sur le mur (les 5 tuiles de cette couleur)." },
        { q: 'Qui gagne ?', a: "Le joueur ayant le score total le plus élevé, bonus inclus." },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return { gameId: 'azul', playerIds, currentRound: 1, rounds: [{ round: 1, scores: {}, rowCompleted: false }] };
  },

  isRoundComplete(live, roundNum) {
    const round = live.rounds[roundNum - 1];
    if (!round) return false;
    return live.playerIds.every((pid) => round.scores[pid] !== undefined);
  },

  isLastRound(live) {
    return !!live.rounds[live.rounds.length - 1]?.rowCompleted;
  },

  liveRanking(live) {
    const totals = computeTotals(live.playerIds, live.rounds);
    return [...live.playerIds]
      .sort((a, b) => totals[b] - totals[a])
      .map((id) => ({ id, total: totals[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const totals = computeTotals(live.playerIds, live.rounds);
    let roundsPlayed = 0;
    live.rounds.forEach((r) => {
      const any = live.playerIds.some((pid) => r.scores[pid] !== undefined);
      if (any) roundsPlayed++;
    });
    const ranking = [...live.playerIds].sort((a, b) => totals[b] - totals[a]);
    return {
      id,
      gameId: 'azul',
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
