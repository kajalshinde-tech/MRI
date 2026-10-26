import Link from 'next/link';
import PublicShell from '../components/public-shell';
export default function NotFound(){return <PublicShell><div className="public-container public-empty"><span className="eyebrow">PAGE NOT FOUND</span><h1>This page is not available.</h1><p>The link may be incorrect, or this centre may not have a published sample route. Use the verifier to check a UDCID.</p><Link href="/verify" className="pub-button">Verify a centre</Link><Link href="/" className="back-link">Return to home</Link></div></PublicShell>}
