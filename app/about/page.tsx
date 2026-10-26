'use client';
import PublicShell from '../../components/public-shell';
import { ShieldCheck, Users, Building2, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="pub-container info-page">
        <span className="eyebrow">ABOUT THIS PLATFORM</span>
        <h1>About MahaCare Diagnostic Registry</h1>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#92400e' }}>
          <strong>Demonstration Only:</strong> This is a prototype application. All centres, registration numbers, and records are fictional. This platform does not represent any official government system or regulatory authority.
        </div>
        <p>The MahaCare Diagnostic Registry is a demonstration of a diagnostic centre registration and verification platform for Maharashtra. It illustrates how a centralised registry could help citizens, administrators, and regulatory officers manage diagnostic centre information transparently.</p>
        <p>The platform is designed to support the complete lifecycle of diagnostic centre management, from initial registration through inspection, approval, and ongoing compliance monitoring.</p>

        <div className="about-features-grid">
          {[
            { icon: ShieldCheck, title: 'Transparent Verification', text: 'Public profiles show approval status and document validity independently, so citizens can make informed decisions.' },
            { icon: Building2, title: 'Centre Management', text: 'Centres manage their own registration, staff, equipment, and documents through a dedicated portal.' },
            { icon: Users, title: 'Officer Oversight', text: 'Regulatory officers review applications, conduct inspections, and manage compliance from a unified dashboard.' },
            { icon: Globe, title: 'Maharashtra-wide Coverage', text: 'Registration and filters support all 36 districts, with sample centres in selected districts.' },
          ].map(item => (
            <div key={item.title} style={{ background: 'white', border: '1px solid #e5ebee', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 44, height: 44, background: '#e8f5f3', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#0d9488', marginBottom: 14 }}>
                <item.icon size={22} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#7a93a2', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>About the Prototype</h2>
        <p>This prototype was built using Next.js, React, and TypeScript with Tailwind CSS. Data is shared through the project server with an offline browser cache. The demo includes 32 fictional diagnostic centres across Pune, Mumbai, Thane, Nashik, Nagpur, Satara, Kolhapur, and Chhatrapati Sambhajinagar.</p>
        <p>A future production system would require production authentication, managed encrypted storage, digital signing, regulatory API access, and reviewed Marathi translations. This demo uses a shared file-backed registry and offline browser cache.</p>
      </div>
    </PublicShell>
  );
}
