'use client';
import { useState } from 'react';
import { MapPin, Phone, Mail, Send, Check } from 'lucide-react';
import PublicShell from '../../components/public-shell';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <PublicShell>
      <div className="pub-container info-page" style={{ maxWidth: 960 }}>
        <span className="eyebrow">GET IN TOUCH</span>
        <h1>Contact Us</h1>
        <p>This is a demonstration application. The contact details below are fictional and for illustrative purposes only.</p>

        <div className="contact-grid">
          <div>
            {sent ? (
              <div style={{ background: '#d1faf4', border: '1px solid #a7f3d0', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, background: '#059669', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'white' }}>
                  <Check size={24} />
                </div>
                <h3 style={{ color: '#065f46', fontSize: 18 }}>Message sent</h3>
                <p style={{ color: '#047857', fontSize: 13, marginTop: 8 }}>Thank you for your message. In a real system, you would receive a response within 2 working days.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} style={{ marginTop: 16, color: '#0d9488', fontSize: 13 }}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e5ebee', borderRadius: 12, padding: 28 }}>
                <h3 style={{ fontSize: 16, marginBottom: 20 }}>Send a Message</h3>
                <div className="contact-form-field">
                  <label htmlFor="c-name">Name *</label>
                  <input id="c-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="c-email">Email *</label>
                  <input id="c-email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="c-subject">Subject</label>
                  <input id="c-subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief subject" />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="c-message">Message *</label>
                  <textarea id="c-message" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Your message…" style={{ minHeight: 120 }} />
                </div>
                <button type="submit" className="pub-btn-large" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={15} /> Send Message
                </button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: MapPin, title: 'Address', text: 'Directorate of Health Services\nMaharashtra State (Fictional address for demo)' },
              { icon: Phone, title: 'Phone', text: '1800-XXX-XXXX (Illustrative)\nMonday–Friday, 9 AM–6 PM' },
              { icon: Mail, title: 'Email', text: 'info@mahacare.example\nFor demonstration purposes only' },
            ].map(item => (
              <div key={item.title} style={{ background: 'white', border: '1px solid #e5ebee', borderRadius: 12, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: '#e8f5f3', borderRadius: 9, display: 'grid', placeItems: 'center', color: '#0d9488', flexShrink: 0 }}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ fontSize: 13, color: '#7a93a2', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{item.text}</p>
                </div>
              </div>
            ))}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#92400e' }}>
              <strong>Demonstration only.</strong> All contact details shown here are fictional. This is not an official government contact.
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
