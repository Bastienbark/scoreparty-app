import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { RankingRow } from '../components/RankingRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { GAMES, getGame } from '../games/registry';
import { playerRoleCounts, rolePercent, roleStyle, ROLE_STATS_ORDER } from '../games/trouDuCul';
import { buildContestLeaderboard, contestGames } from '../state/contestStats';
import { useAppStore } from '../state/store';
import { HistoryEntry, TrouDuCulHistoryEntry } from '../types/models';
import { colors, fonts, radii } from '../theme/tokens';
import { fmtDate } from '../utils/date';

interface SingleStats {
  gamesPlayed: number;
  winRate: string;
  avgScore: string | number;
  tdcRoles: { role: string; pct: number }[] | null;
  perGame: { gameId: string; name: string; color: string; played: number; winRate: string }[];
}

function buildSingle(pid: string, history: HistoryEntry[]): SingleStats | null {
  const games = history.filter((h) => h.playerIds.includes(pid));
  if (!games.length) return null;
  const wins = games.filter((h) => getGame(h.gameId)!.rankingIds(h as never)[0] === pid).length;
  const crGames = games.filter((h) => h.gameId === 'cinq-rois');
  const avgScore = crGames.length
    ? Math.round(crGames.reduce((sum, h) => sum + getGame(h.gameId)!.scoreValue(h as never, pid), 0) / crGames.length)
    : 0;

  const tdcGames = games.filter((h) => h.gameId === 'trou-du-cul') as TrouDuCulHistoryEntry[];
  let tdcRoles: { role: string; pct: number }[] | null = null;
  if (tdcGames.length) {
    const breakdown = playerRoleCounts(tdcGames, pid);
    tdcRoles = ROLE_STATS_ORDER.map((role) => ({ role, pct: rolePercent(breakdown, role) }));
  }

  const playedGameIds = GAMES.filter((g) => games.some((h) => h.gameId === g.id));
  const perGame = playedGameIds.map((g) => {
    const gGames = games.filter((h) => h.gameId === g.id);
    const gWins = gGames.filter((h) => g.rankingIds(h as never)[0] === pid).length;
    return { gameId: g.id, name: g.name, color: g.color, played: gGames.length, winRate: `${Math.round((gWins / gGames.length) * 100)}%` };
  });

  return {
    gamesPlayed: games.length,
    winRate: `${Math.round((wins / games.length) * 100)}%`,
    avgScore: crGames.length ? avgScore : '–',
    tdcRoles,
    perGame,
  };
}

