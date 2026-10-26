import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

const filename = `workflow-test-${randomUUID()}.json`;
const file = path.join(process.cwd(), '.runtime', filename);
const port = 3200 + Math.floor(Math.random() * 500);
const base = `http://localhost:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(port)], {
  cwd: process.cwd(), env: { ...process.env, REGISTRY_FILE_NAME: filename }, stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', data => logs += data);
server.stderr.on('data', data => logs += data);
const pause = () => new Promise(resolve => setTimeout(resolve, 300));
async function patch(changes, role = 'Centre', status = 200) {
  const response = await fetch(`${base}/api/registry`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-demo-role': role }, body: JSON.stringify({ changes }) });
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  return body;
}
const change = (table, before, after) => ({ table, id: after.id, before, after });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(`${base}/api/registry`)).ok; if (ready) break; } catch {}
    await pause();
  }
  assert.ok(ready, logs);
  const initial = await (await fetch(`${base}/api/registry`)).json();
  const centre = { ...initial.centres[0], id: 'TEST-CENTRE', udcid: 'MH-TEST-2026-001', name: 'Workflow Test Clinic', status: 'Submitted', approvedAt: undefined };
  const permit = { ...initial.documents[0], id: 'TEST-DOC', centreId: centre.id, expiryDate: '2099-12-31', attachment: { name: 'test.pdf', type: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0=' } };
  let db = await patch([change('centres', null, centre), change('documents', null, permit)]);
  assert.equal(db.documents.find(d => d.id === permit.id).attachment.name, 'test.pdf');
  assert.equal((await fetch(`${base}/api/certificates/${centre.udcid}`)).status, 403);
  await patch([change('centres', centre, { ...centre, status: 'Approved' })], 'District Admin', 409);
  await patch([change('centres', centre, { ...centre, status: 'Inspection Scheduled' })], 'Officer', 409);
  const scheduled = { ...centre, status: 'Inspection Scheduled' };
  await patch([change('centres', centre, scheduled)], 'District Admin');
  const inspected = { ...scheduled, status: 'Inspection Completed' };
  const report = { id: 'TEST-REPORT', centreId: centre.id, officerId: 'TEST-OFFICER', officerName: 'Test inspector', status: 'Completed', scheduledAt: '2026-01-01', conductedAt: '2026-01-02', gpsLat: 18.5, gpsLng: 73.8, gpsCapturedAt: '2026-01-02T10:00:00Z', gpsAccuracy: 7, checklist: [{ id: 'safety', label: 'Test safety item', result: 'Compliant' }], remarks: 'Synthetic integration fixture', followUpRequired: false, photos: [{ id: 'photo', name: 'Synthetic image', capturedAt: '2026-01-02T10:00:00Z', dataUrl: 'data:image/jpeg;base64,/9j/2Q==' }] };
  await patch([change('inspections', null, { ...report, photos: [] })], 'Officer', 409);
  db = await patch([change('inspections', null, report), change('centres', scheduled, inspected)], 'Officer');
  assert.equal(db.inspections.find(i => i.id === report.id).photos.length, 1);
  await patch([change('centres', inspected, { ...inspected, status: 'Approved' })], 'Officer', 409);
  const approved = { ...inspected, status: 'Approved', approvedAt: '2026-01-03' };
  await patch([change('centres', inspected, approved)], 'District Admin');
  const secondDevice = await (await fetch(`${base}/api/registry`)).json();
  assert.equal(secondDevice.centres.find(c => c.id === centre.id).status, 'Approved');
  await patch([change('centres', scheduled, { ...approved, name: 'Stale write' })], 'District Admin', 409);
  const response = await fetch(`${base}/api/certificates/${centre.udcid}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /MH-TEST-2026-001/);
  assert.equal((await PDFDocument.load(await response.arrayBuffer())).getPageCount(), 1);
  const marathi = { ...approved, name: 'चाचणी क्लिनिक' };
  await patch([change('centres', approved, marathi)], 'District Admin');
  const localizedPdf = await fetch(`${base}/api/certificates/${centre.udcid}`);
  if (!localizedPdf.ok) throw new Error(await localizedPdf.text());
  assert.equal(localizedPdf.status, 200);
  assert.equal((await PDFDocument.load(await localizedPdf.arrayBuffer())).getPageCount(), 1);
  assert.equal((await fetch(`${base}/mobile/centres/${centre.udcid}`)).status, 200);
  const legacy = await fetch(`${base}/centres/${centre.udcid}`, { redirect: 'manual' });
  assert.equal(legacy.status, 307);
  assert.equal(legacy.headers.get('location'), `/mobile/centres/${centre.udcid}`);
  assert.equal((await fetch(`${base}/mobile/centres/UNKNOWN`)).status, 200); // Client renders the missing-record state.
  console.log('PASS: documents, role restrictions, inspection evidence, approval gating, cross-device reads, stale writes, PDF and mobile report route.');
} finally {
  server.kill();
  await new Promise(resolve => server.once('exit', resolve));
  // Only the exact, randomly named test database is removed.
  assert.ok(path.resolve(file).startsWith(path.resolve('.runtime') + path.sep));
  await rm(file, { force: true });
  await rm(`${file}.tmp`, { force: true });
}
