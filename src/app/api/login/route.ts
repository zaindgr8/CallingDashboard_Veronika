import { json, readJson, route, HttpError } from '@/lib/server/http';
import { makeSession, credentialsMatch, recordFailedAttempt, SESSION_COOKIE, SESSION_TTL_MS, tooManyAttempts } from '@/lib/server/auth';

export const POST = route(async (req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (tooManyAttempts(ip)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  const { username, password } = await readJson<{ username?: string; password?: string }>(req);
  if (!credentialsMatch(username ? String(username) : undefined, password ? String(password) : '')) {
    recordFailedAttempt(ip);
    throw new HttpError(401, 'Incorrect username or password');
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, makeSession(), {
    httpOnly: true,
    sameSite: 'strict',
    // Behind a TLS-terminating proxy the request itself arrives over http.
    secure: process.env.NODE_ENV === 'production'
      && (req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')).split(',')[0].trim() === 'https',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}, { auth: false });
