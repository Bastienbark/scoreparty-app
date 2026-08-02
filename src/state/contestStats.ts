import { getGameOrThrow } from '../games/registry';
import type { HistoryEntry } from '../types/models';

/** 1er = 3 pts, 2e = 2 pts, 3e = 1 pt, 4e et au-delà = 0 pt. */
export function pointsForRank(rank: number): number {
  if (rank === 1) return 3;
  if (rank === 2) return 2;
  if (rank === 3) return 1;
  return 0;
}

export interface ContestLeaderboardRow {
  playerId: string;
  points: number;
  gamesPlayed: number;
  wins: number;
}

export function contestGames(contestId: string, history: HistoryEntry[]): HistoryEntry[] {
  return history.filter((h) => h.contestId === contestId);
}

export function buildContestLeaderboard(contestId: string, history: HistoryEntry[]): ContestLeaderboardRow[] {
  const rows = new Map<string, ContestLeaderboardRow>();
  for (const entry of contestGames(contestId, history)) {
    const game = getGameOrThrow(entry.gameId);
    const ranking = game.rankingIds(entry as never);
    ranking.forEach((pid, idx) => {
      const row = rows.get(pid) ?? { playerId: pid, points: 0, gamesPlayed: 0, wins: 0 };
      row.points += pointsForRank(idx + 1);
      row.gamesPlayed += 1;
      if (idx === 0) row.wins += 1;
      rows.set(pid, row);
    });
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || b.gamesPlayed - a.gamesPlayed);
}
