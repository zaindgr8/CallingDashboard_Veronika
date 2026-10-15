import { randomUUID } from 'node:crypto';
import { normalizePhone } from '@/lib/calls';
import { buildLead, callsByContact } from '@/lib/leads';
import type { LeadBrief, LeadDetail, LeadNote, LeadRecord, LeanCall } from '@/lib/types';
import { HttpError } from './http';
import { baseFilter, cached, E164, listCalls } from './retell';
import { readStore, updateStore } from './store';

const FILE = 'leads.json';
type Leads = Record<string, LeadRecord>;

/** How far back calls count toward a lead's history and score. */
export const LEAD_WINDOW_DAYS = 180;
export const MAX_LEADS = 50_000;

export const readLeads = () => readStore<Leads>(FILE, {});

/** Calls used to build the pipeline. Key starts with `calls:` so placing a call clears it. */
export function leadCalls(): Promise<LeanCall[]> {
  return cached('calls:leads', 30_000, () => {
    const end = Date.now();
    return listCalls({ ...baseFilter(), start_timestamp: { type: 'range', op: 'bt', value: [end - LEAD_WINDOW_DAYS * 86400_000, end] } });
  });
}

/** Parses a phone from a URL segment or form, or throws a 400. */
export function phoneParam(raw: string) {
  const phone = normalizePhone(decodeURIComponent(raw));
  if (!E164.test(phone)) throw new HttpError(400, 'Invalid phone number');
  return phone;
}

/** First non-empty `*name*` variable, e.g. customer_name. */
export function leadNameFrom(vars: Record<string, string>) {
  const key = Object.keys(vars).find((k) => /name/i.test(k) && !/agent|company|business/i.test(k) && vars[k].trim());
  return key ? vars[key].trim().slice(0, 120) : undefined;
}

const blank = (phone: string): LeadRecord => ({ phone, created_at: Date.now() });

export type LeadPatch = Partial<Pick<LeadRecord, 'name' | 'email' | 'company' | 'stage' | 'value' | 'tags' | 'follow_up_at' | 'source' | 'archived'>>;

export function updateLead(phone: string, patch: LeadPatch) {
  return updateStore<Leads, LeadRecord>(FILE, {}, (all) => {
    const rec = (all[phone] ||= blank(phone));
    if (patch.stage && patch.stage !== rec.stage) rec.stage_at = Date.now();
    Object.assign(rec, patch, { updated_at: Date.now() });
    return rec;
  });
}

/**
 * Creates leads that don't exist yet and fills in blank fields on ones that do.
 * Never overwrites what a person has already entered.
 */
export function mergeLeads(items: (LeadPatch & { phone: string })[]) {
  return updateStore<Leads, { created: number; updated: number }>(FILE, {}, (all) => {
    let created = 0, updated = 0;
    for (const { phone, ...fields } of items) {
      const rec = all[phone];
      if (!rec) {
        if (Object.keys(all).length >= MAX_LEADS) throw new HttpError(400, `Lead limit of ${MAX_LEADS} reached.`);
        all[phone] = { ...blank(phone), ...fields, ...(fields.stage ? { stage_at: Date.now() } : {}) };
        created++;
        continue;
      }
      let changed = false;
      for (const [k, v] of Object.entries(fields) as [keyof LeadPatch, unknown][]) {
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
        if (k === 'tags') {
          const merged = [...new Set([...(rec.tags ?? []), ...(v as string[])])];
          if (merged.length !== (rec.tags ?? []).length) { rec.tags = merged; changed = true; }
        } else if (rec[k] == null || rec[k] === '') {
          (rec as unknown as Record<string, unknown>)[k] = v;
          changed = true;
        }
      }
      if (rec.archived) { rec.archived = false; changed = true; } // re-imported: bring it back
      if (changed) { rec.updated_at = Date.now(); updated++; }
    }
    return { created, updated };
  });
}

export function addNote(phone: string, text: string) {
  return updateStore<Leads, LeadNote>(FILE, {}, (all) => {
    const rec = (all[phone] ||= blank(phone));
    const note = { id: randomUUID(), at: Date.now(), text };
    rec.notes = [note, ...(rec.notes ?? [])].slice(0, 500);
    rec.updated_at = Date.now();
    return note;
  });
}

export function deleteNote(phone: string, id: string) {
  return updateStore<Leads, void>(FILE, {}, (all) => {
    const rec = all[phone];
    if (rec?.notes) rec.notes = rec.notes.filter((n) => n.id !== id);
  });
}

export function saveBrief(phone: string, brief: LeadBrief) {
  return updateStore<Leads, void>(FILE, {}, (all) => {
    (all[phone] ||= blank(phone)).brief = brief;
  });
}

export function deleteLead(phone: string) {
  return updateStore<Leads, void>(FILE, {}, (all) => { delete all[phone]; });
}

export async function leadDetail(phone: string): Promise<LeadDetail> {
  const [records, calls] = await Promise.all([readLeads(), leadCalls()]);
  const rec = records[phone];
  const history = callsByContact(calls).get(phone) ?? [];
  if (!rec && !history.length) throw new HttpError(404, 'Lead not found');
  return { ...buildLead(phone, rec, history), notes: rec?.notes ?? [], history, brief: rec?.brief };
}