export function StatsScreen() {
  const players = useAppStore((s) => s.players);
  const history = useAppStore((s) => s.history);
  const contests = useAppStore((s) => s.contests);
  const statsMode = useAppStore((s) => s.statsMode);
  const statsPlayerId = useAppStore((s) => s.statsPlayerId);
  const statsCompareIds = useAppStore((s) => s.statsCompareIds);
  const statsCompareGameId = useAppStore((s) => s.statsCompareGameId);
  const statsHeadToHeadOnly = useAppStore((s) => s.statsHeadToHeadOnly);
  const setStatsMode = useAppStore((s) => s.setStatsMode);
  const selectStatsPlayer = useAppStore((s) => s.selectStatsPlayer);
  const toggleStatsCompare = useAppStore((s) => s.toggleStatsCompare);
  const setStatsCompareGameId = useAppStore((s) => s.setStatsCompareGameId);
  const statsCompareContestId = useAppStore((s) => s.statsCompareContestId);
  const setStatsCompareContestId = useAppStore((s) => s.setStatsCompareContestId);
  const toggleStatsHeadToHead = useAppStore((s) => s.toggleStatsHeadToHead);
  const playerById = useAppStore((s) => s.playerById);

  const single = useMemo(() => (statsPlayerId ? buildSingle(statsPlayerId, history) : null), [statsPlayerId, history]);

  const shownContest = useMemo(() => contests.find((c) => !c.endedAt) ?? contests[0] ?? null, [contests]);
  const contestLeaderboard = useMemo(
    () => (shownContest ? buildContestLeaderboard(shownContest.id, history) : []),
    [shownContest, history],
  );
  const contestGamesCount = useMemo(() => (shownContest ? contestGames(shownContest.id, history).length : 0), [shownContest, history]);

  const compare = useMemo(() => {
    if (statsCompareIds.length < 2) return null;
    const matchesGameFilter = (h: HistoryEntry) => !statsCompareGameId || h.gameId === statsCompareGameId;
    const matchesContestFilter = (h: HistoryEntry) => !statsCompareContestId || h.contestId === statsCompareContestId;
    // "Together": every compared player is in the game. In head-to-head mode this
    // tightens to an exact match — the game had these players and no one else.
    const togetherMatch = (h: HistoryEntry) => {
      if (!statsCompareIds.every((o) => h.playerIds.includes(o))) return false;
      return !statsHeadToHeadOnly || h.playerIds.length === statsCompareIds.length;
    };
    // A player's own games, restricted to head-to-head confrontations with the
    // other compared players when the toggle is on (otherwise unrestricted, as
    // before — this stat isn't inherently a "together" stat outside that mode).
    const eligibleGames = (pid: string) =>
      history.filter((h) => h.playerIds.includes(pid) && matchesGameFilter(h) && matchesContestFilter(h) && (!statsHeadToHeadOnly || togetherMatch(h)));

    const rowsMeta: { label: string; calc: (pid: string) => string }[] = [
      {
        label: 'Parties jouées ensemble',
        calc: () => String(history.filter((h) => matchesGameFilter(h) && matchesContestFilter(h) && togetherMatch(h)).length),
      },
      {
        label: 'Victoires',
        calc: (pid) => String(eligibleGames(pid).filter((h) => getGame(h.gameId)!.rankingIds(h as never)[0] === pid).length),
      },
    ];

    if (!statsCompareGameId || statsCompareGameId === 'cinq-rois') {
      rowsMeta.push({
        label: 'Score moyen (Cinq Rois)',
        calc: (pid) => {
          const g = eligibleGames(pid).filter((h) => h.gameId === 'cinq-rois');
          return g.length ? String(Math.round(g.reduce((sum, h) => sum + getGame(h.gameId)!.scoreValue(h as never, pid), 0) / g.length)) : '–';
        },
      });
    }

    if (!statsCompareGameId || statsCompareGameId === 'trou-du-cul') {
      const tdcBreakdown = (pid: string) => playerRoleCounts(eligibleGames(pid).filter((h) => h.gameId === 'trou-du-cul') as TrouDuCulHistoryEntry[], pid);
      rowsMeta.push({
        label: '% Président',
        calc: (pid) => {
          const bd = tdcBreakdown(pid);
          return bd.totalRounds ? `${rolePercent(bd, 'Président')}%` : '–';
        },
      });
      rowsMeta.push({
        label: '% Trou du Cul',
        calc: (pid) => {
          const bd = tdcBreakdown(pid);
          return bd.totalRounds ? `${rolePercent(bd, 'Trou du Cul')}%` : '–';
        },
      });
    }

    return {
      players: statsCompareIds.map((id) => playerById(id)),
      rows: rowsMeta.map((rm) => ({ label: rm.label, values: statsCompareIds.map((id) => rm.calc(id)) })),
    };
  }, [statsCompareIds, statsCompareGameId, statsCompareContestId, statsHeadToHeadOnly, history, playerById]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Statistiques</Text>

      <View style={styles.modeSwitch}>
        <PressableScale
          scaleTo={0.97}
          onPress={() => setStatsMode('single')}
          style={[styles.modeBtn, statsMode === 'single' && { backgroundColor: colors.teal }]}
        >
          <Text style={[styles.modeLabel, { color: statsMode === 'single' ? colors.bg : colors.textMuted }]}>Par joueur</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.97}
          onPress={() => setStatsMode('compare')}
          style={[styles.modeBtn, statsMode === 'compare' && { backgroundColor: colors.teal }]}
        >
          <Text style={[styles.modeLabel, { color: statsMode === 'compare' ? colors.bg : colors.textMuted }]}>Comparatif</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.97}
          onPress={() => setStatsMode('contest')}
          style={[styles.modeBtn, statsMode === 'contest' && { backgroundColor: colors.teal }]}
        >
          <Text style={[styles.modeLabel, { color: statsMode === 'contest' ? colors.bg : colors.textMuted }]}>🏆 Concours</Text>
        </PressableScale>
      </View>

      {statsMode === 'single' && (
        <>
          <View style={styles.chipsWrap}>
            {players.map((p) => (
              <Chip key={p.id} label={p.name} active={statsPlayerId === p.id} activeBg={p.color} activeFg={colors.bg} onPress={() => selectStatsPlayer(p.id)} />
            ))}
          </View>

          {single ? (
            <>
              <View style={styles.tileGrid}>
                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Parties jouées</Text>
                  <Text style={[styles.tileValue, { color: colors.teal }]}>{single.gamesPlayed}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Taux de victoire</Text>
                  <Text style={[styles.tileValue, { color: colors.amber }]}>{single.winRate}</Text>
                </View>
                <View style={[styles.tile, { flexBasis: '100%' }]}>
                  <Text style={styles.tileLabel}>Score moyen (Cinq Rois)</Text>
                  <Text style={[styles.tileValue, { color: colors.orange }]}>{single.avgScore}</Text>
                </View>
              </View>

              {single.perGame.length > 1 && (
                <>
                  <Text style={styles.sectionTitle}>Taux de victoire par jeu</Text>
                  <View style={{ gap: 6, marginBottom: 18 }}>
                    {single.perGame.map((g) => (
                      <View key={g.gameId} style={styles.perGameRow}>
                        <View style={[styles.dot, { backgroundColor: g.color }]} />
                        <Text style={styles.perGameName}>{g.name}</Text>
                        <Text style={styles.perGamePlayed}>{g.played} partie{g.played > 1 ? 's' : ''}</Text>
                        <Text style={[styles.perGameWinRate, { color: g.color }]}>{g.winRate}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {single.tdcRoles && (
                <>
                  <Text style={styles.sectionTitle}>Rôles — Trou du Cul</Text>
                  <View style={styles.tileGrid}>
                    {single.tdcRoles.map((r) => (
                      <View key={r.role} style={styles.tile}>
                        <Text style={styles.tileLabel}>{r.role}</Text>
                        <Text style={[styles.tileValue, { color: roleStyle(r.role).bg, fontSize: 20 }]}>{r.pct}%</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Aucune partie enregistrée pour ce joueur.</Text>
          )}
        </>
      )}

      {statsMode === 'compare' && (
        <>
          <Text style={styles.hint}>Choisis 2 à 4 joueurs</Text>
          <View style={styles.chipsWrap}>
            {players.map((p) => (
              <Chip key={p.id} label={p.name} active={statsCompareIds.includes(p.id)} activeBg={p.color} activeFg={colors.bg} onPress={() => toggleStatsCompare(p.id)} />
            ))}
          </View>

          <Text style={styles.hint}>Jeu</Text>
          <View style={styles.chipsWrap}>
            <Chip label="Tous" active={!statsCompareGameId} activeBg={colors.teal} activeFg={colors.bg} onPress={() => setStatsCompareGameId(null)} />
            {GAMES.map((g) => (
              <Chip
                key={g.id}
                label={g.name}
                active={statsCompareGameId === g.id}
                activeBg={g.color}
                activeFg={colors.bg}
                onPress={() => setStatsCompareGameId(g.id)}
              />
            ))}
          </View>

          {contests.length > 0 && (
            <>
              <Text style={styles.hint}>Concours</Text>
              <View style={styles.chipsWrap}>
                <Chip label="Tous" active={!statsCompareContestId} activeBg={colors.teal} activeFg={colors.bg} onPress={() => setStatsCompareContestId(null)} />
                {contests.map((c) => (
                  <Chip
                    key={c.id}
                    label={`🏆 ${c.name}`}
                    active={statsCompareContestId === c.id}
                    activeBg={colors.amber}
                    activeFg={colors.bg}
                    onPress={() => setStatsCompareContestId(c.id)}
                  />
                ))}
              </View>
            </>
          )}

          <Chip
            label="⚔️ Confrontation directe uniquement"
            active={statsHeadToHeadOnly}
            activeBg={colors.red}
            activeFg={colors.white}
            onPress={toggleStatsHeadToHead}
            style={{ marginBottom: 18, alignSelf: 'flex-start' }}
          />

          {compare ? (
            <>
              <View style={styles.compareHeader}>
                <View style={{ flex: 1.4 }} />
                {compare.players.map((p) => (
                  <View key={p.id} style={styles.compareHeaderCol}>
                    <View style={[styles.dot, { backgroundColor: p.color }]} />
                    <Text style={styles.compareHeaderName}>{p.name}</Text>
                  </View>
                ))}
              </View>
              {compare.rows.map((row, idx) => (
                <View key={idx} style={styles.compareRow}>
                  <Text style={styles.compareRowLabel}>{row.label}</Text>
                  {row.values.map((v, i) => (
                    <Text key={i} style={styles.compareRowValue}>
                      {v}
                    </Text>
                  ))}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>Sélectionne au moins 2 joueurs pour comparer.</Text>
          )}
        </>
      )}

      {statsMode === 'contest' && (
        <>
          {shownContest ? (
            <>
              <Text style={styles.sectionTitle}>{shownContest.name}</Text>
              <Text style={styles.hint}>
                {shownContest.endedAt ? `Terminé le ${fmtDate(shownContest.endedAt)}` : `En cours depuis le ${fmtDate(shownContest.startedAt)}`}
                {' · '}
                {contestGamesCount} partie{contestGamesCount > 1 ? 's' : ''}
              </Text>

              {contestLeaderboard.length ? (
                <View style={{ gap: 8 }}>
                  {contestLeaderboard.map((row, idx) => {
                    const p = playerById(row.playerId);
                    return (
                      <RankingRow
                        key={row.playerId}
                        position={idx + 1}
                        name={p.name}
                        color={p.color}
                        scoreLabel={`${row.points} pt${row.points > 1 ? 's' : ''}`}
                        highlight={idx === 0}
                        medal={idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : undefined}
                      />
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.empty}>Aucune partie enregistrée pour ce concours pour l'instant.</Text>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Aucun concours pour l'instant. Lance-en un depuis l'écran d'accueil.</Text>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  modeSwitch: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.md, padding: 4, marginBottom: 18 },
  modeBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center' },
  modeLabel: { fontSize: 13, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  tile: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: 14 },
  tileLabel: { fontSize: 11, color: colors.textMuted },
  tileValue: { fontFamily: fonts.headingBold, fontSize: 22, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  perGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  perGameName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  perGamePlayed: { fontSize: 11, color: colors.textMuted, marginRight: 4 },
  perGameWinRate: { fontFamily: fonts.headingBold, fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  empty: { fontSize: 13, color: colors.textMutedDark, textAlign: 'center', paddingVertical: 20 },
  compareHeader: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  compareHeaderCol: { flex: 1, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  compareHeaderName: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  compareRow: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 6 },
  compareRowLabel: { flex: 1.4, fontSize: 11, color: colors.textMuted },
  compareRowValue: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
