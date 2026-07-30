/**
 * Safe-area insets (notch/Dynamic Island on top, home indicator on bottom)
 * are at most ~60pt (top) / ~34pt (bottom) on any real device.
 * react-native-safe-area-context's web implementation reads
 * `env(safe-area-inset-*)` via a probe element, and on iOS Safari these
 * values can be measured mid-transition while the browser's own toolbar is
 * animating in/out, occasionally producing values far larger than any real
 * device inset (a big block of empty space instead of the usual few
 * millimetres). Clamping guards against that without losing the padding on
 * devices that genuinely need it.
 */
const MAX_TOP_INSET = 60;
const MAX_BOTTOM_INSET = 34;

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

export function clampTopInset(value: number): number {
  return clamp(value, MAX_TOP_INSET);
}

export function clampBottomInset(value: number): number {
  return clamp(value, MAX_BOTTOM_INSET);
}
