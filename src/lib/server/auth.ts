import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'dm_session';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url');

/** Token format: `<expiryMs>.<nonce>.<hmac>` */
export function makeSession() {
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomUUID()}`;
  return `${payload}.${sign(payload)}`;
}

export function validSession(token?: string | null) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const expect = Buffer.from(sign(payload));
  if (sig.length !== expect.length || !timingSafeEqual(sig, expect)) return false;
  return Number(payload.split('.')[0]) > Date.now();
}

export function passwordMatches(input: string) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  const a = createHmac('sha256', secret()).update(input).digest();
  const b = createHmac('sha256', secret()).update(expected).digest();
  return timingSafeEqual(a, b);
}

const attempts = new Map<string, number[]>();
export function tooManyAttempts(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  attempts.set(ip, recent);
  return recent.length >= 10;
}
export function recordFailedAttempt(ip: string) {
  attempts.set(ip, [...(attempts.get(ip) ?? []), Date.now()]);
}
