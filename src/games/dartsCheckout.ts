interface Segment {
  label: string;
  value: number;
  isDouble: boolean;
}

const SEGMENTS: Segment[] = [];
for (let n = 1; n <= 20; n++) {
  SEGMENTS.push({ label: `${n}`, value: n, isDouble: false });
  SEGMENTS.push({ label: `D${n}`, value: n * 2, isDouble: true });
  SEGMENTS.push({ label: `T${n}`, value: n * 3, isDouble: false });
}
SEGMENTS.push({ label: '25', value: 25, isDouble: false });
SEGMENTS.push({ label: 'Bull', value: 50, isDouble: true });

// Largest value first: mirrors how players actually go for checkouts (clear
// the big numbers first), and happens to reproduce the standard outshot
// table for the common cases (e.g. 100 -> T20, D20).
const BY_VALUE_DESC = [...SEGMENTS].sort((a, b) => b.value - a.value);

function findFinish(remaining: number, doubleOut: boolean, dartsLeft: number): string[] | null {
  if (dartsLeft <= 0) return null;
  for (const seg of BY_VALUE_DESC) {
    if (seg.value > remaining) continue;
    const rest = remaining - seg.value;
    if (rest === 0) {
      if (doubleOut && !seg.isDouble) continue;
      return [seg.label];
    }
    if (dartsLeft > 1) {
      const sub = findFinish(rest, doubleOut, dartsLeft - 1);
      if (sub) return [seg.label, ...sub];
    }
  }
  return null;
}

/**
 * Suggests a checkout (up to 3 darts) for the given remaining score, or null
 * when there's no valid finish within 3 darts (e.g. the classic "bogey"
 * numbers 169/168/166/165/163/162/159 under double-out).
 */
export function suggestCheckout(remaining: number, doubleOut: boolean): string[] | null {
  if (remaining <= 1 || remaining > 170) return null;
  if (doubleOut && remaining === 1) return null;
  return findFinish(remaining, doubleOut, 3);
}
