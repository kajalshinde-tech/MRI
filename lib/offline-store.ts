// IndexedDB provides space for photographs and documents without localStorage's
// small, synchronous quota. Existing localStorage demo data remains recoverable.
let connection: Promise<IDBDatabase> | null = null;
function open() {
  if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('mahacare-offline', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Offline device storage is unavailable.'));
  });
  return connection;
}
export async function offlineGet<T>(key: string): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction('records', 'readonly').objectStore('records').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function offlineSet(key: string, value: unknown): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite');
    transaction.objectStore('records').put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Device storage is full or unavailable.'));
    transaction.onabort = () => reject(new Error('Device storage write was interrupted.'));
  });
}
export async function offlineDelete(key: string): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite');
    transaction.objectStore('records').delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function offlineUpdate<T>(key: string, update: (current: T | undefined) => T): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite');
    const store = transaction.objectStore('records');
    const request = store.get(key);
    request.onsuccess = () => store.put(update(request.result), key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to update offline storage.'));
  });
}
