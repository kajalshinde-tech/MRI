'use client';
import { useRef } from 'react';
import { useReportUrl } from '@/components/use-report-url';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, ExternalLink, ShieldCheck, Award } from 'lucide-react';
import type { DiagnosticCentre } from '../../lib/types';

interface QrCertificateProps {
  centre: DiagnosticCentre;
}

export default function QrCertificate({ centre }: QrCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const verifyUrl = useReportUrl(centre.udcid);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('centre-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${centre.udcid}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (centre.status !== 'Approved') return <p>Certificate available after administrator approval.</p>;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Demo Registration Certificate & Display Plate</h3>
          <p className="text-xs text-slate-500">
            Prototype display plate. This is not a government licence.
          </p>
        </div>
        <div className="flex gap-2">
          <a className="button primary" download href={`/api/certificates/${encodeURIComponent(centre.udcid)}`}>Download PDF</a>
          <button
            onClick={handleDownloadQr}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Download QR (SVG)
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer size={14} /> Print Certificate Plate
          </button>
        </div>
      </div>

      {/* Certificate Frame */}
      <div
        ref={printRef}
        className="certificate-print-area max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-2xl border-4 border-double border-teal-800 shadow-md relative overflow-hidden"
      >
        {/* Decorative corner borders */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-teal-700 pointer-events-none" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-teal-700 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-teal-700 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-teal-700 pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center pb-6 border-b-2 border-teal-700">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 text-teal-800 rounded-full mb-2 ring-4 ring-teal-100">
            <Award size={28} />
          </div>
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-600">
            Maharashtra Demo Registry
          </h2>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prototype workflow demonstration
          </h3>
          <h1 className="text-2xl font-black text-teal-900 mt-2 font-serif tracking-wide">
            CERTIFICATE OF REGISTRATION
          </h1>
          <p className="text-[11px] text-slate-500 italic mt-0.5">
            Diagnostic & Imaging Centre Regulatory Verification Plate
          </p>
        </div>

        {/* UDCID Callout */}
        <div className="my-6 p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-center">
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
              Unique Diagnostic Centre Identification (UDCID)
            </span>
            <div className="text-2xl font-black font-mono text-teal-950 mt-0.5 tracking-wider" translate="no">
              {centre.udcid}
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
          <div className="md:col-span-2 space-y-3 text-xs text-slate-800 leading-relaxed">
            <p>
              This is to certify that <strong>{centre.name}</strong>, situated at:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              {centre.address}, Taluka {centre.taluka}, District {centre.district} — {centre.pincode}
            </div>
            <p>
              has been approved in this demonstration registry as a <strong>{centre.type}</strong> ({centre.ownershipType}) in the sample Maharashtra workflow.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 uppercase text-[9px] font-bold block">Medical Director / Owner</span>
                <strong>{centre.owner.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] font-bold block">Registration Status</span>
                <span className="font-bold text-emerald-800">{centre.status}</span>
              </div>
            </div>
          </div>

          {/* QR Display */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
              <QRCodeSVG
                id="centre-qr-svg"
                value={verifyUrl}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[10px] font-bold uppercase text-teal-800 mt-2">
              Scan to Verify Live
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5" translate="no">
              {centre.udcid}
            </span>
          </div>
        </div>

        {/* Services List */}
        <div className="pt-3 border-t border-slate-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
            Authorized Diagnostic Facilities & Modalities:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {centre.services.map(s => (
              <span key={s} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Certificate Footer / Signature */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 flex justify-between items-end text-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Issue & Approval Date</p>
            <p className="font-semibold text-slate-800">
              {centre.approvedAt ? new Date(centre.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending Formal Sign-off'}
            </p>
            <p className="text-[9px] text-slate-400">Demonstration record — no digital government signature</p>
          </div>

          <div className="text-right space-y-1">
            <div className="w-36 border-b border-slate-400 mb-1" />
            <p className="font-bold text-slate-900">Demo administrator</p>
            <p className="text-[10px] text-slate-500">Maharashtra Demo Registry</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[9px] text-slate-400 text-center">
          Fictional demonstration certificate. Not valid for legal or regulatory use.
        </div>
      </div>
    </div>
  );
}
