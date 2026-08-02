import type { CricketHistoryEntry, CricketLiveGame, CricketMarks, CricketTarget, CricketTurn, DartThrow } from '../types/models';
import type { GameDef } from './types';

export const CRICKET_TARGETS: CricketTarget[] = [20, 19, 18, 17, 16, 15, 'bull'];

function faceValue(t: CricketTarget): number {
  return t === 'bull' ? 25 : t;
}

function emptyMarks(): CricketMarks {
  return { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, bull: 0 };
}

function isCricketTarget(segment: number | 'bull'): segment is CricketTarget {
  return segment === 'bull' || (segment >= 15 && segment <= 20);
}

function closedCount(marks: CricketMarks): number {
  return CRICKET_TARGETS.filter((t) => marks[t] >= 3).length;
}

function allClosed(marks: CricketMarks): boolean {
  return closedCount(marks) === CRICKET_TARGETS.length;
}

interface DerivedCricketState {
  marks: Record<string, CricketMarks>;
  scores: Record<string, number>;
  winnerId: string | null;
  activePlayerId: string | null;
}

function findWinner(playerIds: string[], marks: Record<string, CricketMarks>, scores: Record<string, number>, cutThroat: boolean): string | null {
  for (const pid of playerIds) {
    if (!allClosed(marks[pid])) continue;
    const others = playerIds.filter((id) => id !== pid);
    const isBest = cutThroat ? others.every((oid) => scores[pid] <= scores[oid]) : others.every((oid) => scores[pid] >= scores[oid]);
    if (isBest) return pid;
  }
  return null;
}

/**
 * Applies one dart to the running marks/scores in place. A dart's multiplier
 * adds that many marks (capped at 3 = closed); marks beyond what's needed to
 * close score points (at the target's face value each) for the thrower
 * (classic) or are added to every opponent who hasn't closed the target yet
 * (cut-throat) — but only while at least one player still has it open.
 */
function applyThrow(marks: Record<string, CricketMarks>, scores: Record<string, number>, playerIds: string[], cutThroat: boolean, playerId: string, t: DartThrow): void {
  if (!isCricketTarget(t.segment)) return; // off-target dart: consumes the throw, no effect
  const target = t.segment;
  const myMarks = marks[playerId];
  const current = myMarks[target];
  const neededToClose = Math.max(0, 3 - current);
  const excess = Math.max(0, t.multiplier - neededToClose);
  myMarks[target] = Math.min(3, current + t.multiplier);
  if (excess <= 0) return;

  const opponentsOpen = playerIds.filter((id) => id !== playerId && marks[id][target] < 3);
  if (opponentsOpen.length === 0) return;

  const value = faceValue(target) * excess;
  if (cutThroat) {
    opponentsOpen.forEach((oid) => (scores[oid] += value));
  } else {
    scores[playerId] += value;
  }
}

export function deriveCricketState(live: CricketLiveGame): DerivedCricketState {
  const marks: Record<string, CricketMarks> = {};
  const scores: Record<string, number> = {};
  live.playerIds.forEach((id) => {
    marks[id] = emptyMarks();
    scores[id] = 0;
  });

  live.turns.forEach((turn) => {
    turn.throws.forEach((t) => applyThrow(marks, scores, live.playerIds, live.cutThroat, turn.playerId, t));
  });

  // Cricket has no "bust" that voids a turn — every dart's marks are permanent
  // the instant it's thrown, so the turn in progress must be reflected live
  // (unlike x01, where a provisional turn can still be discarded).
  const preActivePlayerId = live.playerIds[live.turns.length % live.playerIds.length];
  if (preActivePlayerId) {
    live.currentThrows.forEach((t) => applyThrow(marks, scores, live.playerIds, live.cutThroat, preActivePlayerId, t));
  }

  const winnerId = findWinner(live.playerIds, marks, scores, live.cutThroat);
  const activePlayerId = winnerId ? null : preActivePlayerId;
  return { marks, scores, winnerId, activePlayerId };
}

