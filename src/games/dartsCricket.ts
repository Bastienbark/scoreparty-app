import type { CricketHistoryEntry, CricketLiveGame, CricketMarks, CricketSlotKey, CricketSlotValues, CricketTurn, DartThrow } from '../types/models';
import type { GameDef } from './types';

export const CRICKET_SLOT_KEYS: CricketSlotKey[] = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6', 'bull'];
const REROLLABLE_SLOTS: CricketSlotKey[] = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'];
const CRAZY_POOL_MIN = 5;
const CRAZY_POOL_MAX = 20;

export function defaultSlotValues(): CricketSlotValues {
  return { slot1: 20, slot2: 19, slot3: 18, slot4: 17, slot5: 16, slot6: 15, bull: 25 };
}

function emptyMarks(): CricketMarks {
  return { slot1: 0, slot2: 0, slot3: 0, slot4: 0, slot5: 0, slot6: 0, bull: 0 };
}

function closedCount(marks: CricketMarks): number {
  return CRICKET_SLOT_KEYS.filter((k) => marks[k] >= 3).length;
}

function allClosed(marks: CricketMarks): boolean {
  return closedCount(marks) === CRICKET_SLOT_KEYS.length;
}

/** Resolves a dart's literal segment to the slot currently displaying that value (bull always maps to the bull slot). Null = off-target dart, no active slot shows this value right now. */
function resolveSlot(slotValues: CricketSlotValues, segment: number | 'bull' | 'miss'): CricketSlotKey | null {
  if (segment === 'miss') return null;
  if (segment === 'bull') return 'bull';
  const found = REROLLABLE_SLOTS.find((k) => slotValues[k] === segment);
  return found ?? null;
}

/** Teams are always pairs of 2 — up to 4 teams for the 8-player max. */
export const TEAM_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function resolveTeamId(pid: string, idx: number, overrides: Record<string, string> = {}): string {
  return overrides[pid] ?? TEAM_LETTERS[Math.floor(idx / 2)] ?? TEAM_LETTERS[TEAM_LETTERS.length - 1];
}

export function buildTeamOf(playerIds: string[], overrides: Record<string, string> = {}): Record<string, string> {
  const teamOf: Record<string, string> = {};
  playerIds.forEach((pid, idx) => (teamOf[pid] = resolveTeamId(pid, idx, overrides)));
  return teamOf;
}

/** Every team must have exactly 2 members — checked before a team-mode game can start. */
export function teamSizesValid(playerIds: string[], overrides: Record<string, string> = {}): boolean {
  const teamOf = buildTeamOf(playerIds, overrides);
  const counts: Record<string, number> = {};
  playerIds.forEach((pid) => {
    const t = teamOf[pid];
    counts[t] = (counts[t] ?? 0) + 1;
  });
  return Object.values(counts).every((c) => c === 2);
}

/**
 * Rerolls every not-yet-frozen slot (Crazy Cricket only) to a new random face
 * value from 5-20: never its own previous value, and never a value already
 * active on another slot (frozen or not) at the same time. A slot freezes —
 * stops being rerolled — the instant any single player has closed it,
 * regardless of team. Marks stay attached to the slot itself, so a slot's
 * history of marks survives its value changing.
 */
export function rerollSlotValues(marks: Record<string, CricketMarks>, playerIds: string[], crazyMode: boolean, current: CricketSlotValues, rng: () => number = Math.random): CricketSlotValues {
  if (!crazyMode) return current;
  const next: CricketSlotValues = { ...current };
  const isFrozen = (slot: CricketSlotKey) => playerIds.some((pid) => marks[pid][slot] >= 3);
  const taken = new Set<number>(REROLLABLE_SLOTS.filter(isFrozen).map((slot) => current[slot]));

  REROLLABLE_SLOTS.filter((slot) => !isFrozen(slot)).forEach((slot) => {
    const pool: number[] = [];
    for (let v = CRAZY_POOL_MIN; v <= CRAZY_POOL_MAX; v++) if (!taken.has(v) && v !== current[slot]) pool.push(v);
    const value = pool.length ? pool[Math.floor(rng() * pool.length)] : current[slot];
    next[slot] = value;
    taken.add(value);
  });
  return next;
}

interface DerivedCricketState {
  marks: Record<string, CricketMarks>;
  individualScores: Record<string, number>;
  teamScores: Record<string, number>;
  winnerTeamId: string | null;
  activePlayerId: string | null;
}

function teamsOf(playerIds: string[], teamOf: Record<string, string>): string[] {
  return [...new Set(playerIds.map((id) => teamOf[id]))];
}

