import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { NumericKeypadModal } from '../../components/NumericKeypadModal';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { getGameOrThrow } from '../../games/registry';
import { SKYJO_END_THRESHOLD } from '../../games/skyjo';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { Player, SkyjoLiveGame } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

const LABEL_COL = 34;
const CELL_COL = 56;

export function SkyjoLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as SkyjoLiveGame;
  const players = useAppStore((s) => s.players);
  const modal = useAppStore((s) => s.modal);
  const openCell = useAppStore((s) => s.openCell);
  const modalDigit = useAppStore((s) => s.modalDigit);
  const modalBackspace = useAppStore((s) => s.modalBackspace);
  const modalToggleSign = useAppStore((s) => s.modalToggleSign);
  const modalCancel = useAppStore((s) => s.modalCancel);
  const modalConfirm = useAppStore((s) => s.modalConfirm);
  const skyjoNextRound = useAppStore((s) => s.skyjoNextRound);
  const playerById = useAppStore((s) => s.playerById);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const game = getGameOrThrow('skyjo');
  const roundNum = liveGame.currentRound;
  const ranking = game.liveRanking(liveGame, playersMap);
  const allFilled = game.isRoundComplete(liveGame, roundNum);
  const isLastRound = game.isLastRound(liveGame);

  const finishNow = () => navigation.navigate('Recap');
  const nextRound = () => {
    if (!allFilled) return;
    if (isLastRound) navigation.navigate('Recap');
    else skyjoNextRound();
  };

  return (
    <>
      <LiveScreenLayout
        header={
          <>
            <View style={styles.header}>
              <BackButton size={32} onPress={() => navigation.goBack()} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Skyjo</Text>
                <Text style={styles.subtitle}>Manche {roundNum}</Text>
              </View>
              <PressableScale onPress={finishNow} style={styles.finishBtn}>
                <Text style={styles.finishLabel}>Terminer</Text>
              </PressableScale>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Fin de partie à</Text>
                <Text style={[styles.infoValue, { color: colors.amber }]}>{SKYJO_END_THRESHOLD} pts</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Manches jouées</Text>
                <Text style={[styles.infoValue, { color: colors.teal }]}>{liveGame.rounds.length}</Text>
              </View>
            </View>
          </>
        }
        footer={
          <Button
            label={isLastRound ? 'Terminer la partie 🏁' : 'Manche suivante →'}
            disabled={!allFilled}
            onPress={nextRound}
            size="md"
          />
        }
      >
        <Text style={styles.legend}>Entre le score de fin de manche de chaque joueur (peut être négatif).</Text>

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

            {liveGame.rounds.map((r) => {
              const isCurrent = r.round === roundNum;
              return (
                <View key={r.round} style={[styles.row, isCurrent && { backgroundColor: 'rgba(123,97,255,0.15)' }]}>
                  <View style={{ width: LABEL_COL, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.rowLabel, { color: isCurrent ? colors.violet : colors.textMuted }]}>{r.round}</Text>
                  </View>
                  {liveGame.playerIds.map((pid) => {
                    const v = r.scores[pid];
                    const filled = v !== undefined;
                    const bg = filled ? colors.surfaceAlt2 : isCurrent ? colors.violet : colors.surfaceAlt;
                    const fg = filled ? colors.textPrimary : colors.white;
                    return (
                      <View key={pid} style={{ width: CELL_COL, padding: 4, alignItems: 'center' }}>
                        <PressableScale scaleTo={0.92} onPress={() => openCell(r.round, pid)} style={[styles.cell, { backgroundColor: bg }]}>
                          <Text style={{ color: fg, fontSize: 13, fontWeight: '600' }}>{filled ? String(v) : '–'}</Text>
                        </PressableScale>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>

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
        title={modal ? `${playerById(modal.pid).name} · Manche ${modal.round}` : ''}
        value={modal?.value ?? ''}
        onDigit={modalDigit}
        onBackspace={modalBackspace}
        onCancel={modalCancel}
        onConfirm={modalConfirm}
        allowNegative
        onToggleSign={modalToggleSign}
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
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  infoCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.sm, padding: 10 },
  infoLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase' },
  infoValue: { fontFamily: fonts.headingBold, fontSize: 18, fontWeight: '700' },
  legend: { fontSize: 11, color: colors.textMutedDark, marginBottom: 14 },
  tableWrap: { borderRadius: radii.md, backgroundColor: colors.surface, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 3 },
  headerName: { fontSize: 10, color: colors.textPrimary },
  rowLabel: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bodyBold },
  cell: { width: 44, height: 34, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
});
