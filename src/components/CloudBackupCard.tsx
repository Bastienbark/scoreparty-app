import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../state/store';
import { colors, fonts, radii } from '../theme/tokens';
import { PressableScale } from './PressableScale';

function statusLabel(status: string, lastSyncedAt: string | null, error: string | null): string {
  if (status === 'syncing') return 'Sauvegarde en cours…';
  if (status === 'error') return error ?? 'Erreur de sauvegarde';
  if (status === 'synced' && lastSyncedAt) {
    const d = new Date(lastSyncedAt);
    return `Sauvegardé à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return 'Jamais sauvegardé sur cet appareil';
}

export function CloudBackupCard() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncCode = useAppStore((s) => s.syncCode);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const syncError = useAppStore((s) => s.syncError);
  const syncNow = useAppStore((s) => s.syncNow);
  const restoreFromSyncCode = useAppStore((s) => s.restoreFromSyncCode);
  const resetAllData = useAppStore((s) => s.resetAllData);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  const disabled = syncStatus === 'disabled';

  const copyCode = async () => {
    if (!syncCode) return;
    await Clipboard.setStringAsync(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const confirmRestore = () => {
    const code = inputCode.trim();
    if (!code) return;
    Alert.alert(
      'Restaurer cette sauvegarde ?',
      `Les joueurs et l'historique de cet appareil seront remplacés par la sauvegarde du code ${code.toUpperCase()}. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: async () => {
            const res = await restoreFromSyncCode(code);
            if (res.ok) {
              setRestoreOpen(false);
              setInputCode('');
              Alert.alert('Restauré ✅', 'Tes joueurs et ton historique ont été remplacés par la sauvegarde.');
            } else {
              Alert.alert('Échec', res.error ?? 'Code introuvable.');
            }
          },
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert(
      'Réinitialiser toutes les données ?',
      "Tous les joueurs et toutes les parties seront supprimés définitivement, sur cet appareil et dans la sauvegarde cloud. Cette action est irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await resetAllData();
            setResetting(false);
            Alert.alert('Réinitialisé ✅', 'Toutes les données ont été supprimées. Tu repars de zéro.');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>☁️ Sauvegarde cloud</Text>
        {syncStatus === 'syncing' && <ActivityIndicator size="small" color={colors.teal} />}
      </View>

      {disabled ? (
        <Text style={styles.muted}>Non configurée sur ce déploiement (voir le README).</Text>
      ) : (
        <>
          <Text style={styles.muted}>{statusLabel(syncStatus, lastSyncedAt, syncError)}</Text>

          <PressableScale scaleTo={0.97} onPress={copyCode} style={styles.codeRow}>
            <Text style={styles.code}>{syncCode}</Text>
            <Text style={styles.copyLabel}>{copied ? 'Copié ✓' : 'Copier'}</Text>
          </PressableScale>
          <Text style={styles.hint}>Note ce code : il permet de retrouver tes données sur un autre appareil ou après réinstallation.</Text>

          <View style={styles.actionsRow}>
            <PressableScale scaleTo={0.97} onPress={syncNow} style={styles.actionBtn}>
              <Text style={styles.actionLabel}>Sauvegarder maintenant</Text>
            </PressableScale>
            <PressableScale scaleTo={0.97} onPress={() => setRestoreOpen((v) => !v)} style={styles.actionBtn}>
              <Text style={styles.actionLabel}>Restaurer avec un code</Text>
            </PressableScale>
          </View>

          {restoreOpen && (
            <View style={styles.restoreRow}>
              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="XXXXX-XXXXX"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={styles.restoreInput}
              />
              <PressableScale scaleTo={0.94} onPress={confirmRestore} style={styles.restoreBtn}>
                <Text style={styles.restoreBtnLabel}>Restaurer</Text>
              </PressableScale>
            </View>
          )}
        </>
      )}

      <PressableScale scaleTo={0.97} onPress={confirmReset} style={styles.resetBtn} disabled={resetting}>
        <Text style={styles.resetBtnLabel}>{resetting ? 'Réinitialisation…' : '🗑️ Réinitialiser toutes les données'}</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, marginTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.heading, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  muted: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt2,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  code: { fontFamily: fonts.headingBold, fontSize: 16, fontWeight: '700', color: colors.amber, letterSpacing: 1 },
  copyLabel: { fontSize: 12, color: colors.teal, fontWeight: '600', fontFamily: fonts.bodySemiBold },
  hint: { fontSize: 11, color: colors.textMutedDark, marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: colors.surfaceAlt2, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.bodySemiBold, textAlign: 'center' },
  restoreRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  restoreInput: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceAlt2,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  restoreBtn: { borderRadius: radii.sm, paddingHorizontal: 16, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  restoreBtnLabel: { color: colors.white, fontWeight: '700', fontSize: 12, fontFamily: fonts.bodyBold },
  resetBtn: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  resetBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.red, fontFamily: fonts.bodySemiBold },
});
