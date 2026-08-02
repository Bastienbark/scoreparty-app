import type { DartThrow, ShanghaiHistoryEntry, ShanghaiLiveGame, ShanghaiTurn } from '../types/models';
import type { GameDef } from './types';

interface DerivedShanghaiState {
  scores: Record<string, number>;
  winnerIds: string[] | null;
  shanghaiWinnerId: string | null;
  activePlayerId: string | null;
  round: number;
}

function applyTurn(scores: Record<string, number>, round: number, pid: string, throws: DartThrow[]): boolean {
  let turnScore = 0;
  const multsHit = new Set<number>();
  throws.forEach((t) => {
    if (t.segment === round) {
      turnScore += t.points;
      multsHit.add(t.multiplier);
    }
  });
  scores[pid] += turnScore;
  return multsHit.has(1) && multsHit.has(2) && multsHit.has(3);
}

export function deriveShanghaiState(live: ShanghaiLiveGame): DerivedShanghaiState {
  const scores: Record<string, number> = {};
  live.playerIds.forEach((id) => (scores[id] = 0));
  const turnsPerRound = live.playerIds.length;
  let shanghaiWinnerId: string | null = null;

  live.turns.forEach((turn) => {
    if (shanghaiWinnerId) return;
    if (applyTurn(scores, turn.round, turn.playerId, turn.throws)) shanghaiWinnerId = turn.playerId;
  });

  const turnIdx = live.turns.length;
  const round = Math.floor(turnIdx / turnsPerRound) + 1;
  const roundsRemain = round <= live.totalRounds;
  const preActivePlayerId = !shanghaiWinnerId && roundsRemain ? live.playerIds[turnIdx % turnsPerRound] : null;
  if (preActivePlayerId) {
    if (applyTurn(scores, round, preActivePlayerId, live.currentThrows)) shanghaiWinnerId = preActivePlayerId;
  }

  const allRoundsDone = live.turns.length >= live.totalRounds * turnsPerRound;
  let winnerIds: string[] | null = shanghaiWinnerId ? [shanghaiWinnerId] : null;
  if (!winnerIds && allRoundsDone) {
    const maxScore = Math.max(...live.playerIds.map((id) => scores[id]));
    winnerIds = live.playerIds.filter((id) => scores[id] === maxScore);
  }

  return { scores, winnerIds, shanghaiWinnerId, activePlayerId: winnerIds ? null : preActivePlayerId, round: Math.min(round, live.totalRounds) };
}

function rankByScore(playerIds: string[], scores: Record<string, number>, winnerIds: string[]): { ranking: string[]; rankGroups: number[] } {
  const nonWinners = playerIds.filter((id) => !winnerIds.includes(id)).sort((a, b) => scores[b] - scores[a]);
  const ranking = [...winnerIds, ...nonWinners];
  const rankGroups: number[] = [];
  let rank = 1;
  let prevScore: number | null = null;
  ranking.forEach((id, idx) => {
    if (idx === 0) {
      rankGroups.push(1);
      prevScore = scores[id];
      return;
    }
    if (idx < winnerIds.length) {
      rankGroups.push(1); // tied co-winners
      return;
    }
    if (scores[id] !== prevScore) rank = idx + 1;
    rankGroups.push(rank);
    prevScore = scores[id];
  });
  return { ranking, rankGroups };
}

export const dartsShanghaiGame: GameDef<ShanghaiLiveGame, ShanghaiHistoryEntry> = {
  id: 'darts-shanghai',
  name: 'Shanghai',
  badge: '🎯',
  color: '#00E0B8',
  tagline: "Fléchettes · vise le numéro du round, tente le Shanghai",
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
        { q: 'Comment se joue une manche ?', a: "Au round N, seule la cible N compte : simple, double et triple rapportent leur valeur, les fléchettes ailleurs ne comptent pas." },
        { q: 'Qui gagne ?', a: "À la fin de tous les rounds, le score total le plus élevé gagne (égalité possible, partagée)." },
      ],
    },
    {
      id: 'shanghai',
      title: 'Le Shanghai',
      items: [
        { q: "Qu'est-ce qu'un Shanghai ?", a: "Toucher le simple, le double ET le triple du numéro du round, dans la même volée de 3 fléchettes — victoire immédiate, quel que soit le score des autres." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    const v = variants ?? {};
    const totalRounds = v['20'] ? 20 : 7;
    return { gameId: 'darts-shanghai', playerIds, totalRounds, turns: [], currentThrows: [] };
  },

  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveShanghaiState(live).winnerIds;
  },

  liveRanking(live) {
    const { scores, winnerIds } = deriveShanghaiState(live);
    const winners = winnerIds ?? [];
    return [...live.playerIds]
      .sort((a, b) => {
        const aw = winners.includes(a);
        const bw = winners.includes(b);
        if (aw && !bw) return -1;
        if (bw && !aw) return 1;
        return scores[b] - scores[a];
      })
      .map((id) => ({ id, total: scores[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const { scores, winnerIds, shanghaiWinnerId } = deriveShanghaiState(live);
    if (!winnerIds) throw new Error('darts-shanghai: buildHistoryEntry called before a winner was decided');
    const { ranking, rankGroups } = rankByScore(live.playerIds, scores, winnerIds);
    return {
      id,
      gameId: 'darts-shanghai',
      date,
      playerIds: live.playerIds,
      totalRounds: live.totalRounds,
      turns: live.turns,
      finalScores: scores,
      shanghaiWinnerId,
      ranking,
      rankGroups,
      winnerId: ranking[0],
    };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  rankGroups(entry) {
    return entry.rankGroups;
  },
  scoreValue(entry, playerId) {
    return entry.finalScores[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return `${entry.finalScores[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => `${entry.rankGroups[idx]}. ${players[id]?.name ?? '?'} — ${entry.finalScores[id]} pts`);
  },
  activeVariantsLabel(entry) {
    return `${entry.totalRounds} rounds${entry.shanghaiWinnerId ? ' · Shanghai !' : ''}`;
  },
  resultLabel(entry, winnerName) {
    if (entry.shanghaiWinnerId) return `${winnerName} (Shanghai !)`;
    return `${winnerName} (${entry.finalScores[entry.winnerId]} pts)`;
  },
};
