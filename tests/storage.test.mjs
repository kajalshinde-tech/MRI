import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = stripTypeScriptTypes(await readFile(new URL('../lib/storage.ts', import.meta.url), 'utf8'))
  .replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, '');
function fixture() {
  const cache = new Map();
  const prefs = new Map();
  let shared = { centres: [], documents: [], applicationEvents: [], inspections: [], complaints: [], notifications: [], users: [] };
  let failure = null;
  const navigator = { onLine: true };
  const localStorage = { getItem: key => prefs.get(key) || null, setItem: (key, value) => prefs.set(key, value) };
  const context = vm.createContext({
    seed: () => structuredClone(shared), navigator, localStorage, structuredClone, Error, TypeError,
    crypto: { randomUUID }, Event: class {}, CustomEvent: class {}, window: { dispatchEvent() {} },
    offlineGet: async key => structuredClone(cache.get(key)),
    offlineSet: async (key, value) => { cache.set(key, structuredClone(value)); },
    offlineUpdate: async (key, update) => { cache.set(key, structuredClone(update(cache.get(key)))); },
    fetch: async (_url, options) => {
      if (!navigator.onLine) throw new TypeError('Network unavailable');
      if (failure) return { ok: false, json: async () => ({ error: failure }) };
      if (options?.method === 'PATCH') {
        for (const change of JSON.parse(options.body).changes) {
          const records = shared[change.table];
          const index = records.findIndex(r => r.id === change.id);
          if (index < 0) records.push(change.after); else records[index] = change.after;
        }
      }
      return { ok: true, json: async () => structuredClone(shared) };
    },
  });
  const api = vm.runInContext(`${source}\n({load,save,updateDatabase,syncPending,pendingCount})`, context);
  return { api, navigator, cache, fail: message => failure = message, shared: () => shared };
}

test('offline changes persist and retry successfully on reconnection', async () => {
  const f = fixture();
  const { db } = await f.api.load();
  f.navigator.onLine = false;
  const saved = await f.api.updateDatabase(db, draft => draft.centres.push({ id: 'offline-clinic', name: 'Test clinic' }));
  assert.equal(saved.centres[0].id, 'offline-clinic');
  assert.equal(await f.api.pendingCount(), 1);
  assert.equal(f.shared().centres.length, 0);
  assert.equal((await f.api.load()).db.centres[0].id, 'offline-clinic');
  f.navigator.onLine = true;
  await f.api.syncPending();
  assert.equal(await f.api.pendingCount(), 0);
  assert.equal(f.shared().centres[0].id, 'offline-clinic');
});
test('server rejection is shown as failure and is never queued as offline success', async () => {
  const f = fixture();
  const { db } = await f.api.load();
  f.fail('Complete the inspection first.');
  await assert.rejects(f.api.updateDatabase(db, draft => draft.centres.push({ id: 'invalid' })), /inspection first/);
  assert.equal(await f.api.pendingCount(), 0);
  assert.equal(f.shared().centres.length, 0);
});
test('a rejected queued change is retained for resolution', async () => {
  const f = fixture();
  const { db } = await f.api.load();
  f.navigator.onLine = false;
  await f.api.updateDatabase(db, draft => draft.centres.push({ id: 'pending' }));
  f.navigator.onLine = true;
  f.fail('This record changed on another device.');
  await assert.rejects(f.api.syncPending(), /another device/);
  assert.equal(await f.api.pendingCount(), 1);
});
