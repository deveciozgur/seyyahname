// Lock screen session.
//   GET    → AuthStatus
//   POST   {pin} → sets the session cookie (JWT, HS256)
//   DELETE → clears it
import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { AuthStatus, VerifyRequest, VerifyResponse } from '@/lib/api-contract';
import { APP_VERSION, env } from '@/lib/server/env';
import { HttpError, assertConfigured, assertSameApp, handle, isAuthenticated, isSecure, json, readJson } from '@/lib/server/http';
import { clientIp, lockedMessage, pinLimiter } from '@/lib/server/rate-limit';
import { SESSION_COOKIE, cookieOptions, createSessionToken } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/** Constant-time comparison (hashing first makes the lengths equal). */
const samePin = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export function GET(req: NextRequest) {
  return handle(async () => {
    assertConfigured();
    return json<AuthStatus>({ authenticated: await isAuthenticated(req), ai: Boolean(env.geminiKey), model: env.geminiModel, version: APP_VERSION });
  });
}

export function POST(req: NextRequest) {
  return handle(async () => {
    assertConfigured();
    assertSameApp(req);
    const ip = clientIp(req.headers);
    const wait = pinLimiter.wait(ip);
    if (wait) return json({ error: lockedMessage(wait) }, 429, { 'Retry-After': String(Math.ceil(wait / 1000)) });

    const { pin } = await readJson<VerifyRequest>(req, 4096);
    if (typeof pin !== 'string' || !pin || !samePin(pin, env.pin)) {
      const locked = pinLimiter.fail(ip);
      throw new HttpError(locked ? lockedMessage(locked) : 'PIN hatalı.', locked ? 429 : 401);
    }
    pinLimiter.clear(ip);
    const { token, maxAge } = await createSessionToken();
    const res = json<VerifyResponse>({ authenticated: true });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(isSecure(req), maxAge));
    return res;
  });
}

export function DELETE(req: NextRequest) {
  return handle(async () => {
    assertSameApp(req);
    const res = json<VerifyResponse>({ authenticated: false });
    res.cookies.set(SESSION_COOKIE, '', cookieOptions(isSecure(req), 0));
    return res;
  });
}
