import type { MilleSaborsHistoryEntry, MilleSaborsLiveGame } from '../types/models';
import type { GameDef } from './types';

export const MILLE_SABORDS_DEFAULT_THRESHOLD = 6000;

interface DerivedMilleSaborsState {
  totals: Record<string, number>;
  winnerId: string | null;
  /** Full best-to-worst order, only set once winnerId is known. */
  ranking: string[] | null;
  /** True while the game is in the one-time "everyone still owed a turn" stretch after someone first crosses the threshold. */
  isFinalStretch: boolean;
  /** Players who still owe their turn before the final stretch can resolve. */
  pendingPlayerIds: string[];
}

/**
 * Turn order is free-form (any player can be logged at any time, matching
 * how the physical dice actually move around the table) rather than a rigid
 * rotation index, so the "everyone else gets one last turn" rule is tracked
 * with a pending-players set instead of counting turns modulo player count —
 * this stays correct even if turns are logged out of strict left-to-right
 * order or a mistake is undone via delete.
 */
export function deriveMilleSaborsState(live: MilleSaborsLiveGame): DerivedMilleSaborsState {
  const { playerIds, threshold, turns } = live;
  const totals: Record<string, number> = {};
  playerIds.forEach((id) => (totals[id] = 0));

  let winnerId: string | null = null;
  let graceConsumed = false;
  let triggerPlayerId: string | null = null;
  let pending = new Set<string>();

  for (const t of turns) {
    if (winnerId) break;

    totals[t.playerId] += t.points;
    if (t.penaltyToOthers) {
      playerIds.forEach((id) => {
        if (id !== t.playerId) totals[id] -= t.penaltyToOthers;
      });
    }

    if (t.instantWin) {
      winnerId = t.playerId;
      break;
    }

    if (pending.size > 0) {
      pending.delete(t.playerId);
      if (pending.size === 0) {
        if (totals[triggerPlayerId!] >= threshold) {
          winnerId = playerIds.reduce((best, id) => (totals[id] > totals[best] ? id : best));
          break;
        }
        graceConsumed = true;
        triggerPlayerId = null;
      }
    }

    if (!winnerId && pending.size === 0 && !triggerPlayerId) {
      if (totals[t.playerId] >= threshold) {
        if (graceConsumed) {
          winnerId = t.playerId;
          break;
        }
        triggerPlayerId = t.playerId;
        pending = new Set(playerIds.filter((id) => id !== t.playerId));
      }
    }
  }

  const ranking = winnerId ? [winnerId, ...playerIds.filter((id) => id !== winnerId).sort((a, b) => totals[b] - totals[a])] : null;

  return { totals, winnerId, ranking, isFinalStretch: !winnerId && pending.size > 0, pendingPlayerIds: [...pending] };
}

