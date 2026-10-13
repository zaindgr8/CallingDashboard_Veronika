import { json, readJson, route, HttpError } from '@/lib/server/http';
import { makeSession, passwordMatches, recordFailedAttempt, SESSION_COOKIE, SESSION_TTL_MS, tooManyAttempts } from '@/lib/server/auth';

export const POST = route(async (req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (tooManyAttempts(ip)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  const { password } = await readJson<{ password?: string }>(req);
  if (!passwordMatches(String(password ?? ''))) {
    recordFailedAttempt(ip);
    throw new HttpError(401, 'Incorrect password');
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, makeSession(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' && req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}, { auth: false });
