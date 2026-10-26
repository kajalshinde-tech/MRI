'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ScanLine, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PublicShell, { PublicBadge } from '@/components/public-shell';
import { useReportUrl } from '@/components/use-report-url';
import { load } from '@/lib/storage';
import { validity } from '@/lib/data';
import type { DiagnosticCentre, CentreDocument } from '@/lib/types';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [udcid, setUdcid] = useState(searchParams.get('udcid') || '');
  const [result, setResult] = useState<{ centre: DiagnosticCentre; docs: CentreDocument[] } | null>(null);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const { db } = await load();
    const centre = db.centres.find(c => c.udcid.toLowerCase() === udcid.trim().toLowerCase() || c.id.toLowerCase() === udcid.trim().toLowerCase());
    if (!centre) { setError('No centre found with that ID. Please check and try again.'); setResult(null); return; }
    const docs = db.documents.filter(d => d.centreId === centre.id);
    setResult({ centre, docs });
    setError('');
  }

  const profileUrl = useReportUrl(result?.centre.udcid || '');

  return (
    <div className="pub-container verify-page" style={{ padding: '30px 16px 50px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="eyebrow">QR VERIFICATION</span>
        <h1 style={{ fontSize: 24, marginTop: 6, color: '#0f172a', fontWeight: 800 }}>Verify a Centre</h1>
        <p style={{ color: '#334155', fontSize: 13, marginTop: 8, lineHeight: 1.6, maxWidth: 540, marginInline: 'auto' }}>
          Enter a centre's UDCID to view its public verification record. Data comes from the shared demonstration registry.
        </p>
      </div>

      <div className="verify-form-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, background: '#e8f5f3', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#0d9488' }}>
            <ScanLine size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17 }}>Enter UDCID</h2>
            <p style={{ color: '#8fa5b5', fontSize: 12, marginTop: 3 }}>Scan a centre's QR code or enter the ID manually</p>
          </div>
        </div>
        <form onSubmit={handleSearch}>
          <div className="form-field">
            <label className="form-label" htmlFor="udcid-input">Centre UDCID</label>
            <input
              id="udcid-input" className="form-input" translate="no"
              placeholder="e.g. MH-PUN-2024-001"
              value={udcid} onChange={e => setUdcid(e.target.value)}
            />
            <span style={{ fontSize: 11, color: '#aab9c5' }}>Sample IDs: MH-PUN-2024-001, MH-MUM-2024-001, MH-NAG-2024-001</span>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="pub-btn-large" style={{ width: '100%', justifyContent: 'center' }}>
            <Search size={16} /> Verify Centre
          </button>
        </form>
      </div>

      {result && (
        <div className="verify-result">
          <div className="verify-result-header">
            <div className="verify-result-header-flex">
              <div>
                <span style={{ fontSize: 10, color: '#7ec8e3', letterSpacing: 2, fontWeight: 700 }}>VERIFICATION RESULT</span>
                <h2 style={{ marginTop: 6 }}>{result.centre.name}</h2>
                <p style={{ color: '#a8c4d4', fontSize: 13, marginTop: 4 }} translate="no">{result.centre.udcid}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 10, padding: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
                <QRCodeSVG value={profileUrl} size={72} level="M" />
              </div>
            </div>
          </div>

          <div className="verify-result-body">
            {result.centre.status === 'Approved' ? (
              <div className="verify-status-strip approved">
                <CheckCircle2 size={20} /> Approved — Application approval recorded
              </div>
            ) : result.centre.status === 'Rejected' ? (
              <div className="verify-status-strip rejected">
                <XCircle size={20} /> Rejected
              </div>
            ) : (
              <div className="verify-status-strip pending">
                <Clock size={20} /> {result.centre.status}
              </div>
            )}

            <dl className="profile-dl" style={{ marginBottom: 20 }}>
              <dt>Facility type</dt><dd>{result.centre.type}</dd>
              <dt>District / Taluka</dt><dd>{result.centre.district} / {result.centre.taluka}</dd>
              <dt>Address</dt><dd>{result.centre.address}, {result.centre.pincode}</dd>
              <dt>Ownership</dt><dd>{result.centre.ownershipType}</dd>
              {result.centre.lastInspectionDate && <><dt>Last inspection</dt><dd>{new Date(result.centre.lastInspectionDate).toLocaleDateString('en-IN')}</dd></>}
              <dt>Profile updated</dt><dd>{new Date(result.centre.updatedAt).toLocaleDateString('en-IN')}</dd>
            </dl>

            {result.centre.services.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, marginBottom: 10, color: '#4d6578' }}>Services</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.centre.services.map(s => <span key={s} className="service-chip">{s}</span>)}
                </div>
              </div>
            )}

            {result.docs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, marginBottom: 12, color: '#4d6578' }}>Document Validity Summary</h3>
                {result.docs.map(d => (
                  <div key={d.id} className="doc-validity-row">
                    <span style={{ fontSize: 12, color: '#4d6578' }}>{d.title}</span>
                    <PublicBadge tone={validity(d.expiryDate) === 'Valid' ? 'teal' : validity(d.expiryDate) === 'Expiring Soon' ? 'amber' : validity(d.expiryDate) === 'Expired' ? 'red' : 'gray'}>
                      {validity(d.expiryDate)}
                    </PublicBadge>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: '#aab9c5', marginTop: 10, lineHeight: 1.6 }}>
                  Individual document uploads are not shown publicly. Validity is tracked separately from approval status.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/mobile/centres/${result.centre.udcid}`} className="pub-btn-primary" style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}>
                Open clinic report
              </Link>
              <Link href={`/complaint?centreId=${result.centre.id}&centreName=${encodeURIComponent(result.centre.name)}`} className="pub-btn-outline" style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}>
                Report issue
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <PublicShell>
      <Suspense fallback={<div className="pub-container" style={{ padding: '60px 0', textAlign: 'center', color: '#8fa5b5' }}>Loading…</div>}>
        <VerifyContent />
      </Suspense>
    </PublicShell>
  );
}
