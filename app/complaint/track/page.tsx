'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import PublicShell from '../../../components/public-shell';
import { load } from '../../../lib/storage';
import type { Complaint } from '../../../lib/types';

function TrackContent() {
  const searchParams = useSearchParams();
  const [trackNum, setTrackNum] = useState(searchParams.get('num') || '');
  const [trackResult, setTrackResult] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    const num = searchParams.get('num');
    if (num) {
      setTrackNum(num);
      searchTracking(num);
    }
  }, [searchParams]);

  async function searchTracking(num: string) {
    const { db } = await load();
    const found = db.complaints.find(c => c.trackingNumber.toLowerCase() === num.trim().toLowerCase());
    if (!found) {
      setTrackError('No grievance record found with that tracking reference. Please verify and try again.');
      setTrackResult(null);
    } else {
      setTrackResult(found);
      setTrackError('');
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    searchTracking(trackNum);
  }

  return (
    <PublicShell>
      <div className="public-wrap py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/complaint" className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <span className="public-eyebrow">Public Redressal</span>
              <h1 className="text-2xl font-bold text-slate-900">Track Grievance / Complaint</h1>
            </div>
          </div>

          <div className="card p-6">
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Enter Tracking Reference (e.g. CMP-2024-00142)"
                  value={trackNum}
                  onChange={e => { setTrackNum(e.target.value); setTrackError(''); }}
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm transition-colors shrink-0"
              >
                Track
              </button>
            </form>
            {trackError && <p className="text-rose-600 text-xs mt-2">{trackError}</p>}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500 items-center">
              <span>Quick demo samples:</span>
              <button onClick={() => { setTrackNum('CMP-2024-00142'); searchTracking('CMP-2024-00142'); }} className="text-teal-700 underline font-mono">CMP-2024-00142</button>
              <span>·</span>
              <button onClick={() => { setTrackNum('CMP-2024-00198'); searchTracking('CMP-2024-00198'); }} className="text-teal-700 underline font-mono">CMP-2024-00198</button>
            </div>
          </div>

          {trackResult && (
            <div className="card p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Tracking Reference</span>
                  <h2 className="text-xl font-bold font-mono text-slate-900" translate="no">{trackResult.trackingNumber}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  trackResult.status === 'Resolved' || trackResult.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                  trackResult.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800' :
                  'bg-sky-100 text-sky-800'
                }`}>
                  {trackResult.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Category</p>
                  <p className="font-medium text-slate-800 mt-0.5">{trackResult.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Date Submitted</p>
                  <p className="font-medium text-slate-800 mt-0.5">{trackResult.submittedAt}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Complainant</p>
                  <p className="font-medium text-slate-800 mt-0.5">{trackResult.complainantName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Description</p>
                  <p className="text-slate-700 mt-0.5">{trackResult.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-teal-600" /> Action & Resolution History
                </h3>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {trackResult.history.map((ev, i) => (
                    <div key={ev.id || i} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{ev.action}</span>
                          <span className="text-xs text-slate-400">· {ev.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">By: {ev.actorName}</p>
                        {ev.remarks && <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded">{ev.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading tracker…</div>}>
      <TrackContent />
    </Suspense>
  );
}
