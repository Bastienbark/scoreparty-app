import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from '../components/Chip';
import { IconBadge } from '../components/IconBadge';
import { PressableScale } from '../components/PressableScale';
import { ScreenContainer } from '../components/ScreenContainer';
import { GAMES, getGame } from '../games/registry';
import { useAppStore } from '../state/store';
import { Player } from '../types/models';
import { colors, fonts, radii } from '../theme/tokens';
import { confirmAction } from '../utils/confirm';
import { fmtDate } from '../utils/date';

export function HistoryScreen() {
  const history = useAppStore((s) => s.history);
  const players = useAppStore((s) => s.players);
  const filters = useAppStore((s) => s.historyFilters);
  const toggleHistGame = useAppStore((s) => s.toggleHistGame);
  const clearHistGameFilter = useAppStore((s) => s.clearHistGameFilter);
  const toggleHistPlayerFilter = useAppStore((s) => s.toggleHistPlayerFilter);
  const setHistDateFrom = useAppStore((s) => s.setHistDateFrom);
  const setHistDateTo = useAppStore((s) => s.setHistDateTo);
  const toggleHistExpand = useAppStore((s) => s.toggleHistExpand);
  const deleteHistoryEntry = useAppStore((s) => s.deleteHistoryEntry);
  const playerById = useAppStore((s) => s.playerById);

  const confirmDelete = async (id: string, gameName: string, dateLabel: string) => {
    const ok = await confirmAction({
      title: 'Supprimer cette partie ?',
      message: `La partie de ${gameName} du ${dateLabel} sera supprimée définitivement, y compris de la sauvegarde cloud si elle est active.`,
      confirmLabel: 'Supprimer',
    });
    if (ok) deleteHistoryEntry(id);
  };

  const playersMap = useMemo(() => {
    const m: Record<string, Player> = {};
    players.forEach((p) => (m[p.id] = p));
    return m;
  }, [players]);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (filters.gameIds.length && !filters.gameIds.includes(h.gameId)) return false;
      if (filters.playerIds.length && !filters.playerIds.every((pid) => h.playerIds.includes(pid))) return false;
      if (filters.dateFrom && new Date(h.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(h.date) > new Date(filters.dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [history, filters]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Historique</Text>

      <View style={styles.chipsWrap}>
        <Chip label="Tous" active={filters.gameIds.length === 0} activeBg={colors.teal} activeFg={colors.bg} onPress={clearHistGameFilter} />
        {GAMES.map((g) => (
          <Chip
            key={g.id}
            label={g.name}
            active={filters.gameIds.includes(g.id)}
            activeBg={g.color}
            activeFg={colors.bg}
            onPress={() => toggleHistGame(g.id)}
          />
        ))}
      </View>
      <View style={styles.chipsWrap}>
        {players.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            active={filters.playerIds.includes(p.id)}
            activeBg={p.color}
            activeFg={colors.bg}
            onPress={() => toggleHistPlayerFilter(p.id)}
          />
        ))}
      </View>
      <View style={styles.dateRow}>
        <TextInput
          value={filters.dateFrom}
          onChangeText={setHistDateFrom}
          placeholder="Du (AAAA-MM-JJ)"
          placeholderTextColor={colors.textMuted}
          style={styles.dateInput}
        />
        <TextInput
          value={filters.dateTo}
          onChangeText={setHistDateTo}
          placeholder="Au (AAAA-MM-JJ)"
          placeholderTextColor={colors.textMuted}
          style={styles.dateInput}
        />
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>Aucune partie ne correspond à ces filtres.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((entry) => {
            const game = getGame(entry.gameId)!;
            const winner = playerById(game.rankingIds(entry)[0]);
            const expanded = !!filters.expanded[entry.id];
            return (
              <PressableScale key={entry.id} scaleTo={0.99} onPress={() => toggleHistExpand(entry.id)} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <IconBadge label={game.badge} color={game.color} size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.entryName}>{game.name}</Text>
                    <Text style={styles.entryMeta}>
                      {fmtDate(entry.date)} · {entry.playerIds.length} joueur{entry.playerIds.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.entryWinner}>👑 {winner.name}</Text>
                </View>
                {expanded && (
                  <View style={styles.detail}>
                    {game.detailLines(entry, playersMap).map((line, idx) => (
                      <Text key={idx} style={styles.detailLine}>
                        {line}
                      </Text>
                    ))}
                    <PressableScale
                      scaleTo={0.97}
                      onPress={() => confirmDelete(entry.id, game.name, fmtDate(entry.date))}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnLabel}>🗑️ Supprimer cette partie</Text>
                    </PressableScale>
                  </View>
                )}
              </PressableScale>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dateInput: {
    flex: 1,
    borderRadius: radii.xl,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  empty: { fontSize: 13, color: colors.textMutedDark, textAlign: 'center', paddingVertical: 30 },
  entry: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 14 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  entryMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  entryWinner: { fontSize: 12, color: colors.amber, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 4 },
  detailLine: { fontSize: 12, color: colors.textBody, fontFamily: fonts.body },
  deleteBtn: { marginTop: 10, borderRadius: radii.sm, paddingVertical: 9, alignItems: 'center', backgroundColor: 'rgba(255,56,100,0.12)' },
  deleteBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.red, fontFamily: fonts.bodySemiBold },
});
