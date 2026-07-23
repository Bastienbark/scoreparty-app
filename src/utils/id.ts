export function uid(): string {
  return 'id' + Math.random().toString(36).slice(2, 9);
}
