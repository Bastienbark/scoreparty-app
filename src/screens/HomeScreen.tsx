import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconBadge } from '../components/IconBadge';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { getGame } from '../games/registry';
import { HomeStackNavProp } from '../navigation/types';
import { useAppStore } from '../state/store';
import { colors, fonts, gradients, radii, shadows } from '../theme/tokens';
import { fmtDate } from '../utils/date';
import { LinearGradient } from 'expo-linear-gradient';

export function HomeScreen() {
  const navigation = useNavigation<HomeStackNavProp<'HomeRoot'>>();
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const openNewGameSetup = useAppStore((s) => s.openNewGameSetup);
  const playerById = useAppStore((s) => s.playerById);

  const recent = history.slice(0, 3);
  const totalGamesLabel = history.length
    ? `${history.length} partie${history.length > 1 ? 's' : ''} enregistrée${history.length > 1 ? 's' : ''}`
    : 'Prêt pour ta première partie ?';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>SCOREPARTY</Text>
        <View style={styles.diceBadge}>
          <Text style={{ fontSize: 18 }}>🎲</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{totalGamesLabel}</Text>

      <PressableScale
        onPress={() => {
          openNewGameSetup();
          navigation.navigate('Setup');
        }}
        style={{ marginTop: 20 }}
      >
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cta, shadows.cta]}>
          <Text style={styles.ctaPlus}>＋</Text>
          <Text style={styles.ctaLabel}>Nouvelle partie</Text>
        </LinearGradient>
      </PressableScale>

      <View style={styles.shortcuts}>
        <PressableScale style={styles.shortcut} scaleTo={0.96} onPress={() => navigation.navigate('HistoryTab')}>
          <Text style={styles.shortcutIcon}>📜</Text>
          <Text style={styles.shortcutTitle}>Historique</Text>
          <Text style={styles.shortcutSub}>{history.length} partie{history.length > 1 ? 's' : ''}</Text>
        </PressableScale>
        <PressableScale style={styles.shortcut} scaleTo={0.96} onPress={() => navigation.navigate('StatsTab')}>
          <Text style={styles.shortcutIcon}>📊</Text>
          <Text style={styles.shortcutTitle}>Statistiques</Text>
          <Text style={styles.shortcutSub}>Progression &amp; classements</Text>
        </PressableScale>
      </View>

      <Text style={styles.sectionTitle}>Dernières parties</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>Aucune partie enregistrée pour l'instant.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {recent.map((entry) => {
            const game = getGame(entry.gameId)!;
            const winner = playerById(game.rankingIds(entry)[0]);
            return (
              <View key={entry.id} style={styles.entryRow}>
                <IconBadge label={game.badge} color={game.color} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.entryName}>{game.name}</Text>
                  <Text style={styles.entryMeta}>
                    {fmtDate(entry.date)} · {entry.playerIds.length} joueurs
                  </Text>
                </View>
                <Text style={styles.entryResult}>👑 {game.resultLabel(entry, winner.name)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.headingBold, fontSize: 26, fontWeight: '700', color: colors.amber, letterSpacing: 1.5 },
  diceBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.red,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.textMuted, fontFamily: fonts.body },
  cta: {
    borderRadius: radii.xl,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaPlus: { fontSize: 22, color: colors.white },
  ctaLabel: { fontFamily: fonts.heading, fontSize: 19, fontWeight: '600', color: colors.white },
  shortcuts: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shortcut: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16 },
  shortcutIcon: { fontSize: 24 },
  shortcutTitle: { fontFamily: fonts.heading, fontWeight: '600', fontSize: 15, color: colors.textPrimary, marginTop: 8 },
  shortcutSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 24, marginBottom: 10 },
  empty: { fontSize: 13, color: colors.textMutedDark, textAlign: 'center', paddingVertical: 20 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radii.md, padding: 14 },
  entryName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  entryMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  entryResult: { fontSize: 12, color: colors.amber, fontWeight: '600', fontFamily: fonts.bodySemiBold, flexShrink: 0 },
});
