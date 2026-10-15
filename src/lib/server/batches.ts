import type { Batch } from '@/lib/types';
import { readStore, updateStore } from './store';

// Retell has no "list batch calls" endpoint, so campaigns launched from the
// dashboard are logged here.
const FILE = 'batches.json';

export const readBatches = () => readStore<Batch[]>(FILE, []);

export function saveBatch(entry: Batch) {
  return updateStore<Batch[], void>(FILE, [], (list) => {
    list.unshift(entry);
    list.splice(500);
  });
}
