import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Batch } from '@/lib/types';

// Retell has no "list batch calls" endpoint, so campaigns launched from the
// dashboard are logged here. Needs a writable disk (any Node host / VPS).
const DIR = join(process.cwd(), 'data');
const FILE = join(DIR, 'batches.json');

export async function readBatches(): Promise<Batch[]> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch {
    return [];
  }
}

export async function saveBatch(entry: Batch) {
  const list = await readBatches();
  list.unshift(entry);
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(list.slice(0, 500), null, 2));
}