export const milleSaborsGame: GameDef<MilleSaborsLiveGame, MilleSaborsHistoryEntry> = {
  id: 'mille-sabords',
  name: 'Mille Sabords',
  badge: '🏴‍☠️',
  color: '#FFC300',
  tagline: 'Dés pirates · combinez vos dés, évitez les têtes de mort',
  totalRounds: Infinity,
  hasVariants: false,
  variantDefs: [],
  minPlayers: 2,
  maxPlayers: 5,
  rulesContent: [
    {
      id: 'but',
      title: 'But du jeu',
      items: [
        { q: 'Comment gagne-t-on des points ?', a: "À son tour, on lance les 8 dés puis on choisit de relancer certains d'entre eux pour former la meilleure combinaison possible, avant d'arrêter volontairement son tour." },
        { q: 'Qui gagne la partie ?', a: "Le premier pirate à atteindre 6000 points (5000 ou 8000 selon l'objectif choisi) déclenche la fin de partie ; le joueur ayant le plus de points au final l'emporte." },
      ],
    },
    {
      id: 'relance',
      title: 'Relancer les dés',
      items: [
        { q: 'Quelles sont les règles pour relancer ?', a: "On garde au moins un dé de côté, on relance au moins deux dés à la fois, et les dés affichant une tête de mort ne peuvent plus être relancés — ils sont maudits jusqu'à la fin du tour." },
        { q: "Que se passe-t-il à la 3ᵉ tête de mort ?", a: "Le tour s'arrête immédiatement et le joueur ne marque aucun point pour ce tour, même s'il avait de bonnes combinaisons de côté." },
      ],
    },
    {
      id: 'points',
      title: 'Valeur des combinaisons',
      items: [
        { q: 'Combien rapportent les dés identiques ?', a: '3 dés = 100 pts · 4 dés = 200 pts · 5 dés = 500 pts · 6 dés = 1000 pts · 7 dés = 2000 pts · 8 dés = 4000 pts.' },
        { q: 'Et les diamants et pièces d\'or ?', a: "Ils rapportent 100 points chacun, en plus de leur valeur dans une combinaison éventuelle." },
        { q: 'Le bonus « coffre au trésor plein » ?', a: "Marquer des points avec ses 8 dés à la fois rapporte un bonus supplémentaire de 500 points." },
      ],
    },
    {
      id: 'ile',
      title: 'Île de la Tête-de-Mort',
      items: [
        { q: 'Quand y est-on envoyé ?', a: "Si le tout premier lancer du tour révèle 4 têtes de mort ou plus. Le joueur relance alors uniquement les dés restants, en mettant de côté chaque nouvelle tête de mort obtenue." },
        { q: 'Que rapporte ce tour ?', a: "Rien pour le joueur lui-même, mais chacun de ses adversaires perd 100 points par tête de mort révélée durant le tour (200 avec la carte Pirate) — au moins 400 points à eux tous dès le premier lancer." },
      ],
    },
    {
      id: 'fin',
      title: 'Fin de partie',
      items: [
        { q: 'Que se passe-t-il au premier joueur à 6000 points ?', a: "Tous les autres joueurs jouent un dernier tour, puis le pirate ayant le plus de points remporte la partie." },
        { q: 'Et si ce joueur repasse sous 6000 entre-temps ?', a: "La partie continue normalement jusqu'à ce que quelqu'un atteigne à nouveau le seuil — cette fois la victoire est immédiate, sans nouveau dernier tour pour les autres." },
        { q: 'La « Magie pirate » ?', a: "Réaliser une combinaison de 9 symboles identiques (dé + carte Pièce d'or ou Diamant, par exemple) fait gagner la partie sur-le-champ." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    const v = variants ?? {};
    const threshold = v['5000'] ? 5000 : v['8000'] ? 8000 : MILLE_SABORDS_DEFAULT_THRESHOLD;
    return { gameId: 'mille-sabords', playerIds, threshold, turns: [] };
  },

  // Mille Sabords is turn-based, not round-based — these two only exist to
  // satisfy the shared GameDef contract, MilleSaborsLiveScreen doesn't call them.
  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveMilleSaborsState(live).winnerId;
  },

  liveRanking(live) {
    const { totals, ranking } = deriveMilleSaborsState(live);
    const ids = ranking ?? [...live.playerIds].sort((a, b) => totals[b] - totals[a]);
    return ids.map((id) => ({ id, total: totals[id] }));
  },
  liveScoreLabel(total, isWinner) {
    return isWinner ? 'Vainqueur !' : `${total} pts`;
  },

  buildHistoryEntry(live, id, date) {
    const { totals, winnerId, ranking } = deriveMilleSaborsState(live);
    if (!winnerId || !ranking) throw new Error('mille-sabords: buildHistoryEntry called before a winner was decided');
    return {
      id,
      gameId: 'mille-sabords',
      date,
      playerIds: live.playerIds,
      threshold: live.threshold,
      turns: live.turns,
      totals,
      ranking,
      winnerId,
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
  activeVariantsLabel(entry) {
    return entry.threshold !== MILLE_SABORDS_DEFAULT_THRESHOLD ? `Objectif ${entry.threshold} pts` : null;
  },
  resultLabel(entry, winnerName) {
    return `${winnerName} (${entry.totals[entry.winnerId] ?? 0} pts)`;
  },
};
