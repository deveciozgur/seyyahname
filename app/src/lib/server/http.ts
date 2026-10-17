// Shared plumbing for the app/api route handlers: JSON responses, the CSRF header, body limits and the
// session check.
import { NextResponse, type NextRequest } from 'next/server';
import { CSRF_HEADER, CSRF_VALUE, type ApiErrorBody } from '../api-contract.ts';
import { env } from './env.ts';
import { SESSION_COOKIE, verifySessionToken } from './session.ts';
import { createStorage, type Storage } from './storage.ts';

export const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export const json = <T>(data: T, status = 200, headers: Record<string, string> = {}) => NextResponse.json(data, { status, headers: { ...NO_STORE, ...headers } });

export const fail = (error: string, status: number, extra: Omit<ApiErrorBody, 'error'> = {}, headers: Record<string, string> = {}) => json<ApiErrorBody>({ error, ...extra }, status, headers);

/** A problem the handler turns into a JSON error response. */
export class HttpError extends Error {
  status: number;
  extra: Omit<ApiErrorBody, 'error'>;
  constructor(message: string, status: number, extra: Omit<ApiErrorBody, 'error'> = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Mutating requests must carry the app's header (a cross-site request cannot set it without CORS). */
export function assertSameApp(req: NextRequest) {
  if (req.headers.get(CSRF_HEADER) !== CSRF_VALUE) throw new HttpError('Access denied.', 403);
}

export function assertConfigured() {
  if (!env.pin) throw new HttpError('APP_SECRET_PIN is not set. Add it to the server environment variables (or the .env file).', 503);
}

export async function isAuthenticated(req: NextRequest) {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function assertAuthenticated(req: NextRequest) {
  assertConfigured();
  if (!(await isAuthenticated(req))) throw new HttpError('Session expired.', 401, { locked: true });
}

/** JSON body with a size limit (the coach files are at most 1 MB each). */
export async function readJson<T>(req: NextRequest, maxBytes = 4 * 1024 * 1024): Promise<T> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > maxBytes) throw new HttpError('Request too large.', 413);
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError('Request too large.', 413);
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as T;
  } catch {
    /* fall through */
  }
  throw new HttpError('The request body must be a JSON object.', 400);
}

/** Runs a handler and maps thrown HttpError / StorageError (anything with a status) to JSON errors. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    const status = typeof err?.status === 'number' ? err.status : 500;
    if (status === 500) console.error('[seyyahname] api error:', err);
    const extra = (err?.extra ?? {}) as Omit<ApiErrorBody, 'error'>;
    return fail(status === 500 ? 'Server error. See the server log for details.' : err.message, status, extra);
  }
}

/** One storage per data folder, shared by the routes and kept across hot reloads in development. */
const g = globalThis as typeof globalThis & { __seyyahnameStorage?: Storage };
export function storage(): Storage {
  const dir = env.dataDir;
  if (!g.__seyyahnameStorage || g.__seyyahnameStorage.dir !== dir) g.__seyyahnameStorage = createStorage(dir);
  return g.__seyyahnameStorage;
}

/** HTTPS as seen by the visitor (directly, or reported by the hosting panel's proxy). */
export const isSecure = (req: NextRequest) => process.env.NODE_ENV === 'production' || req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
