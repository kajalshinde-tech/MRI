'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, MapPin, CheckCircle2, Clock, XCircle, AlertCircle,
  Shield, ArrowLeft, Flag, Stethoscope,
  UserCheck, Wrench, Phone, Mail, Award, Check, Share2, Layers, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PublicShell, { PublicBadge } from '@/components/public-shell';
import { useReportUrl } from '@/components/use-report-url';
import LanguageSwitcher from '@/components/language-switcher';
import { load } from '@/lib/storage';
import { validity } from '@/lib/data';
import type { DiagnosticCentre, CentreDocument, Doctor, TechnicalStaff } from '@/lib/types';

function StatusBanner({ status }: { status: string }) {
  if (status === 'Approved') return (
    <div className="verify-status-strip approved" style={{ padding: '10px 14px', borderRadius: 10, margin: '12px 0 16px' }}>
      <div className="verify-status-icon" style={{ width: 28, height: 28 }}>
        <CheckCircle2 size={18} />
      </div>
      <div>
        <strong style={{ fontSize: 13, display: 'block', color: '#065f46', fontWeight: 700 }}>Approved in the demo registry</strong>
        <p style={{ fontSize: 11, color: '#047857', margin: '2px 0 0', lineHeight: 1.4 }}>
          Demonstration approval only. Credentials are entered records, not live government verification.
        </p>
      </div>
    </div>
  );
  if (status === 'Rejected') return (
    <div className="verify-status-strip rejected" style={{ padding: '10px 14px', borderRadius: 10, margin: '12px 0 16px' }}>
      <div className="verify-status-icon" style={{ width: 28, height: 28 }}>
        <XCircle size={18} />
      </div>
      <div>
        <strong style={{ fontSize: 13, display: 'block', color: '#991b1b', fontWeight: 700 }}>Registration Rejected / Suspended</strong>
        <p style={{ fontSize: 11, color: '#b91c1c', margin: '2px 0 0' }}>This facility is not approved in this demonstration registry.</p>
      </div>
    </div>
  );
  return (
    <div className="verify-status-strip pending" style={{ padding: '10px 14px', borderRadius: 10, margin: '12px 0 16px' }}>
      <div className="verify-status-icon" style={{ width: 28, height: 28 }}>
        <Clock size={18} />
      </div>
      <div>
        <strong style={{ fontSize: 13, display: 'block', color: '#92400e', fontWeight: 700 }}>Status: {status}</strong>
        <p style={{ fontSize: 11, color: '#b45309', margin: '2px 0 0' }}>Statutory verification or on-site field inspection in progress.</p>
      </div>
    </div>
  );
}

function DocValidityBadge({ v }: { v: string }) {
  const tone = v === 'Valid' ? 'teal' : v === 'Expiring Soon' ? 'amber' : v === 'Expired' ? 'red' : 'gray';
  return <PublicBadge tone={tone as 'teal' | 'amber' | 'red' | 'gray'}>{v}</PublicBadge>;
}

function CitizenShell({ children }: { children: React.ReactNode }) {
  return <div className="citizen-report">
    <header className="citizen-report-header"><Link href="/">MahaCare<span> · Clinic Report</span></Link><LanguageSwitcher /></header>
    <main>{children}</main>
    <footer className="citizen-report-footer">Demonstration data. This report is not a government licence. Approval and document validity are shown separately.</footer>
  </div>;
}

