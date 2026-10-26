'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Flag, Check, Clock, Search, ShieldAlert, ArrowLeft } from 'lucide-react';
import PublicShell from '../../components/public-shell';
import { load, save } from '../../lib/storage';
import type { Complaint } from '../../lib/types';

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

  useEffect(() => {
    if (searchParams.get('track')) {
      setStep('track');
      load().then(({ db }) => {
      const found = db.complaints.find(c => c.trackingNumber.toLowerCase() === (searchParams.get('track') || '').trim().toLowerCase());
      if (found) setTrackResult(found);
      }).catch(error => setTrackError(error.message));
    }
  }, [searchParams]);

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
      history: [
        {
          id: `CH-${Date.now()}`,
          complaintId: `CMP-USER-${Date.now()}`,
          action: 'Submitted',
          actorName: form.name,
          timestamp: now,
          remarks: 'Complaint submitted online via citizen portal'
        }
      ],
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
    if (!found) {
      setTrackError('No grievance record found with that tracking reference. Please check and try again.');
      setTrackResult(null);
      return;
    }
    setTrackResult(found);
    setTrackError('');
  }

  return (
    <PublicShell>
      <div className="pub-container complaint-page">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="eyebrow">PUBLIC GRIEVANCE REDRESSAL</span>
          <h1 style={{ fontSize: 32, marginTop: 10 }}>Citizen Grievance & Complaint Portal</h1>
          <p style={{ color: '#7a93a2', fontSize: 14, marginTop: 10, lineHeight: 1.6, maxWidth: 580, marginInline: 'auto' }}>
            Lodge a grievance regarding any diagnostic centre in Maharashtra or monitor the status of an existing inquiry.
          </p>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5ebee', marginBottom: 28, justifyContent: 'center', gap: 16 }}>
          <button
            onClick={() => { setStep('form'); setSubmitted(null); }}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 13,
              borderBottom: step === 'form' ? '2px solid #0d9488' : '2px solid transparent',
              color: step === 'form' ? '#0d9488' : '#7a93a2',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Flag size={15} /> File a Grievance
          </button>
          <button
            onClick={() => setStep('track')}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 13,
              borderBottom: step === 'track' ? '2px solid #0d9488' : '2px solid transparent',
              color: step === 'track' ? '#0d9488' : '#7a93a2',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Search size={15} /> Track Grievance Status
          </button>
        </div>

        {step === 'form' && !submitted && (
          <div className="complaint-card">
            <form onSubmit={handleSubmit}>
              {form.centreName && (
                <div style={{ padding: '12px 16px', background: '#e8f5f3', border: '1px solid #c8e9e4', borderRadius: 8, fontSize: 13, color: '#0d7d74', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span>Concerning Centre: <strong>{form.centreName}</strong></span>
                  <button type="button" onClick={() => setForm({ ...form, centreId: '', centreName: '' })} style={{ color: '#0d9488', textDecoration: 'underline', fontSize: 12 }}>Clear</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Your Full Name *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kulkarni"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number or Email *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    placeholder="+91 98765 43210 or email"
                    value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Grievance Category *</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as Category })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="Provide full particulars of the incident, date, equipment or staff involved..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ padding: 14, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: 10, margin: '20px 0' }}>
                <ShieldAlert size={16} style={{ marginTop: 2, flexShrink: 0, color: '#b45309' }} />
                <span>
                  <strong>Demo Prototype Notice:</strong> Grievances submitted here are saved in your local browser storage and reflected in the District Officer and Admin portal for evaluation.
                </span>
              </div>

              <button
                type="submit"
                className="pub-btn-large"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Flag size={16} /> Submit Grievance
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="complaint-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 56, height: 56, background: '#d1fae5', color: '#059669', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Check size={28} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f' }}>Grievance Registered Successfully</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
              Your grievance has been logged and assigned to the relevant District Health Officer for inquiry.
            </p>
            <div className="tracking-result" style={{ margin: '24px auto', maxWidth: 360 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#047857', fontWeight: 700, letterSpacing: '1px' }}>Tracking Reference</span>
              <div className="tracking-number" translate="no" style={{ marginTop: 4 }}>{submitted.trackingNumber}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setTrackNum(submitted.trackingNumber);
                  setStep('track');
                  setTrackResult(submitted);
                  setSubmitted(null);
                }}
                className="pub-btn-primary"
                style={{ padding: '10px 20px', fontSize: 13 }}
              >
                Track This Grievance
              </button>
              <Link
                href="/centres"
                className="pub-btn-outline"
                style={{ padding: '10px 20px', fontSize: 13 }}
              >
                Return to Directory
              </Link>
            </div>
          </div>
        )}

        {step === 'track' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="complaint-card" style={{ padding: 24 }}>
              <form onSubmit={handleTrack} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter Tracking Number (e.g. CMP-2024-00142)"
                  value={trackNum}
                  onChange={e => { setTrackNum(e.target.value); setTrackError(''); }}
                />
                <button
                  type="submit"
                  className="pub-btn-primary"
                  style={{ padding: '0 24px', flexShrink: 0 }}
                >
                  Track
                </button>
              </form>
              {trackError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{trackError}</p>}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f4f7', display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: '#8fa5b5', alignItems: 'center' }}>
                <span>Try sample tracking numbers:</span>
                <button onClick={() => { setTrackNum('CMP-2024-00142'); }} style={{ color: '#0d9488', textDecoration: 'underline', fontFamily: 'monospace' }}>CMP-2024-00142</button>
                <span>·</span>
                <button onClick={() => { setTrackNum('CMP-2024-00198'); }} style={{ color: '#0d9488', textDecoration: 'underline', fontFamily: 'monospace' }}>CMP-2024-00198</button>
              </div>
            </div>

            {trackResult && (
              <div className="complaint-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #f0f4f7', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#8fa5b5', fontWeight: 700, letterSpacing: '1px' }}>Tracking Reference</span>
                    <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#1e3a5f', margin: '4px 0 0' }} translate="no">{trackResult.trackingNumber}</h2>
                  </div>
                  <span className={`pub-badge ${trackResult.status === 'Resolved' || trackResult.status === 'Closed' ? 'pub-badge-teal' : trackResult.status === 'Under Investigation' ? 'pub-badge-amber' : 'pub-badge-blue'}`} style={{ padding: '6px 14px', fontSize: 12 }}>
                    {trackResult.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 13, marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#8fa5b5', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Category</p>
                    <p style={{ fontWeight: 600, color: '#1e3a5f', margin: '4px 0 0' }}>{trackResult.category}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#8fa5b5', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Date Submitted</p>
                    <p style={{ fontWeight: 600, color: '#1e3a5f', margin: '4px 0 0' }}>{trackResult.submittedAt}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#8fa5b5', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Complainant</p>
                    <p style={{ fontWeight: 600, color: '#1e3a5f', margin: '4px 0 0' }}>{trackResult.complainantName}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#8fa5b5', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Description</p>
                    <p style={{ color: '#475569', margin: '4px 0 0' }}>{trackResult.description}</p>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div style={{ paddingTop: 20, borderTop: '1px solid #f0f4f7' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} style={{ color: '#0d9488' }} /> Investigation & Action Timeline
                  </h3>
                  <div className="complaint-timeline">
                    {trackResult.history.map((ev, i) => (
                      <div key={ev.id || i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-line" />
                        <div style={{ fontSize: 13, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ color: '#1e3a5f' }}>{ev.action}</strong>
                            <span style={{ fontSize: 11, color: '#8fa5b5' }}>· {ev.timestamp}</span>
                          </div>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>By: {ev.actorName}</p>
                          {ev.remarks && <p style={{ fontSize: 12, color: '#334155', background: '#f8fafc', padding: 10, borderRadius: 6, margin: '6px 0 0', border: '1px solid #e2e8f0' }}>{ev.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

export default function ComplaintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading grievance portal…</div>}>
      <ComplaintContent />
    </Suspense>
  );
}
