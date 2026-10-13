import { json, route, HttpError } from '@/lib/server/http';
import { getCall } from '@/lib/server/retell';

export const GET = route<RouteContext<'/api/calls/[id]'>>(async (_req, ctx) => {
  const { id } = await ctx.params;
  if (!/^[\w-]+$/.test(id)) throw new HttpError(400, 'Invalid call id');
  return json(await getCall(id));
});
