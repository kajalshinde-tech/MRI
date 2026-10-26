import CentreProfile from '@/components/centre-profile';
export default async function MobileCentreReport({ params }: { params: Promise<{ udcid: string }> }) {
  const { udcid } = await params;
  return <CentreProfile udcid={udcid} standalone />;
}
