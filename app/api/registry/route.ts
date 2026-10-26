import { changeRegistry, readRegistry, type Change } from '@/lib/registry-server';
import type { Role } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This is the shared DEMO store. Role headers retain the existing demo role
// selector; they are deliberately not presented as production authentication.
export async function GET() {
  return Response.json(await readRegistry(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Use the registry from its own website.' }, { status: 403 });
  }
  const body = await request.text();
  if (body.length > 12_000_000) return Response.json({ error: 'Attachments exceed the request limit.' }, { status: 413 });
  try {
    const { changes } = JSON.parse(body) as { changes: Change[] };
    if (!Array.isArray(changes) || changes.length > 300) throw new Error('Invalid changes.');
    const role = (request.headers.get('x-demo-role') || 'Centre') as Role;
    return Response.json(await changeRegistry(changes, role));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 409 });
  }
}
