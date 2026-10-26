import test from 'node:test';
import assert from 'node:assert/strict';
import { approvalError, inspectionError, distanceMeters } from '../lib/workflow.ts';
import { seed, districts } from '../lib/data.ts';

function ready() {
  const db = seed();
  const centre = db.centres[0];
  centre.status = 'Inspection Completed';
  db.inspections = [{ id: 'test', centreId: centre.id, status: 'Completed', conductedAt: '2099-01-01', checklist: [{ id: '1', result: 'Compliant' }], followUpRequired: false }];
  db.documents = [{ id: 'doc', centreId: centre.id, expiryDate: '2099-12-31' }];
  return { db, centre };
}
test('36 distinct current districts are available', () => {
  assert.equal(new Set(districts).size, 36);
  assert.ok(districts.includes('Mumbai City') && districts.includes('Mumbai Suburban') && districts.includes('Ahilyanagar'));
});
test('field inspectors and centre owners cannot approve', () => {
  const { db, centre } = ready();
  assert.match(approvalError(db, centre, 'Officer'), /administrator/);
  assert.match(approvalError(db, centre, 'Centre'), /administrator/);
});
test('approval requires completed inspection state and actual report', () => {
  const { db, centre } = ready();
  centre.status = 'Submitted';
  assert.match(approvalError(db, centre, 'District Admin'), /inspection/);
  centre.status = 'Inspection Completed'; db.inspections = [];
  assert.match(approvalError(db, centre, 'District Admin'), /report/);
});
test('noncompliance and follow-up block approval', () => {
  const { db, centre } = ready();
  db.inspections[0].checklist[0].result = 'Non-compliant';
  assert.match(approvalError(db, centre, 'State Admin'), /non-compliant/);
  db.inspections[0].checklist[0].result = 'Compliant'; db.inspections[0].followUpRequired = true;
  assert.match(approvalError(db, centre, 'State Admin'), /follow-up/);
});
test('missing and expired permits block approval', () => {
  const { db, centre } = ready();
  db.documents[0].expiryDate = '2000-01-01';
  assert.match(approvalError(db, centre, 'State Admin'), /expired/);
  db.documents = [];
  assert.match(approvalError(db, centre, 'State Admin'), /document/);
});
test('administrators can approve a complete compliant inspection', () => {
  const { db, centre } = ready();
  assert.equal(approvalError(db, centre, 'District Admin'), null);
});
test('field report requires captured coordinates, photograph and findings', () => {
  const report = { remarks: 'Checked', checklist: [{ id: '1' }] };
  assert.match(inspectionError(report), /GPS/);
  Object.assign(report, { gpsLat: 0, gpsLng: 0, gpsCapturedAt: new Date().toISOString() });
  assert.match(inspectionError(report), /photograph/);
  report.photos = [{ id: 'photo' }];
  assert.equal(inspectionError(report), null);
  report.remarks = '';
  assert.match(inspectionError(report), /findings/);
});
test('distance is measured rather than a fabricated proximity label', () => {
  assert.equal(distanceMeters(18, 73, 18, 73), 0);
  assert.ok(distanceMeters(18, 73, 18.001, 73) > 100);
});
