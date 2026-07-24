import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfigured } from '../lib/firebase';
import type { HistoryEntry, Player } from '../types/models';

// Excludes ambiguous characters (0/O, 1/I/L) to keep codes easy to read and type.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateSyncCode(): string {
  const group = () =>
    Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `${group()}-${group()}`;
}

export function normalizeSyncCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

interface CloudSnapshot {
  players: Player[];
  history: HistoryEntry[];
  updatedAt: string;
}

export async function pushSnapshot(code: string, players: Player[], history: HistoryEntry[]): Promise<void> {
  if (!db) return;
  const snapshot: CloudSnapshot = { players, history, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'syncs', code), snapshot);
}

export async function fetchSnapshot(code: string): Promise<CloudSnapshot | null> {
  if (!db) return null;
  const ref = doc(db, 'syncs', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as CloudSnapshot;
}

export async function deleteSnapshot(code: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'syncs', code));
}

export { firebaseConfigured };