export default function CentreProfile({ udcid, standalone = false }: { udcid: string; standalone?: boolean }) {
  const Shell = standalone ? CitizenShell : PublicShell;
  const [centre, setCentre] = useState<DiagnosticCentre | null>(null);
  const [docs, setDocs] = useState<CentreDocument[]>([]);
  const [lastInspection, setLastInspection] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [shareError, setShareError] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'equipment' | 'permits'>('staff');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const { db } = await load();
        if (!active) return;
        const found = db.centres.find(c => c.udcid === udcid);
        setNotFound(!found);
        setCentre(found || null);
        if (found) {
          setDocs(db.documents.filter(d => d.centreId === found.id));
          const report = db.inspections.filter(i => i.centreId === found.id && i.status === 'Completed').sort((a,b) => (b.conductedAt || '').localeCompare(a.conductedAt || ''))[0];
          setLastInspection(report?.conductedAt || found.lastInspectionDate || null);
        }
        setLoadError('');
      } catch (error) { if (active) setLoadError((error as Error).message); }
      finally { if (active) setLoading(false); }
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('registry-updated', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('registry-updated', refresh); };
  }, [udcid]);

  const publicUrl = useReportUrl(udcid);
  const hasExpiredDoc = docs.some(d => validity(d.expiryDate) === 'Expired');

  const handleCopyLink = async () => {
    setShareError('');
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true); setTimeout(() => setCopied(false), 3000);
    } catch { setShareError(`Copy this report link: ${publicUrl}`); }
  };
  if (loadError) return <Shell><div className="pub-container p-6"><h1>Report unavailable</h1><p role="alert">{loadError}</p><button className="pub-btn-primary" onClick={() => window.location.reload()}>Retry</button></div></Shell>;

  if (loading) return (
    <Shell>
      <div key="loading" translate="no" className="pub-container" style={{ padding: '80px 20px', textAlign: 'center', color: '#1e293b' }}>
        <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 700 }}>Loading verified centre profile…</p>
      </div>
    </Shell>
  );

  if (notFound) return (
    <Shell>
      <div className="pub-container" style={{ padding: '60px 16px' }}>
        <div className="empty-state" style={{ maxWidth: 440, margin: '0 auto', background: 'white', padding: 28, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <Building2 size={44} style={{ margin: '0 auto 12px', color: '#64748b' }} />
          <h2 style={{ fontSize: 19, fontWeight: 750, color: '#0f172a' }}>Centre Not Found</h2>
          <p style={{ fontSize: 13, color: '#334155', marginTop: 8 }}>
            No diagnostic establishment was found with UDCID <strong translate="no" style={{ fontFamily: 'monospace', color: '#0d9488' }}>{udcid}</strong>.
          </p>
          <Link href="/centres" className="pub-btn-large" style={{ marginTop: 20 }}>
            <ArrowLeft size={15} /> Search Registered Centres
          </Link>
        </div>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div key="profile" className="pub-container centre-profile-page">
        <div className="mobile-app-shell">
          {/* Top Bar (Native App Style) */}
          {!standalone && <div className="app-top-bar">
            <Link href="/centres" className="app-action-btn mail" style={{ padding: '6px 12px', gap: 4 }}>
              <ArrowLeft size={14} /> <span>All Centres</span>
            </Link>

            <span className="app-id-pill" translate="no">
              {udcid}
            </span>

            <button translate="no" onClick={handleCopyLink} className="share-btn" style={{ padding: '6px 12px', fontSize: 11 }}>
              {copied ? <Check size={14} style={{ color: '#0d9488' }} /> : <Share2 size={14} />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>}

          {/* State Department Verification Seal Header */}
          <div className="gov-seal-banner" style={{ padding: '12px 16px', borderRadius: 12 }}>
            <div className="gov-seal-left">
              <div className="gov-seal-icon" style={{ width: 34, height: 34 }}>
                <Award size={20} />
              </div>
              <div>
                <span className="gov-seal-title" style={{ fontSize: 9 }}>
                  Maharashtra · Demo Registry
                </span>
                <div className="gov-seal-sub" style={{ fontSize: 11, fontWeight: 600 }}>
                  Digital Clinical Verification Record
                </div>
              </div>
            </div>
            <span className="gov-seal-badge" style={{ fontSize: 10, padding: '4px 10px' }}>
              <CheckCircle2 size={12} /> Public record
            </span>
          </div>

          {/* Expired Doc Advisory if any */}
          {hasExpiredDoc && centre?.status === 'Approved' && (
            <div className="profile-advisory-banner" style={{ padding: '10px 14px', fontSize: 11 }}>
              <AlertCircle size={16} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: '#92400e' }}>Advisory:</strong> One or more documents have expired. Demo approval does not confirm document validity.
              </div>
            </div>
          )}

          {/* Centre Hero Profile Card */}
          <div className="app-card report-summary-card">
            <div className="report-clinic-heading">
              <div className="report-clinic-meta">
                <span className="report-facility-type">{centre!.type}</span>
                <span className="report-ownership">{centre!.ownershipType}</span>
                <span className={`pub-badge ${centre!.status === 'Approved' ? 'pub-badge-teal' : centre!.status === 'Rejected' ? 'pub-badge-red' : 'pub-badge-amber'}`}>{centre!.status}</span>
              </div>
              <h1>{centre!.name}</h1>
              <p className="report-clinic-address">{[centre!.address, centre!.taluka, centre!.district].filter((part, index, parts) => parts.indexOf(part) === index).join(', ')} — {centre!.pincode}</p>
            </div>

            {/* Quick Contact & Details Row */}
            <div className="report-summary-details">
              <div className="report-owner-detail">
                {centre!.udcid === 'MH-PUN-2024-001' && <figure className="report-owner-photo"><Image src="/demo-clinic-owner.png" alt="AI-generated illustration of the demo clinic owner" width={96} height={108} sizes="96px" className="demo-owner-image" /></figure>}
                <div className="report-owner-info">
                  <span className="report-detail-label">Director / Owner</span>
                  <strong>{centre!.owner.name}</strong>
                  <span>{centre!.owner.qualification}</span>
                </div>
              </div>
              <div className="report-inspection-detail">
                <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Last Inspection</span>
                <strong style={{ color: '#0f172a', fontSize: 12, display: 'block', marginTop: 2 }}>
                  {lastInspection ? new Date(lastInspection).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded'}
                </strong>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>{lastInspection ? 'Inspection recorded' : 'Inspection not yet recorded'}</span>
              </div>
            </div>

            {/* Direct Touch Actions */}
            <div className="app-quick-actions">
              <a href={`tel:${centre!.phone}`} className="app-action-btn call">
                <Phone size={13} /> <span>Call {centre!.phone}</span>
              </a>
              <a href={`mailto:${centre!.email}`} className="app-action-btn mail">
                <Mail size={13} /> <span>Email Centre</span>
              </a>
            </div>
          </div>

          {/* Status Banner */}
          <StatusBanner status={centre!.status} />

          {/* Native App-Style Segmented Tabs */}
          {standalone ? <nav className="citizen-report-sections" aria-label="Report sections"><a href="#report-staff">Doctors & staff</a><a href="#report-equipment">Equipment</a><a href="#report-permits">Permits</a></nav> : <div className="app-tabs-nav">
            <button
              onClick={() => setActiveTab('staff')}
              className={`app-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            >
              <Stethoscope size={13} />
              <span className="tab-label-full">{`Doctors & Staff (${centre!.doctors.length + centre!.technicalStaff.length})`}</span>
              <span className="tab-label-short">{`Staff (${centre!.doctors.length + centre!.technicalStaff.length})`}</span>
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`app-tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
            >
              <Wrench size={13} />
              <span className="tab-label-full">{`Equipment (${centre!.equipment?.length || 0})`}</span>
              <span className="tab-label-short">{`Equip (${centre!.equipment?.length || 0})`}</span>
            </button>
            <button
              onClick={() => setActiveTab('permits')}
              className={`app-tab-btn ${activeTab === 'permits' ? 'active' : ''}`}
            >
              <QrCode size={13} />
              <span className="tab-label-full">{`QR & Permits (${docs.length})`}</span>
              <span className="tab-label-short">{`QR/Docs (${docs.length})`}</span>
            </button>
          </div>}

          {shareError && <p role="status" className="break-all text-sm">{shareError}</p>}
          {/* Tab 1: Qualified Medical Practitioners & Technical Staff */}
          {(standalone || activeTab === 'staff') && (
            <div id="report-staff" className="report-section">
              {/* Doctors */}
              <div className="app-card">
                <div className="app-card-title">
                  <h3>
                    <Stethoscope size={16} style={{ color: '#0d9488' }} /> Doctors & Medical Staff
                  </h3>
                  {!standalone && <span className="pub-badge pub-badge-teal" style={{ fontSize: 10 }}>Registration details</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {!centre!.doctors.length && <p>No doctors have been recorded.</p>}
                  {centre!.doctors.map((doc: Doctor, idx: number) => (
                    <div key={idx} className="report-person" style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div className="report-person-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: 13, color: '#0f172a', fontWeight: 750 }}>{doc.name}</strong>
                          <p style={{ margin: '2px 0 6px', fontSize: 11, color: '#334155', fontWeight: 600 }}>
                            {doc.qualification} · Spec: {doc.specialisation || 'Radiology'}
                          </p>
                        </div>
                        <span className="app-badge-verified">
                          <Check size={10} /> Recorded
                        </span>
                      </div>
                      <div className="report-person-meta" style={{ fontSize: 11, color: '#334155', borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <div>MMC Reg: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>{doc.registrationNumber}</span></div>
                        <div style={{ textAlign: 'right' }}>Expiry: <b>{doc.registrationExpiry}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Staff */}
              <div className="app-card">
                <div className="app-card-title">
                  <h3>
                    <UserCheck size={16} style={{ color: '#0284c7' }} /> Technical Staff
                  </h3>
                  {!standalone && <span className="pub-badge pub-badge-blue" style={{ fontSize: 10 }}>Registration details</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {!centre!.technicalStaff.length && <p>No technical staff have been recorded.</p>}
                  {centre!.technicalStaff.map((st: TechnicalStaff, idx: number) => (
                    <div key={idx} className="report-person" style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div className="report-person-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: 13, color: '#0f172a', fontWeight: 750 }}>{st.name}</strong>
                          <p style={{ margin: '2px 0 4px', fontSize: 11, color: '#334155' }}>
                            {st.designation} ({st.qualification})
                          </p>
                        </div>
                        <span className="app-badge-verified">
                          <Check size={10} /> Recorded
                        </span>
                      </div>
                      <div className="report-person-meta" style={{ fontSize: 11, color: '#334155', borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                        Registration: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{st.registrationNumber}</span>
                        <span style={{ color: '#64748b', marginLeft: 8 }}>({st.registrationAuthority})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Machinery & Authorized Services */}
          {(standalone || activeTab === 'equipment') && (
            <div id="report-equipment" className="report-section">
              {/* Diagnostic Machinery */}
              <div className="app-card">
                <div className="app-card-title">
                  <h3>
                    <Wrench size={16} style={{ color: '#b45309' }} /> Equipment & Calibration Records
                  </h3>
                  {!standalone && <span className="pub-badge pub-badge-teal" style={{ fontSize: 10 }}>Equipment records</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {centre!.equipment && centre!.equipment.length > 0 ? (
                    centre!.equipment.map(eq => (
                      <div key={eq.id} className="equipment-item" style={{ padding: '10px 12px' }}>
                        <div>
                          <strong style={{ fontSize: 12, color: '#0f172a' }}>{eq.name}</strong>
                          <small style={{ color: '#475569', marginTop: 2 }}>{eq.make} ({eq.model}) · <span style={{ fontFamily: 'monospace' }}>SN: {eq.serialNumber}</span></small>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <span className="pub-badge pub-badge-teal" style={{ fontSize: 9 }}>Recorded</span>
                          <span style={{ fontSize: 10, color: '#64748b' }}>Cal: {eq.lastCalibrationDate || 'Not recorded'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>No equipment has been recorded for this clinic.</p>
                  )}
                </div>
              </div>

              {/* Authorized Modalities */}
              <div className="app-card">
                <div className="app-card-title">
                  <h3>
                    <Layers size={16} style={{ color: '#0d9488' }} /> Authorized Services & Modalities
                  </h3>
                </div>
                <div className="centre-profile-services" style={{ marginTop: 4 }}>
                  {!centre!.services.length && <p>No services have been recorded.</p>}
                  {centre!.services.map(s => (
                    <span key={s} className="profile-service-tag" style={{ fontSize: 11, padding: '5px 10px', color: '#0f172a', fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Official Verification QR & Statutory Permits */}
          {(standalone || activeTab === 'permits') && (
            <div id="report-permits" className="report-section">
              {/* Dynamic QR Verification Box */}
              {!standalone && <div className="app-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#0f766e', letterSpacing: '1px', display: 'block', marginBottom: 12 }}>
                  Public Profile QR Plate
                </span>
                <div style={{ display: 'inline-block', padding: 12, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                  <QRCodeSVG
                    value={publicUrl}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: 13, marginBottom: 4 }}>Scan to Verify Authenticity</strong>
                <p style={{ margin: '0 auto', fontSize: 11, color: '#475569', lineHeight: 1.5, maxWidth: 300 }}>
                  Linked to this centre in the demonstration registry.
                </p>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e', marginTop: 6, fontSize: 13 }} translate="no">
                  {centre!.udcid}
                </div>
              </div>}

              {/* Statutory Clearances */}
              <div className="app-card">
                <div className="app-card-title">
                  <h3>
                    <Shield size={16} style={{ color: '#0d9488' }} /> Statutory Permits & NOCs
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!docs.length && <p>No permits have been recorded.</p>}
                  {docs.map(d => (
                    <div key={d.id} className="profile-doc-item" style={{ padding: '10px 12px', margin: 0 }}>
                      <div>
                        <strong style={{ fontSize: 12, color: '#0f172a' }}>{d.title}</strong>
                        <small style={{ color: '#475569' }}>{d.registration} · {d.issuingAuthority}</small>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{d.expiryDate || 'N/A'}</span>
                        <DocValidityBadge v={validity(d.expiryDate)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citizen Redressal Box */}
              <div className="app-card" style={{ borderLeft: '3px solid #dc2626' }}>
                <h3 style={{ fontSize: 13, fontWeight: 750, color: '#991b1b', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flag size={15} style={{ color: '#dc2626' }} /> Citizen Redressal / तक्रार
                </h3>
                <p style={{ fontSize: 11, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Notice any discrepancy, uncalibrated equipment, or lack of qualified doctors during examination?
                </p>
                <Link
                  href={`/complaint?centreId=${centre!.id}&centreName=${encodeURIComponent(centre!.name)}`}
                  className="report-issue-btn"
                  style={{ justifyContent: 'center', fontSize: 12, padding: '10px 14px' }}
                >
                  <Flag size={16} aria-hidden="true" /> <span>Report an Issue / File Grievance</span>
                </Link>
              </div>
            </div>
          )}

          {/* Sticky Mobile Bottom Bar */}
          <div className="app-sticky-bottom">
            <Link
              href={`/complaint?centreId=${centre!.id}&centreName=${encodeURIComponent(centre!.name)}`}
              className="report-issue-btn"
              aria-label="Report an issue or file a grievance"
            >
              <Flag size={16} aria-hidden="true" /> <span>Report Issue</span>
            </Link>
            <button
              translate="no"
              onClick={handleCopyLink}
              className="pub-btn-primary"
              type="button"
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
