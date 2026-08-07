import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { LiveScreenLayout } from '../../components/LiveScreenLayout';
import { NumericKeypadModal } from '../../components/NumericKeypadModal';
import { PressableScale } from '../../components/PressableScale';
import { RankingRow } from '../../components/RankingRow';
import { deriveMilleSaborsState } from '../../games/milleSabords';
import { HomeStackNavProp } from '../../navigation/types';
import { useAppStore } from '../../state/store';
import { MilleSaborsLiveGame, MilleSaborsTurn, Player } from '../../types/models';
import { colors, fonts, radii } from '../../theme/tokens';

function turnLabel(t: MilleSaborsTurn): string {
  if (t.instantWin) return '🏴‍☠️ Magie pirate — victoire immédiate';
  if (t.penaltyToOthers > 0) return `🏝️ Île de la Tête-de-Mort · −${t.penaltyToOthers} à chaque adversaire`;
  return `${t.points >= 0 ? '+' : ''}${t.points} pts`;
}

export function MilleSaborsLiveScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Live'>>();
  const liveGame = useAppStore((s) => s.liveGame) as MilleSaborsLiveGame;
  const players = useAppStore((s) => s.players);
  const modal = useAppStore((s) => s.modal);
  const openPointsEntry = useAppStore((s) => s.openMilleSaborsPointsEntry);
  const openPenaltyEntry = useAppStore((s) => s.openMilleSaborsPenaltyEntry);
  const instantWin = useAppStore((s) => s.milleSaborsInstantWin);
  const deleteTurn = useAppStore((s) => s.milleSaborsDeleteTurn);
  const modalDigit = useAppStore((s) => s.modalDigit);
  const modalBackspace = useAppStore((s) => s.modalBackspace);
  const modalToggleSign = useAppStore((s) => s.modalToggleSign);
  const modalCancel = useAppStore((s) => s.modalCancel);
  const modalConfirm = useAppStore((s) => s.modalConfirm);
  const playerById = useAppStore((s) => s.playerById);

  const [magicOpen, setMagicOpen] = useState(false);

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const { totals, winnerId, ranking, isFinalStretch, pendingPlayerIds } = deriveMilleSaborsState(liveGame);
  const orderedIds = ranking ?? [...liveGame.playerIds].sort((a, b) => totals[b] - totals[a]);
  const finishNow = () => navigation.navigate('Recap');
  const recentTurns = liveGame.turns.map((t, i) => ({ ...t, index: i })).reverse();
  const gameOver = !!winnerId;

  return (
    <>
      <LiveScreenLayout
        header={
          <View style={styles.header}>
            <BackButton size={32} onPress={() => navigation.goBack()} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Mille Sabords</Text>
              <Text style={styles.subtitle}>
                Objectif {liveGame.threshold} pts · {liveGame.turns.length} tour{liveGame.turns.length > 1 ? 's' : ''} joué{liveGame.turns.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        }
        footer={<Button label={gameOver ? 'Voir le récap 🏴‍☠️' : 'Partie en cours…'} disabled={!gameOver} onPress={finishNow} size="md" />}
      >
        {gameOver ? (
          <View style={styles.winnerCard}>
            <Text style={styles.winnerText}>
              🏴‍☠️ {playersMap[winnerId]?.name} remporte la partie avec {totals[winnerId]} pts !
            </Text>
          </View>
        ) : (
          isFinalStretch && (
            <View style={styles.stretchCard}>
              <Text style={styles.stretchText}>
                🏝️ Dernier tour ! {pendingPlayerIds.map((id) => playersMap[id]?.name).join(', ')} doi{pendingPlayerIds.length > 1 ? 'vent' : 't'} encore jouer avant la fin de la partie.
              </Text>
            </View>
          )
        )}

        <Text style={styles.sectionTitle}>Ajouter un tour</Text>
        <View style={{ gap: 6, marginBottom: 12 }}>
          {liveGame.playerIds.map((pid) => (
            <View key={pid} style={styles.playerRow}>
              <View style={[styles.dot, { backgroundColor: playersMap[pid]?.color }]} />
              <Text style={styles.playerName} numberOfLines={1}>
                {playersMap[pid]?.name}
              </Text>
              <Text style={styles.playerTotal}>{totals[pid] ?? 0} pts</Text>
              <PressableScale scaleTo={0.9} disabled={gameOver} onPress={() => openPenaltyEntry(pid)} style={[styles.iconBtn, styles.penaltyBtn, gameOver && { opacity: 0.4 }]}>
                <Text style={styles.penaltyIcon}>🏝️</Text>
              </PressableScale>
              <PressableScale scaleTo={0.9} disabled={gameOver} onPress={() => openPointsEntry(pid)} style={[styles.iconBtn, styles.pointsBtn, gameOver && { opacity: 0.4 }]}>
                <Text style={styles.plusLabel}>＋</Text>
              </PressableScale>
            </View>
          ))}
        </View>

        {!gameOver &&
          (magicOpen ? (
            <View style={styles.magicCard}>
              <Text style={styles.magicTitle}>Qui a réalisé la Magie Pirate (9 symboles identiques) ?</Text>
              <View style={styles.chipsRow}>
                {liveGame.playerIds.map((pid) => (
                  <PressableScale
                    key={pid}
                    scaleTo={0.95}
                    onPress={() => {
                      instantWin(pid);
                      setMagicOpen(false);
                    }}
                    style={[styles.magicChip, { borderColor: playersMap[pid]?.color }]}
                  >
                    <Text style={styles.magicChipLabel}>{playersMap[pid]?.name}</Text>
                  </PressableScale>
                ))}
                <PressableScale scaleTo={0.95} onPress={() => setMagicOpen(false)} style={styles.magicCancel}>
                  <Text style={styles.magicCancelLabel}>Annuler</Text>
                </PressableScale>
              </View>
            </View>
          ) : (
            <PressableScale scaleTo={0.98} onPress={() => setMagicOpen(true)} style={styles.magicLink}>
              <Text style={styles.magicLinkLabel}>🌊 Magie pirate — victoire immédiate…</Text>
            </PressableScale>
          ))}

        {recentTurns.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Derniers tours</Text>
            <View style={{ gap: 6, marginTop: 12, marginBottom: 20 }}>
              {recentTurns.map((t) => (
                <View key={t.index} style={styles.turnRow}>
                  <View style={[styles.dot, { backgroundColor: playersMap[t.playerId]?.color }]} />
                  <Text style={styles.turnName} numberOfLines={1}>
                    {playersMap[t.playerId]?.name}
                  </Text>
                  <Text style={styles.turnPoints} numberOfLines={1}>
                    {turnLabel(t)}
                  </Text>
                  <PressableScale scaleTo={0.9} onPress={() => deleteTurn(t.index)} style={styles.turnDelete}>
                    <Text style={styles.turnDeleteLabel}>✕</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Classement en direct</Text>
        <View style={{ gap: 6 }}>
          {orderedIds.map((id, idx) => (
            <RankingRow
              key={id}
              position={idx + 1}
              name={playersMap[id]?.name ?? '?'}
              color={playersMap[id]?.color ?? '#888'}
              scoreLabel={id === winnerId ? 'Vainqueur !' : `${totals[id] ?? 0} pts`}
              highlight={id === winnerId || (idx === 0 && !winnerId)}
            />
          ))}
        </View>
      </LiveScreenLayout>

      <NumericKeypadModal
        visible={!!modal}
        title={modal ? `${playerById(modal.pid).name} · ${modal.kind === 'penalty' ? 'pénalité à chaque adversaire' : 'points ce tour'}` : ''}
        value={modal?.value ?? ''}
        onDigit={modalDigit}
        onBackspace={modalBackspace}
        onCancel={modalCancel}
        onConfirm={modalConfirm}
        allowNegative={modal?.kind !== 'penalty'}
        onToggleSign={modalToggleSign}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontFamily: fonts.heading, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted },
  winnerCard: { backgroundColor: 'rgba(255,195,0,0.14)', borderRadius: radii.lg, padding: 14, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.amber },
  winnerText: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.amber, textAlign: 'center' },
  stretchCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.cyan },
  stretchText: { fontSize: 12.5, color: colors.textPrimary, textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  playerName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  playerTotal: { fontFamily: fonts.headingBold, fontSize: 14, fontWeight: '700', color: colors.amber },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pointsBtn: { backgroundColor: colors.surfaceAlt2 },
  penaltyBtn: { backgroundColor: colors.surfaceAlt2 },
  plusLabel: { color: colors.teal, fontWeight: '700', fontSize: 16 },
  penaltyIcon: { fontSize: 14 },
  magicLink: { paddingVertical: 8, marginBottom: 14 },
  magicLinkLabel: { fontSize: 12, color: colors.textMutedDark, textAlign: 'center' },
  magicCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 12, marginBottom: 14 },
  magicTitle: { fontSize: 12.5, color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  magicChip: { borderWidth: 1.5, borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 12 },
  magicChipLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  magicCancel: { borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.surfaceAlt2 },
  magicCancelLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, fontFamily: fonts.bodySemiBold },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt2,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  turnName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold, width: 64 },
  turnPoints: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textMuted, fontFamily: fonts.bodyBold },
  turnDelete: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  turnDeleteLabel: { color: colors.red, fontSize: 12, fontWeight: '700' },
});
