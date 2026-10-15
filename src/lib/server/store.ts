import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Tiny JSON-file store for the data Retell doesn't keep for us (campaign log, leads).
// Writes are serialized per file and land atomically (temp file + rename), so
// concurrent requests can't interleave or leave half-written JSON behind.
// Needs a writable disk; swap this module for a database on serverless hosts.
const DIR = process.env.DATA_DIR || join(/*turbopackIgnore: true*/ process.cwd(), 'data');
const queues = new Map<string, Promise<unknown>>();

async function read<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(/*turbopackIgnore: true*/ DIR, name), 'utf8')) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw err; // corrupt file: fail loudly rather than overwrite it with an empty one
  }
}

export function readStore<T>(name: string, fallback: T): Promise<T> {
  // Reads wait for pending writes so callers always see their own changes.
  return (queues.get(name) ?? Promise.resolve()).then(() => read(name, fallback));
}

/** Read-modify-write under a per-file lock. Returns whatever `fn` returns. */
export function updateStore<T, R>(name: string, fallback: T, fn: (data: T) => R | Promise<R>): Promise<R> {
  const run = (queues.get(name) ?? Promise.resolve()).catch(() => {}).then(async () => {
    const data = await read(name, fallback);
    const result = await fn(data);
    await mkdir(DIR, { recursive: true });
    const file = join(/*turbopackIgnore: true*/ DIR, name);
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2));
    await rename(tmp, file);
    return result;
  });
  queues.set(name, run);
  return run;
}
