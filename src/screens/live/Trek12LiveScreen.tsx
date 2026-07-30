import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { NumericKeypadModal } from '../../components/NumericKeypadModal';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { getGameOrThrow } from '../../games/registry';
import { rollRedDie, rollYellowDie } from '../../games/trek12';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { Player, Trek12LiveGame } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

export function Trek12LiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as Trek12LiveGame;
  const players = useAppStore((s) => s.players);
  const modal = useAppStore((s) => s.modal);
  const openTrek12Score = useAppStore((s) => s.openTrek12Score);
  const modalDigit = useAppStore((s) => s.modalDigit);
  const modalBackspace = useAppStore((s) => s.modalBackspace);
  const modalCancel = useAppStore((s) => s.modalCancel);
  const modalConfirm = useAppStore((s) => s.modalConfirm);
  const playerById = useAppStore((s) => s.playerById);

  const [yellow, setYellow] = useState<number | null>(null);
  const [red, setRed] = useState<number | null>(null);
  const sum = yellow !== null && red !== null ? yellow + red : null;

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('trek-12');
  const ranking = game.liveRanking(liveGame, playersMap);
  const allFilled = game.isRoundComplete(liveGame, 1);
  const filledCount = liveGame.playerIds.filter((pid) => liveGame.scores[pid] !== undefined).length;

  const finishNow = () => navigation.navigate('Recap');

  return (
    <>
      <LiveScreenLayout
        header={
          <View style={styles.header}>
            <BackButton size={32} onPress={() => navigation.goBack()} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Trek 12</Text>
              <Text style={styles.subtitle}>
                {filledCount}/{liveGame.playerIds.length} scores saisis
              </Text>
            </View>
            <PressableScale onPress={finishNow} style={styles.finishBtn}>
              <Text style={styles.finishLabel}>Terminer</Text>
            </PressableScale>
          </View>
        }
        footer={<Button label="Terminer la partie 🏁" disabled={!allFilled} onPress={finishNow} size="md" />}
      >
        <Text style={styles.sectionTitle}>🎲 Dés virtuels</Text>
        <View style={styles.diceRow}>
          <PressableScale scaleTo={0.95} onPress={() => setYellow(rollYellowDie())} style={[styles.die, { backgroundColor: colors.amber }]}>
            <Text style={styles.dieLabel}>JAUNE</Text>
            <Text style={styles.dieValue}>{yellow ?? '–'}</Text>
            <Text style={styles.dieRange}>0-5</Text>
          </PressableScale>
          <PressableScale scaleTo={0.95} onPress={() => setRed(rollRedDie())} style={[styles.die, { backgroundColor: colors.red }]}>
            <Text style={[styles.dieLabel, { color: colors.white }]}>ROUGE</Text>
            <Text style={[styles.dieValue, { color: colors.white }]}>{red ?? '–'}</Text>
            <Text style={[styles.dieRange, { color: 'rgba(255,255,255,0.8)' }]}>1-6</Text>
          </PressableScale>
        </View>
        <Text style={styles.sumLabel}>{sum !== null ? `Somme : ${sum}` : 'Touche un dé pour le lancer'}</Text>
        <PressableScale
          scaleTo={0.97}
          onPress={() => {
            setYellow(rollYellowDie());
            setRed(rollRedDie());
          }}
          style={styles.rollBothBtn}
        >
          <Text style={styles.rollBothLabel}>🎲 Relancer les deux</Text>
        </PressableScale>

        <Text style={styles.sectionTitle}>Score final</Text>
        <View style={{ gap: 6, marginBottom: 20 }}>
          {liveGame.playerIds.map((pid) => {
            const v = liveGame.scores[pid];
            return (
              <PressableScale key={pid} scaleTo={0.98} onPress={() => openTrek12Score(pid)} style={styles.playerRow}>
                <View style={[styles.dot, { backgroundColor: playersMap[pid]?.color }]} />
                <Text style={styles.playerName}>{playersMap[pid]?.name}</Text>
                <Text style={styles.playerScore}>{v !== undefined ? `${v} pts` : 'Toucher pour saisir'}</Text>
              </PressableScale>
            );
          })}
        </View>

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
        title={modal ? `${playerById(modal.pid).name} · score final` : ''}
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
  diceRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  die: { flex: 1, borderRadius: radii.lg, paddingVertical: 18, alignItems: 'center' },
  dieLabel: { fontSize: 11, fontWeight: '700', color: colors.bg, letterSpacing: 1, fontFamily: fonts.bodyBold },
  dieValue: { fontFamily: fonts.headingBold, fontSize: 36, fontWeight: '700', color: colors.bg, marginVertical: 4 },
  dieRange: { fontSize: 11, color: colors.bg, opacity: 0.7 },
  sumLabel: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
  rollBothBtn: { borderRadius: radii.sm, paddingVertical: 12, backgroundColor: colors.surface, alignItems: 'center', marginBottom: 20 },
  rollBothLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
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
  playerScore: { fontFamily: fonts.headingBold, fontSize: 13, fontWeight: '700', color: colors.cyan },
});
