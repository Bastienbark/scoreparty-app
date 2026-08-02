import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionLabel } from '../components/SectionLabel';
import { GAMES } from '../games/registry';
import { HomeStackNavProp } from '../navigation/types';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';

export function SetupScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Setup'>>();
  const players = useAppStore((s) => s.players);
  const setup = useAppStore((s) => s.setup);
  const selectSetupGame = useAppStore((s) => s.selectSetupGame);
  const togglePlayer = useAppStore((s) => s.toggleSetupPlayer);
  const setNewPlayerName = useAppStore((s) => s.setSetupNewPlayerName);
  const addPlayer = useAppStore((s) => s.addSetupPlayer);
  const toggleVariant = useAppStore((s) => s.toggleSetupVariant);
  const toggleCountsForContest = useAppStore((s) => s.toggleSetupCountsForContest);
  const startGame = useAppStore((s) => s.startGame);
  const contests = useAppStore((s) => s.contests);
  const activeContest = contests.find((c) => !c.endedAt) ?? null;

  const gameChosen = !!setup.gameId;
  const isTdc = setup.gameId === 'trou-du-cul';
  const selectedGame = GAMES.find((g) => g.id === setup.gameId);
  const minPlayers = selectedGame?.minPlayers ?? 2;
  const maxPlayers = selectedGame?.maxPlayers ?? 7;
  const count = setup.selectedPlayerIds.length;
  const canStart = gameChosen && count >= minPlayers && count <= maxPlayers;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Nouvelle partie</Text>
      </View>

      <SectionLabel>1. Choisis le jeu</SectionLabel>
      <View style={{ gap: 10, marginBottom: 24 }}>
        {GAMES.map((g) => {
          const selected = g.id === setup.gameId;
          return (
            <PressableScale
              key={g.id}
              scaleTo={0.98}
              onPress={() => selectSetupGame(g.id)}
              style={[
                styles.gameCard,
                { backgroundColor: selected ? colors.surface : colors.surfaceAlt, borderColor: selected ? g.color : 'transparent' },
              ]}
            >
              <View style={[styles.gameBadge, { backgroundColor: g.color }]}>
                <Text style={styles.gameBadgeText}>{g.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gameName}>{g.name}</Text>
                <Text style={styles.gameTagline}>{g.tagline}</Text>
              </View>
              {selected && <Text style={{ fontSize: 20 }}>✅</Text>}
            </PressableScale>
          );
        })}
      </View>

      {gameChosen && (
        <>
          <SectionLabel>2. Choisis les joueurs ({count}/{maxPlayers})</SectionLabel>
          <View style={styles.chipsWrap}>
            {players.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                active={setup.selectedPlayerIds.includes(p.id)}
                activeBg={p.color}
                activeFg={colors.bg}
                dotColor={p.color}
                onPress={() => togglePlayer(p.id)}
              />
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              value={setup.newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Ajouter un joueur…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              onSubmitEditing={addPlayer}
              returnKeyType="done"
            />
            <PressableScale scaleTo={0.94} onPress={addPlayer} style={styles.addBtn}>
              <Text style={styles.addBtnText}>＋</Text>
            </PressableScale>
          </View>

          {isTdc && (
            <>
              <SectionLabel>3. Variantes (optionnel)</SectionLabel>
              <View style={styles.chipsWrap}>
                {selectedGame?.variantDefs.map((v) => (
                  <Chip
                    key={v.key}
                    label={v.label}
                    active={!!setup.variants[v.key]}
                    activeBg={colors.orange}
                    activeFg={colors.bg}
                    onPress={() => toggleVariant(v.key)}
                  />
                ))}
              </View>
            </>
          )}

          {activeContest && (
            <>
              <SectionLabel>Concours</SectionLabel>
              <View style={{ marginBottom: 20 }}>
                <Chip
                  label={setup.countsForContest ? `🏆 Compte pour "${activeContest.name}"` : '🚫 Partie hors concours'}
                  active={setup.countsForContest}
                  activeBg={colors.amber}
                  activeFg={colors.bg}
                  onPress={toggleCountsForContest}
                />
              </View>
            </>
          )}

          <Text style={styles.hint}>
            Sélectionne {minPlayers} à {maxPlayers} joueurs ({count} sélectionné{count > 1 ? 's' : ''})
          </Text>
          <Button
            label="Commencer la partie 🚀"
            disabled={!canStart}
            onPress={() => {
              if (startGame()) navigation.navigate('Live');
            }}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontFamily: fonts.heading, fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  gameCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radii.lg, padding: 16, borderWidth: 2 },
  gameBadge: { width: 46, height: 46, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  gameBadgeText: { fontFamily: fonts.headingBold, fontWeight: '700', fontSize: 13, color: colors.bg },
  gameName: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  gameTagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  input: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  addBtn: { borderRadius: radii.sm, paddingHorizontal: 16, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: colors.bg, fontWeight: '700', fontSize: 18 },
  hint: { fontSize: 12, color: colors.textMutedDark, textAlign: 'center', marginBottom: 10 },
});
