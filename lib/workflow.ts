import type { Database, DiagnosticCentre, Inspection, Role } from './types';

export function approvalError(db: Database, centre: DiagnosticCentre, role: Role): string | null {
  if (role !== 'State Admin' && role !== 'District Admin') return 'Only a district or state administrator can approve applications.';
  if (centre.status !== 'Inspection Completed') return 'Complete the field inspection before approval.';
  const latest = db.inspections.filter(i => i.centreId === centre.id && i.status === 'Completed')
    .sort((a, b) => (b.conductedAt || '').localeCompare(a.conductedAt || ''))[0];
  if (!latest) return 'A completed inspection report is required.';
  if (!latest.checklist.length || latest.checklist.some(i => i.result === 'Non-compliant')) return 'Resolve non-compliant inspection findings before approval.';
  if (latest.followUpRequired) return 'Complete a follow-up inspection before approval.';
  const docs = db.documents.filter(d => d.centreId === centre.id);
  if (!docs.length) return 'At least one registration document is required.';
  const today = new Date().toISOString().slice(0, 10);
  if (docs.some(d => d.expiryDate && d.expiryDate < today)) return 'Update expired documents before approval.';
  return null;
}

export function inspectionError(report: Inspection): string | null {
  if (!Number.isFinite(report.gpsLat) || !Number.isFinite(report.gpsLng) || !report.gpsCapturedAt) return 'Capture device GPS coordinates before submitting.';
  if (!report.photos?.length) return 'Attach at least one inspection photograph.';
  if (!report.remarks.trim()) return 'Enter inspection findings.';
  if (!report.checklist.length) return 'Complete the safety checklist.';
  if (report.followUpRequired && !report.followUpDate) return 'Choose a follow-up date.';
  return null;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
