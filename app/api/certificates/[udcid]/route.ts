import 'regenerator-runtime/runtime';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { publicOrigin } from '@/lib/public-origin';
import { readRegistry } from '@/lib/registry-server';

export const runtime = 'nodejs';
export async function GET(request: Request, { params }: { params: Promise<{ udcid: string }> }) {
  const { udcid } = await params;
  const db = await readRegistry();
  const centre = db.centres.find(c => c.udcid === udcid);
  if (!centre) return Response.json({ error: 'Centre not found.' }, { status: 404 });
  if (centre.status !== 'Approved') return Response.json({ error: 'Certificate is available after approval.' }, { status: 403 });
  const document = await PDFDocument.create();
  let page = document.addPage([595, 842]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.registerFontkit(fontkit);
  const devanagari = await document.embedFont(await readFile(path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff')), { subset: true });
  let y = 760;
  const text = (value: string, size = 12, strong = false) => {
    let x = 60;
    for (const word of value.split(/\s+/)) {
      const font = /[\u0900-\u097f]/.test(word) ? devanagari : strong ? bold : regular;
      const width = font.widthOfTextAtSize(word, size);
      if (x + width > 535 && x > 60) { x = 60; y -= size + 8; }
      if (y < 275) { page = document.addPage([595, 842]); y = 760; }
      page.drawText(word, { x, y, size, font, color: rgb(.08, .18, .25) });
      x += width + regular.widthOfTextAtSize(' ', size);
    }
    y -= size + 16;
  };
  try {
    page.drawRectangle({ x: 35, y: 35, width: 525, height: 772, borderColor: rgb(.05, .58, .53), borderWidth: 2 });
    const registration = db.documents.find(d => d.centreId === centre.id && d.category === 'Centre Registration');
    const doctor = centre.doctors[0];
    text('MahaCare Diagnostic Registry', 22, true);
    text('CERTIFICATE OF REGISTRATION', 19, true);
    text('MAHARASHTRA DEMO REGISTRY | DEMONSTRATION COPY', 10, true);
    text(`Recorded issuing authority: ${registration?.issuingAuthority || 'Not recorded'}`, 11);
    text('This establishment is recorded as Approved in the demonstration registry.', 11);
    text(`Registration number: ${registration?.registration || 'Not recorded'}`, 12, true);
    text(`Unique centre identification: ${centre.udcid}`, 12, true);
    text(centre.name, 18, true);
    text(`Address: ${centre.address}, ${centre.taluka}, ${centre.district} ${centre.pincode}`, 11);
    text(`Type of facility: ${centre.type} | ${centre.ownershipType}`, 11);
    text(`Owner: ${centre.owner.name}${centre.owner.qualification ? ` | ${centre.owner.qualification}` : ''}`, 11);
    text(`Doctor in charge: ${doctor ? `${doctor.name} | ${doctor.qualification}` : 'Not recorded'}`, 11);
    text(`Professional registration: ${doctor ? `${doctor.registrationAuthority}: ${doctor.registrationNumber}` : 'Not recorded'}`, 11);
    text(`Registration validity: ${registration?.issueDate || 'Not recorded'} to ${registration?.expiryDate || 'Not recorded'}`, 11);
    text(`Registry approval date: ${centre.approvedAt || 'Not recorded'}`, 11);
    text(`Recorded services: ${centre.services.join(', ') || 'Not recorded'}`, 11);
    const origin = publicOrigin(new URL(request.url).origin);
    const profile = `${origin.replace(/\/$/, '')}/mobile/centres/${encodeURIComponent(centre.udcid)}`;
    const png = await document.embedPng(await QRCode.toBuffer(profile, { width: 240, margin: 2 }));
    page.drawImage(png, { x: 60, y: Math.min(y - 175, 220), width: 160, height: 160 });
    page.drawText('Scan to open the current clinic report. Each permit has its own validity.', { x: 60, y: 65, size: 9, font: regular });
    page.drawText('Fictional demonstration certificate. Not a government licence. No government signature.', { x: 60, y: 48, size: 8, font: regular });
    const bytes = await document.save();
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Certificate_${centre.udcid}.pdf"`, 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 422 }); }
}
