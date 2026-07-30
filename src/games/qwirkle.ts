import type { QwirkleHistoryEntry, QwirkleLiveGame } from '../types/models';
import type { GameDef } from './types';

function computeTotals(playerIds: string[], turns: QwirkleLiveGame['turns']): Record<string, number> {
  const totals: Record<string, number> = {};
  playerIds.forEach((id) => (totals[id] = 0));
  turns.forEach((t) => {
    totals[t.playerId] = (totals[t.playerId] ?? 0) + t.points;
  });
  return totals;
}

export const qwirkleGame: GameDef<QwirkleLiveGame, QwirkleHistoryEntry> = {
  id: 'qwirkle',
  name: 'Qwirkle',
  badge: 'QWK',
  color: '#FF7A1A',
  tagline: '2 à 4 joueurs · tours libres · le score le plus haut gagne',
  totalRounds: Infinity,
  hasVariants: false,
  variantDefs: [],
  minPlayers: 2,
  maxPlayers: 4,
  rulesContent: [
    {
      id: 'materiel',
      title: 'Le matériel',
      items: [
        { q: 'Combien de tuiles compose le jeu ?', a: '108 tuiles : 6 formes × 6 couleurs, à raison de 3 exemplaires de chaque combinaison forme/couleur.' },
        { q: 'Combien de tuiles a-t-on en main ?', a: 'Chaque joueur pioche et garde 6 tuiles en main tout au long de la partie, en repiochant après chaque tour.' },
      ],
    },
    {
      id: 'tour',
      title: 'Jouer un tour',
      items: [
        { q: 'Comment poser des tuiles ?', a: "On aligne une ou plusieurs tuiles avec celles déjà posées : toutes les tuiles d'une même ligne doivent partager soit la même couleur, soit la même forme (jamais les deux à la fois), et aucune valeur ne peut se répéter deux fois dans une ligne." },
        { q: 'Comment est calculé le score d\'un tour ?', a: "On marque 1 point par tuile présente dans chaque ligne complétée ou prolongée ce tour-ci (une pose qui touche deux lignes à la fois rapporte pour les deux)." },
      ],
    },
    {
      id: 'qwirkle',
      title: 'Le bonus Qwirkle',
      items: [
        { q: 'Qu\'est-ce qu\'un Qwirkle ?', a: 'Compléter une ligne de 6 tuiles (les 6 couleurs d\'une forme, ou les 6 formes d\'une couleur) : cette ligne rapporte un bonus de 6 points, en plus des points déjà comptés pour les tuiles posées.' },
      ],
    },
    {
      id: 'fin',
      title: 'Fin de partie et classement',
      items: [
        { q: 'Quand la partie se termine-t-elle ?', a: "Dès que la pioche est épuisée et qu'un joueur pose sa toute dernière tuile en main." },
        { q: 'Y a-t-il un bonus de fin de partie ?', a: "Oui : le joueur qui pose sa dernière tuile alors que la pioche est vide marque un bonus de 6 points supplémentaires." },
        { q: 'Qui gagne ?', a: 'Le joueur ayant le score total le plus élevé sur l\'ensemble de la partie.' },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return { gameId: 'qwirkle', playerIds, turns: [] };
  },

  // Qwirkle is turn-based, not round-based: there is no "round" to fill in
  // before advancing, so these two are trivial — kept only to satisfy the
  // shared GameDef contract (neither is called by QwirkleLiveScreen).
  isRoundComplete() {
    return true;
  },
  isLastRound() {
    return false;
  },

  liveRanking(live) {
    const totals = computeTotals(live.playerIds, live.turns);
    return [...live.playerIds]
      .sort((a, b) => totals[b] - totals[a])
      .map((id) => ({ id, total: totals[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const totals = computeTotals(live.playerIds, live.turns);
    const ranking = [...live.playerIds].sort((a, b) => totals[b] - totals[a]);
    return {
      id,
      gameId: 'qwirkle',
      date,
      playerIds: live.playerIds,
      turns: live.turns,
      totals,
      ranking,
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
