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
import { LostCitiesRwLiveGame, Player } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

export function LostCitiesRwLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as LostCitiesRwLiveGame;
  const players = useAppStore((s) => s.players);
  const modal = useAppStore((s) => s.modal);
  const openScoreEntry = useAppStore((s) => s.openTrek12Score);
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

  const game = getGameOrThrow('lost-cities-rw');
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
              <Text style={styles.title}>Lost Cities: Roll & Write</Text>
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
        <Text style={styles.legend}>Chaque joueur remplit sa fiche d'expédition en jouant, puis inscrit ici son score final (total des cases blanches en haut de sa fiche).</Text>

        <Text style={styles.sectionTitle}>Score final</Text>
        <View style={{ gap: 6, marginBottom: 20 }}>
          {liveGame.playerIds.map((pid) => {
            const v = liveGame.scores[pid];
            return (
              <PressableScale key={pid} scaleTo={0.98} onPress={() => openScoreEntry(pid)} style={styles.playerRow}>
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
  title: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted },
  finishBtn: { borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.red },
  finishLabel: { color: colors.white, fontSize: 12, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  legend: { fontSize: 11, color: colors.textMutedDark, marginBottom: 16, lineHeight: 16 },
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
  playerScore: { fontFamily: fonts.headingBold, fontSize: 13, fontWeight: '700', color: colors.orange },
});
