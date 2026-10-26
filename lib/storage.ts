// Shared demo persistence with an offline cache and retry queue.
import { seed } from './data';
import { offlineGet, offlineSet, offlineUpdate } from './offline-store';
import type { Database, Role } from './types';

const KEY = 'mahacare-db-v3';
const QUEUE = 'mahacare-pending-v1';
type Change = { table: keyof Database; id: string; before: unknown; after: unknown };
type Pending = { id: string; changes: Change[]; role: Role };
export class RegistrySaveError extends Error {}
let syncing: Promise<void> | null = null;
const baselines = new WeakMap<Database, Database>();

async function cached(): Promise<Database> {
  try {
    const db = await offlineGet<Database>(KEY);
    if (db?.centres && db?.documents && db?.inspections) return db;
    const legacy = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (legacy?.centres && legacy?.documents && legacy?.inspections) return legacy;
  } catch {}
  return seed();
}
async function remember(db: Database) {
  baselines.set(db, structuredClone(db));
  try {
    if (!localStorage.getItem('mahacare-shared-migrated')) {
      const legacy = localStorage.getItem(KEY);
      if (legacy) await offlineSet('mahacare-legacy-backup', JSON.parse(legacy));
      localStorage.setItem('mahacare-shared-migrated', 'yes');
    }
    await offlineSet(KEY, db);
  } catch {
    window.dispatchEvent(new CustomEvent('registry-cache-error', { detail: 'Records loaded online, but the offline cache could not be saved. Free device storage before working offline.' }));
  }
  return db;
}
async function pending(): Promise<Pending[]> {
  return await offlineGet<Pending[]>(QUEUE) || [];
}
export async function pendingCount() { return (await pending()).length; }
function role(): Role {
  try { return JSON.parse(localStorage.getItem('mahacare-session') || '{}').role || 'Centre'; } catch { return 'Centre'; }
}
async function send(changes: Change[], actor: Role): Promise<Database> {
  const response = await fetch('/api/registry', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-demo-role': actor }, body: JSON.stringify({ changes }) });
  const result = await response.json();
  if (!response.ok) throw new RegistrySaveError(result.error || 'Unable to save registry changes.');
  return result;
}
async function flushPending(): Promise<void> {
  const queue = await pending();
  while (queue.length) {
    await send(queue[0].changes, queue[0].role);
    const completed = queue[0].id;
    queue.shift();
    await offlineUpdate<Pending[]>(QUEUE, current => (current || []).filter(item => item.id !== completed));
  }
}
export function syncPending(): Promise<void> {
  if (!syncing) syncing = flushPending().finally(() => { syncing = null; });
  return syncing;
}
export async function load(): Promise<{ db: Database; recovered: boolean }> {
  if (typeof window === 'undefined') return { db: seed(), recovered: false };
  try {
    await syncPending();
    const response = await fetch('/api/registry', { cache: 'no-store' });
    if (!response.ok) throw new Error('Registry unavailable.');
    return { db: await remember(await response.json()), recovered: false };
  } catch (error) {
    window.dispatchEvent(new CustomEvent('registry-cache-error', { detail: error instanceof RegistrySaveError ? `Sync blocked: ${error.message} Pending work is kept on this device.` : 'Server unavailable. Showing saved records from this device.' }));
    const db = await cached(); baselines.set(db, structuredClone(db));
    return { db, recovered: false };
  }
}
export async function save(db: Database, previous?: Database): Promise<Database> {
  const before = previous || baselines.get(db) || await cached();
  const changes: Change[] = [];
  for (const table of Object.keys(db) as (keyof Database)[]) {
    if (table === 'users') continue;
    for (const record of db[table]) {
      const previous = before[table].find(r => r.id === record.id) || null;
      if (JSON.stringify(previous) !== JSON.stringify(record)) changes.push({ table, id: record.id, before: previous, after: record });
    }
  }
  if (!changes.length) return db;
  try {
    await syncPending();
    const saved = await send(changes, role());
    await remember(saved);
    window.dispatchEvent(new Event('registry-updated'));
    return saved;
  } catch (error) {
    if (error instanceof RegistrySaveError) throw error;
    if (!(error instanceof TypeError) && navigator.onLine) throw new RegistrySaveError((error as Error).message);
    try { await offlineUpdate<Pending[]>(QUEUE, current => [...current || [], { id: crypto.randomUUID(), changes, role: role() }]); }
    catch (error) { throw new RegistrySaveError((error as Error).message); }
    await remember(db);
    window.dispatchEvent(new Event('registry-updated'));
    return db;
  }
}
export async function updateDatabase(db: Database, updater: (d: Database) => void): Promise<Database> {
  const clone = structuredClone(db); updater(clone);
  return save(clone, db);
}
