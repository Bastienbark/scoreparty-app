import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { PressableScale } from './PressableScale';

type Multiplier = 1 | 2 | 3;

interface Props {
  onThrow: (segment: number | 'bull', multiplier: Multiplier) => void;
  disabled?: boolean;
  /** Restrict tappable segments (e.g. cricket's 15-20 + bull) — others render dimmed. Omit for all 1-20 + bull. */
  enabledSegments?: (number | 'bull')[];
}

const MULT_LABEL: Record<Multiplier, string> = { 1: 'SIMPLE', 2: 'DOUBLE', 3: 'TRIPLE' };
const SEGMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

export function DartsThrowPad({ onThrow, disabled, enabledSegments }: Props) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const bullDisabled = multiplier === 3;
  const isEnabled = (segment: number | 'bull') => !enabledSegments || enabledSegments.includes(segment);

  const throwSegment = (segment: number | 'bull') => {
    if (disabled || !isEnabled(segment)) return;
    if (segment === 'bull' && bullDisabled) return;
    onThrow(segment, multiplier);
    setMultiplier(1);
  };

  return (
    <View>
      <View style={styles.multRow}>
        {([1, 2, 3] as Multiplier[]).map((m) => (
          <PressableScale
            key={m}
            scaleTo={0.95}
            disabled={disabled}
            onPress={() => setMultiplier(m)}
            style={[styles.multBtn, multiplier === m && { backgroundColor: colors.teal }]}
          >
            <Text style={[styles.multLabel, { color: multiplier === m ? colors.bg : colors.textMuted }]}>{MULT_LABEL[m]}</Text>
          </PressableScale>
        ))}
      </View>

      <View style={styles.grid}>
        {SEGMENTS.map((n) => (
          <PressableScale
            key={n}
            scaleTo={0.9}
            disabled={disabled || !isEnabled(n)}
            onPress={() => throwSegment(n)}
            style={[styles.segment, !isEnabled(n) && { opacity: 0.3 }]}
          >
            <Text style={styles.segmentLabel}>{n}</Text>
          </PressableScale>
        ))}
        <PressableScale
          scaleTo={0.9}
          disabled={disabled || bullDisabled || !isEnabled('bull')}
          onPress={() => throwSegment('bull')}
          style={[styles.segment, styles.bull, (bullDisabled || !isEnabled('bull')) && { opacity: 0.35 }]}
        >
          <Text style={[styles.segmentLabel, { color: colors.white }]}>BULL</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  multRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  multBtn: { flex: 1, borderRadius: radii.sm, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surfaceAlt2 },
  multLabel: { fontSize: 12, fontWeight: '700', fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: {
    width: '17.5%',
    aspectRatio: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.bodyBold },
  bull: { backgroundColor: colors.red, width: '100%' },
});
