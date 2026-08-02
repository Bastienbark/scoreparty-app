import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { DartsThrowPad } from '../../components/DartsThrowPad';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { suggestCheckout } from '../../games/dartsCheckout';
import { deriveX01State } from '../../games/dartsX01';
import { getGameOrThrow } from '../../games/registry';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { DartsX01LiveGame, DartThrow, Player } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

function throwLabel(t: DartThrow): string {
  if (t.segment === 'bull') return t.multiplier === 2 ? 'Bull' : '25';
  if (t.multiplier === 1) return `${t.segment}`;
  if (t.multiplier === 2) return `D${t.segment}`;
  return `T${t.segment}`;
}

export function DartsX01LiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as DartsX01LiveGame;
  const players = useAppStore((s) => s.players);
  const dartsAddThrow = useAppStore((s) => s.dartsAddThrow);
  const dartsUndoThrow = useAppStore((s) => s.dartsUndoThrow);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('darts-x01');
  const ranking = game.liveRanking(liveGame, playersMap);
  const { scores, winnerId, activePlayerId } = deriveX01State(liveGame);
  const activePlayer = activePlayerId ? playersMap[activePlayerId] : null;
  const dartsThrown = liveGame.currentThrows.length;
  const remaining = activePlayerId ? scores[activePlayerId] : 0;
  const checkout = activePlayerId && !winnerId ? suggestCheckout(remaining, liveGame.doubleOut) : null;
  const recentTurns = [...liveGame.turns].reverse().slice(0, 8);

  const finishNow = () => navigation.navigate('Recap');
  const canUndo = liveGame.currentThrows.length > 0 || liveGame.turns.length > 0;

  return (
    <LiveScreenLayout
      header={
        <View style={styles.header}>
          <BackButton size={32} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{liveGame.startScore}</Text>
            <Text style={styles.subtitle}>
              {liveGame.doubleOut ? 'Double out' : 'Sortie simple'}
              {liveGame.doubleIn ? ' · Double in' : ''}
            </Text>
          </View>
        </View>
      }
      footer={<Button label={winnerId ? 'Voir le récap 🎯' : 'Partie en cours…'} disabled={!winnerId} onPress={finishNow} size="md" />}
    >
      {activePlayer && !winnerId && (
        <View style={styles.activeCard}>
          <View style={[styles.activeDot, { backgroundColor: activePlayer.color }]} />
          <Text style={styles.activeName}>{activePlayer.name} au tir</Text>
          <Text style={styles.activeRemaining}>{remaining}</Text>
          <Text style={styles.activeThrowIndex}>Fléchette {dartsThrown + 1}/3</Text>
          {checkout && <Text style={styles.checkout}>Finish : {checkout.join(' · ')}</Text>}

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

      {winnerId && (
        <View style={styles.winnerCard}>
          <Text style={styles.winnerText}>🎯 {playersMap[winnerId]?.name} a fini la partie !</Text>
        </View>
      )}

      {!winnerId && <DartsThrowPad onThrow={dartsAddThrow} />}

      <PressableScale scaleTo={0.96} onPress={dartsUndoThrow} disabled={!canUndo} style={[styles.undoBtn, !canUndo && { opacity: 0.4 }]}>
        <Text style={styles.undoLabel}>⌫ Annuler la dernière fléchette</Text>
      </PressableScale>

      <Text style={styles.sectionTitle}>Classement en direct</Text>
      <View style={{ gap: 6, marginBottom: 20 }}>
        {ranking.map((r, idx) => (
          <RankingRow
            key={r.id}
            position={idx + 1}
            name={playersMap[r.id]?.name ?? '?'}
            color={playersMap[r.id]?.color ?? '#888'}
            scoreLabel={r.id === winnerId ? 'Fini !' : `${r.total} restants`}
            highlight={r.id === winnerId || (idx === 0 && !winnerId)}
          />
        ))}
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
                <Text style={[styles.turnScore, t.isBust && { color: colors.red }]}>{t.isBust ? 'BUST' : `-${t.turnScore}`}</Text>
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
  activeCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18, alignItems: 'center', marginBottom: 16 },
  activeDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  activeName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  activeRemaining: { fontFamily: fonts.headingBold, fontSize: 48, fontWeight: '700', color: colors.amber, marginVertical: 4 },
  activeThrowIndex: { fontSize: 12, color: colors.textMuted },
  checkout: { fontSize: 13, fontWeight: '700', color: colors.teal, marginTop: 8, fontFamily: fonts.bodyBold },
  throwsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  throwPill: { width: 56, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: colors.surfaceAlt2, alignItems: 'center' },
  throwPillLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, fontFamily: fonts.bodyBold },
  winnerCard: { backgroundColor: 'rgba(255,195,0,0.14)', borderRadius: radii.lg, padding: 18, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.amber },
  winnerText: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '600', color: colors.amber, textAlign: 'center' },
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
  turnScore: { fontSize: 12, fontWeight: '700', color: colors.teal, fontFamily: fonts.bodyBold },
});
