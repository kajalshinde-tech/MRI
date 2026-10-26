'use client';
import { useEffect, useState } from 'react';
export function useReportUrl(udcid: string) {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/api/config', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(config => {
      if (config?.publicOrigin) setOrigin(config.publicOrigin);
    }).catch(() => {});
  }, []);
  return origin && udcid ? `${origin}/mobile/centres/${encodeURIComponent(udcid)}` : '';
}
