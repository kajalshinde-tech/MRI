'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, LayoutGrid, List, MapPin, Filter, X, Building2, ArrowRight } from 'lucide-react';
import PublicShell from '@/components/public-shell';
import CentreCard from '@/components/centre-card';
import { usePublicData } from '@/components/use-public-data';
import { districts, facilityTypes, talukas } from '@/lib/data';
import type { DiagnosticCentre } from '@/lib/types';

const PAGE_SIZE = 9;
const statuses = ['Approved', 'Under Review', 'Submitted', 'Inspection Scheduled'];

function CentresContent() {
  const searchParams = useSearchParams();
  const { centres } = usePublicData();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [taluka, setTaluka] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const availTalukas = district ? (talukas[district] || []) : [];

  const filtered = (centres || []).filter((c: DiagnosticCentre) =>
    (!q || `${c.name} ${c.udcid} ${c.district} ${c.taluka}`.toLowerCase().includes(q.toLowerCase())) &&
    (!district || c.district === district) &&
    (!taluka || c.taluka === taluka) &&
    (!type || c.type === type) &&
    (!status || c.status === status)
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() { setQ(''); setDistrict(''); setTaluka(''); setType(''); setStatus(''); setPage(1); }
  const hasFilters = q || district || taluka || type || status;

  return (
    <div className="pub-container centres-page">
      <div className="centres-page-header">
        <span className="eyebrow">DIAGNOSTIC CENTRE DIRECTORY</span>
        <h1>Find a Centre</h1>
        <p style={{ color: '#334155', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          Browse publicly registered diagnostic centres across Maharashtra. Showing approved records.
        </p>
      </div>

      {/* Search */}
      <div className="centres-search-bar">
        <Search size={18} />
        <input
          placeholder="Search centre name or UDCID…"
          value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          aria-label="Search centres"
        />
        {q && <button style={{ padding: '0 14px', color: '#8fa5b5' }} onClick={() => { setQ(''); setPage(1); }} aria-label="Clear search"><X size={16} /></button>}
      </div>

      {/* Filters */}
      <div className="centres-filters">
        <Filter size={15} style={{ color: '#8fa5b5' }} />
        <select value={district} onChange={e => { setDistrict(e.target.value); setTaluka(''); setPage(1); }} aria-label="Filter by district">
          <option value="">All districts</option>
          {districts.map((d: string) => <option key={d}>{d}</option>)}
        </select>
        <select value={taluka} onChange={e => { setTaluka(e.target.value); setPage(1); }} aria-label="Filter by taluka" disabled={!district}>
          <option value="">All talukas</option>
          {availTalukas.map((t: string) => <option key={t}>{t}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} aria-label="Filter by facility type">
          <option value="">All types</option>
          {facilityTypes.map((t: string) => <option key={t}>{t}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {statuses.map((s: string) => <option key={s}>{s}</option>)}
        </select>
        {hasFilters && <button onClick={clearFilters} style={{ fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><X size={13} /> Clear</button>}
        <div className="view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={15} /></button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={15} /></button>
        </div>
      </div>

      {centres === null ? (
        <p className="public-loading">Loading centres…</p>
      ) : (
        <>
          <p className="centres-count">{total} centre{total !== 1 ? 's' : ''} found</p>
          {shown.length === 0 ? (
            <div className="empty-state">
              <Building2 size={48} />
              <h3>No centres found</h3>
              <p>Try adjusting your search or filters. The demo dataset includes 32 fictional centres across 8 districts.</p>
              <button onClick={clearFilters} style={{ marginTop: 16, color: '#0d9488', fontSize: 13 }}>Clear all filters</button>
            </div>
          ) : view === 'grid' ? (
            <div className="public-centre-grid">
              {shown.map((c: DiagnosticCentre) => <CentreCard key={c.udcid} centre={c} />)}
            </div>
          ) : (
            <div className="centres-list">
              {shown.map((c: DiagnosticCentre) => <CentreListItem key={c.udcid} centre={c} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="pub-pagination">
              <span>Page {page} of {pages} · {total} records</span>
              <div className="pub-pagination-btns">
                <button className="pub-pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <button className="pub-pagination-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CentreListItem({ centre }: { centre: DiagnosticCentre }) {
  const statusColor = centre.status === 'Approved' ? 'green' : centre.status === 'Rejected' ? 'red' : 'amber';
  return (
    <div className="centre-list-item">
      <div className="centre-list-icon"><Building2 size={22} /></div>
      <div className="centre-list-info">
        <h3>{centre.name}</h3>
        <p><MapPin size={12} /> {centre.taluka}, {centre.district} · {centre.type}</p>
      </div>
      <div className="centre-list-meta">
        <span className={`pub-badge pub-badge-${statusColor === 'green' ? 'teal' : statusColor === 'amber' ? 'amber' : 'red'}`}>{centre.status}</span>
        <span style={{ fontSize: 10, color: '#aab9c5' }} translate="no">{centre.udcid}</span>
      </div>
      <div className="centre-list-actions">
        <Link href={`/centres/${centre.udcid}`} className="centre-link-btn">View <ArrowRight size={13} /></Link>
      </div>
    </div>
  );
}

export default function CentresPage() {
  return (
    <PublicShell>
      <Suspense fallback={<div className="pub-container" style={{ padding: '60px 0', textAlign: 'center', color: '#8fa5b5' }}>Loading directory…</div>}>
        <CentresContent />
      </Suspense>
    </PublicShell>
  );
}