function findWinnerTeam(playerIds: string[], teamOf: Record<string, string>, marks: Record<string, CricketMarks>, teamScores: Record<string, number>, cutThroat: boolean): string | null {
  for (const teamId of teamsOf(playerIds, teamOf)) {
    const members = playerIds.filter((id) => teamOf[id] === teamId);
    if (!members.every((id) => allClosed(marks[id]))) continue;
    const otherTeams = teamsOf(playerIds, teamOf).filter((t) => t !== teamId);
    const isBest = cutThroat
      ? otherTeams.every((ot) => teamScores[teamId] <= teamScores[ot])
      : otherTeams.every((ot) => teamScores[teamId] >= teamScores[ot]);
    if (isBest) return teamId;
  }
  return null;
}

/**
 * Applies one dart. A dart's multiplier adds that many marks to the resolved
 * slot (capped at 3 = closed); marks beyond what's needed to close are
 * "excess" and score at the slot's current face value each — but the
 * trigger differs by mode:
 *  - Classic: scores once the THROWER's whole TEAM has closed the slot
 *    (every teammate individually at 3 marks), credited to the team (and to
 *    the thrower's own tally), as long as an opposing team still has it open.
 *  - Cut-throat: scores once the THROWER has personally closed the slot
 *    (teammates' status irrelevant), redirected to each opposing player who
 *    hasn't personally closed it — and to their team's total.
 */
function applyThrow(
  marks: Record<string, CricketMarks>,
  individualScores: Record<string, number>,
  teamScores: Record<string, number>,
  playerIds: string[],
  teamOf: Record<string, string>,
  cutThroat: boolean,
  playerId: string,
  slotKey: CricketSlotKey | null,
  multiplier: number,
  faceValue: number,
): void {
  if (!slotKey) return; // off-target dart: consumes the throw, no effect
  const myTeam = teamOf[playerId];
  const myMarks = marks[playerId];
  const current = myMarks[slotKey];
  const neededToClose = Math.max(0, 3 - current);
  const excess = Math.max(0, multiplier - neededToClose);

  const throwerClosedBefore = current >= 3;
  const teamClosedBefore = playerIds.filter((id) => teamOf[id] === myTeam).every((id) => marks[id][slotKey] >= 3);

  myMarks[slotKey] = Math.min(3, current + multiplier);
  if (excess <= 0) return;

  const value = faceValue * excess;
  if (cutThroat) {
    if (!throwerClosedBefore) return;
    const openOpponents = playerIds.filter((id) => teamOf[id] !== myTeam && marks[id][slotKey] < 3);
    openOpponents.forEach((oid) => {
      individualScores[oid] += value;
      teamScores[teamOf[oid]] += value;
    });
  } else {
    if (!teamClosedBefore) return;
    const opposingHasOpenMember = playerIds.some((id) => teamOf[id] !== myTeam && marks[id][slotKey] < 3);
    if (opposingHasOpenMember) {
      individualScores[playerId] += value;
      teamScores[myTeam] += value;
    }
  }
}

export function deriveCricketState(live: CricketLiveGame): DerivedCricketState {
  const marks: Record<string, CricketMarks> = {};
  const individualScores: Record<string, number> = {};
  live.playerIds.forEach((id) => {
    marks[id] = emptyMarks();
    individualScores[id] = 0;
  });
  const teamScores: Record<string, number> = {};
  teamsOf(live.playerIds, live.teamOf).forEach((t) => (teamScores[t] = 0));

  live.turns.forEach((turn) => {
    turn.throws.forEach((t) => {
      const slotKey = resolveSlot(turn.slotValues, t.segment);
      applyThrow(marks, individualScores, teamScores, live.playerIds, live.teamOf, live.cutThroat, turn.playerId, slotKey, t.multiplier, slotKey ? turn.slotValues[slotKey] : 0);
    });
  });

  // Cricket has no "bust" that voids a turn — every dart's marks are permanent
  // the instant it's thrown, so the turn in progress must be reflected live.
  const preActivePlayerId = live.playerIds[live.turns.length % live.playerIds.length] ?? null;
  if (preActivePlayerId) {
    live.currentThrows.forEach((t) => {
      const slotKey = resolveSlot(live.currentSlotValues, t.segment);
      applyThrow(marks, individualScores, teamScores, live.playerIds, live.teamOf, live.cutThroat, preActivePlayerId, slotKey, t.multiplier, slotKey ? live.currentSlotValues[slotKey] : 0);
    });
  }

  const winnerTeamId = findWinnerTeam(live.playerIds, live.teamOf, marks, teamScores, live.cutThroat);
  const activePlayerId = winnerTeamId ? null : preActivePlayerId;
  return { marks, individualScores, teamScores, winnerTeamId, activePlayerId };
}

