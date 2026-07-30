import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { NumericKeypadModal } from '../../components/NumericKeypadModal';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { getGameOrThrow } from '../../games/registry';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { Player, QwirkleLiveGame } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

export function QwirkleLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as QwirkleLiveGame;
  const players = useAppStore((s) => s.players);
  const modal = useAppStore((s) => s.modal);
  const openQwirkleEntry = useAppStore((s) => s.openQwirkleEntry);
  const qwirkleDeleteTurn = useAppStore((s) => s.qwirkleDeleteTurn);
  const modalDigit = useAppStore((s) => s.modalDigit);
  const modalBackspace = useAppStore((s) => s.modalBackspace);
  const modalCancel = useAppStore((s) => s.modalCancel);
  const modalConfirm = useAppStore((s) => s.modalConfirm);
  const playerById = useAppStore((s) => s.playerById);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('qwirkle');
  const ranking = game.liveRanking(liveGame, playersMap);
  const totalsById = useMemo(() => {
    const m: Record<string, number> = {};
    ranking.forEach((r) => (m[r.id] = r.total));
    return m;
  }, [ranking]);

  const finishNow = () => navigation.navigate('Recap');
  const recentTurns = liveGame.turns.map((t, i) => ({ ...t, index: i })).reverse();

  return (
    <>
      <LiveScreenLayout
        header={
          <View style={styles.header}>
            <BackButton size={32} onPress={() => navigation.goBack()} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Qwirkle</Text>
              <Text style={styles.subtitle}>
                {liveGame.turns.length} tour{liveGame.turns.length > 1 ? 's' : ''} joué{liveGame.turns.length > 1 ? 's' : ''}
              </Text>
            </View>
            <PressableScale onPress={finishNow} style={styles.finishBtn}>
              <Text style={styles.finishLabel}>Terminer</Text>
            </PressableScale>
          </View>
        }
        footer={
          <Button
            label="Terminer la partie 🏁"
            disabled={liveGame.turns.length === 0}
            onPress={finishNow}
            size="md"
          />
        }
      >
        <Text style={styles.sectionTitle}>Ajouter des points</Text>
        <View style={{ gap: 6, marginBottom: 20 }}>
          {liveGame.playerIds.map((pid) => (
            <PressableScale key={pid} scaleTo={0.98} onPress={() => openQwirkleEntry(pid)} style={styles.playerRow}>
              <View style={[styles.dot, { backgroundColor: playersMap[pid]?.color }]} />
              <Text style={styles.playerName}>{playersMap[pid]?.name}</Text>
              <Text style={styles.playerTotal}>{totalsById[pid] ?? 0} pts</Text>
              <View style={styles.plusBtn}>
                <Text style={styles.plusLabel}>＋</Text>
              </View>
            </PressableScale>
          ))}
        </View>

        {recentTurns.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Derniers tours</Text>
            <View style={{ gap: 6, marginBottom: 20 }}>
              {recentTurns.map((t) => (
                <View key={t.index} style={styles.turnRow}>
                  <View style={[styles.dot, { backgroundColor: playersMap[t.playerId]?.color }]} />
                  <Text style={styles.turnName}>{playersMap[t.playerId]?.name}</Text>
                  <Text style={styles.turnPoints}>+{t.points} pts</Text>
                  <PressableScale scaleTo={0.9} onPress={() => qwirkleDeleteTurn(t.index)} style={styles.turnDelete}>
                    <Text style={styles.turnDeleteLabel}>✕</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Classement en direct</Text>
        <View style={{ gap: 6 }}>
          {ranking.map((r, idx) => (
            <RankingRow
              key={r.id}
              position={idx + 1}
              name={playersMap[r.id]?.name ?? '?'}
              color={playersMap[r.id]?.color ?? '#888'}
              scoreLabel={`${r.total} pts`}
              highlight={idx === 0}
            />
          ))}
        </View>
      </LiveScreenLayout>

      <NumericKeypadModal
        visible={!!modal}
        title={modal ? `${playerById(modal.pid).name} · points ce tour` : ''}
        value={modal?.value ?? ''}
        onDigit={modalDigit}
        onBackspace={modalBackspace}
        onCancel={modalCancel}
        onConfirm={modalConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontFamily: fonts.heading, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted },
  finishBtn: { borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.red },
  finishLabel: { color: colors.white, fontSize: 12, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  playerName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  playerTotal: { fontFamily: fonts.headingBold, fontSize: 14, fontWeight: '700', color: colors.orange },
  plusBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surfaceAlt2, alignItems: 'center', justifyContent: 'center' },
  plusLabel: { color: colors.teal, fontWeight: '700', fontSize: 16 },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt2,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  turnName: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  turnPoints: { fontSize: 12, fontWeight: '700', color: colors.textMuted, fontFamily: fonts.bodyBold },
  turnDelete: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  turnDeleteLabel: { color: colors.red, fontSize: 12, fontWeight: '700' },
});
