import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { getGameOrThrow } from '../../games/registry';
import { activeVariantLabels, roleForPosition, roleStyle } from '../../games/trouDuCul';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { Player, TrouDuCulLiveGame } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

export function TrouDuCulLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as TrouDuCulLiveGame;
  const players = useAppStore((s) => s.players);
  const tdcTapPlayer = useAppStore((s) => s.tdcTapPlayer);
  const tdcResetRound = useAppStore((s) => s.tdcResetRound);
  const tdcNextRound = useAppStore((s) => s.tdcNextRound);
  const playerById = useAppStore((s) => s.playerById);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('trou-du-cul');
  const roundNum = liveGame.currentRound;
  const roundData = liveGame.rounds[roundNum - 1];
  const total = liveGame.playerIds.length;
  const order = roundData.order;
  const remaining = liveGame.playerIds.filter((pid) => !order.includes(pid));
  const roundComplete = order.length === total;
  const isLastRound = game.isLastRound(liveGame);
  const ranking = game.liveRanking(liveGame, playersMap);
  const variantsLabel = activeVariantLabels(liveGame.variants).join(', ') || 'aucune';

  const finishNow = () => navigation.navigate('Recap');
  const nextRound = () => {
    if (!roundComplete) return;
    if (isLastRound) navigation.navigate('Recap');
    else tdcNextRound();
  };

  return (
    <ScreenContainer contentStyle={{ paddingHorizontal: 16 }}>
      <View style={styles.header}>
        <BackButton size={32} onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.subtitle}>Manche {roundNum}/5</Text>
        </View>
        <PressableScale onPress={finishNow} style={styles.finishBtn}>
          <Text style={styles.finishLabel}>Terminer</Text>
        </PressableScale>
      </View>

      <Text style={styles.variants}>Variantes : {variantsLabel}</Text>
      <Text style={styles.instruction}>Touche les joueurs dans l'ordre où ils se sont débarrassés de leurs cartes 👇</Text>

      <View style={{ gap: 6, marginBottom: 14 }}>
        {order.map((pid, idx) => {
          const role = roleForPosition(idx, total);
          const style = roleStyle(role);
          return (
            <View key={pid} style={styles.orderRow}>
              <Text style={styles.orderPos}>{idx + 1}</Text>
              <View style={[styles.dot, { backgroundColor: playersMap[pid]?.color }]} />
              <Text style={styles.orderName}>{playersMap[pid]?.name}</Text>
              <Text style={[styles.roleBadge, { backgroundColor: style.bg, color: style.fg }]}>{role}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.remainingWrap}>
        {remaining.map((pid) => (
          <PressableScale key={pid} scaleTo={0.94} onPress={() => tdcTapPlayer(pid)} style={styles.remainingChip}>
            <View style={[styles.dot, { width: 18, height: 18, borderRadius: 9, backgroundColor: playersMap[pid]?.color }]} />
            <Text style={styles.remainingName}>{playersMap[pid]?.name}</Text>
          </PressableScale>
        ))}
      </View>

      {roundComplete && (
        <PressableScale onPress={tdcResetRound} style={styles.resetBtn}>
          <Text style={styles.resetLabel}>↺ Refaire cette manche</Text>
        </PressableScale>
      )}

      <Text style={styles.sectionTitle}>Classement général cumulé</Text>
      <View style={{ gap: 6, marginBottom: 16 }}>
        {ranking.map((r, idx) => (
          <RankingRow
            key={r.id}
            position={idx + 1}
            name={playersMap[r.id]?.name ?? '?'}
            color={playersMap[r.id]?.color ?? '#888'}
            scoreLabel={`${r.total} pts`}
          />
        ))}
      </View>

      <Button
        label={isLastRound ? 'Terminer la partie 🏁' : 'Manche suivante →'}
        disabled={!roundComplete}
        onPress={nextRound}
        size="md"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontFamily: fonts.heading, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted },
  finishBtn: { borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.red },
  finishLabel: { color: colors.white, fontSize: 12, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  variants: { fontSize: 12, color: colors.textMutedDark, marginBottom: 14 },
  instruction: { fontSize: 13, color: colors.textPrimary, marginBottom: 10 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  orderPos: { fontFamily: fonts.headingBold, fontWeight: '700', fontSize: 13, width: 18, color: colors.textPrimary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  orderName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  roleBadge: { fontSize: 11, fontWeight: '700', paddingVertical: 4, paddingHorizontal: 9, borderRadius: radii.sm, fontFamily: fonts.bodyBold, overflow: 'hidden' },
  remainingWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  remainingChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radii.md, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: colors.surface },
  remainingName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  resetBtn: { borderRadius: radii.sm, padding: 10, backgroundColor: colors.surface, marginBottom: 8, alignItems: 'center' },
  resetLabel: { color: colors.textMuted, fontSize: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
});
