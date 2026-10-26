'use client';
import { useEffect, useState } from 'react';
import {
  X, Check, ShieldCheck, MapPin, Camera, FileCheck,
  AlertTriangle, ArrowRight, ArrowLeft, Building2, Upload
} from 'lucide-react';
import type { Database, DiagnosticCentre, Inspection, ChecklistItem } from '../../lib/types';
import { updateDatabase } from '../../lib/storage';
import { offlineGet, offlineSet, offlineDelete } from '@/lib/offline-store';
import { distanceMeters, inspectionError } from '@/lib/workflow';
import { inspectionPhoto } from '@/lib/media';
import type { InspectionPhoto } from '@/lib/types';

interface InspectionModalProps {
  db: Database;
  officerDistrict: string;
  initialCentreId?: string;
  onClose: () => void;
  onSuccess: (updatedDb: Database, message: string) => void;
}

const defaultChecklist: { id: string; label: string }[] = [
  { id: 'chk-1', label: 'Patient safety protocols, signage, and emergency exit routes clearly visible' },
  { id: 'chk-2', label: 'Equipment calibration logs and manufacturer service certificates up to date' },
  { id: 'chk-3', label: 'Radiation safety shielding (lead glass, aprons) and AERB clearances verified' },
  { id: 'chk-4', label: 'Emergency medicines, resuscitation kit, and oxygen cylinder available & inspected' },
  { id: 'chk-5', label: 'Biomedical waste segregation colour-coded bins and authorization present' },
  { id: 'chk-6', label: 'Registered Medical Practitioners and qualified technicians present on duty' },
];

