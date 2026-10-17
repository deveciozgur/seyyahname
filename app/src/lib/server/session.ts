// Lock-screen session: a JWT (HS256, jose) in an HttpOnly cookie. The signing key is derived from
// APP_SESSION_SECRET and APP_SECRET_PIN, so rotating either signs every device out.
import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from './env.ts';

export const SESSION_COOKIE = 'seyyahname_session';
const ISSUER = 'seyyahname';

function key(): Uint8Array {
  return new Uint8Array(createHash('sha256').update(`${env.sessionSecret}:seyyahname:${env.pin}`).digest());
}

export async function createSessionToken(now = Date.now()): Promise<{ token: string; maxAge: number }> {
  const maxAge = Math.round(env.sessionDays * 86400);
  const token = await new SignJWT({ scope: 'coach' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(ISSUER)
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + maxAge)
    .sign(key());
  return { token, maxAge };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !env.pin) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISSUER, algorithms: ['HS256'] });
    return payload.scope === 'coach';
  } catch {
    return false;
  }
}

/** Cookie attributes: Secure in production and behind HTTPS (plain-HTTP development keeps working). */
export function cookieOptions(secure: boolean, maxAge: number) {
  return { httpOnly: true, path: '/', sameSite: 'lax' as const, secure, maxAge };
}
