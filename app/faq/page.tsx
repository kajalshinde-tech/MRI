'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PublicShell from '../../components/public-shell';

const faqs = [
  { q: 'What is the MahaCare Diagnostic Registry?', a: 'It is a demonstration prototype of a diagnostic centre registration and public verification platform for Maharashtra. All data is fictional and for illustrative purposes only.' },
  { q: 'How do I register my diagnostic centre?', a: 'In this demo, you can explore the registration form via the "Register Centre" link. The full 6-step form collects centre details, location, staff, services, equipment, and documents. A real system would require integration with official regulatory databases.' },
  { q: 'What is a UDCID?', a: 'UDCID stands for Unique Diagnostic Centre Identifier. In this demo it follows the format MH-[DISTRICT]-[YEAR]-[NUMBER]. This ID is used to look up and verify a centre publicly.' },
  { q: 'Are application approval and document validity the same?', a: 'No. They are tracked independently. An approved centre may have a document that has since expired. The public profile shows both statuses clearly and separately.' },
  { q: 'Can I scan a QR code to verify a centre?', a: 'Yes. Approved centres have a QR code that links to their public profile. You can also enter a UDCID manually on the Verify Centre page.' },
  { q: 'How do I submit a complaint?', a: 'Use the "Report an Issue" button on any centre profile, or visit the Submit Complaint page. You will receive a tracking number to monitor your complaint\'s progress.' },
  { q: 'Is this an official government system?', a: 'No. This is a demonstration prototype only. It does not represent any official government system, regulatory authority, or licensing body. Use fictional records only. Demo submissions and attachments are stored on the project server and cached on your device.' },
  { q: 'Is the data stored securely?', a: 'The demo shares records through the project server and keeps an offline device cache. It does not provide production authentication or encrypted document storage. Use fictional data only.' },
  { q: 'What languages does the platform support?', a: 'The current demo is in English. Marathi language support is planned for a future phase using manual translations for accuracy, with a fallback message if translation cannot load.' },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <PublicShell>
      <div className="pub-container info-page">
        <span className="eyebrow">HELP & INFORMATION</span>
        <h1>Frequently Asked Questions</h1>
        <p>Find answers about how the MahaCare Diagnostic Registry prototype works.</p>
        <div style={{ marginTop: 28 }}>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button className="faq-question" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {faq.q}
                {open === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {open === i && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
