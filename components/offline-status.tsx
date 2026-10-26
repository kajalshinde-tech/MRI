'use client';
import { useEffect, useState } from 'react';
import { RegistrySaveError, syncPending, pendingCount } from '@/lib/storage';

export default function OfflineStatus() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => {
      setOffline(!navigator.onLine);
      pendingCount().then(setPending).catch(() => setError('Offline storage is unavailable.')); 
    };
    const sync = () => { refresh(); if (navigator.onLine) syncPending().then(() => { setError(''); refresh(); }).catch(error => setError(error.message)); };
    const failed = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof RegistrySaveError) { event.preventDefault(); setError(event.reason.message); }
    };
    const cacheError = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('registry-cache-error', cacheError);
    refresh(); sync();
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('online', sync);
    window.addEventListener('offline', refresh);
    window.addEventListener('registry-updated', refresh);
    window.addEventListener('unhandledrejection', failed);
    return () => {
      window.removeEventListener('registry-cache-error', cacheError);
      window.removeEventListener('online', sync); window.removeEventListener('offline', refresh);
      window.removeEventListener('registry-updated', refresh); window.removeEventListener('unhandledrejection', failed);
    };
  }, []);
  if (!offline && !pending && !error) return null;
  return <aside role="status" translate="no" className="registry-sync-status">
    <span>{error || (offline ? 'Offline — using saved records.' : 'Waiting to sync.')} {pending > 0 && `${pending} change set(s) saved on this device.`}</span>
    {!offline && <button onClick={() => syncPending().then(() => { setPending(0); setError(''); window.dispatchEvent(new Event('registry-updated')); }).catch(error => setError(error.message))}>Retry sync</button>}
    {error && <button onClick={() => setError('')}>Dismiss</button>}
  </aside>;
}
