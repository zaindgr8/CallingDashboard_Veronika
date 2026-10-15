import { z } from 'zod';
import { json, readJson, route } from '@/lib/server/http';
import { addNote, deleteNote, phoneParam } from '@/lib/server/leads';
import { parse } from '@/lib/server/validate';

type Ctx = RouteContext<'/api/leads/[phone]/notes'>;

export const POST = route<Ctx>(async (req, ctx) => {
  const { text } = parse(z.object({ text: z.string().trim().min(1, 'Write a note first').max(4000) }), await readJson(req));
  return json(await addNote(phoneParam((await ctx.params).phone), text), { status: 201 });
});

export const DELETE = route<Ctx>(async (req, ctx) => {
  await deleteNote(phoneParam((await ctx.params).phone), String(req.nextUrl.searchParams.get('id') ?? ''));
  return json({ ok: true });
});