/** Simulates applying one more dart for the active player — used by the store to decide whether the turn/game ends right here. */
export function previewCricketThrow(live: CricketLiveGame, playerId: string, t: DartThrow): { winnerTeamId: string | null } {
  const base = deriveCricketState(live); // already reflects currentThrows
  const marks: Record<string, CricketMarks> = {};
  const teamScores: Record<string, number> = {};
  const individualScores: Record<string, number> = {};
  live.playerIds.forEach((id) => {
    marks[id] = { ...base.marks[id] };
    individualScores[id] = base.individualScores[id];
  });
  teamsOf(live.playerIds, live.teamOf).forEach((tid) => (teamScores[tid] = base.teamScores[tid]));

  const slotKey = resolveSlot(live.currentSlotValues, t.segment);
  applyThrow(marks, individualScores, teamScores, live.playerIds, live.teamOf, live.cutThroat, playerId, slotKey, t.multiplier, slotKey ? live.currentSlotValues[slotKey] : 0);
  const winnerTeamId = findWinnerTeam(live.playerIds, live.teamOf, marks, teamScores, live.cutThroat);
  return { winnerTeamId };
}

/** Orders players by team placement (winning team first), grouping teammates together; rankGroups shares a number across a whole team so ties (e.g. a team win) can be scored identically downstream. */
function rankTeamsAndPlayers(
  playerIds: string[],
  teamOf: Record<string, string>,
  marks: Record<string, CricketMarks>,
  teamScores: Record<string, number>,
  cutThroat: boolean,
  winnerTeamId: string | null,
): { ranking: string[]; rankGroups: number[] } {
  const orderedTeams = teamsOf(playerIds, teamOf).sort((a, b) => {
    if (a === winnerTeamId) return -1;
    if (b === winnerTeamId) return 1;
    return cutThroat ? teamScores[a] - teamScores[b] : teamScores[b] - teamScores[a];
  });
  const ranking: string[] = [];
  const rankGroups: number[] = [];
  orderedTeams.forEach((teamId, teamIdx) => {
    const members = playerIds.filter((id) => teamOf[id] === teamId).sort((a, b) => closedCount(marks[b]) - closedCount(marks[a]));
    members.forEach((pid) => {
      ranking.push(pid);
      rankGroups.push(teamIdx + 1);
    });
  });
  return { ranking, rankGroups };
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
        { q: 'Quelles sont les cibles ?', a: 'Les numéros 15, 16, 17, 18, 19, 20 et le centre (bull) — en Crazy Cricket, 6 des cibles changent de valeur en cours de partie.' },
        { q: 'Comment ferme-t-on une cible ?', a: "Chaque fléchette dessus ajoute une marque (simple = 1, double = 2, triple = 3) ; une cible est fermée à 3 marques." },
        { q: 'Comment gagne-t-on ?', a: "Le premier joueur (ou la première équipe) à avoir fermé les 7 cibles tout en ayant le meilleur score (le plus haut en classique, le plus bas en cut-throat) remporte la partie." },
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
    {
      id: 'equipe',
      title: 'Mode Équipe',
      items: [
        { q: 'Comment fonctionnent les marques en équipe ?', a: 'Chaque joueur marque individuellement comme en solo. Une cible est "fermée pour l\'équipe" seulement quand tous ses membres l\'ont individuellement fermée.' },
        { q: 'Qui peut marquer des points en classique ?', a: "Une fois la cible fermée pour toute l'équipe, n'importe quel membre qui la retouche rapporte des points à l'équipe." },
        { q: 'Et en cut-throat ?', a: "Chaque joueur peut rediriger des points dès qu'il a personnellement fermé la cible, vers chaque adversaire (et son équipe) qui ne l'a pas encore fermée individuellement — pas besoin d'attendre que toute l'équipe adverse ait fermé." },
      ],
    },
    {
      id: 'crazy',
      title: 'Crazy Cricket',
      items: [
        { q: 'Qu\'est-ce qui change ?', a: "Le bull reste fixe, mais les 6 autres cibles sont des emplacements dont la valeur (5 à 20) peut changer aléatoirement après chaque tour de joueur." },
        { q: 'Que deviennent mes marques si la valeur change ?', a: "Elles restent acquises sur l'emplacement, qui affiche juste un nouveau numéro — rien n'est perdu." },
        { q: 'Un emplacement peut-il changer indéfiniment ?', a: "Non : dès qu'un joueur (de n'importe quelle équipe) l'a fermé (3 marques), sa valeur se fige définitivement." },
      ],
    },
  ],

  createLiveGame(playerIds, variants) {
    const v = variants ?? {};
    const teamMode = !!v.teamMode;
    const crazyMode = !!v.crazyMode;
    const teamOf: Record<string, string> = {};
    playerIds.forEach((pid, idx) => (teamOf[pid] = teamMode ? resolveTeamId(pid, idx, {}) : pid));
    const noMarksYet: Record<string, CricketMarks> = {};
    playerIds.forEach((pid) => (noMarksYet[pid] = emptyMarks()));
    return {
      gameId: 'darts-cricket',
      playerIds,
      cutThroat: !!v.cutThroat,
      teamMode,
      crazyMode,
      teamOf,
      turns: [],
      currentThrows: [],
      // Crazy Cricket shuffles the 6 numbered slots right from the start — no
      // "classic 20..15" opening arrangement, everyone throws at random values.
      currentSlotValues: crazyMode ? rerollSlotValues(noMarksYet, playerIds, true, defaultSlotValues()) : defaultSlotValues(),
    };
  },

  isRoundComplete() {
    return true;
  },
  isLastRound(live) {
    return !!deriveCricketState(live).winnerTeamId;
  },

  liveRanking(live) {
    const { individualScores, winnerTeamId } = deriveCricketState(live);
    const winners = winnerTeamId ? live.playerIds.filter((id) => live.teamOf[id] === winnerTeamId) : [];
    return [...live.playerIds]
      .sort((a, b) => {
        const aWin = winners.includes(a);
        const bWin = winners.includes(b);
        if (aWin && !bWin) return -1;
        if (bWin && !aWin) return 1;
        return live.cutThroat ? individualScores[a] - individualScores[b] : individualScores[b] - individualScores[a];
      })
      .map((id) => ({ id, total: individualScores[id] }));
  },

  buildHistoryEntry(live, id, date) {
    const { marks, individualScores, teamScores, winnerTeamId } = deriveCricketState(live);
    if (!winnerTeamId) throw new Error('darts-cricket: buildHistoryEntry called before a winner was decided');
    const { ranking, rankGroups } = rankTeamsAndPlayers(live.playerIds, live.teamOf, marks, teamScores, live.cutThroat, winnerTeamId);
    return {
      id,
      gameId: 'darts-cricket',
      date,
      playerIds: live.playerIds,
      cutThroat: live.cutThroat,
      teamMode: live.teamMode,
      crazyMode: live.crazyMode,
      teamOf: live.teamOf,
      turns: live.turns,
      finalMarks: marks,
      finalScores: individualScores,
      finalTeamScores: teamScores,
      ranking,
      rankGroups,
      winnerId: ranking[0],
      winnerTeamId,
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
    return entry.teamMode ? `${entry.finalTeamScores[entry.teamOf[playerId]] ?? 0} pts (équipe)` : `${entry.finalScores[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    if (!entry.teamMode) {
      return entry.ranking.map((id, idx) => `${idx + 1}. ${players[id]?.name ?? '?'} — ${entry.finalScores[id]} pts (${closedCount(entry.finalMarks[id])}/7 fermées)`);
    }
    const lines: string[] = [];
    let lastGroup = 0;
    entry.ranking.forEach((id, idx) => {
      const group = entry.rankGroups[idx];
      if (group !== lastGroup) {
        const teamId = entry.teamOf[id];
        lines.push(`${group}. Équipe ${teamId} — ${entry.finalTeamScores[teamId]} pts`);
        lastGroup = group;
      }
      lines.push(`   · ${players[id]?.name ?? '?'} — ${entry.finalScores[id]} pts perso (${closedCount(entry.finalMarks[id])}/7 fermées)`);
    });
    return lines;
  },
  activeVariantsLabel(entry) {
    const bits = [entry.cutThroat ? 'Cut-throat' : 'Classique'];
    if (entry.teamMode) bits.push('Équipe');
    if (entry.crazyMode) bits.push('Crazy');
    return bits.join(' · ');
  },
  resultLabel(entry, winnerName) {
    if (!entry.teamMode) return `${winnerName} (${entry.finalScores[entry.winnerId]} pts)`;
    const teamSize = entry.playerIds.filter((id) => entry.teamOf[id] === entry.winnerTeamId).length;
    const teamLabel = teamSize > 1 ? `${winnerName} & équipe` : winnerName;
    return `${teamLabel} (${entry.finalTeamScores[entry.winnerTeamId]} pts)`;
  },
};
