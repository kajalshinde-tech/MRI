# MahaCare Registry — Phase 1

A responsive Next.js App Router, React, TypeScript, and Tailwind frontend demonstration. All names and registration numbers are fictional. Neutral branding does not imply government approval.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Use `npm run build` for a static export to `out/`, and `npm run typecheck` for TypeScript checks.

## Review Phase 1

- Switch demo role from the header: State Admin sees 32 centres; District Admin and Officer see their selected district; Centre sees centre-1.
- Choose an assigned district using the dashboard control. This simulates access; it is not authentication.
- Review calculated dashboard counts and click district bars or cards to explore records.
- Search centre names or UDCIDs, filter, sort, paginate, and open a read-only detail dialog.
- Review document validity, calculated against today's date. Approval, expiry, and inspection are separate concepts.
- Mark notifications read, refresh, and verify persistence.
- Settings → Reset Demo Data restores samples and recalculates dates.

## Architecture

- `lib/data.ts`: domain interfaces, seed generator, role scoping, transitions, validity helpers, and explicit public-profile projection.
- `lib/storage.ts`: versioned browser storage and shared immutable update helper.
- `app/page.tsx`: Phase 1 demo workspace and reusable presentation components.
- `app/globals.css`: responsive design system and Tailwind entry point.

State is stored in `mahacare-demo-v1`; role preferences use `mahacare-session`. Sample seed dates are created relative to the date of initialization and then retained until reset. Invalid or incompatible saved data resets to samples. Browser storage is not secure storage. Do not enter real patient, personal, or licensing data.

## Next phases

2. Public directory and public profile routes.
3. Registration and full centre self-service.
4. Review, correction, and decisions.
5. Inspection workflows.
6. QR, renewals, and complaints.
7. Full monitoring, GIS, reports, and CSV export.
8. Marathi integration, accessibility review, and end-to-end verification.

This phase uses one workspace route with client-side sections. Dedicated workflow routes will be introduced with their implementation. Public preview is explicitly informational. Inspection and complaint counts are sample summaries; no action is presented as a completed workflow. English is available; Marathi integration is planned. The font stack supports Devanagari using installed system fonts, without requiring external font downloads.

Production requires a shared database, real authentication and server-side authorization, secure document storage, audit logging, validated regulatory rules, and privacy controls. Browser-local records do not synchronise between devices. Proposal and certificate PDFs and the reference image have not yet been supplied.