/** Simulates applying one more dart for the active player, without mutating live state — used by the store to decide whether the turn/game ends right here. */
export function previewCricketThrow(live: CricketLiveGame, playerId: string, t: DartThrow): { marks: Record<string, CricketMarks>; scores: Record<string, number>; winnerId: string | null } {
  const base = deriveCricketState(live); // already reflects currentThrows
  const marks: Record<string, CricketMarks> = {};
  const scores: Record<string, number> = {};
  live.playerIds.forEach((id) => {
    marks[id] = { ...base.marks[id] };
    scores[id] = base.scores[id];
  });
  applyThrow(marks, scores, live.playerIds, live.cutThroat, playerId, t);
  const winnerId = findWinner(live.playerIds, marks, scores, live.cutThroat);
  return { marks, scores, winnerId };
}

function rankPlayers(playerIds: string[], marks: Record<string, CricketMarks>, scores: Record<string, number>, cutThroat: boolean, winnerId: string | null): string[] {
  return [...playerIds].sort((a, b) => {
    if (a === winnerId) return -1;
    if (b === winnerId) return 1;
    const scoreDiff = cutThroat ? scores[a] - scores[b] : scores[b] - scores[a];
    if (scoreDiff !== 0) return scoreDiff;
    return closedCount(marks[b]) - closedCount(marks[a]);
  });
}

export const dartsCricketGame: GameDef<CricketLiveGame, CricketHistoryEntry> = {
  id: 'darts-cricket',
  name: 'Cricket',
  badge: '🎯',
  color: '#7B61FF',
  tagline: 'Fléchettes · ferme le 15 à 20 et le centre avant les autres',
  totalRounds: Infinity,
  hasVariants: false,
  variantDefs: [],
  minPlayers: 1,
  maxPlayers: 8,
  rulesContent: [
    {
      id: 'but',
      title: 'But du jeu',
      items: [
        { q: 'Quelles sont les cibles ?', a: 'Les numéros 15, 16, 17, 18, 19, 20 et le centre (bull).' },
        { q: 'Comment ferme-t-on une cible ?', a: "Chaque fléchette dessus ajoute une marque (simple = 1, double = 2, triple = 3) ; une cible est fermée à 3 marques." },
        { q: 'Comment gagne-t-on ?', a: "Le premier joueur à avoir fermé les 7 cibles tout en ayant le meilleur score (le plus haut en classique, le plus bas en cut-throat) remporte la partie." },
      ],
    },
    {
      id: 'points',
      title: 'Marquer des points',
      items: [
        { q: 'Comment marque-t-on des points ?', a: "En touchant une cible déjà fermée pour soi, tant qu'au moins un adversaire ne l'a pas encore fermée — les marques en trop rapportent leur valeur faciale chacune (20, 19… ou 25 pour le bull)." },
        { q: "Qu'est-ce que le mode Cut-throat ?", a: "Les points marqués de cette façon sont ajoutés au score des adversaires qui n'ont pas fermé la cible (au lieu d'être ajoutés à son propre score) — le score le plus bas gagne." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    return { gameId: 'darts-cricket', playerIds, cutThroat: !!(variants ?? {}).cutThroat, turns: [], currentThrows: [] };
  },

  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveCricketState(live).winnerId;
  },

  liveRanking(live) {
    const { marks, scores, winnerId } = deriveCricketState(live);
    return rankPlayers(live.playerIds, marks, scores, live.cutThroat, winnerId).map((id) => ({ id, total: scores[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const { marks, scores, winnerId } = deriveCricketState(live);
    if (!winnerId) throw new Error('darts-cricket: buildHistoryEntry called before a winner was decided');
    const ranking = rankPlayers(live.playerIds, marks, scores, live.cutThroat, winnerId);
    return {
      id,
      gameId: 'darts-cricket',
      date,
      playerIds: live.playerIds,
      cutThroat: live.cutThroat,
      turns: live.turns,
      finalMarks: marks,
      finalScores: scores,
      ranking,
      winnerId,
    };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  scoreValue(entry, playerId) {
    return entry.finalScores[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return `${entry.finalScores[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => {
      const closed = closedCount(entry.finalMarks[id]);
      return `${idx + 1}. ${players[id]?.name ?? '?'} — ${entry.finalScores[id]} pts (${closed}/7 fermées)`;
    });
  },
  activeVariantsLabel(entry) {
    return entry.cutThroat ? 'Cut-throat' : 'Classique';
  },
  resultLabel(entry, winnerName) {
    return `${winnerName} (${entry.finalScores[entry.winnerId]} pts)`;
  },
};
