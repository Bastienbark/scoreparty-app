import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

interface Props {
  position: number;
  name: string;
  color: string;
  scoreLabel: string;
  highlight?: boolean;
  medal?: string;
}

export function RankingRow({ position, name, color, scoreLabel, highlight, medal }: Props) {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <Text style={[styles.pos, { color: highlight ? colors.amber : colors.textPrimary }]}>{medal ?? position}</Text>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.name}>{name}</Text>
      <Text style={[styles.score, { color: highlight ? colors.amber : colors.textPrimary }]}>{scoreLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowHighlight: { borderColor: colors.amber },
  pos: { fontFamily: fonts.headingBold, fontSize: 13, width: 22, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  score: { fontFamily: fonts.headingBold, fontSize: 14, fontWeight: '700' },
});
