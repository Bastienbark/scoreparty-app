import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { Button } from './Button';
import { PressableScale } from './PressableScale';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

interface Props {
  visible: boolean;
  title: string;
  value: string;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NumericKeypadModal({ visible, title, value, onDigit, onBackspace, onCancel, onConfirm }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, anim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: anim,
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.display}>{value || '0'}</Text>
          <View style={styles.grid}>
            {DIGITS.map((d) => (
              <PressableScale key={d} scaleTo={0.94} onPress={() => onDigit(d)} style={styles.key}>
                <Text style={styles.keyLabel}>{d}</Text>
              </PressableScale>
            ))}
            <PressableScale scaleTo={0.94} onPress={onBackspace} style={styles.key}>
              <Text style={[styles.keyLabel, { color: colors.orange, fontSize: 16 }]}>⌫</Text>
            </PressableScale>
          </View>
          <View style={styles.actions}>
            <Button label="Annuler" onPress={onCancel} variant="secondary" size="md" style={styles.actionBtn} />
            <Button label="Valider ✓" onPress={onConfirm} variant="accent" size="md" style={[styles.actionBtn, { flex: 1.4 }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,32,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 20 },
  title: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '600', textAlign: 'center', color: colors.textPrimary, marginBottom: 4 },
  display: { fontFamily: fonts.headingBold, fontSize: 38, fontWeight: '700', textAlign: 'center', color: colors.amber, marginVertical: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '31%',
    paddingVertical: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1 },
});
