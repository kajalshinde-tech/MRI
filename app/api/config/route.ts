import { publicOrigin } from '@/lib/public-origin';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return Response.json({ publicOrigin: publicOrigin(new URL(request.url).origin) }, { headers: { 'Cache-Control': 'no-store' } });
}
