import type { Trek12HistoryEntry, Trek12LiveGame } from '../types/models';
import type { GameDef } from './types';

/** Le dé jaune va de 0 à 5. */
export function rollYellowDie(): number {
  return Math.floor(Math.random() * 6);
}

/** Le dé rouge va de 1 à 6. */
export function rollRedDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export const trek12Game: GameDef<Trek12LiveGame, Trek12HistoryEntry> = {
  id: 'trek-12',
  name: 'Trek 12',
  badge: 'TK12',
  color: '#00D9FF',
  tagline: 'Dés jaune (0-5) et rouge (1-6) · le score le plus élevé gagne',
  totalRounds: 1,
  hasVariants: false,
  variantDefs: [],
  rulesContent: [
    {
      id: 'des',
      title: 'Les dés',
      items: [
        {
          q: 'Quelles valeurs prennent les dés ?',
          a: "Le dé jaune va de 0 à 5, le dé rouge va de 1 à 6. Si tu n'as plus les dés physiques, utilise les dés virtuels sur l'écran de partie : touche un dé pour le relancer.",
        },
      ],
    },
    {
      id: 'score',
      title: 'Suivi du score',
      items: [
        {
          q: 'Comment le score est-il suivi dans l\'app ?',
          a: "ScoreParty ne connaît pas le détail des règles de tracé/zones de Trek 12 — l'app te sert à lancer les dés et à enregistrer le score final de chaque joueur, calculé par vous-mêmes selon les règles officielles. Le score le plus élevé gagne.",
        },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return { gameId: 'trek-12', playerIds, scores: {} };
  },

  isRoundComplete(live) {
    return live.playerIds.every((pid) => live.scores[pid] !== undefined);
  },
  isLastRound() {
    return true;
  },

  liveRanking(live) {
    return [...live.playerIds]
      .sort((a, b) => (live.scores[b] ?? 0) - (live.scores[a] ?? 0))
      .map((id) => ({ id, total: live.scores[id] ?? 0 }));
  },

  buildHistoryEntry(live, id, date) {
    const totals: Record<string, number> = {};
    live.playerIds.forEach((pid) => (totals[pid] = live.scores[pid] ?? 0));
    const ranking = [...live.playerIds].sort((a, b) => totals[b] - totals[a]);
    return { id, gameId: 'trek-12', date, playerIds: live.playerIds, totals, ranking };
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
