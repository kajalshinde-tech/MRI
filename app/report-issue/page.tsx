'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Flag, Check, Clock, Search, ArrowRight } from 'lucide-react';
import PublicShell from '../../components/public-shell';
import { load, save } from '../../lib/storage';
import type { Complaint, ComplaintEvent } from '../../lib/types';

function genTracking() {
  return `CMP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

type Category = Complaint['category'];
const categories: Category[] = ['Service Quality', 'Document Issue', 'Staff Behaviour', 'Equipment', 'Billing', 'Other'];

function ComplaintContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'form' | 'track'>('form');
  const [trackNum, setTrackNum] = useState(searchParams.get('track') || '');
  const [trackResult, setTrackResult] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState('');
  const [submitted, setSubmitted] = useState<Complaint | null>(null);
  const [form, setForm] = useState({
    centreId: searchParams.get('centreId') || '',
    centreName: searchParams.get('centreName') || '',
    name: '',
    contact: '',
    category: 'Service Quality' as Category,
    description: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { db } = await load();
    const tracking = genTracking();
    const now = new Date().toISOString().slice(0, 10);
    const newComplaint: Complaint = {
      id: `CMP-USER-${Date.now()}`,
      trackingNumber: tracking,
      centreId: form.centreId || undefined,
      complainantName: form.name,
      complainantContact: form.contact,
      category: form.category,
      description: form.description,
      status: 'Open',
      history: [{ id: `CH-${Date.now()}`, complaintId: `CMP-USER-${Date.now()}`, action: 'Submitted', actorName: form.name, timestamp: now, remarks: 'Complaint submitted online via public portal' }],
      submittedAt: now,
    };
    db.complaints.push(newComplaint);
    await save(db);
    setSubmitted(newComplaint);
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const { db } = await load();
    const found = db.complaints.find(c => c.trackingNumber.toLowerCase() === trackNum.trim().toLowerCase());
    if (!found) { setTrackError('No complaint found with that tracking number.'); setTrackResult(null); return; }
    setTrackResult(found);
    setTrackError('');
  }

  if (submitted) return (
    <div className="pub-container complaint-page">
      <div className="complaint-card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#d1faf4', borderRadius: 50, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: '#059669' }}>
            <Check size={28} />
          </div>
          <h2>Complaint Submitted</h2>
          <p style={{ color: '#7a93a2', fontSize: 14, marginTop: 8 }}>Your complaint has been registered. Please save your tracking number.</p>
          <div className="tracking-result" style={{ margin: '24px 0' }}>
            <p style={{ fontSize: 12, color: '#065f46', marginBottom: 8 }}>Your Tracking Number</p>
            <div className="tracking-number" translate="no">{submitted.trackingNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href={`/complaint?track=${submitted.trackingNumber}`} className="pub-btn-primary" onClick={() => { setStep('track'); setTrackNum(submitted.trackingNumber); setSubmitted(null); }}>
              Track this complaint
            </Link>
            <Link href="/" className="pub-btn-outline">Return home</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pub-container complaint-page">
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <button onClick={() => setStep('form')} className={step === 'form' ? 'pub-btn-primary' : 'pub-btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Flag size={14} /> Submit Complaint
        </button>
        <button onClick={() => setStep('track')} className={step === 'track' ? 'pub-btn-primary' : 'pub-btn-outline'} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Search size={14} /> Track Complaint
        </button>
      </div>

      {step === 'form' ? (
        <div className="complaint-card">
          <span className="eyebrow">REPORT AN ISSUE</span>
          <h2 style={{ marginTop: 8, marginBottom: 4 }}>Submit a Complaint</h2>
          <p style={{ color: '#7a93a2', fontSize: 13, marginBottom: 28 }}>Your complaint will be assigned a tracking number. Personal details are kept private.</p>
          <form onSubmit={handleSubmit}>
            {form.centreName && (
              <div style={{ background: '#f0f7f6', border: '1px solid #a7f3d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#065f46' }}>
                Complaint about: <strong>{form.centreName}</strong>
              </div>
            )}
            <div className="form-field">
              <label className="form-label" htmlFor="comp-name">Your name *</label>
              <input id="comp-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="comp-contact">Contact number *</label>
              <input id="comp-contact" className="form-input" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Mobile number" />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="comp-category">Category *</label>
              <select id="comp-category" className="form-select" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="comp-desc">Description *</label>
              <textarea id="comp-desc" className="form-textarea" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail…" />
            </div>
            <div className="form-actions">
              <button type="submit" className="pub-btn-large">Submit Complaint <ArrowRight size={15} /></button>
            </div>
          </form>
        </div>
      ) : (
        <div className="complaint-card">
          <span className="eyebrow">COMPLAINT TRACKING</span>
          <h2 style={{ marginTop: 8, marginBottom: 4 }}>Track your Complaint</h2>
          <p style={{ color: '#7a93a2', fontSize: 13, marginBottom: 24 }}>Enter your tracking number to view the status of your complaint.</p>
          <form onSubmit={handleTrack}>
            <div className="form-field">
              <label className="form-label" htmlFor="track-num">Tracking Number</label>
              <input id="track-num" className="form-input" translate="no" value={trackNum} onChange={e => setTrackNum(e.target.value)} placeholder="e.g. CMP-2024-00142" />
              <span style={{ fontSize: 11, color: '#aab9c5' }}>Try: CMP-2024-00142 or CMP-2024-00198</span>
            </div>
            {trackError && <p style={{ color: '#dc2626', fontSize: 13 }}>{trackError}</p>}
            <button type="submit" className="pub-btn-large" style={{ marginTop: 8 }}>Track <ArrowRight size={15} /></button>
          </form>

          {trackResult && (
            <div style={{ marginTop: 28, borderTop: '1px solid #e5ebee', paddingTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span className="eyebrow" translate="no">{trackResult.trackingNumber}</span>
                  <h3 style={{ marginTop: 6 }}>{trackResult.category}</h3>
                  <p style={{ fontSize: 13, color: '#7a93a2', marginTop: 4 }}>{trackResult.description}</p>
                </div>
                <span className={`pub-badge ${trackResult.status === 'Resolved' || trackResult.status === 'Closed' ? 'pub-badge-teal' : trackResult.status === 'Open' ? 'pub-badge-gray' : 'pub-badge-blue'}`}>
                  {trackResult.status}
                </span>
              </div>
              <h4 style={{ fontSize: 12, color: '#8fa5b5', marginBottom: 14 }}>TIMELINE</h4>
              <div className="complaint-timeline">
                {trackResult.history.map((h, i) => (
                  <div key={h.id} className="timeline-item" style={{ position: 'relative' }}>
                    <div>
                      <div className="timeline-dot" />
                      {i < trackResult.history.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2d4f65' }}>{h.action}</p>
                      <p style={{ fontSize: 12, color: '#7a93a2', marginTop: 3 }}>{h.remarks}</p>
                      <p style={{ fontSize: 11, color: '#aab9c5', marginTop: 4 }}>{new Date(h.timestamp).toLocaleDateString('en-IN')} · {h.actorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComplaintPage() {
  return (
    <PublicShell>
      <Suspense fallback={<div className="pub-container" style={{ padding: '60px 0', textAlign: 'center', color: '#8fa5b5' }}>Loading…</div>}>
        <ComplaintContent />
      </Suspense>
    </PublicShell>
  );
}
