import type { AtcHistoryEntry, AtcHitType, AtcLiveGame, AtcTurn, DartThrow } from '../types/models';
import type { GameDef } from './types';

const FINAL_NUMBER = 20;

function finalProgress(includeBull: boolean): number {
  return includeBull ? FINAL_NUMBER + 1 : FINAL_NUMBER;
}

/** The number (or bull) a player at this progress must hit next, or null once they've finished. */
export function targetFor(progress: number, includeBull: boolean): number | 'bull' | null {
  if (progress < FINAL_NUMBER) return progress + 1;
  if (includeBull && progress === FINAL_NUMBER) return 'bull';
  return null;
}

function isValidHit(t: DartThrow, target: number | 'bull', hitType: AtcHitType): boolean {
  if (t.segment !== target) return false;
  if (hitType === 'single') return t.multiplier === 1;
  if (hitType === 'double') return t.multiplier === 2;
  return true;
}

interface DerivedAtcState {
  progress: Record<string, number>;
  winnerId: string | null;
  activePlayerId: string | null;
}

function applyTurn(progress: Record<string, number>, includeBull: boolean, hitType: AtcHitType, pid: string, throws: DartThrow[]): string | null {
  for (const t of throws) {
    const target = targetFor(progress[pid], includeBull);
    if (target === null) return pid; // already finished earlier this same replay — shouldn't normally happen
    if (isValidHit(t, target, hitType)) {
      progress[pid] += 1;
      if (targetFor(progress[pid], includeBull) === null) return pid;
    }
  }
  return null;
}

export function deriveAtcState(live: AtcLiveGame): DerivedAtcState {
  const progress: Record<string, number> = {};
  live.playerIds.forEach((id) => (progress[id] = 0));
  let winnerId: string | null = null;

  live.turns.forEach((turn) => {
    if (winnerId) return;
    winnerId = applyTurn(progress, live.includeBull, live.hitType, turn.playerId, turn.throws);
  });

  const preActivePlayerId = winnerId ? null : (live.playerIds[live.turns.length % live.playerIds.length] ?? null);
  if (preActivePlayerId && !winnerId) {
    winnerId = applyTurn(progress, live.includeBull, live.hitType, preActivePlayerId, live.currentThrows);
  }

  return { progress, winnerId, activePlayerId: winnerId ? null : preActivePlayerId };
}

function rankByProgress(playerIds: string[], progress: Record<string, number>, winnerId: string): string[] {
  return [...playerIds].sort((a, b) => {
    if (a === winnerId) return -1;
    if (b === winnerId) return 1;
    return progress[b] - progress[a];
  });
}

export const dartsAtcGame: GameDef<AtcLiveGame, AtcHistoryEntry> = {
  id: 'darts-atc',
  name: 'Around the Clock',
  badge: '🎯',
  color: '#00D9FF',
  tagline: 'Fléchettes · touche le 1, puis le 2… jusqu\'au 20',
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
        { q: 'Comment gagne-t-on ?', a: "Chaque joueur doit toucher les numéros dans l'ordre, du 1 au 20 (puis le centre en option) — le premier à finir gagne." },
        { q: "Qu'est-ce que je dois viser ?", a: "Ta cible actuelle, affichée à l'écran — elle avance dès que tu la touches, y compris plusieurs fois dans la même volée si tu enchaînes." },
      ],
    },
    {
      id: 'options',
      title: 'Options',
      items: [
        { q: 'Quel type de touche compte ?', a: "Par défaut, simple/double/triple comptent tous. Deux variantes possibles : n'accepter que les doubles, ou que les simples, pour progresser." },
        { q: 'À quoi sert le centre en fin de partie ?', a: "Si activé, il faut aussi toucher le centre après le 20 pour terminer la partie." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    const v = variants ?? {};
    const hitType: AtcHitType = v.hitDouble ? 'double' : v.hitSingle ? 'single' : 'any';
    return { gameId: 'darts-atc', playerIds, hitType, includeBull: !!v.includeBull, turns: [], currentThrows: [] };
  },

  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveAtcState(live).winnerId;
  },

  liveRanking(live) {
    const { progress, winnerId } = deriveAtcState(live);
    return rankByProgress(live.playerIds, progress, winnerId ?? '').map((id) => ({ id, total: progress[id] }));
  },
  liveScoreLabel(total, isWinner) {
    return isWinner ? 'Fini !' : `${total}/${FINAL_NUMBER} touchés`;
  },

  buildHistoryEntry(live, id, date) {
    const { progress, winnerId } = deriveAtcState(live);
    if (!winnerId) throw new Error('darts-atc: buildHistoryEntry called before a winner was decided');
    const ranking = rankByProgress(live.playerIds, progress, winnerId);
    return {
      id,
      gameId: 'darts-atc',
      date,
      playerIds: live.playerIds,
      hitType: live.hitType,
      includeBull: live.includeBull,
      turns: live.turns,
      finalProgress: progress,
      ranking,
      winnerId,
    };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  scoreValue(entry, playerId) {
    return entry.finalProgress[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return playerId === entry.winnerId ? 'Fini !' : `${entry.finalProgress[playerId] ?? 0}/${FINAL_NUMBER} touchés`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => {
      const label = id === entry.winnerId ? 'fini' : `${entry.finalProgress[id]}/${FINAL_NUMBER} touchés`;
      return `${idx + 1}. ${players[id]?.name ?? '?'} — ${label}`;
    });
  },
  activeVariantsLabel(entry) {
    const bits = [entry.hitType === 'double' ? 'Doubles uniquement' : entry.hitType === 'single' ? 'Simples uniquement' : 'Simple/double/triple'];
    if (entry.includeBull) bits.push('+ centre');
    return bits.join(' · ');
  },
  resultLabel(entry, winnerName) {
    return winnerName;
  },
};