export default function InspectionModal({ db, officerDistrict, initialCentreId, onClose, onSuccess }: InspectionModalProps) {
  const [step, setStep] = useState(1);

  // Available centres in this district
  const districtCentres = db.centres.filter(c => c.district === officerDistrict && c.status === 'Inspection Scheduled');
  const [selectedCentreId, setSelectedCentreId] = useState(initialCentreId || districtCentres[0]?.id || '');
  const selectedCentre = db.centres.find(c => c.id === selectedCentreId);

  // GPS State
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number; capturedAt: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'verified'>('idle');

  // Documents checked
  const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});

  // Checklist items
  const [checklist, setChecklist] = useState<Record<string, 'Compliant' | 'Non-compliant' | 'Not Applicable'>>({
  });

  // Photos
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Remarks
  const [remarks, setRemarks] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const [draftReady, setDraftReady] = useState(false);
  const draftKey = `mahacare-inspection-draft-${officerDistrict}`;
  useEffect(() => {
    offlineGet<any>(draftKey).then(draft => {
      if (draft && (!initialCentreId || initialCentreId === draft.selectedCentreId) && districtCentres.some(c => c.id === draft.selectedCentreId)) {
        setSelectedCentreId(draft.selectedCentreId); setStep(draft.step || 1); setGps(draft.gps);
        setGpsStatus(draft.gps ? 'verified' : 'idle'); setPhotos(draft.photos || []);
        setVerifiedDocs(draft.verifiedDocs || {}); setChecklist(draft.checklist || {});
        setRemarks(draft.remarks || ''); setFollowUp(!!draft.followUp); setFollowUpDate(draft.followUpDate || '');
      }
    }).catch(() => setError('Saved inspection draft could not be read.')).finally(() => setDraftReady(true));
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    offlineSet(draftKey, { selectedCentreId, step, gps, photos, verifiedDocs, checklist, remarks, followUp, followUpDate })
      .catch(() => setError('Device storage is full. Remove a photo or free storage before leaving this report.'));
  }, [draftReady, selectedCentreId, step, gps, photos, verifiedDocs, checklist, remarks, followUp, followUpDate, draftKey]);


  const centreDocs = db.documents.filter(d => d.centreId === selectedCentreId);

  function captureGps() {
    setError('');
    if (!navigator.geolocation || !window.isSecureContext) {
      setError('Device GPS requires HTTPS or localhost. Open this site over HTTPS on your phone.'); return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(position => {
      setGps({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: new Date(position.timestamp).toISOString() });
      setGpsStatus('verified');
    }, failure => { setGpsStatus('idle'); setError(failure.message || 'Location unavailable. Allow location access and retry.'); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }
  async function addPhoto(file?: File) {
    if (!file) return;
    setBusy(true); setError('');
    try {
      if (photos.length >= 4) throw new Error('Attach up to four photos.');
      const photo = await inspectionPhoto(file);
      setPhotos(current => [...current, { ...photo, gpsLat: gps?.lat, gpsLng: gps?.lng }]);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  const proximity = gps && selectedCentre?.gpsLat !== undefined && selectedCentre?.gpsLng !== undefined
    ? distanceMeters(gps.lat, gps.lng, selectedCentre.gpsLat, selectedCentre.gpsLng) : null;

  async function handleSubmit() {
    if (!selectedCentre || busy) return;
    setBusy(true); setError('');
    try {

    const now = new Date().toISOString();
    const updatedDb = await updateDatabase(db, draft => {
      // 1. Add inspection record
      const inspectionId = `INS-FIELD-${Date.now()}`;
      const newItems: ChecklistItem[] = defaultChecklist.map(c => ({
        id: c.id,
        label: c.label,
        result: checklist[c.id] || 'Compliant',
      }));

      const newInspection: Inspection = {
        id: inspectionId,
        centreId: selectedCentre.id,
        officerId: 'U004',
        officerName: 'Field Inspector',
        scheduledAt: now,
        conductedAt: now,
        status: 'Completed',
        gpsLat: gps?.lat, gpsLng: gps?.lng, gpsAccuracy: gps?.accuracy, gpsCapturedAt: gps?.capturedAt,
        photos, verifiedDocumentIds: Object.keys(verifiedDocs).filter(id => verifiedDocs[id]),
        checklist: newItems,
        remarks,
        followUpRequired: followUp,
        followUpDate: followUp ? followUpDate : undefined,
      };

      const validation = inspectionError(newInspection);
      if (validation) throw new Error(validation);
      draft.inspections = draft.inspections.filter(i => !(i.centreId === selectedCentre.id && i.status === 'Scheduled'));
      draft.inspections.push(newInspection);

      // 2. Update centre status
      const target = draft.centres.find(c => c.id === selectedCentre.id);
      if (target) {
        target.lastInspectionDate = now;
        if (target.status === 'Inspection Scheduled' || target.status === 'Under Review') {
          target.status = 'Inspection Completed';
        }
      }

      // 3. Add application event audit
      draft.applicationEvents.push({
        id: `EV-${Date.now()}`,
        centreId: selectedCentre.id,
        fromStatus: selectedCentre.status,
        toStatus: 'Inspection Completed',
        actorRole: 'Officer',
        actorName: 'Field Inspector',
        remarks: `On-site field inspection conducted with GPS verification. Findings: ${remarks.slice(0, 100)}...`,
        timestamp: now,
      });

      // 4. Add notification
      draft.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        district: officerDistrict,
        centreId: selectedCentre.id,
        message: `Field inspection report submitted for ${selectedCentre.name}. Outcome: Completed.`,
        type: 'success',
        read: false,
        createdAt: now,
      });
    });

    await offlineDelete(draftKey).catch(() => {});
    onSuccess(updatedDb, `Inspection report submitted successfully for ${selectedCentre.name}`);
    onClose();
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="modal max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Field Inspection Workflow"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Official Field Inspection</span>
            <p className="text-xs text-slate-500">Draft autosaves on this device. Offline submissions sync when this app reconnects.</p>
            <h2 className="text-lg font-bold text-slate-800">7-Step On-Site Verification Protocol</h2>
          </div>
          <button aria-label="Close dialog" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </header>

        {/* Step indicator bar */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Step {step} of 7: {
              step === 1 ? 'Select Centre' :
              step === 2 ? 'GPS Geolocation' :
              step === 3 ? 'Document Verification' :
              step === 4 ? 'Safety Checklist' :
              step === 5 ? 'Photo Evidence' :
              step === 6 ? 'Officer Observations' :
              'Review & Submit'
            }</span>
            <span className="text-teal-700 font-bold">{Math.round((step / 7) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-2 text-sm text-slate-700">
          {/* STEP 1: SELECT CENTRE */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Centre for On-Site Inspection ({officerDistrict} District)
              </label>
              <select
                value={selectedCentreId}
                onChange={e => { setSelectedCentreId(e.target.value); setGps(null); setGpsStatus('idle'); setPhotos([]); setVerifiedDocs({}); setChecklist({}); }}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {districtCentres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.udcid}) — Current Status: {c.status}
                  </option>
                ))}
              </select>

              {selectedCentre && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedCentre.name}</h4>
                      <p className="text-xs text-slate-500">{selectedCentre.address}</p>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-semibold">
                      {selectedCentre.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                    <p><strong>Owner:</strong> {selectedCentre.owner.name}</p>
                    <p><strong>Phone:</strong> {selectedCentre.phone}</p>
                    <p><strong>Last Inspection:</strong> {selectedCentre.lastInspectionDate || 'None on record'}</p>
                    <p><strong>Pending Documents:</strong> {centreDocs.length} registered</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: GPS VERIFICATION */}
          {step === 2 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                <MapPin size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800">On-Site Geolocation Tagging</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Record device coordinates and accuracy. Compare them with the registered premises location.
              </p>

              {gpsStatus === 'idle' && (
                <div className="space-y-3">
                  <button
                    onClick={captureGps}
                    className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin size={16} /> Capture Device GPS
                  </button>
                  <p className="text-xs text-slate-400">Your browser will request location permission.</p>
                </div>
              )}

              {gpsStatus === 'locating' && (
                <div className="text-teal-700 animate-pulse text-sm font-semibold">
                  Triangulating satellite coordinates…
                </div>
              )}

              {gpsStatus === 'verified' && gps && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl inline-block text-left text-xs text-emerald-900 max-w-sm w-full space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                    <Check size={16} /> Device Location Captured
                  </div>
                  <p><strong>Latitude:</strong> {gps.lat.toFixed(6)}° N</p>
                  <p><strong>Longitude:</strong> {gps.lng.toFixed(6)}° E</p>
                  <p><strong>Device accuracy:</strong> ±{Math.round(gps.accuracy)} m</p>
                  <p><strong>Distance from premises:</strong> {proximity === null ? 'Premises GPS not registered' : `${Math.round(proximity)} m`}</p>
                  <p><strong>Timestamp:</strong> {new Date(gps.capturedAt).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DOCUMENT VERIFICATION */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Cross-check on-site original certificates and trade permits against registry records:
              </p>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {centreDocs.map(doc => (
                  <label key={doc.id} className="flex items-start gap-3 py-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={!!verifiedDocs[doc.id]}
                      onChange={e => setVerifiedDocs({ ...verifiedDocs, [doc.id]: e.target.checked })}
                      className="mt-1 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-800">{doc.title}</strong>
                      <span className="text-slate-500 ml-2 font-mono">({doc.registration})</span>
                      <p className="text-slate-500">Authority: {doc.issuingAuthority} · Expiry: {doc.expiryDate || 'N/A'}</p>
                    </div>
                  </label>
                ))}
                {centreDocs.length === 0 && (
                  <p className="text-xs text-amber-700 p-2">No documents currently uploaded for this centre.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CHECKLIST */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Standard clinical and radiological safety items:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {defaultChecklist.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-800 mb-2">{item.label}</p>
                    <div className="flex gap-4">
                      {(['Compliant', 'Non-compliant', 'Not Applicable'] as const).map(option => (
                        <label key={option} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`item-${item.id}`}
                            value={option}
                            checked={checklist[item.id] === option}
                            onChange={() => setChecklist({ ...checklist, [item.id]: option })}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className={option === 'Compliant' ? 'text-emerald-700' : option === 'Non-compliant' ? 'text-rose-700' : 'text-slate-500'}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: PHOTOS */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Attach evidentiary inspection photographs (timestamped):</p>
              <div className="grid grid-cols-2 gap-3">
                {photos.map(photo => <div key={photo.id} className="border rounded-lg p-2">
                  <img src={photo.dataUrl} alt={photo.name} className="w-full rounded" />
                  <p>{photo.name}</p><small>{new Date(photo.capturedAt).toLocaleString('en-IN')}</small>
                  <button type="button" onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}>Remove photo</button>
                </div>)}
              </div>
              <label className="block text-sm font-semibold">Take a photo
                <input type="file" accept="image/*" capture="environment" disabled={busy} onChange={e => { void addPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <label className="block text-sm font-semibold">Or choose an existing photo
                <input type="file" accept="image/*" disabled={busy} onChange={e => { void addPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <p className="text-xs">Up to four compressed images. The attachment time and available GPS are saved with each photo.</p>
            </div>
          )}

          {/* STEP 6: REMARKS */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Officer Inspection Findings & Observations *
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Record all specific observations, deficiencies noted, or recommendations..."
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUp}
                    onChange={e => setFollowUp(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mandatory Follow-up Re-inspection Required</span>
                </label>

                {followUp && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-600 uppercase font-semibold mb-1">
                      Scheduled Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="border border-slate-300 rounded-md p-1.5 text-xs bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & SUBMIT */}
          {step === 7 && (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1.5 text-teal-900">
                <div className="font-bold text-teal-800 text-sm">Summary of Field Report</div>
                <p><strong>Centre:</strong> {selectedCentre?.name} ({selectedCentre?.udcid})</p>
                <p><strong>GPS Verified:</strong> {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Not captured'}</p>
                <p><strong>Checklist Items:</strong> 6 standard points evaluated</p>
                <p><strong>Follow-up Required:</strong> {followUp ? `Yes (${followUpDate})` : 'No'}</p>
                <p><strong>Inspector:</strong> Field Inspector</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>Legal Attestation:</strong> By submitting this report, the officer confirms having personally inspected the premises, equipment, radiation safety shielding, and staff credentials in accordance with Maharashtra clinical diagnostic standards.
              </div>
            </div>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {/* Footer Navigation */}
        <footer className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="py-2 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={() => {
                setError('');
                if (step === 1 && !selectedCentre) { setError('Schedule an inspection for a centre first.'); return; }
                if (step === 2 && !gps) { setError('Capture device GPS before continuing.'); return; }
                if (step === 3 && centreDocs.some(d => !verifiedDocs[d.id])) { setError('Review every submitted document.'); return; }
                if (step === 4 && defaultChecklist.some(c => !checklist[c.id])) { setError('Evaluate all checklist items.'); return; }
                if (step === 5 && !photos.length) { setError('Attach at least one photo.'); return; }
                if (step === 6 && (!remarks.trim() || (followUp && !followUpDate))) { setError('Enter findings and any required follow-up date.'); return; }
                setStep(step + 1);
              }}
              className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleSubmit}
              className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Check size={16} /> Submit Inspection Report
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
