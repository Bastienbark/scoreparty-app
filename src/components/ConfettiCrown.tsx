import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { playerColors } from '../theme/tokens';

const PIECE_COUNT = 14;
const FALL_DISTANCE = 420;

function ConfettiPiece({ index }: { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const duration = 1600 + (index % 3) * 400;
  const delay = (index % 5) * 200;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-40, FALL_DISTANCE] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const opacity = progress.interpolate({ inputRange: [0, 0.05, 1], outputRange: [1, 1, 0] });
  const left = `${(index * 7) % 100}%`;
  const color = playerColors[index % playerColors.length];

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: left as `${number}%`, backgroundColor: color, opacity, transform: [{ translateY }, { rotate }] },
      ]}
    />
  );
}

export function Confetti() {
  return (
    <View style={styles.confettiLayer} pointerEvents="none">
      {Array.from({ length: PIECE_COUNT }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

export function BouncingCrown() {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });

  return (
    <Animated.Text style={[styles.crown, { transform: [{ translateY }, { rotate }] }]}>👑</Animated.Text>
  );
}

const styles = StyleSheet.create({
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  piece: { position: 'absolute', top: 0, width: 8, height: 8, borderRadius: 2 },
  crown: { fontSize: 44, textAlign: 'center' },
});
