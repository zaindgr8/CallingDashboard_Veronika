import { json, readJson, route, HttpError } from '@/lib/server/http';
import {
  assertCallable, baseFilter, cached, cleanVars, clearCallCache, createPhoneCall, E164, listCalls, MAX_CALLS_PER_RANGE, normalizeTo,
} from '@/lib/server/retell';

export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const end = Number(sp.get('end')) || Date.now();
  const start = Number(sp.get('start')) || end - 30 * 86400_000;
  const filter = { ...baseFilter(), start_timestamp: { type: 'range', op: 'bt', value: [start, end] } };
  const calls = await cached(`calls:${start}:${Math.floor(end / 15000)}`, 15_000, () => listCalls(filter));
  return json({ calls, truncated: calls.length >= MAX_CALLS_PER_RANGE });
});

export const POST = route(async (req) => {
  const body = await readJson<{ from_number?: string; to_number?: string; agent_id?: string; variables?: unknown }>(req);
  const to = normalizeTo(body.to_number);
  if (!E164.test(to)) throw new HttpError(400, 'Enter the number in international format, e.g. +971501234567');
  const from = String(body.from_number ?? '');
  await assertCallable(from, body.agent_id || undefined);
  const call = await createPhoneCall({ from_number: from, to_number: to, agent_id: body.agent_id || undefined, variables: cleanVars(body.variables) });
  clearCallCache();
  return json({ call_id: call.call_id, status: call.call_status }, { status: 201 });
});
