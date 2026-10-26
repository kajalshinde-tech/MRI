'use client';
import { useRef } from 'react';
import { useReportUrl } from '@/components/use-report-url';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Activity } from 'lucide-react';
import type { DiagnosticCentre, CentreDocument } from '@/lib/types';

export default function QrCertificate({ centre, documents = [] }: { centre: DiagnosticCentre; documents?: CentreDocument[] }) {
  const printRef = useRef<HTMLDivElement>(null);
  const verifyUrl = useReportUrl(centre.udcid);
  const registration = documents.find(d => d.category === 'Centre Registration');
  const doctor = centre.doctors[0];
  const date = (value?: string) => value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded';
  const downloadQr = () => {
    const svg = printRef.current?.querySelector('svg[data-clinic-qr]');
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `QR_${centre.udcid}.svg`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (centre.status !== 'Approved') return <p>Certificate available after administrator approval.</p>;
  const fields = [
    ['Registration number', registration?.registration || 'Not recorded'],
    ['Unique centre identification', centre.udcid],
    ['Establishment name', centre.name],
    ['Address', `${centre.address}, ${centre.taluka}, ${centre.district} — ${centre.pincode}`],
    ['Type of facility', `${centre.type} · ${centre.ownershipType}`],
    ['Owner', `${centre.owner.name}${centre.owner.qualification ? ` · ${centre.owner.qualification}` : ''}`],
    ['Doctor in charge', doctor ? `${doctor.name} · ${doctor.qualification}${doctor.specialisation ? ` · ${doctor.specialisation}` : ''}` : 'Not recorded'],
    ['Professional registration', doctor ? `${doctor.registrationAuthority}: ${doctor.registrationNumber}` : 'Not recorded'],
  ];
  return <div className="certificate-workspace">
    <div className="certificate-toolbar print:hidden">
      <div><h3>Registration Certificate and QR Plate</h3><p>Reference format adapted for the MahaCare demonstration registry.</p></div>
      <div className="certificate-actions">
        <a className="button primary" download href={`/api/certificates/${encodeURIComponent(centre.udcid)}`}>Download PDF</a>
        <button className="button" onClick={downloadQr}><Download size={16}/> QR SVG</button>
        <button className="button" onClick={() => window.print()}><Printer size={16}/> Print</button>
      </div>
    </div>
    <article ref={printRef} className="certificate-print-area clinic-certificate">
      <header className="clinic-certificate-header">
        <div className="certificate-brand"><Activity size={28}/><span>MahaCare<span>DIAGNOSTIC REGISTRY</span></span></div>
        <span className="certificate-demo-label">DEMONSTRATION COPY</span>
      </header>
      <div className="certificate-heading"><p>MAHARASHTRA DEMO REGISTRY</p><h1>Certificate of Registration</h1><span>Diagnostic and imaging establishment record</span></div>
      <div className="certificate-authority"><span>Recorded issuing authority</span><strong>{registration?.issuingAuthority || 'Not recorded'}</strong></div>
      <p className="certificate-intro">The following establishment is recorded as <strong>Approved</strong> in the MahaCare demonstration registry.</p>
      <dl className="certificate-details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="certificate-validity"><div><span>Registration valid from</span><strong>{date(registration?.issueDate)}</strong></div><div><span>Registration valid until</span><strong>{date(registration?.expiryDate)}</strong></div><div><span>Registry approval date</span><strong>{date(centre.approvedAt)}</strong></div></div>
      <section className="certificate-services"><h2>Recorded services</h2><p>{centre.services.join(' · ') || 'Not recorded'}</p></section>
      <div className="certificate-verification"><div><h2>View the clinic report</h2><p>Scan to view staff, equipment and current document records. Each permit has its own validity period.</p><span translate="no">{centre.udcid}</span></div><QRCodeSVG data-clinic-qr value={verifyUrl} size={128} level="M" marginSize={4}/></div>
      <footer className="certificate-footnote">Fictional demonstration certificate. Not a government licence or proof of legal compliance. No government signature or seal is represented.</footer>
    </article>
  </div>;
}
