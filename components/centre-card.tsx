'use client';
// components/centre-card.tsx — Public-facing centre card
import Link from 'next/link';
import { Building2, MapPin, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import type { DiagnosticCentre } from '../lib/types';
import { validity } from '../lib/data';

function StatusIcon({ status }: { status: string }) {
  if (status === 'Approved') return <CheckCircle2 size={14} className="status-icon green" />;
  if (status === 'Rejected') return <AlertCircle size={14} className="status-icon red" />;
  return <Clock size={14} className="status-icon amber" />;
}

export default function CentreCard({ centre }: { centre: DiagnosticCentre }) {
  return (
    <article className="centre-pub-card">
      <div className="centre-card-top">
        <span className="centre-card-icon"><Building2 size={22} /></span>
        <span className={`centre-card-type-badge type-${centre.type.split(' ')[0].toLowerCase()}`}>
          {centre.type}
        </span>
      </div>
      <h3 className="centre-card-name">{centre.name}</h3>
      <p className="centre-card-addr">
        <MapPin size={12} /> {centre.taluka}, {centre.district}
      </p>
      <div className="centre-card-status">
        <StatusIcon status={centre.status} />
        <span className={`status-text ${centre.status === 'Approved' ? 'green' : centre.status === 'Rejected' ? 'red' : 'amber'}`}>
          {centre.status}
        </span>
        <span className="centre-card-udcid" translate="no">{centre.udcid}</span>
      </div>
      {centre.services.length > 0 && (
        <div className="centre-card-services">
          {centre.services.slice(0, 3).map(s => (
            <span key={s} className="service-chip">{s}</span>
          ))}
          {centre.services.length > 3 && (
            <span className="service-chip service-chip-more">+{centre.services.length - 3}</span>
          )}
        </div>
      )}
      <div className="centre-card-actions">
        <Link href={`/centres/${centre.udcid}`} className="centre-card-link">
          View profile <ArrowRight size={14} />
        </Link>

      </div>
    </article>
  );
}
