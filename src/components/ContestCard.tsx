import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';
import { fmtDate } from '../utils/date';
import { confirmAction } from '../utils/confirm';
import { PressableScale } from './PressableScale';

export function ContestCard() {
  const contests = useAppStore((s) => s.contests);
  const startContest = useAppStore((s) => s.startContest);
  const endContest = useAppStore((s) => s.endContest);

  const [startOpen, setStartOpen] = useState(false);
  const [name, setName] = useState('');

  const active = contests.find((c) => !c.endedAt) ?? null;
  const last = !active ? contests[0] ?? null : null;

  const confirmEnd = async () => {
    if (!active) return;
    const ok = await confirmAction({
      title: 'Terminer le concours ?',
      message: `"${active.name}" sera clôturé. Les prochaines parties ne compteront plus pour lui, mais ses statistiques restent consultables.`,
      confirmLabel: 'Terminer',
    });
    if (ok) endContest();
  };

  const launch = () => {
    startContest(name);
    setName('');
    setStartOpen(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏆 {active ? 'Concours en cours' : 'Concours'}</Text>

      {active ? (
        <>
          <Text style={styles.name}>{active.name}</Text>
          <Text style={styles.muted}>Démarré le {fmtDate(active.startedAt)} · les parties enregistrées comptent pour ce concours</Text>
          <PressableScale scaleTo={0.97} onPress={confirmEnd} style={styles.endBtn}>
            <Text style={styles.endBtnLabel}>Terminer le concours</Text>
          </PressableScale>
        </>
      ) : (
        <>
          {last && <Text style={styles.muted}>Dernier concours : {last.name} (terminé le {fmtDate(last.endedAt!)})</Text>}
          {!last && <Text style={styles.muted}>Aucun concours en cours.</Text>}

          {startOpen ? (
            <View style={styles.startRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nom du concours (optionnel)"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                onSubmitEditing={launch}
                returnKeyType="done"
              />
              <PressableScale scaleTo={0.94} onPress={launch} style={styles.launchBtn}>
                <Text style={styles.launchBtnLabel}>Lancer 🚀</Text>
              </PressableScale>
            </View>
          ) : (
            <PressableScale scaleTo={0.97} onPress={() => setStartOpen(true)} style={styles.startBtn}>
              <Text style={styles.startBtnLabel}>Démarrer un concours</Text>
            </PressableScale>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, marginTop: 16 },
  title: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  name: { fontFamily: fonts.headingBold, fontSize: 16, fontWeight: '700', color: colors.amber, marginTop: 8 },
  muted: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  endBtn: { marginTop: 12, backgroundColor: colors.surfaceAlt2, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  endBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.red, fontFamily: fonts.bodySemiBold },
  startBtn: { marginTop: 12, backgroundColor: colors.surfaceAlt2, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  startBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.teal, fontFamily: fonts.bodySemiBold },
  startRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceAlt2,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  launchBtn: { borderRadius: radii.sm, paddingHorizontal: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  launchBtnLabel: { color: colors.bg, fontWeight: '700', fontSize: 12, fontFamily: fonts.bodyBold },
});
