import { redirect } from 'next/navigation';
export default async function CentreProfilePage({ params }: { params: Promise<{ udcid: string }> }) {
  const { udcid } = await params;
  // Existing printed QR codes keep working after the report moves to its own URL.
  redirect(`/mobile/centres/${encodeURIComponent(udcid)}`);
}
