import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { PressableScale } from './PressableScale';

type Multiplier = 1 | 2 | 3;

interface Props {
  onThrow: (segment: number | 'bull' | 'miss', multiplier: Multiplier) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  /** When provided, only these targets are rendered (compact grid) instead of the full 1-20 + bull board. */
  enabledSegments?: (number | 'bull')[];
}

const FULL_SEGMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function DartsThrowPad({ onThrow, onUndo, canUndo, disabled, enabledSegments }: Props) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const bullDisabled = multiplier === 3;
  const compact = !!enabledSegments;

  const throwSegment = (segment: number | 'bull') => {
    if (disabled) return;
    if (segment === 'bull' && bullDisabled) return;
    onThrow(segment, multiplier);
    setMultiplier(1);
  };

  const throwMiss = () => {
    if (disabled) return;
    onThrow('miss', 1);
    setMultiplier(1);
  };

  const toggleMultiplier = (m: Multiplier) => {
    setMultiplier((current) => (current === m ? 1 : m));
  };

  const rows = compact ? chunk(enabledSegments as (number | 'bull')[], 4) : null;

  return (
    <View>
      <View style={styles.controlRow}>
        <PressableScale scaleTo={0.95} disabled={disabled} onPress={throwMiss} style={[styles.ctrlBtn, styles.ctrlMiss]}>
          <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>RATÉ</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.95}
          disabled={disabled}
          onPress={() => toggleMultiplier(2)}
          style={[styles.ctrlBtn, { backgroundColor: multiplier === 2 ? colors.amber : colors.surfaceAlt2 }]}
        >
          <Text style={[styles.ctrlLabel, { color: multiplier === 2 ? colors.bg : colors.amber }]}>DOUBLE</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.95}
          disabled={disabled}
          onPress={() => toggleMultiplier(3)}
          style={[styles.ctrlBtn, { backgroundColor: multiplier === 3 ? colors.orange : colors.surfaceAlt2 }]}
        >
          <Text style={[styles.ctrlLabel, { color: multiplier === 3 ? colors.bg : colors.orange }]}>TRIPLE</Text>
        </PressableScale>
        <PressableScale
          scaleTo={0.95}
          disabled={disabled || !canUndo}
          onPress={onUndo}
          style={[styles.ctrlBtn, styles.ctrlUndo, !canUndo && { opacity: 0.4 }]}
        >
          <Text style={[styles.ctrlLabel, { color: colors.red }]}>⌫ ANNULER</Text>
        </PressableScale>
      </View>

      {compact ? (
        <View style={{ gap: 8 }}>
          {rows!.map((row, i) => (
            <View key={i} style={styles.compactRow}>
              {row.map((seg) => {
                const isBull = seg === 'bull';
                const segDisabled = disabled || (isBull && bullDisabled);
                return (
                  <PressableScale
                    key={seg}
                    scaleTo={0.94}
                    disabled={segDisabled}
                    onPress={() => throwSegment(seg)}
                    style={[styles.compactBtn, isBull && styles.bullCompact, segDisabled && { opacity: 0.35 }]}
                  >
                    <Text style={[styles.compactLabel, isBull && { color: colors.white }]}>{isBull ? 'BULL' : seg}</Text>
                  </PressableScale>
                );
              })}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {FULL_SEGMENTS.map((n) => (
            <PressableScale key={n} scaleTo={0.9} disabled={disabled} onPress={() => throwSegment(n)} style={styles.segment}>
              <Text style={styles.segmentLabel}>{n}</Text>
            </PressableScale>
          ))}
          <PressableScale
            scaleTo={0.9}
            disabled={disabled || bullDisabled}
            onPress={() => throwSegment('bull')}
            style={[styles.segment, styles.bull, bullDisabled && { opacity: 0.35 }]}
          >
            <Text style={[styles.segmentLabel, { color: colors.white }]}>BULL</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controlRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  ctrlBtn: { flex: 1, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  ctrlMiss: { backgroundColor: colors.surfaceAlt2 },
  ctrlUndo: { backgroundColor: 'rgba(255,56,100,0.16)' },
  ctrlLabel: { fontSize: 11, fontWeight: '700', fontFamily: fonts.bodyBold, letterSpacing: 0.3 },
  compactRow: { flexDirection: 'row', gap: 8 },
  compactBtn: {
    flex: 1,
    height: 62,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLabel: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.bodyBold },
  bullCompact: { backgroundColor: colors.violet },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: { width: '17.5%', aspectRatio: 1, borderRadius: radii.sm, backgroundColor: colors.surfaceAlt2, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.bodyBold },
  bull: { backgroundColor: colors.violet },
});
