import 'server-only';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { seed } from './data';
import type { Database, Role } from './types';
import { approvalError, inspectionError } from './workflow';

const file = path.join(process.cwd(), '.runtime', path.basename(process.env.REGISTRY_FILE_NAME || 'registry.json'));
const tables = ['centres', 'documents', 'applicationEvents', 'inspections', 'complaints', 'notifications', 'users'] as const;
export type Change = { table: keyof Database; id: string; before: unknown; after: Record<string, unknown> | null };
const state = globalThis as typeof globalThis & { registryLock?: Promise<unknown> };

export async function readRegistry(): Promise<Database> {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return seed(); throw error; }
}

export function changeRegistry(changes: Change[], role: Role): Promise<Database> {
  const operation = (state.registryLock || Promise.resolve()).catch(() => {}).then(async () => {
    const db = await readRegistry();
    const candidate = structuredClone(db);
    for (const change of changes) {
      if (!tables.includes(change.table) || change.table === 'users') throw new Error('Unsupported record type.');
      const records = candidate[change.table] as unknown as { id: string }[];
      const index = records.findIndex(r => r.id === change.id);
      const existing = index < 0 ? null : records[index];
      // A retry after an interrupted response is safe and idempotent.
      if (JSON.stringify(existing) === JSON.stringify(change.after)) continue;
      if (JSON.stringify(existing) !== JSON.stringify(change.before)) throw new Error('This record changed on another device. Refresh and try again.');
      if (!change.after) throw new Error('Deleting shared records is not supported.');
      if (change.after.id !== change.id) throw new Error('Invalid record ID.');
      if (change.table === 'documents') {
        const attachment = change.after.attachment as { dataUrl?: string } | undefined;
        if (attachment && (!/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/.test(attachment.dataUrl || '') || (attachment.dataUrl?.length || 0) > 700_000)) throw new Error('Invalid document attachment.');
      }
      if (index < 0) records.push(change.after as unknown as { id: string });
      else records[index] = change.after as unknown as { id: string };
    }
    for (const change of changes) {
      if (change.table === 'centres' && change.after) {
        const centre = candidate.centres.find(c => c.id === change.id)!;
        const previous = db.centres.find(c => c.id === change.id);
        if (previous && centre.status !== previous.status && ['Inspection Scheduled', 'Approved', 'Rejected', 'Correction Required'].includes(centre.status) && role !== 'State Admin' && role !== 'District Admin') throw new Error('Only administrators can issue application decisions.');
        if (candidate.centres.some(c => c.id !== centre.id && c.udcid === centre.udcid)) throw new Error('Centre ID already exists. Submit again to generate another ID.');
        if (centre.status === 'Approved' && previous?.status !== 'Approved') {
          const error = approvalError({ ...candidate, centres: db.centres }, { ...centre, status: previous?.status || 'Submitted' }, role);
          if (error) throw new Error(error);
        }
      }
      if (change.table === 'inspections' && change.after?.status === 'Completed') {
        if (role !== 'Officer') throw new Error('Only the field inspector can submit inspection reports.');
        const report = candidate.inspections.find(i => i.id === change.id)!;
        const error = inspectionError(report);
        if (error) throw new Error(error);
        if (report.photos!.length > 4 || report.photos!.some(p => !/^data:image\/jpeg;base64,/.test(p.dataUrl) || p.dataUrl.length > 450_000)) throw new Error('Invalid inspection photos.');
      }
    }
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(candidate), 'utf8');
    await rename(`${file}.tmp`, file);
    return candidate;
  });
  state.registryLock = operation;
  return operation;
}
