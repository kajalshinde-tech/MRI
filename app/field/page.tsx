'use client';
import Link from 'next/link';
export default function FieldWorkspace() {
  const open = () => {
    let session = { district: 'Pune' };
    try { session = { ...session, ...JSON.parse(localStorage.getItem('mahacare-session') || '{}') }; } catch {}
    localStorage.setItem('mahacare-session', JSON.stringify({ ...session, role: 'Officer' }));
    window.location.assign('/portal');
  };
  return <main className="pub-container py-12" style={{ maxWidth: 640 }}>
    <h1>Field inspector workspace</h1>
    <p className="mt-4 text-sm leading-relaxed">Conduct scheduled inspections, capture device GPS, attach photographs and submit findings. Open the workspace while connected once before using it offline.</p>
    <p className="mt-3 text-sm leading-relaxed">On phones, camera and GPS require HTTPS. You can install this web app using your browser’s Add to Home Screen option. Demo role selection is not production authentication.</p>
    <button className="pub-btn-primary mt-6" onClick={open}>Open inspector workspace</button>
    <Link className="block mt-4 text-sm" href="/">Return to website</Link>
  </main>;
}
