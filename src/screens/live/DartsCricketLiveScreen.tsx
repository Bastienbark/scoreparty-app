import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { DartsThrowPad } from '../../components/DartsThrowPad';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { CRICKET_SLOT_KEYS, deriveCricketState } from '../../games/dartsCricket';
import { getGameOrThrow } from '../../games/registry';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { CricketLiveGame, CricketSlotKey, DartThrow, Player } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

const LABEL_COL = 34;
const CELL_COL = 48;

function throwLabel(t: DartThrow): string {
  if (t.segment === 'bull') return t.multiplier === 2 ? 'Bull' : '25';
  if (t.multiplier === 1) return `${t.segment}`;
  if (t.multiplier === 2) return `D${t.segment}`;
  return `T${t.segment}`;
}

function markSymbol(n: number): string {
  if (n >= 3) return '⊗';
  if (n === 2) return '✕';
  if (n === 1) return '／';
  return '·';
}

const TEAM_COLOR: Record<string, string> = { A: colors.teal, B: colors.orange };

export function DartsCricketLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as CricketLiveGame;
  const players = useAppStore((s) => s.players);
  const dartsCricketAddThrow = useAppStore((s) => s.dartsCricketAddThrow);
  const dartsCricketUndoThrow = useAppStore((s) => s.dartsCricketUndoThrow);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('darts-cricket');
  const ranking = game.liveRanking(liveGame, playersMap);
  const { marks, individualScores, teamScores, winnerTeamId, activePlayerId } = deriveCricketState(liveGame);
  const activePlayer = activePlayerId ? playersMap[activePlayerId] : null;
  const dartsThrown = liveGame.currentThrows.length;
  const recentTurns = [...liveGame.turns].reverse().slice(0, 6);
  const teams = liveGame.teamMode ? [...new Set(liveGame.playerIds.map((id) => liveGame.teamOf[id]))] : [];
  const winnerNames = winnerTeamId
    ? liveGame.playerIds.filter((id) => liveGame.teamOf[id] === winnerTeamId).map((id) => playersMap[id]?.name)
    : [];

  const enabledSegments = useMemo(() => {
    const values = CRICKET_SLOT_KEYS.filter((k): k is CricketSlotKey => k !== 'bull').map((k) => liveGame.currentSlotValues[k]);
    return [...values, 'bull'] as (number | 'bull')[];
  }, [liveGame.currentSlotValues]);

  const finishNow = () => navigation.navigate('Recap');
  const canUndo = liveGame.currentThrows.length > 0 || liveGame.turns.length > 0;

  return (
    <LiveScreenLayout
      header={
        <View style={styles.header}>
          <BackButton size={32} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Cricket</Text>
            <Text style={styles.subtitle}>
              {liveGame.cutThroat ? 'Cut-throat · le plus bas gagne' : 'Classique · le plus haut gagne'}
              {liveGame.teamMode ? ' · Équipe' : ''}
              {liveGame.crazyMode ? ' · Crazy' : ''}
            </Text>
          </View>
        </View>
      }
      footer={<Button label={winnerTeamId ? 'Voir le récap 🎯' : 'Partie en cours…'} disabled={!winnerTeamId} onPress={finishNow} size="md" />}
    >
      {liveGame.teamMode && (
        <View style={styles.teamScoresRow}>
          {teams.map((teamId) => (
            <View key={teamId} style={[styles.teamScoreCard, { borderColor: TEAM_COLOR[teamId] ?? colors.textMuted }]}>
              <Text style={[styles.teamScoreLabel, { color: TEAM_COLOR[teamId] ?? colors.textMuted }]}>Équipe {teamId}</Text>
              <Text style={styles.teamScoreValue}>{teamScores[teamId] ?? 0} pts</Text>
            </View>
          ))}
        </View>
      )}

      {activePlayer && !winnerTeamId && (
        <View style={styles.activeCard}>
          <View style={[styles.activeDot, { backgroundColor: activePlayer.color }]} />
          <Text style={styles.activeName}>
            {activePlayer.name} au tir · fléchette {dartsThrown + 1}/3
          </Text>
          <View style={styles.throwsRow}>
            {[0, 1, 2].map((i) => {
              const t = liveGame.currentThrows[i];
              return (
                <View key={i} style={[styles.throwPill, t && { backgroundColor: colors.teal }]}>
                  <Text style={[styles.throwPillLabel, t && { color: colors.bg }]}>{t ? throwLabel(t) : '–'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {winnerTeamId && (
        <View style={styles.winnerCard}>
          <Text style={styles.winnerText}>
            🎯 {liveGame.teamMode ? `Équipe ${winnerTeamId} (${winnerNames.join(' & ')})` : winnerNames[0]} a fermé toutes les cibles et gagne !
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrap}>
        <View>
          <View style={styles.row}>
            <View style={{ width: LABEL_COL }} />
            {liveGame.playerIds.map((pid) => (
              <View key={pid} style={{ width: CELL_COL, alignItems: 'center', paddingVertical: 8 }}>
                <View style={[styles.headerDot, { backgroundColor: playersMap[pid]?.color }]} />
                <Text style={styles.headerName} numberOfLines={1}>
                  {playersMap[pid]?.name}
                </Text>
              </View>
            ))}
          </View>

          {CRICKET_SLOT_KEYS.map((slot) => (
            <View key={slot} style={styles.row}>
              <View style={{ width: LABEL_COL, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.rowLabel}>{slot === 'bull' ? '⊙' : liveGame.currentSlotValues[slot]}</Text>
              </View>
              {liveGame.playerIds.map((pid) => {
                const n = marks[pid][slot];
                return (
                  <View key={pid} style={{ width: CELL_COL, alignItems: 'center', paddingVertical: 6 }}>
                    <Text style={[styles.mark, { color: n >= 3 ? colors.teal : n > 0 ? colors.amber : colors.textMutedDark }]}>{markSymbol(n)}</Text>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={[styles.row, styles.scoreRow]}>
            <View style={{ width: LABEL_COL, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.rowLabel}>Σ</Text>
            </View>
            {liveGame.playerIds.map((pid) => (
              <View key={pid} style={{ width: CELL_COL, alignItems: 'center', paddingVertical: 8 }}>
                <Text style={styles.scoreValue}>{individualScores[pid]}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {!winnerTeamId && <DartsThrowPad onThrow={dartsCricketAddThrow} enabledSegments={enabledSegments} />}

      <PressableScale scaleTo={0.96} onPress={dartsCricketUndoThrow} disabled={!canUndo} style={[styles.undoBtn, !canUndo && { opacity: 0.4 }]}>
        <Text style={styles.undoLabel}>⌫ Annuler la dernière fléchette</Text>
      </PressableScale>

      <Text style={styles.sectionTitle}>Classement en direct</Text>
      <View style={{ gap: 6, marginBottom: 20 }}>
        {ranking.map((r, idx) => {
          const isWinner = winnerTeamId ? liveGame.teamOf[r.id] === winnerTeamId : false;
          return (
            <RankingRow
              key={r.id}
              position={idx + 1}
              name={liveGame.teamMode ? `${playersMap[r.id]?.name ?? '?'} (Équipe ${liveGame.teamOf[r.id]})` : playersMap[r.id]?.name ?? '?'}
              color={playersMap[r.id]?.color ?? '#888'}
              scoreLabel={`${r.total} pts`}
              highlight={isWinner || (idx === 0 && !winnerTeamId)}
            />
          );
        })}
      </View>

      {recentTurns.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Derniers tours</Text>
          <View style={{ gap: 6 }}>
            {recentTurns.map((t, idx) => (
              <View key={idx} style={styles.turnRow}>
                <View style={[styles.dot, { backgroundColor: playersMap[t.playerId]?.color }]} />
                <Text style={styles.turnName}>{playersMap[t.playerId]?.name}</Text>
                <Text style={styles.turnThrows}>{t.throws.map(throwLabel).join(' · ')}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </LiveScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontFamily: fonts.heading, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted },
  teamScoresRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  teamScoreCard: { flex: 1, borderRadius: radii.lg, borderWidth: 1.5, padding: 12, alignItems: 'center', backgroundColor: colors.surface },
  teamScoreLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bodyBold },
  teamScoreValue: { fontFamily: fonts.headingBold, fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  activeCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, alignItems: 'center', marginBottom: 14 },
  activeDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  activeName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  throwsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  throwPill: { width: 56, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: colors.surfaceAlt2, alignItems: 'center' },
  throwPillLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, fontFamily: fonts.bodyBold },
  winnerCard: { backgroundColor: 'rgba(255,195,0,0.14)', borderRadius: radii.lg, padding: 18, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.amber },
  winnerText: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '600', color: colors.amber, textAlign: 'center' },
  tableWrap: { borderRadius: radii.md, backgroundColor: colors.surface, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 3 },
  headerName: { fontSize: 10, color: colors.textPrimary },
  rowLabel: { fontSize: 13, fontWeight: '700', fontFamily: fonts.bodyBold, color: colors.textMuted },
  mark: { fontSize: 18, fontWeight: '700' },
  scoreRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  scoreValue: { fontFamily: fonts.headingBold, fontSize: 14, fontWeight: '700', color: colors.amber },
  undoBtn: { marginTop: 12, marginBottom: 20, backgroundColor: colors.surfaceAlt2, borderRadius: radii.sm, paddingVertical: 12, alignItems: 'center' },
  undoLabel: { fontSize: 12, fontWeight: '600', color: colors.orange, fontFamily: fonts.bodySemiBold },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt2,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  turnName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold, width: 64 },
  turnThrows: { flex: 1, fontSize: 12, color: colors.textMuted },
});
