import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BouncingCrown, Confetti } from '../components/ConfettiCrown';
import { ScreenContainer } from '../components/ScreenContainer';
import { PressableScale } from '../components/PressableScale';
import { getGameOrThrow } from '../games/registry';
import { activeVariantLabels } from '../games/trouDuCul';
import { HomeStackNavProp } from '../navigation/types';
import { useAppStore } from '../state/store';
import { Player } from '../types/models';
import { colors, fonts, gradients, radii, shadows } from '../theme/tokens';
import { fmtDate } from '../utils/date';

const MEDALS = ['🥇', '🥈', '🥉'];

export function RecapScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Recap'>>();
  const liveGame = useAppStore((s) => s.liveGame);
  const recapSaved = useAppStore((s) => s.recapSaved);
  const players = useAppStore((s) => s.players);
  const playerById = useAppStore((s) => s.playerById);
  const saveGame = useAppStore((s) => s.saveGame);
  const resetLiveGame = useAppStore((s) => s.resetLiveGame);
  const liveGameCountsForContest = useAppStore((s) => s.liveGameCountsForContest);
  const contests = useAppStore((s) => s.contests);
  const activeContest = contests.find((c) => !c.endedAt) ?? null;

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  if (!liveGame) return null;

  const game = getGameOrThrow(liveGame.gameId);
  const ranking = game.liveRanking(liveGame, playersMap);
  const winnerName = playerById(ranking[0].id).name;
  const isTdc = liveGame.gameId === 'trou-du-cul';
  const variantsLabel = isTdc && 'variants' in liveGame ? activeVariantLabels(liveGame.variants).join(', ') || 'aucune' : null;

  const goHome = () => {
    resetLiveGame();
    navigation.popToTop();
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      {recapSaved && <Confetti />}
      <BouncingCrown />
      <Text style={styles.winner}>{winnerName} gagne !</Text>
      <Text style={styles.meta}>
        {game.name} · {fmtDate(new Date().toISOString())}
      </Text>

      <View style={styles.ranking}>
        {ranking.map((r, idx) => (
          <View
            key={r.id}
            style={[
              styles.row,
              { backgroundColor: idx === 0 ? 'rgba(255,195,0,0.14)' : colors.surface, borderColor: idx === 0 ? colors.amber : 'transparent' },
            ]}
          >
            <Text style={styles.medal}>{MEDALS[idx] ?? `#${idx + 1}`}</Text>
            <View style={[styles.dot, { backgroundColor: playersMap[r.id]?.color }]} />
            <Text style={styles.name}>{playersMap[r.id]?.name}</Text>
            <Text style={styles.score}>{game.liveScoreLabel ? game.liveScoreLabel(r.total, idx === 0) : `${r.total} pts`}</Text>
          </View>
        ))}
      </View>

      {isTdc && variantsLabel && <Text style={styles.variants}>Variantes : {variantsLabel}</Text>}

      {recapSaved ? (
        <>
          <View style={styles.savedBox}>
            <Text style={styles.savedText}>✅ Partie enregistrée dans l'historique !</Text>
          </View>
          {activeContest && (
            <Text style={styles.contestNote}>
              {liveGameCountsForContest ? `🏆 Comptée pour "${activeContest.name}"` : '🚫 Non comptée pour le concours'}
            </Text>
          )}
          <PressableScale onPress={goHome} style={styles.homeBtn}>
            <Text style={styles.homeBtnLabel}>Retour à l'accueil</Text>
          </PressableScale>
        </>
      ) : (
        <PressableScale onPress={saveGame} style={{ marginTop: 20 }}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.saveBtn, shadows.cta]}>
            <Text style={styles.saveLabel}>Enregistrer la partie 🏆</Text>
          </LinearGradient>
        </PressableScale>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 28, alignItems: 'center' },
  winner: { fontFamily: fonts.headingBold, fontSize: 22, fontWeight: '700', color: colors.amber, marginTop: 8 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  ranking: { width: '100%', gap: 8, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radii.sm, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
  medal: { fontSize: 18, width: 24, textAlign: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  score: { fontSize: 15, fontWeight: '700', color: colors.amber, fontFamily: fonts.headingBold },
  variants: { width: '100%', fontSize: 12, color: colors.textMutedDark, marginTop: 14, textAlign: 'left' },
  savedBox: { width: '100%', marginTop: 20, backgroundColor: colors.teal, borderRadius: radii.md, padding: 14 },
  savedText: { fontFamily: fonts.heading, fontWeight: '600', fontSize: 14, color: colors.bg },
  contestNote: { fontSize: 12, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
  homeBtn: { width: '100%', marginTop: 12, borderRadius: radii.lg, padding: 16, backgroundColor: colors.surface, alignItems: 'center' },
  homeBtnLabel: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  saveBtn: { width: '100%', borderRadius: radii.lg, padding: 18, alignItems: 'center' },
  saveLabel: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', color: colors.white },
});
