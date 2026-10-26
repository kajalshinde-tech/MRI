'use client';
import Link from 'next/link';
import {
  Search, ArrowRight, ShieldCheck, MapPin, ScanLine, Building2,
  Activity, FileCheck2, ArrowUpRight, Smartphone, QrCode, Sparkles
} from 'lucide-react';
import PublicShell, { PublicBadge } from '../components/public-shell';
import CentreCard from '../components/centre-card';
import DemoOwner from '../components/demo-owner';
import { usePublicData } from '../components/use-public-data';
import { districts } from '../lib/data';

export default function Home() {
  const { centres } = usePublicData();

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="public-hero-section">
        <div className="public-container hero-grid">
          <div>
            <span className="hero-eyebrow">
              <span /> MAHARASHTRA · DEMO REGISTRY
            </span>
            <h1>
              Clarity for every<br />
              <em>care decision.</em>
            </h1>
            <p>
              Find diagnostic centres. Explore their services.<br className="desktop-break" />
              Check approval and document information in one place.
            </p>

            <form className="hero-search" action="/centres">
              <div className="hero-search-input-wrap">
                <Search size={19} />
                <input
                  name="q"
                  aria-label="Search centre name, UDCID, district or taluka"
                  placeholder="Search centre name, UDCID, district or taluka…"
                />
              </div>
              <button type="submit">
                Find a centre <ArrowRight size={16} />
              </button>
            </form>

            <div className="hero-actions">
              <Link href="/verify">
                <ScanLine size={15} /> Verify centre <ArrowUpRight size={13} />
              </Link>
              <span className="hero-action-sep" />
              <Link href="/register">
                Register centre <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="hero-footnote">
              <ShieldCheck size={14} /> Sample information for demonstration. Not a licence validation service.
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="floating-mark">
              <Activity size={29} />
            </div>
            <div className="preview-profile">
              <div className="preview-label">
                <span>
                  <span className="pulse" /> PUBLIC CENTRE PROFILE
                </span>
                <ShieldCheck size={16} />
              </div>
              <div className="preview-facility">
                <Building2 size={29} />
              </div>
              <PublicBadge tone="gray">ILLUSTRATIVE PREVIEW</PublicBadge>
              <h2>Sahyadri MRI 1</h2>
              <p>
                <MapPin size={13} />
                Haveli, Pune · Maharashtra
              </p>
              <div className="preview-code" translate="no">
                MH-PUN-2024-001 <span>SAMPLE UDCID</span>
              </div>
              <div className="preview-line">
                <span>Approval</span>
                <PublicBadge tone="teal">Approved</PublicBadge>
              </div>
              <div className="preview-line">
                <span>Document validity</span>
                <PublicBadge tone="amber">Review separately</PublicBadge>
              </div>
              <div className="preview-disclaimer">
                <FileCheck2 size={18} />
                <span>
                  Clear status. Useful details.<br />
                  <b>One stable centre profile.</b>
                </span>
              </div>
            </div>
            <div className="floating-caption">
              <ShieldCheck size={18} />
              <span>
                Information you can inspect.<small>Built around transparency.</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="public-container">
        {/* Trust row */}
        <section className="public-trust-row">
          <div>
            <b>{centres === null ? '—' : centres.length}</b>
            <span>approved sample centres</span>
          </div>
          <div>
            <b>{districts.length}</b>
            <span>districts supported</span>
          </div>
          <div>
            <b>6</b>
            <span>sample facility categories</span>
          </div>
          <div className="trust-note">
            <ShieldCheck size={24} />
            <p>
              Approval and document validity<br />
              <strong>are shown independently.</strong>
            </p>
          </div>
        </section>

        {/* Paths section */}
        <section className="public-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">START WITH WHAT YOU NEED</span>
              <h2>Find the right information, faster.</h2>
            </div>
            <p>A clear path from discovery to a centre’s public record.</p>
          </div>
          <div className="public-paths">
            {[
              {
                icon: Search,
                n: '01',
                title: 'Find a centre',
                text: 'Search approved sample facilities by district, service, or centre ID.',
                href: '/centres',
                label: 'Explore directory',
              },
              {
                icon: ScanLine,
                n: '02',
                title: 'Check the public record',
                text: 'Look up a UDCID to see approval, services, and document information.',
                href: '/verify',
                label: 'Verify a centre',
              },
              {
                icon: Smartphone,
                n: '03',
                title: 'Read a clinic report',
                text: 'Read staff, equipment, services and document details in one report.',
                href: '/mobile/centres/MH-PUN-2024-001',
                label: 'View sample report',
              },
            ].map(item => (
              <article key={item.n}>
                <div>
                  <span className="path-icon">
                    <item.icon size={22} />
                  </span>
                  <small>{item.n}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link href={item.href}>
                  {item.label}
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Featured centres */}
        <section className="public-section featured-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE THE REGISTRY</span>
              <h2>A closer look at sample centres.</h2>
            </div>
            <Link className="pub-button light" href="/centres">
              View all centres <ArrowRight size={16} />
            </Link>
          </div>
          <div className="public-centre-grid">
            {centres === null ? (
              <p className="public-loading" role="status">Loading approved sample centres…</p>
            ) : (
              centres.slice(0, 3).map(c => <CentreCard key={c.udcid} centre={c} />)
            )}
          </div>
        </section>

        <DemoOwner />

        {/* Districts section */}
        <section className="public-section districts-section">
          <div>
            <span className="eyebrow">LOCAL INFORMATION, CONNECTED</span>
            <h2>Explore Maharashtra,<br />one district at a time.</h2>
            <p>Register and filter centres across all 36 districts. Sample records cover selected districts. Public results include only approved records.</p>
          </div>
          <div className="district-links">
            {districts.map((d, i) => (
              <Link href={`/centres?district=${encodeURIComponent(d)}`} key={d}>
                <span className="district-number">{String(i + 1).padStart(2, '0')}</span>
                {d}
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
