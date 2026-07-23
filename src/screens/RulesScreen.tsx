import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { GAMES, getGameOrThrow } from '../games/registry';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';

export function RulesScreen() {
  const rulesGame = useAppStore((s) => s.rulesGame);
  const rulesQuery = useAppStore((s) => s.rulesQuery);
  const rulesOpenTheme = useAppStore((s) => s.rulesOpenTheme);
  const selectRulesGame = useAppStore((s) => s.selectRulesGame);
  const setRulesQuery = useAppStore((s) => s.setRulesQuery);
  const toggleRulesTheme = useAppStore((s) => s.toggleRulesTheme);

  const game = getGameOrThrow(rulesGame);
  const query = rulesQuery.trim().toLowerCase();
  const allQA = useMemo(() => game.rulesContent.flatMap((t) => t.items), [game]);
  const results = query ? allQA.filter((qa) => (qa.q + ' ' + qa.a).toLowerCase().includes(query)) : [];

  return (
    <ScreenContainer>
      <Text style={styles.title}>Règles du jeu</Text>

      <View style={styles.gameRow}>
        {GAMES.map((g) => (
          <PressableScale
            key={g.id}
            scaleTo={0.97}
            onPress={() => selectRulesGame(g.id)}
            style={[styles.gameBtn, { backgroundColor: rulesGame === g.id ? g.color : colors.surface }]}
          >
            <Text style={[styles.gameBtnLabel, { color: rulesGame === g.id ? colors.bg : colors.textPrimary }]}>{g.name}</Text>
          </PressableScale>
        ))}
      </View>

      <TextInput
        value={rulesQuery}
        onChangeText={setRulesQuery}
        placeholder="Pose ta question… ex: combien vaut un joker ?"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />

      {query ? (
        <View style={{ gap: 10 }}>
          {results.map((qa, idx) => (
            <View key={idx} style={styles.qaCard}>
              <Text style={styles.qaQAmber}>{qa.q}</Text>
              <Text style={styles.qaA}>{qa.a}</Text>
            </View>
          ))}
          {results.length === 0 && <Text style={styles.empty}>Aucune réponse trouvée. Essaie une autre formulation.</Text>}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {game.rulesContent.map((theme) => {
            const open = rulesOpenTheme === theme.id;
            return (
              <View key={theme.id} style={styles.themeCard}>
                <PressableScale onPress={() => toggleRulesTheme(theme.id)} style={styles.themeHeader}>
                  <Text style={styles.themeTitle}>{theme.title}</Text>
                  <Text style={styles.chevron}>{open ? '︿' : '﹀'}</Text>
                </PressableScale>
                {open && (
                  <View style={styles.themeBody}>
                    {theme.items.map((qa, idx) => (
                      <View key={idx}>
                        <Text style={styles.qaQTeal}>{qa.q}</Text>
                        <Text style={styles.qaA}>{qa.a}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  gameRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gameBtn: { flex: 1, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  gameBtnLabel: { fontSize: 13, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  search: {
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 16,
  },
  qaCard: { backgroundColor: colors.surface, borderRadius: radii.sm, padding: 14 },
  qaQAmber: { fontSize: 13, fontWeight: '700', color: colors.amber, marginBottom: 6, fontFamily: fonts.bodyBold },
  qaQTeal: { fontSize: 12, fontWeight: '700', color: colors.teal, marginBottom: 3, fontFamily: fonts.bodyBold },
  qaA: { fontSize: 13, color: colors.textBody, lineHeight: 19, fontFamily: fonts.body },
  empty: { fontSize: 13, color: colors.textMutedDark, textAlign: 'center', paddingVertical: 20 },
  themeCard: { backgroundColor: colors.surface, borderRadius: radii.sm, overflow: 'hidden' },
  themeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  themeTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chevron: { fontSize: 14, color: colors.textMuted },
  themeBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
});
