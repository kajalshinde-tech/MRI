'use client';
// components/public-shell.tsx — Shared layout for all public pages
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Activity, Menu, X, Search, ShieldCheck, ArrowUpRight, Bell, Phone } from 'lucide-react';
import LanguageSwitcher from './language-switcher';

export function PublicBadge({
  children, tone = 'teal'
}: { children: React.ReactNode; tone?: 'teal' | 'amber' | 'red' | 'gray' | 'blue' }) {
  const cls = {
    teal: 'pub-badge-teal', amber: 'pub-badge-amber',
    red: 'pub-badge-red', gray: 'pub-badge-gray', blue: 'pub-badge-blue',
  }[tone];
  return <span className={`pub-badge ${cls}`}>{children}</span>;
}

const navLinks = [
  { href: '/centres', label: 'Find a Centre' },
  { href: '/verify', label: 'Verify Centre' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="pub-root">
      {/* Demo Banner */}
      <div className="pub-demo-banner">
        <div className="pub-demo-banner-content">
          <ShieldCheck size={13} className="pub-demo-icon" />
          <span className="pub-demo-text">
            <strong>Demo only.</strong>
            <span className="pub-demo-desc"> Fictional records · Not an official service.</span>
          </span>
        </div>
        <Link href="/login" className="pub-portal-link">Portal login <ArrowUpRight size={12} /></Link>
      </div>

      {/* Header */}
      <header className={`pub-header${scrolled ? ' pub-header-shadow' : ''}`}>
        <div className="pub-header-inner">
          <Link href="/" className="pub-brand">
            <span className="pub-brand-icon"><Activity size={20} /></span>
            <span className="pub-brand-text">
              <strong>MahaCare<span className="pub-dot">.</span></strong>
              <small>DIAGNOSTIC REGISTRY</small>
            </span>
          </Link>

          <nav className="pub-nav" role="navigation" aria-label="Main navigation">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="pub-nav-link">{l.label}</Link>
            ))}
          </nav>

          <div className="pub-header-actions">
            <LanguageSwitcher />
            <Link href="/register" className="pub-btn-outline">Register Centre</Link>
            <Link href="/login" className="pub-btn-primary">Portal Login</Link>
            <button
              className="pub-mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="pub-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <nav id="public-mobile-navigation" className="pub-mobile-nav" aria-label="Mobile navigation" role="navigation" onClick={e => e.stopPropagation()}>
            <div className="pub-mobile-nav-header">
              <Link href="/" className="pub-brand" onClick={() => setMobileOpen(false)}>
                <span className="pub-brand-icon"><Activity size={20} /></span>
                <strong>MahaCare<span className="pub-dot">.</span></strong>
              </Link>
              <button aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={22} /></button>
            </div>
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="pub-mobile-link" onClick={() => setMobileOpen(false)}>{l.label}</Link>
            ))}
            <div className="pub-mobile-actions">
              <Link href="/register" className="pub-btn-outline" onClick={() => setMobileOpen(false)}>Register Centre</Link>
              <Link href="/login" className="pub-btn-primary" onClick={() => setMobileOpen(false)}>Portal Login</Link>
            </div>
          </nav>
        </div>
      )}

      <main className="pub-main">{children}</main>

      {/* Footer */}
      <footer className="pub-footer">
        <div className="pub-container">
          <div className="pub-footer-grid">
            <div>
              <Link href="/" className="pub-brand pub-footer-brand">
                <span className="pub-brand-icon pub-brand-icon-sm"><Activity size={17} /></span>
                <span>
                  <strong>MahaCare<span className="pub-dot">.</span></strong>
                  <small>DIAGNOSTIC REGISTRY</small>
                </span>
              </Link>
              <p className="pub-footer-desc">
                A demonstration platform for diagnostic centre registration and verification in Maharashtra. All data is fictional.
              </p>
            </div>
            <div>
              <h3>Quick Links</h3>
              <ul>
                {navLinks.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <h3>Actions</h3>
              <ul>
                <li><Link href="/register">Register your centre</Link></li>
                <li><Link href="/verify">Verify a centre</Link></li>
                <li><Link href="/complaint">Submit a complaint</Link></li>
                <li><Link href="/complaint/track">Track complaint</Link></li>
              </ul>
            </div>
            <div>
              <h3>Legal</h3>
              <p className="pub-footer-legal">
                This is a prototype demonstration. It does not represent any official government system, licence, or regulatory authority. Use fictional records only.
              </p>
            </div>
          </div>
          <div className="pub-footer-bottom">
            <span><Activity size={13} /> MahaCare Registry · Prototype Demonstration · Maharashtra</span>
            <span>Demo data · Shared registry with offline cache</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
