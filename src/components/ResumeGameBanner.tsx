import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getGame } from '../games/registry';
import { HomeStackNavProp } from '../navigation/types';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

export function ResumeGameBanner() {
  const navigation = useNavigation<HomeStackNavProp<'HomeRoot'>>();
  const liveGame = useAppStore((s) => s.liveGame);

  if (!liveGame) return null;
  const game = getGame(liveGame.gameId);
  if (!game) return null;

  const roundLabel = 'currentRound' in liveGame
    ? Number.isFinite(game.totalRounds)
      ? `Manche ${liveGame.currentRound}/${game.totalRounds}`
      : `Manche ${liveGame.currentRound}`
    : `${liveGame.turns.length} tour${liveGame.turns.length > 1 ? 's' : ''} joué${liveGame.turns.length > 1 ? 's' : ''}`;

  return (
    <PressableScale scaleTo={0.98} onPress={() => navigation.navigate('Live')} style={[styles.card, { borderColor: game.color }]}>
      <IconBadge label={game.badge} color={game.color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Partie en cours</Text>
        <Text style={styles.subtitle}>
          {game.name} · {roundLabel}
        </Text>
      </View>
      <Text style={[styles.cta, { color: game.color }]}>Reprendre →</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 16,
  },
  title: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cta: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', flexShrink: 0 },
});
