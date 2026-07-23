import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { getGame } from '../games/registry';
import { useAppStore } from '../state/store';
import { HistoryEntry } from '../types/models';
import { colors, fonts, radii } from '../theme/tokens';
import { fmtDate } from '../utils/date';

interface SingleStats {
  gamesPlayed: number;
  winRate: string;
  avgScore: string | number;
  chart: { pct: string; label: string; color: string }[];
}

function buildSingle(pid: string, history: HistoryEntry[]): SingleStats | null {
  const games = history.filter((h) => h.playerIds.includes(pid));
  if (!games.length) return null;
  const wins = games.filter((h) => getGame(h.gameId)!.rankingIds(h as never)[0] === pid).length;
  const crGames = games.filter((h) => h.gameId === 'cinq-rois');
  const avgScore = crGames.length
    ? Math.round(crGames.reduce((sum, h) => sum + getGame(h.gameId)!.scoreValue(h as never, pid), 0) / crGames.length)
    : 0;
  const sorted = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-6);
  const maxVal = Math.max(1, ...sorted.map((h) => getGame(h.gameId)!.scoreValue(h as never, pid)));
  return {
    gamesPlayed: games.length,
    winRate: `${Math.round((wins / games.length) * 100)}%`,
    avgScore: crGames.length ? avgScore : '–',
    chart: sorted.map((h) => {
      const v = getGame(h.gameId)!.scoreValue(h as never, pid);
      return {
        pct: `${Math.max(8, Math.round((v / maxVal) * 100))}%`,
        label: fmtDate(h.date).split(' ')[0],
        color: getGame(h.gameId)!.color,
      };
    }),
  };
}

export function StatsScreen() {
  const players = useAppStore((s) => s.players);
  const history = useAppStore((s) => s.history);
  const statsMode = useAppStore((s) => s.statsMode);
  const statsPlayerId = useAppStore((s) => s.statsPlayerId);
  const statsCompareIds = useAppStore((s) => s.statsCompareIds);
  const setStatsMode = useAppStore((s) => s.setStatsMode);
  const selectStatsPlayer = useAppStore((s) => s.selectStatsPlayer);
  const toggleStatsCompare = useAppStore((s) => s.toggleStatsCompare);
  const playerById = useAppStore((s) => s.playerById);

  const single = useMemo(() => (statsPlayerId ? buildSingle(statsPlayerId, history) : null), [statsPlayerId, history]);
  const singlePlayer = statsPlayerId ? playerById(statsPlayerId) : null;

  const compare = useMemo(() => {
    if (statsCompareIds.length < 2) return null;
    const statPlayerGames = (pid: string) => history.filter((h) => h.playerIds.includes(pid));
    const rowsMeta = [
      {
        label: 'Parties jouées ensemble',
        calc: (pid: string) => history.filter((h) => h.playerIds.includes(pid) && statsCompareIds.every((o) => h.playerIds.includes(o))).length,
      },
      {
        label: 'Victoires',
        calc: (pid: string) => statPlayerGames(pid).filter((h) => getGame(h.gameId)!.rankingIds(h as never)[0] === pid).length,
      },
      {
        label: 'Score moyen (Cinq Rois)',
        calc: (pid: string) => {
          const g = statPlayerGames(pid).filter((h) => h.gameId === 'cinq-rois');
          return g.length ? Math.round(g.reduce((sum, h) => sum + getGame(h.gameId)!.scoreValue(h as never, pid), 0) / g.length) : '–';
        },
      },
    ];
    return {
      players: statsCompareIds.map((id) => playerById(id)),
      rows: rowsMeta.map((rm) => ({ label: rm.label, values: statsCompareIds.map((id) => String(rm.calc(id))) })),
    };
  }, [statsCompareIds, history, playerById]);

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

              <Text style={styles.sectionTitle}>Évolution</Text>
              <View style={styles.chart}>
                {single.chart.map((b, idx) => (
                  <View key={idx} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: b.pct as `${number}%`, backgroundColor: b.color }]} />
                    </View>
                    <Text style={styles.barLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.empty}>Aucune partie enregistrée pour ce joueur.</Text>
          )}
        </>
      )}

      {statsMode === 'compare' && (
        <>
          <Text style={styles.hint}>Choisis 2 à 3 joueurs</Text>
          <View style={styles.chipsWrap}>
            {players.map((p) => (
              <Chip key={p.id} label={p.name} active={statsCompareIds.includes(p.id)} activeBg={p.color} activeFg={colors.bg} onPress={() => toggleStatsCompare(p.id)} />
            ))}
          </View>

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
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, backgroundColor: colors.surface, borderRadius: radii.md, padding: 12, marginBottom: 20 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 22, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barLabel: { fontSize: 9, color: colors.textMutedDark },
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
