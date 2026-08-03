import type { DartThrow, DartsX01HistoryEntry, DartsX01LiveGame } from '../types/models';
import type { GameDef } from './types';

export const X01_DEFAULT_START = 501;

export function dartPoints(segment: number | 'bull' | 'miss', multiplier: 1 | 2 | 3): number {
  if (segment === 'miss') return 0;
  if (segment === 'bull') return multiplier === 2 ? 50 : 25;
  return segment * multiplier;
}

interface TurnEval {
  turnScore: number;
  isBust: boolean;
  finished: boolean;
  openedAfter: boolean;
}

/**
 * Evaluates a turn (1-3 darts) against a starting remaining score. Stops as
 * soon as a bust or a finish is reached, ignoring any darts entered after
 * that point — the live-input flow only ever calls this with the darts
 * thrown so far, so a bust/finish return means "commit now, even if <3
 * darts were thrown".
 */
export function evaluateX01Turn(remaining: number, openedBefore: boolean, doubleOut: boolean, doubleIn: boolean, throws: DartThrow[]): TurnEval {
  let rem = remaining;
  let opened = openedBefore;
  let scored = 0;

  for (const t of throws) {
    if (doubleIn && !opened) {
      if (t.multiplier === 2) {
        opened = true;
      } else {
        continue; // dart doesn't count until the player has "opened" with a double
      }
    }

    const tentative = rem - t.points;
    if (tentative < 0 || (doubleOut && tentative === 1)) {
      return { turnScore: 0, isBust: true, finished: false, openedAfter: openedBefore };
    }
    if (tentative === 0) {
      if (doubleOut && t.multiplier !== 2) {
        return { turnScore: 0, isBust: true, finished: false, openedAfter: openedBefore };
      }
      return { turnScore: scored + t.points, isBust: false, finished: true, openedAfter: opened };
    }
    rem = tentative;
    scored += t.points;
  }

  return { turnScore: scored, isBust: false, finished: false, openedAfter: opened };
}

interface DerivedX01State {
  scores: Record<string, number>;
  opened: Record<string, boolean>;
  winnerId: string | null;
  activePlayerId: string | null;
}

export function deriveX01State(live: DartsX01LiveGame): DerivedX01State {
  const scores: Record<string, number> = {};
  const opened: Record<string, boolean> = {};
  live.playerIds.forEach((id) => {
    scores[id] = live.startScore;
    opened[id] = !live.doubleIn;
  });

  let winnerId: string | null = null;
  live.turns.forEach((turn) => {
    if (winnerId) return;
    const remainingBefore = scores[turn.playerId];
    const evalResult = evaluateX01Turn(remainingBefore, opened[turn.playerId], live.doubleOut, live.doubleIn, turn.throws);
    opened[turn.playerId] = evalResult.openedAfter;
    if (!turn.isBust) {
      scores[turn.playerId] = remainingBefore - turn.turnScore;
      if (scores[turn.playerId] === 0) winnerId = turn.playerId;
    }
  });

  const activePlayerId = winnerId ? null : live.playerIds[live.turns.length % live.playerIds.length];
  return { scores, opened, winnerId, activePlayerId };
}

export function x01Ranking(live: DartsX01LiveGame): { id: string; total: number }[] {
  const { scores, winnerId } = deriveX01State(live);
  return [...live.playerIds]
    .sort((a, b) => {
      if (a === winnerId) return -1;
      if (b === winnerId) return 1;
      return scores[a] - scores[b];
    })
    .map((id) => ({ id, total: scores[id] }));
}

export const dartsX01Game: GameDef<DartsX01LiveGame, DartsX01HistoryEntry> = {
  id: 'darts-x01',
  name: '301 / 501',
  badge: '🎯',
  color: '#FF3864',
  tagline: 'Fléchettes · pars de 301/501/701, finis pile à 0',
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
        { q: 'Comment gagne-t-on ?', a: "Chaque joueur part d'un score fixe (301, 501 ou 701 selon la config) et doit être le premier à l'amener exactement à 0." },
        { q: "Qu'est-ce qu'une volée ?", a: 'Une volée (ou "tour") est une série de 3 fléchettes lancées par le même joueur avant de passer au suivant.' },
      ],
    },
    {
      id: 'bust',
      title: 'Le "bust"',
      items: [
        { q: 'Que se passe-t-il si mon score passe sous 0 ?', a: "C'est un \"bust\" : toute la volée est annulée, le score revient à ce qu'il était avant ces fléchettes." },
        { q: 'Et si je tombe à 1 point restant ?', a: 'En Double Out, terminer sur 1 est impossible (aucun double ne vaut 1) : atteindre 1 est donc aussi un bust.' },
        { q: 'Je tombe pile à 0 mais pas sur un double, que se passe-t-il ?', a: "En Double Out, finir sans que la dernière fléchette soit un double est un bust : la volée est annulée, il faut retenter." },
      ],
    },
    {
      id: 'options',
      title: 'Options de config',
      items: [
        { q: "Qu'est-ce que le Double Out ?", a: "Règle standard : il faut terminer la partie exactement sur un double (ou le centre plein, qui vaut double 25)." },
        { q: "Qu'est-ce que le Double In ?", a: "Option qui exige de commencer à marquer par un double : les fléchettes lancées avant ce premier double ne comptent pas." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    const v = variants ?? {};
    const startScore = v['701'] ? 701 : v['301'] ? 301 : X01_DEFAULT_START;
    return {
      gameId: 'darts-x01',
      playerIds,
      startScore,
      doubleOut: v.doubleOut !== false,
      doubleIn: !!v.doubleIn,
      turns: [],
      currentThrows: [],
    };
  },

  // Darts is turn-based, not round-based — these two only exist to satisfy
  // the shared GameDef contract, DartsX01LiveScreen doesn't call them.
  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveX01State(live).winnerId;
  },

  liveRanking(live) {
    return x01Ranking(live);
  },
  liveScoreLabel(total, isWinner) {
    return isWinner ? 'Fini !' : `${total} restants`;
  },

  buildHistoryEntry(live, id, date) {
    const { scores, winnerId } = deriveX01State(live);
    if (!winnerId) throw new Error('darts-x01: buildHistoryEntry called before a winner was decided');
    const ranking = [...live.playerIds].sort((a, b) => {
      if (a === winnerId) return -1;
      if (b === winnerId) return 1;
      return scores[a] - scores[b];
    });
    return {
      id,
      gameId: 'darts-x01',
      date,
      playerIds: live.playerIds,
      startScore: live.startScore,
      doubleOut: live.doubleOut,
      doubleIn: live.doubleIn,
      turns: live.turns,
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
    return playerId === entry.winnerId ? 'Fini !' : `${entry.finalScores[playerId] ?? 0} restants`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => {
      const label = id === entry.winnerId ? 'fini' : `${entry.finalScores[id]} restants`;
      return `${idx + 1}. ${players[id]?.name ?? '?'} — ${label}`;
    });
  },
  activeVariantsLabel(entry) {
    const bits = [`Départ ${entry.startScore}`, entry.doubleOut ? 'Double out' : 'Sortie simple'];
    if (entry.doubleIn) bits.push('Double in');
    return bits.join(' · ');
  },
  resultLabel(entry, winnerName) {
    const wins = entry.turns.filter((t) => t.playerId === entry.winnerId && !t.isBust).length;
    return `${winnerName} (en ${wins} volée${wins > 1 ? 's' : ''})`;
  },
};
