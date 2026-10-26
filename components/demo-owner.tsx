import Image from 'next/image';
import Link from 'next/link';

export default function DemoOwner() {
  return (
    <section className="public-section demo-owner-section" aria-labelledby="demo-owner-heading">
      <figure className="demo-owner-portrait">
        <Image src="/demo-clinic-owner.png" alt="AI-generated portrait of a fictional clinic owner" width={1254} height={1254} sizes="(max-width: 640px) 85vw, 320px" className="demo-owner-image" />
        <figcaption>AI-generated portrait · Fictional person</figcaption>
      </figure>
      <div className="demo-owner-copy">
        <span className="eyebrow">THE CLINIC OWNER EXPERIENCE</span>
        <h2 id="demo-owner-heading">Clear records. Confident care.</h2>
        <p>A clinic owner can bring staff qualifications, equipment details and document records together in one place, giving patients a clearer view of their centre.</p>
        <p className="demo-owner-disclosure">An illustrative owner profile for the MahaCare demo.</p>
        <Link className="pub-button light" href="/register">Register your centre</Link>
      </div>
    </section>
  );
}
