'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Save, Building2, MapPin, Users, FlaskConical, FileText, Eye } from 'lucide-react';
import PublicShell from '../../components/public-shell';
import { offlineGet, offlineSet, offlineDelete } from '@/lib/offline-store';
import { readAttachment } from '@/lib/media';
import { districts, talukas, facilityTypes, allServices } from '../../lib/data';
import { load, save } from '../../lib/storage';
import type { CentreDocument, DiagnosticCentre, FacilityType, OwnershipType } from '../../lib/types';

const steps = [
  { n: 1, label: 'Basic Details', icon: Building2 },
  { n: 2, label: 'Location', icon: MapPin },
  { n: 3, label: 'Owner & Staff', icon: Users },
  { n: 4, label: 'Services', icon: FlaskConical },
  { n: 5, label: 'Documents', icon: FileText },
  { n: 6, label: 'Review', icon: Eye },
];

const ownershipTypes: OwnershipType[] = ['Private', 'Trust / NGO', 'Government', 'Public-Private Partnership'];

function Field({ label, id, required, children }: { label: string; id: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<CentreDocument['attachment']>();
  const [permits, setPermits] = useState<{ category: CentreDocument['category']; title: string; registration: string; issuingAuthority: string; issueDate: string; expiryDate: string; attachment?: CentreDocument['attachment'] }[]>(
    ['AERB Clearance', 'Fire Safety', 'Trade Licence'].map(category => ({ category: category as CentreDocument['category'], title: category, registration: '', issuingAuthority: '', issueDate: '', expiryDate: '' }))
  );
  async function attach(file: File | undefined, index?: number) {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const data = { name: file.name, type: file.type, dataUrl: await readAttachment(file) };
      if (index === undefined) setAttachment(data);
      else setPermits(current => current.map((p, i) => i === index ? { ...p, attachment: data } : p));
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'Multi-service Diagnostic Centre' as FacilityType, ownershipType: 'Private' as OwnershipType,
    phone: '', email: '', website: '',
    address: '', district: '', taluka: '', pincode: '',
    gpsLat: '', gpsLng: '',
    ownerName: '', ownerQual: '', ownerPhone: '',
    doctorName: '', doctorQual: '', doctorReg: '', doctorAuth: '', doctorExpiry: '',
    staffName: '', staffQual: '', staffDes: '', staffReg: '',
    services: [] as string[],
    equipName: '', equipMake: '', equipModel: '', equipSerial: '', equipCalibration: '',
    doc1Title: '', doc1Reg: '', doc1Auth: '', doc1Issue: '', doc1Expiry: '',
  });

  useEffect(() => {
    offlineGet<any>('mahacare-registration-draft').then(draft => {
      if (draft) { setForm(current => ({ ...current, ...draft.form })); setPermits(draft.permits || permits); setAttachment(draft.attachment); }
    }).catch(() => setError('Saved registration draft could not be read.'));
  }, []);

  const availTalukas = form.district ? (talukas[form.district] || []) : [];

  function toggleService(s: string) {
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));
  }

  async function handleSubmit() {
    if (busy) return;
    setError(''); setBusy(true);
    try {
    if (!form.name.trim() || !form.district || !form.address.trim() || !form.ownerName.trim() || !form.doc1Title.trim() || !form.doc1Reg.trim()) throw new Error('Complete centre, location, owner and primary document details.');
    const { db } = await load();
    const id = `C-${crypto.randomUUID()}`;
    const udcid = `MH-${(form.district || 'XX').slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);
    const newCentre: DiagnosticCentre = {
      id, udcid, name: form.name || 'Untitled Centre',
      type: form.type, ownershipType: form.ownershipType,
      district: form.district, taluka: form.taluka,
      address: form.address, pincode: form.pincode,
      phone: form.phone, email: form.email, website: form.website || undefined,
      gpsLat: form.gpsLat ? parseFloat(form.gpsLat) : undefined,
      gpsLng: form.gpsLng ? parseFloat(form.gpsLng) : undefined,
      owner: { name: form.ownerName, qualification: form.ownerQual, phone: form.ownerPhone },
      doctors: form.doctorName ? [{ name: form.doctorName, qualification: form.doctorQual, phone: form.ownerPhone, registrationNumber: form.doctorReg, registrationAuthority: form.doctorAuth || 'Maharashtra Medical Council', registrationExpiry: form.doctorExpiry }] : [],
      technicalStaff: form.staffName ? [{ name: form.staffName, qualification: form.staffQual, designation: form.staffDes, phone: '', registrationNumber: form.staffReg, registrationAuthority: 'Maharashtra Para-Medical Training Board' }] : [],
      services: form.services, equipment: form.equipName ? [{ id: `E-${Date.now()}`, name: form.equipName, make: form.equipMake, model: form.equipModel, serialNumber: form.equipSerial, lastCalibrationDate: form.equipCalibration }] : [],
      status: 'Submitted', createdAt: now, updatedAt: now,
    };
    db.centres.push(newCentre);
    db.documents.push({ id: crypto.randomUUID(), centreId: id, title: form.doc1Title, category: 'Centre Registration', registration: form.doc1Reg, issuingAuthority: form.doc1Auth, issueDate: form.doc1Issue, expiryDate: form.doc1Expiry, attachment });
    permits.filter(p => p.registration.trim()).forEach(p => db.documents.push({ ...p, id: crypto.randomUUID(), centreId: id }));
    db.applicationEvents.push({ id: `AE-${Date.now()}`, centreId: id, fromStatus: '', toStatus: 'Submitted', actorRole: 'Centre', actorName: form.ownerName || 'Applicant', remarks: 'Application submitted via online portal', timestamp: now });
    await save(db);
    try { localStorage.setItem('mahacare-session', JSON.stringify({ role: 'Centre', district: form.district, centreId: id })); } catch {}
    await offlineDelete('mahacare-registration-draft').catch(() => {});
    setSubmitted(udcid);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }

  if (submitted) return (
    <PublicShell>
      <div className="pub-container register-page">
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', border: '1px solid #e5ebee', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#d1faf4', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: '#059669' }}>
            <Check size={28} />
          </div>
          <h2>Application Submitted</h2>
          <p style={{ color: '#7a93a2', fontSize: 14, marginTop: 8 }}>Your application has been registered with the system. An officer will review it shortly.</p>
          <div style={{ background: '#f0f7f6', border: '1px solid #a7f3d0', borderRadius: 10, padding: '16px 20px', margin: '24px 0' }}>
            <p style={{ fontSize: 12, color: '#065f46', marginBottom: 6 }}>Your Application UDCID</p>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1e3a5f', letterSpacing: 1 }} translate="no">{submitted}</div>
            <p style={{ fontSize: 11, color: '#8fa5b5', marginTop: 6 }}>Save this ID to track your application</p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/login" className="pub-btn-primary">Go to Portal</Link>
            <Link href="/centres" className="pub-btn-outline">Browse Centres</Link>
          </div>
          <p style={{ fontSize: 11, color: '#aab9c5', marginTop: 20 }}>Demo application saved. Online records are shared; offline submissions wait on this device until connectivity returns.</p>
        </div>
      </div>
    </PublicShell>
  );

  return (
    <PublicShell>
      <div className="pub-container register-page">
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#8fa5b5', marginBottom: 12 }}><ArrowLeft size={14} /> Back to home</Link>
          <span className="eyebrow">CENTRE REGISTRATION</span>
          <h1 style={{ fontSize: 30, marginTop: 8 }}>Register your Diagnostic Centre</h1>
          <p style={{ color: '#7a93a2', fontSize: 14, marginTop: 8 }}>Complete all steps to submit your centre registration application.</p>
        </div>

        {/* Step bar */}
        <div className="register-steps-bar">
          {steps.map(s => (
            <div key={s.n} className={`register-step ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}>
              {step > s.n ? <Check size={14} /> : s.n}
              <small>{s.label}</small>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Sidebar */}
          <div style={{ background: 'white', border: '1px solid #e5ebee', borderRadius: 12, padding: 20, height: 'fit-content' }}>
            {steps.map(s => (
              <button key={s.n} onClick={() => step > s.n && setStep(s.n)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 7, marginBottom: 4, textAlign: 'left', background: step === s.n ? '#e8f5f3' : 'none', color: step === s.n ? '#0d9488' : step > s.n ? '#4d6578' : '#aab9c5', fontWeight: step === s.n ? 700 : 400, fontSize: 13, cursor: step > s.n ? 'pointer' : 'default' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step > s.n ? '#d1faf4' : step === s.n ? '#0d9488' : '#f0f4f7', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 10, color: step > s.n ? '#059669' : step === s.n ? 'white' : '#aab9c5' }}>
                  {step > s.n ? <Check size={12} /> : s.n}
                </div>
                {s.label}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div style={{ background: 'white', border: '1px solid #e5ebee', borderRadius: 12, padding: 32 }}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 24 }}>Basic Details</h2>
                <Field label="Centre Name" id="name" required>
                  <input id="name" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name of centre" />
                </Field>
                <Field label="Facility Type" id="type" required>
                  <select id="type" className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as FacilityType }))}>
                    {facilityTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Ownership Type" id="ownership">
                  <select id="ownership" className="form-select" value={form.ownershipType} onChange={e => setForm(f => ({ ...f, ownershipType: e.target.value as OwnershipType }))}>
                    {ownershipTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Contact Phone" id="phone" required>
                  <input id="phone" className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Centre phone number" />
                </Field>
                <Field label="Email" id="email" required>
                  <input id="email" type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Centre email address" />
                </Field>
                <Field label="Website (optional)" id="website">
                  <input id="website" className="form-input" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yourcentre.example" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 24 }}>Location Details</h2>
                <Field label="Full Address" id="address" required>
                  <input id="address" className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Building, street, area" />
                </Field>
                <Field label="District" id="district" required>
                  <select id="district" className="form-select" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value, taluka: '' }))}>
                    <option value="">Select district</option>
                    {districts.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Taluka" id="taluka">
                  {availTalukas.length ? <select id="taluka" className="form-select" value={form.taluka} onChange={e => setForm(f => ({ ...f, taluka: e.target.value }))}>
                    <option value="">Select taluka</option>{availTalukas.map(t => <option key={t}>{t}</option>)}
                  </select> : <input id="taluka" className="form-input" disabled={!form.district} value={form.taluka} onChange={e => setForm(f => ({ ...f, taluka: e.target.value }))} placeholder="Enter taluka" />}
                </Field>
                <Field label="Pincode" id="pincode" required>
                  <input id="pincode" className="form-input" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit pincode" maxLength={6} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="GPS Latitude" id="lat">
                    <input id="lat" className="form-input" value={form.gpsLat} onChange={e => setForm(f => ({ ...f, gpsLat: e.target.value }))} placeholder="e.g. 18.5204" />
                  </Field>
                  <Field label="GPS Longitude" id="lng">
                    <input id="lng" className="form-input" value={form.gpsLng} onChange={e => setForm(f => ({ ...f, gpsLng: e.target.value }))} placeholder="e.g. 73.8567" />
                  </Field>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 24 }}>Owner & Staff Details</h2>
                <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 14 }}>Centre Owner / Contact Person</h3>
                  <Field label="Owner Name" id="own-name" required><input id="own-name" className="form-input" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="Full name" /></Field>
                  <Field label="Qualification" id="own-qual"><input id="own-qual" className="form-input" value={form.ownerQual} onChange={e => setForm(f => ({ ...f, ownerQual: e.target.value }))} placeholder="e.g. MBBS, MD" /></Field>
                  <Field label="Phone" id="own-phone"><input id="own-phone" className="form-input" value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))} placeholder="Mobile number" /></Field>
                </div>
                <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 14 }}>In-charge Doctor</h3>
                  <Field label="Doctor Name" id="doc-name"><input id="doc-name" className="form-input" value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))} placeholder="Full name" /></Field>
                  <Field label="Qualification" id="doc-qual"><input id="doc-qual" className="form-input" value={form.doctorQual} onChange={e => setForm(f => ({ ...f, doctorQual: e.target.value }))} placeholder="e.g. MBBS, DNB Radiology" /></Field>
                  <Field label="Registration Number" id="doc-reg"><input id="doc-reg" className="form-input" translate="no" value={form.doctorReg} onChange={e => setForm(f => ({ ...f, doctorReg: e.target.value }))} placeholder="MMC registration number" /></Field>
                  <Field label="Registration Expiry" id="doc-exp"><input id="doc-exp" type="date" className="form-input" value={form.doctorExpiry} onChange={e => setForm(f => ({ ...f, doctorExpiry: e.target.value }))} /></Field>
                </div>
                <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '14px 16px' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 14 }}>Technical Staff</h3>
                  <Field label="Staff Name" id="staff-name"><input id="staff-name" className="form-input" value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} placeholder="Full name" /></Field>
                  <Field label="Qualification" id="staff-qual"><input id="staff-qual" className="form-input" value={form.staffQual} onChange={e => setForm(f => ({ ...f, staffQual: e.target.value }))} placeholder="e.g. DMLT, BMLT" /></Field>
                  <Field label="Designation" id="staff-des"><input id="staff-des" className="form-input" value={form.staffDes} onChange={e => setForm(f => ({ ...f, staffDes: e.target.value }))} placeholder="e.g. Lab Technician" /></Field>
                  <Field label="Para-medical Reg. Number" id="staff-reg"><input id="staff-reg" className="form-input" translate="no" value={form.staffReg} onChange={e => setForm(f => ({ ...f, staffReg: e.target.value }))} placeholder="MPTB registration number" /></Field>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>Services & Equipment</h2>
                <p style={{ fontSize: 13, color: '#8fa5b5', marginBottom: 20 }}>Select all services your centre provides.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                  {allServices.map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', background: form.services.includes(s) ? '#e8f5f3' : '#f5f8fa', border: `1px solid ${form.services.includes(s) ? '#a7f3d0' : '#e5ebee'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: form.services.includes(s) ? '#065f46' : '#4d6578' }}>
                      <input type="checkbox" checked={form.services.includes(s)} onChange={() => toggleService(s)} style={{ accentColor: '#0d9488' }} />
                      {s}
                    </label>
                  ))}
                </div>
                <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '14px 16px' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 14 }}>Equipment (add one)</h3>
                  <Field label="Serial Number" id="eq-serial"><input id="eq-serial" className="form-input" value={form.equipSerial} onChange={e => setForm(f => ({ ...f, equipSerial: e.target.value }))} /></Field>
                  <Field label="Last Calibration Date" id="eq-calibration"><input id="eq-calibration" type="date" className="form-input" value={form.equipCalibration} onChange={e => setForm(f => ({ ...f, equipCalibration: e.target.value }))} /></Field>
                  <Field label="Equipment Name" id="eq-name"><input id="eq-name" className="form-input" value={form.equipName} onChange={e => setForm(f => ({ ...f, equipName: e.target.value }))} placeholder="e.g. MRI Scanner 1.5T" /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Make" id="eq-make"><input id="eq-make" className="form-input" value={form.equipMake} onChange={e => setForm(f => ({ ...f, equipMake: e.target.value }))} placeholder="e.g. Siemens" /></Field>
                    <Field label="Model" id="eq-model"><input id="eq-model" className="form-input" value={form.equipModel} onChange={e => setForm(f => ({ ...f, equipModel: e.target.value }))} placeholder="e.g. MAGNETOM Aera" /></Field>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>Documents</h2>
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#92400e' }}>
                  <strong>Illustrative only.</strong> Document requirements vary by facility type and are configurable. The fields below show a sample document entry. In a production system, document checklists are generated based on your facility type.
                </div>
                <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '14px 16px' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 14 }}>Primary Registration Certificate</h3>
                  <Field label="Document Title" id="d1-title"><input id="d1-title" className="form-input" value={form.doc1Title} onChange={e => setForm(f => ({ ...f, doc1Title: e.target.value }))} placeholder="e.g. Centre Registration Certificate" /></Field>
                  <Field label="Registration Number" id="d1-reg"><input id="d1-reg" className="form-input" translate="no" value={form.doc1Reg} onChange={e => setForm(f => ({ ...f, doc1Reg: e.target.value }))} placeholder="Registration or licence number" /></Field>
                  <Field label="Issuing Authority" id="d1-auth"><input id="d1-auth" className="form-input" value={form.doc1Auth} onChange={e => setForm(f => ({ ...f, doc1Auth: e.target.value }))} placeholder="e.g. Directorate of Health Services" /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Issue Date" id="d1-issue"><input id="d1-issue" type="date" className="form-input" value={form.doc1Issue} onChange={e => setForm(f => ({ ...f, doc1Issue: e.target.value }))} /></Field>
                    <Field label="Expiry Date" id="d1-exp"><input id="d1-exp" type="date" className="form-input" value={form.doc1Expiry} onChange={e => setForm(f => ({ ...f, doc1Expiry: e.target.value }))} /></Field>
                  </div>
                  <div style={{ background: '#edf3f7', borderRadius: 7, padding: '10px 14px', fontSize: 12, color: '#7a93a2' }}>
                    <label>Attach registration document (PDF/image, up to 500 KB)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => void attach(e.target.files?.[0])} /></label>{attachment && <p>{attachment.name}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 5 && permits.map((permit, index) => <section key={permit.category} className="mt-4 p-4 border rounded-lg">
              <h3>{permit.title} (if applicable)</h3>
              {(['registration', 'issuingAuthority', 'issueDate', 'expiryDate'] as const).map(field => <label key={field} className="block mt-2 text-sm">
                {{ registration: 'Registration number', issuingAuthority: 'Issuing authority', issueDate: 'Issue date', expiryDate: 'Expiry date' }[field]}
                <input className="form-input" type={field.endsWith('Date') ? 'date' : 'text'} value={permit[field]} onChange={e => setPermits(current => current.map((p, i) => i === index ? { ...p, [field]: e.target.value } : p))} />
              </label>)}
              <label className="block text-sm">Attachment (PDF/image, up to 500 KB)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => void attach(e.target.files?.[0], index)} /></label>
              {permit.attachment && <small>{permit.attachment.name}</small>}
            </section>)}
            {error && <p role="alert" className="text-sm text-red-700 mt-3">{error}</p>}
            {step === 6 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 20 }}>Review & Submit</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { title: 'Basic Details', step: 1, items: [['Centre name', form.name || '—'], ['Facility type', form.type], ['Ownership', form.ownershipType], ['Phone', form.phone || '—'], ['Email', form.email || '—']] },
                    { title: 'Location', step: 2, items: [['Address', form.address || '—'], ['District', form.district || '—'], ['Taluka', form.taluka || '—'], ['Pincode', form.pincode || '—']] },
                    { title: 'Owner & Staff', step: 3, items: [['Owner', form.ownerName || '—'], ['Doctor', form.doctorName || '—'], ['Technical staff', form.staffName || '—']] },
                    { title: 'Services', step: 4, items: [['Selected services', form.services.length ? form.services.join(', ') : '—'], ['Equipment', form.equipName || '—']] },
                    { title: 'Documents', step: 5, items: [['Primary document', form.doc1Title || '—'], ['Reg. number', form.doc1Reg || '—']] },
                  ].map(section => (
                    <div key={section.title} style={{ background: '#f5f8fa', borderRadius: 8, padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>{section.title}</h3>
                        <button onClick={() => setStep(section.step)} style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>Edit</button>
                      </div>
                      <dl style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, fontSize: 12 }}>
                        {section.items.map(([k, v]) => (<><dt key={`k-${k}`} style={{ color: '#8fa5b5' }}>{k}</dt><dd key={`v-${k}`} style={{ margin: 0, color: '#2d4f65' }}>{v}</dd></>))}
                      </dl>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginTop: 20, fontSize: 12, color: '#92400e' }}>
                  <strong>Demo submission:</strong> The application will appear in the shared portal as Submitted. Offline applications are queued on this device. This prototype does not create a government registration.
                </div>
              </>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #e5ebee' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {step > 1 && <button className="pub-btn-outline" onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}><ArrowLeft size={14} /> Previous</button>}
                <button onClick={() => offlineSet('mahacare-registration-draft', { form, permits, attachment }).then(() => setError('Draft saved on this device.')).catch(error => setError(error.message))} className="pub-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#7a93a2' }}><Save size={14} /> Save Draft</button>
              </div>
              {step < 6 ? (
                <button className="pub-btn-large" onClick={() => setStep(s => s + 1)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Next <ArrowRight size={14} /></button>
              ) : (
                <button className="pub-btn-large" disabled={busy} onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Check size={16} /> Submit Application</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
