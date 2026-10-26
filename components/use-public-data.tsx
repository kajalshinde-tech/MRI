'use client';
import { useEffect, useState } from 'react';
import { load } from '@/lib/storage';
import type { Database } from '@/lib/types';

export function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => load().then(result => { if (active) { setDb(result.db); setError(''); } }).catch(error => { if (active) setError(error.message); });
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('registry-updated', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('registry-updated', refresh); };
  }, []);
  return { db, recovered: false, setDb, error };
}
export function usePublicData() {
  const { db, error } = useDatabase();
  return { db, error, centres: db ? db.centres.filter(c => c.status === 'Approved') : null };
}
