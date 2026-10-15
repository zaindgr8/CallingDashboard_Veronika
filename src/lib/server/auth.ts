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

export function credentialsMatch(username?: string, password?: string) {
  const expectedUser = process.env.DASHBOARD_USERNAME;
  const expectedPass = process.env.DASHBOARD_PASSWORD;
  if (!expectedPass) return false;
  if (expectedUser) {
    if (!username) return false;
    const a = createHmac('sha256', secret()).update(username.trim().toLowerCase()).digest();
    const b = createHmac('sha256', secret()).update(expectedUser.trim().toLowerCase()).digest();
    if (!timingSafeEqual(a, b)) return false;
  }
  const pa = createHmac('sha256', secret()).update(password ?? '').digest();
  const pb = createHmac('sha256', secret()).update(expectedPass).digest();
  return timingSafeEqual(pa, pb);
}

export function passwordMatches(input: string) {
  return credentialsMatch(undefined, input);
}

const attempts = new Map<string, number[]>();
export function tooManyAttempts(ip: string) {
  const now = Date.now();
  if (attempts.size > 5000) attempts.forEach((t, k) => { if (!t.some((x) => now - x < 15 * 60_000)) attempts.delete(k); });
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  attempts.set(ip, recent);
  return recent.length >= 10;
}
export function recordFailedAttempt(ip: string) {
  attempts.set(ip, [...(attempts.get(ip) ?? []), Date.now()]);
}
