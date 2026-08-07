import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionLabel } from '../components/SectionLabel';
import { resolveTeamId, teamSizesValid } from '../games/dartsCricket';
import { GAMES } from '../games/registry';
import type { GameDef } from '../games/types';
import { HomeStackNavProp } from '../navigation/types';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';

const DART_GAME_IDS = ['darts-x01', 'darts-cricket', 'darts-atc', 'darts-shanghai'];
const TEAM_COLORS: Record<string, string> = { A: colors.teal, B: colors.orange, C: colors.violet, D: colors.cyan };

function renderGameTile(g: GameDef, selected: boolean, onPress: () => void) {
  return (
    <PressableScale
      key={g.id}
      scaleTo={0.98}
      onPress={onPress}
      style={[styles.gameCard, { backgroundColor: selected ? colors.surface : colors.surfaceAlt, borderColor: selected ? g.color : 'transparent' }]}
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
}

export function SetupScreen() {
  const navigation = useNavigation<HomeStackNavProp<'Setup'>>();
  const players = useAppStore((s) => s.players);
  const setup = useAppStore((s) => s.setup);
  const selectSetupGame = useAppStore((s) => s.selectSetupGame);
  const togglePlayer = useAppStore((s) => s.toggleSetupPlayer);
  const setNewPlayerName = useAppStore((s) => s.setSetupNewPlayerName);
  const addPlayer = useAppStore((s) => s.addSetupPlayer);
  const toggleVariant = useAppStore((s) => s.toggleSetupVariant);
  const selectDartsStartScore = useAppStore((s) => s.selectSetupDartsStartScore);
  const selectAtcHitType = useAppStore((s) => s.selectSetupAtcHitType);
  const selectMilleSaborsThreshold = useAppStore((s) => s.selectSetupMilleSaborsThreshold);
  const toggleSetupPlayerTeam = useAppStore((s) => s.toggleSetupPlayerTeam);
  const toggleCountsForContest = useAppStore((s) => s.toggleSetupCountsForContest);
  const startGame = useAppStore((s) => s.startGame);
  const contests = useAppStore((s) => s.contests);
  const activeContest = contests.find((c) => !c.endedAt) ?? null;

  const [dartsOpen, setDartsOpen] = useState(false);
  const isDartsSelected = !!setup.gameId && DART_GAME_IDS.includes(setup.gameId);
  const showDartsModes = dartsOpen || isDartsSelected;
  const nonDartGames = GAMES.filter((g) => !DART_GAME_IDS.includes(g.id));
  const dartGames = GAMES.filter((g) => DART_GAME_IDS.includes(g.id));

  const gameChosen = !!setup.gameId;
  const isTdc = setup.gameId === 'trou-du-cul';
  const isDartsX01 = setup.gameId === 'darts-x01';
  const isCricket = setup.gameId === 'darts-cricket';
  const isAtc = setup.gameId === 'darts-atc';
  const isShanghai = setup.gameId === 'darts-shanghai';
  const isMilleSabords = setup.gameId === 'mille-sabords';
  const selectedGame = GAMES.find((g) => g.id === setup.gameId);
  const minPlayers = selectedGame?.minPlayers ?? 2;
  const maxPlayers = selectedGame?.maxPlayers ?? 7;
  const count = setup.selectedPlayerIds.length;
  const cricketTeamMode = isCricket && !!setup.variants.teamMode;
  const teamsValid = !cricketTeamMode || (count >= 4 && count % 2 === 0 && teamSizesValid(setup.selectedPlayerIds, setup.dartsTeams));
  const canStart = gameChosen && count >= minPlayers && count <= maxPlayers && teamsValid;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Nouvelle partie</Text>
      </View>

      <SectionLabel>1. Choisis le jeu</SectionLabel>
      <View style={{ gap: 10, marginBottom: showDartsModes ? 10 : 24 }}>
        {nonDartGames.map((g) =>
          renderGameTile(g, g.id === setup.gameId, () => {
            setDartsOpen(false);
            selectSetupGame(g.id);
          }),
        )}
        <PressableScale
          scaleTo={0.98}
          onPress={() => setDartsOpen(true)}
          style={[
            styles.gameCard,
            { backgroundColor: showDartsModes ? colors.surface : colors.surfaceAlt, borderColor: showDartsModes ? colors.red : 'transparent' },
          ]}
        >
          <View style={[styles.gameBadge, { backgroundColor: colors.red }]}>
            <Text style={styles.gameBadgeText}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gameName}>Fléchettes</Text>
            <Text style={styles.gameTagline}>301/501 · Cricket · Around the Clock · Shanghai</Text>
          </View>
          {isDartsSelected && <Text style={{ fontSize: 20 }}>✅</Text>}
        </PressableScale>
      </View>

      {showDartsModes && (
        <>
          <SectionLabel>Choisis le mode</SectionLabel>
          <View style={{ gap: 10, marginBottom: 24, marginLeft: 16 }}>
            {dartGames.map((g) =>
              renderGameTile(g, g.id === setup.gameId, () => {
                setDartsOpen(true);
                selectSetupGame(g.id);
              }),
            )}
          </View>
        </>
      )}

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

          {isDartsX01 && (
            <>
              <SectionLabel>3. Score de départ</SectionLabel>
              <View style={styles.chipsWrap}>
                {[301, 501, 701].map((score) => (
                  <Chip
                    key={score}
                    label={String(score)}
                    active={!!setup.variants[score]}
                    activeBg={colors.red}
                    activeFg={colors.white}
                    onPress={() => selectDartsStartScore(score)}
                  />
                ))}
              </View>
              <View style={styles.chipsWrap}>
                <Chip
                  label="Double out"
                  active={setup.variants.doubleOut !== false}
                  activeBg={colors.orange}
                  activeFg={colors.bg}
                  onPress={() => toggleVariant('doubleOut')}
                />
                <Chip
                  label="Double in"
                  active={!!setup.variants.doubleIn}
                  activeBg={colors.orange}
                  activeFg={colors.bg}
                  onPress={() => toggleVariant('doubleIn')}
                />
              </View>
            </>
          )}

          {isCricket && (
            <>
              <SectionLabel>3. Variantes</SectionLabel>
              <View style={styles.chipsWrap}>
                <Chip
                  label="Cut-throat (score le plus bas gagne)"
                  active={!!setup.variants.cutThroat}
                  activeBg={colors.violet}
                  activeFg={colors.white}
                  onPress={() => toggleVariant('cutThroat')}
                />
                <Chip
                  label="Mode Équipe"
                  active={!!setup.variants.teamMode}
                  activeBg={colors.teal}
                  activeFg={colors.bg}
                  onPress={() => toggleVariant('teamMode')}
                />
                <Chip
                  label="Crazy Cricket"
                  active={!!setup.variants.crazyMode}
                  activeBg={colors.orange}
                  activeFg={colors.bg}
                  onPress={() => toggleVariant('crazyMode')}
                />
              </View>

              {!!setup.variants.teamMode && setup.selectedPlayerIds.length > 0 && (
                <>
                  <SectionLabel>Équipes de 2 (touche pour changer)</SectionLabel>
                  <View style={{ gap: 8, marginBottom: 10 }}>
                    {setup.selectedPlayerIds.map((pid, idx) => {
                      const player = players.find((p) => p.id === pid);
                      const team = resolveTeamId(pid, idx, setup.dartsTeams);
                      const teamColor = TEAM_COLORS[team] ?? colors.textMuted;
                      return (
                        <PressableScale
                          key={pid}
                          scaleTo={0.98}
                          onPress={() => toggleSetupPlayerTeam(pid, idx)}
                          style={[styles.teamRow, { borderColor: teamColor }]}
                        >
                          <View style={[styles.dot, { backgroundColor: player?.color }]} />
                          <Text style={styles.teamPlayerName}>{player?.name}</Text>
                          <Text style={[styles.teamBadge, { color: teamColor }]}>Équipe {team}</Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                  {!teamsValid && (
                    <Text style={[styles.hint, { color: colors.red, marginBottom: 10 }]}>
                      Chaque équipe doit compter exactement 2 joueurs (4, 6 ou 8 joueurs au total).
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {isAtc && (
            <>
              <SectionLabel>3. Type de touche requis</SectionLabel>
              <View style={styles.chipsWrap}>
                <Chip
                  label="Simple/double/triple"
                  active={!setup.variants.hitSingle && !setup.variants.hitDouble}
                  activeBg={colors.cyan}
                  activeFg={colors.bg}
                  onPress={() => selectAtcHitType('any')}
                />
                <Chip label="Simples uniquement" active={!!setup.variants.hitSingle} activeBg={colors.cyan} activeFg={colors.bg} onPress={() => selectAtcHitType('single')} />
                <Chip label="Doubles uniquement" active={!!setup.variants.hitDouble} activeBg={colors.cyan} activeFg={colors.bg} onPress={() => selectAtcHitType('double')} />
              </View>
              <View style={styles.chipsWrap}>
                <Chip
                  label="+ centre pour finir"
                  active={!!setup.variants.includeBull}
                  activeBg={colors.orange}
                  activeFg={colors.bg}
                  onPress={() => toggleVariant('includeBull')}
                />
              </View>
            </>
          )}

          {isShanghai && (
            <>
              <SectionLabel>3. Nombre de rounds</SectionLabel>
              <View style={styles.chipsWrap}>
                <Chip
                  label="7 rounds"
                  active={!setup.variants['20']}
                  activeBg={colors.teal}
                  activeFg={colors.bg}
                  onPress={() => setup.variants['20'] && toggleVariant('20')}
                />
                <Chip
                  label="20 rounds"
                  active={!!setup.variants['20']}
                  activeBg={colors.teal}
                  activeFg={colors.bg}
                  onPress={() => !setup.variants['20'] && toggleVariant('20')}
                />
              </View>
            </>
          )}

          {isMilleSabords && (
            <>
              <SectionLabel>3. Objectif de points</SectionLabel>
              <View style={styles.chipsWrap}>
                {[5000, 6000, 8000].map((t) => (
                  <Chip
                    key={t}
                    label={`${t} pts`}
                    active={!!setup.variants[t]}
                    activeBg={colors.amber}
                    activeFg={colors.bg}
                    onPress={() => selectMilleSaborsThreshold(t)}
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
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  teamPlayerName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  teamBadge: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bodyBold },
  hint: { fontSize: 12, color: colors.textMutedDark, textAlign: 'center', marginBottom: 10 },
});
