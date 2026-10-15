import { isAnswered } from '@/lib/calls';
import { writeBrief } from '@/lib/server/ai';
import { json, route, HttpError } from '@/lib/server/http';
import { leadDetail, phoneParam, saveBrief } from '@/lib/server/leads';
import { getCall } from '@/lib/server/retell';

const MAX_CALLS = 6;

export const POST = route<RouteContext<'/api/leads/[phone]/brief'>>(async (_req, ctx) => {
  const phone = phoneParam((await ctx.params).phone);
  const lead = await leadDetail(phone);
  const answered = lead.history.filter(isAnswered).slice(0, MAX_CALLS);
  if (!answered.length && !lead.notes.length) throw new HttpError(400, 'There are no conversations or notes to summarise yet.');
  const calls = await Promise.all(answered.map((c) => getCall(c.id)));
  await saveBrief(phone, await writeBrief(lead, lead.notes, calls, lead.calls));
  return json(await leadDetail(phone));
});
