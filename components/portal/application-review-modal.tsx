'use client';
import { useState } from 'react';
import {
  X, Check, AlertCircle, Clock, ShieldCheck, XCircle,
  Building2, UserCheck, Stethoscope, FileText, Calendar, Send
} from 'lucide-react';
import type { Database, DiagnosticCentre, Role, CentreStatus } from '../../lib/types';
import { updateDatabase } from '../../lib/storage';
import { approvalError } from '@/lib/workflow';
import { validity } from '../../lib/data';

interface ReviewModalProps {
  centre: DiagnosticCentre;
  db: Database;
  currentRole: Role;
  onClose: () => void;
  onSuccess: (updatedDb: Database, message: string) => void;
}

export default function ApplicationReviewModal({
  centre, db, currentRole, onClose, onSuccess
}: ReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'staff' | 'docs' | 'history'>('details');
  const [actionType, setActionType] = useState<'' | 'approve' | 'reject' | 'correction' | 'schedule'>('');
  const [remarks, setRemarks] = useState('');
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const blockedApproval = approvalError(db, centre, currentRole);
  const administrator = currentRole === 'State Admin' || currentRole === 'District Admin';
  const docs = db.documents.filter(d => d.centreId === centre.id);
  const events = db.applicationEvents.filter(e => e.centreId === centre.id);

  async function executeAction() {
    if (!actionType || busy) return;
    setError(''); setBusy(true);
    try {
    if (!administrator) throw new Error('Only administrators can issue application decisions.');
    if (actionType === 'approve' && blockedApproval) throw new Error(blockedApproval);
    if (!remarks.trim()) throw new Error('Enter decision remarks.');
    const now = new Date().toISOString().slice(0, 10);

    let nextStatus: CentreStatus = centre.status;
    let actionLabel = '';

    if (actionType === 'approve') {
      nextStatus = 'Approved';
      actionLabel = 'Application Approved';
    } else if (actionType === 'reject') {
      nextStatus = 'Rejected';
      actionLabel = 'Application Rejected';
    } else if (actionType === 'correction') {
      nextStatus = 'Correction Required';
      actionLabel = 'Correction Requested';
    } else if (actionType === 'schedule') {
      nextStatus = 'Inspection Scheduled';
      actionLabel = `Inspection Scheduled for ${scheduleDate}`;
    }

    const updatedDb = await updateDatabase(db, draft => {
      const target = draft.centres.find(c => c.id === centre.id);
      if (target) {
        target.status = nextStatus;
        if (nextStatus === 'Approved') {
          target.approvedAt = now;
        }
        target.updatedAt = now;
      }

      // Add application event
      draft.applicationEvents.push({
        id: `EV-${Date.now()}`,
        centreId: centre.id,
        fromStatus: centre.status,
        toStatus: nextStatus,
        actorRole: currentRole,
        actorName: currentRole === 'District Admin' ? 'District Administrator' : 'State Administrator',
        remarks: remarks || actionLabel,
        timestamp: now,
      });

      // Add notification for centre
      draft.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        district: centre.district,
        centreId: centre.id,
        message: `${centre.name}: ${actionLabel}. ${remarks ? `Note: ${remarks}` : ''}`,
        type: nextStatus === 'Approved' ? 'success' : nextStatus === 'Rejected' ? 'error' : 'warning',
        read: false,
        createdAt: now,
      });

      // If scheduled inspection, ensure inspection record exists
      if (actionType === 'schedule') {
        draft.inspections.push({
          id: `INS-${Date.now()}`,
          centreId: centre.id,
          officerId: 'U004',
          officerName: 'Dr. Ajay Bhosale (District Health Officer)',
          scheduledAt: scheduleDate,
          status: 'Scheduled',
          checklist: [],
          remarks: remarks || 'Scheduled on-site field verification',
          followUpRequired: false,
        });
      }
    });

    onSuccess(updatedDb, `Centre ${centre.name} status updated to: ${nextStatus}`);
    onClose();
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="modal max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-label="Application Review"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-700">{centre.udcid}</span>
              <span className={`badge ${
                centre.status === 'Approved' ? 'green' :
                centre.status === 'Rejected' ? 'red' : 'amber'
              }`}>{centre.status}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">{centre.name}</h2>
          </div>
          <button aria-label="Close dialog" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </header>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 mt-3 gap-4 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'details' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 size={15} /> Facility & Services
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'staff' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserCheck size={15} /> Personnel & Doctors ({centre.doctors.length + centre.technicalStaff.length})
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'docs' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText size={15} /> Documents ({docs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'history' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock size={15} /> Audit Timeline ({events.length})
          </button>
        </div>

        {/* Body content */}
        <div className="py-4 text-xs text-slate-700 max-h-[360px] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Facility Type</p>
                  <p className="font-bold text-slate-800 mt-0.5">{centre.type}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Ownership</p>
                  <p className="font-bold text-slate-800 mt-0.5">{centre.ownershipType}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">District / Taluka</p>
                  <p className="font-bold text-slate-800 mt-0.5">{centre.district} / {centre.taluka}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Address</p>
                  <p className="text-slate-800 mt-0.5">{centre.address} — {centre.pincode}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Phone</p>
                  <p className="text-slate-800 mt-0.5">{centre.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Owner / Director</p>
                  <p className="text-slate-800 mt-0.5">{centre.owner.name} ({centre.owner.qualification})</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Diagnostic Services Offered</h4>
                <div className="flex flex-wrap gap-1.5">
                  {centre.services.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-[11px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {centre.equipment && centre.equipment.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Diagnostic Machinery & Equipment</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {centre.equipment.map(eq => (
                      <div key={eq.id} className="p-2.5 bg-white flex justify-between items-center text-xs">
                        <div>
                          <strong>{eq.name}</strong> — {eq.make} ({eq.model})
                          <p className="text-[11px] text-slate-500 font-mono">Serial: {eq.serialNumber}</p>
                        </div>
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Calibration: {eq.lastCalibrationDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Stethoscope size={15} className="text-teal-600" />
                  Medical Practitioners & Radiologists (MMC Registered)
                </h4>
                <div className="space-y-2">
                  {centre.doctors.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <strong>{doc.name}</strong>
                        <span className="text-teal-700 font-mono font-semibold">{doc.registrationNumber}</span>
                      </div>
                      <p className="text-slate-600">Qualification: {doc.qualification} · Spec: {doc.specialisation || 'General'}</p>
                      <p className="text-slate-500 text-[11px]">Authority: {doc.registrationAuthority} · Validity: {doc.registrationExpiry}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <UserCheck size={15} className="text-teal-600" />
                  Technical & Paramedical Staff (State Paramedical Board)
                </h4>
                <div className="space-y-2">
                  {centre.technicalStaff.map((st, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <strong>{st.name} ({st.designation})</strong>
                        <span className="text-teal-700 font-mono font-semibold">{st.registrationNumber}</span>
                      </div>
                      <p className="text-slate-600">Qualification: {st.qualification} · Authority: {st.registrationAuthority}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2">Document Title</th>
                    <th>Category</th>
                    <th>Reg No</th>
                    <th>Issuing Authority</th>
                    <th>Expiry Date</th>
                    <th>Validity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map(doc => {
                    const v = validity(doc.expiryDate);
                    return (
                      <tr key={doc.id} className="py-2">
                        <td className="py-2 font-semibold text-slate-800">{doc.title}</td>
                        <td className="text-slate-600">{doc.category}</td>
                        <td className="font-mono text-slate-600">{doc.registration}</td>
                        <td className="text-slate-600">{doc.issuingAuthority}</td>
                        <td className="text-slate-600">{doc.expiryDate || 'N/A'}</td>
                        <td>
                          <span className={`badge ${v === 'Valid' ? 'green' : v === 'Expired' ? 'red' : 'amber'}`}>
                            {v}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((ev, i) => (
                <div key={ev.id || i} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-800">{ev.toStatus}</strong>
                    <span className="text-[11px] text-slate-400">· {ev.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">By: {ev.actorName} ({ev.actorRole})</p>
                  {ev.remarks && <p className="mt-1 bg-slate-50 p-2 rounded text-slate-700">{ev.remarks}</p>}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-xs text-slate-400">No application events recorded yet.</p>
              )}
            </div>
          )}
        </div>

        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        {blockedApproval && <p className="text-amber-800 text-xs p-2">{blockedApproval}</p>}
        {docs.some(d => d.attachment) && <div className="p-2 text-xs"><strong>Submitted files</strong>{docs.filter(d => d.attachment).map(d => <a key={d.id} className="block text-teal-700 underline" href={d.attachment!.dataUrl} download={d.attachment!.name}>{d.title}: {d.attachment!.name}</a>)}</div>}
        {/* Action Panel */}
        <div className="border-t border-slate-200 pt-3 mt-2">
          {!actionType ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Official Regulatory Actions:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!administrator || busy}
                  onClick={() => { setActionType('schedule'); setRemarks('Scheduled field inspection to verify equipment, AERB safety shielding, and technician records on site.'); }}
                  className="py-1.5 px-3 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar size={14} /> Schedule Inspection
                </button>
                <button
                  type="button"
                  disabled={!administrator || busy}
                  onClick={() => { setActionType('correction'); setRemarks('Please upload updated biomedical waste agreement and clear copy of AERB approval.'); }}
                  className="py-1.5 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle size={14} /> Request Corrections
                </button>
                <button
                  type="button"
                  disabled={!!blockedApproval || busy}
                  title={blockedApproval || 'Approve inspected centre'}
                  onClick={() => { setActionType('approve'); setRemarks('All clinical criteria, radiation safety norms, and medical staff registrations verified and approved.'); }}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> Approve Registration
                </button>
                <button
                  type="button"
                  disabled={!administrator || busy}
                  onClick={() => { setActionType('reject'); setRemarks('Fails statutory safety requirements. Equipment lacking mandatory calibration certifications.'); }}
                  className="py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-800">
                  Confirming: <span className="text-teal-700">{actionType.toUpperCase()}</span>
                </span>
                <button
                  onClick={() => setActionType('')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel
                </button>
              </div>

              {actionType === 'schedule' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Scheduled Inspection Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Official Decision Remarks / Justification *
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter detailed reason or instructions for the applicant..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActionType('')}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  disabled={busy} onClick={executeAction}
                  className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send size={13} /> Confirm & Apply Action
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
