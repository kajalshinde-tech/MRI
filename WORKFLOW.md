# MahaCare implemented workflow

This is a working demonstration with fictional records. Demo role selection is not production authentication. MMC/MPTB/government API access, government signatures and regulatory approval are not supplied by this project.

## Addresses

- Website and directory: `/` and `/centres`.
- Six-step registration: `/register`.
- Customer QR report: `/mobile/centres/{UDCID}`. No login or installation required.
- Existing `/centres/{UDCID}` links redirect to the customer report.
- Field inspector app entry: `/field`. Install it using the browser's Add to Home Screen option.
- Administrator and centre workspaces: `/portal` or `/login`.

Customer reports show clinic information, doctors, technicians, equipment, services and document validity in one scrollable page. They are establishment records, not individual patient diagnostic reports.

## Registration to certificate

1. Register the centre, location, staff and equipment. Add the primary registration document and applicable AERB, fire and trade permit details/files.
2. The shared registry creates a Submitted record with a unique demo UDCID. The registering browser remembers the centre for the Centre workspace.
3. A District Admin or State Admin reviews the application and schedules inspection.
4. Choose Officer, open Applications or Field Inspections, and select a scheduled centre. Capture real device GPS, review documents, complete the checklist, attach actual photos and enter findings. Reports autosave as device drafts.
5. The centre becomes Inspection Completed. Only administrators can approve. Missing inspection reports, non-compliant findings, follow-up requirements, missing registration documents and expired documents block approval.
6. Administrators select an approved centre under QR Plate or View Certificate. The Centre role sees its selected centre's certificate after approval. PDF, print and QR SVG downloads use that centre's own UDCID and report URL.

## Data and offline operation

The shared demo database is `.runtime/registry.json`, outside the public directory. Writes are serialized and saved atomically. Conflicting edits are rejected instead of overwriting another device's changes. The file-backed store is intended for one Node.js server; multi-instance hosting needs a transactional database.

IndexedDB stores the offline registry cache, photos, documents, drafts and retry queue. Existing browser-only records are retained in localStorage and also backed up in IndexedDB as `mahacare-legacy-backup` before adopting the shared cache. Existing browser data is not automatically uploaded or deleted.

Open the field workspace online once to cache its application files and records. Keep the app open or reopen it when connectivity returns to retry queued submissions. Rejected queued edits remain on the device and the sync status displays the error. Do not clear site data while reports are queued. Map tiles and Google translation require a network connection.

Phone GPS/camera and service workers require HTTPS. Localhost works for development on the same computer. A phone on the same LAN can read reports over the computer's advertised LAN address, but real field capture requires HTTPS. Configure `NEXT_PUBLIC_SITE_URL` before building when deploying to a reachable HTTPS address. QR codes generated for localhost automatically advertise an available private LAN address; confirm both devices can reach it through the local firewall.

The district roster supports all 36 districts listed by the Maharashtra Planning Department: https://plan.maharashtra.gov.in/en/36-districts/. Seed records cover selected districts; the UI does not invent facilities for the other districts. Talukas can be entered manually where no sample list is available.

## Checks

- `npm test`: approval rules, district roster, GPS distance, offline queue, reconnect and rejected-save handling.
- `npm run build`: production compilation and TypeScript checks.
- `npm run test:integration`: starts a temporary production server with an isolated database and tests persistence, approval permissions, evidence, shared reads, conflict rejection, PDF generation and QR report routes. Build first. Only the exact test database is removed afterward.

Use fictional records and attachments only. Production authentication, access controls, encryption, retention and official credential integrations remain deployment work.
