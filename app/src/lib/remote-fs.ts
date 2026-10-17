// The coach files as the browser sees them: loaded once from GET /api/state, changed in memory by the
// store, and written back (PUT /api/state) after every operation. A version number guards against two
// devices overwriting each other: on a conflict the store reloads and re-runs.

import { CSRF_HEADER, CSRF_VALUE, type ApiErrorBody, type SaveRequest, type SaveResponse, type SessionPayload, type StatePayload } from './api-contract';
import type { StateFS } from './core/store';

/** Fired when the session has expired; the app shell sends the visitor to /unlock. */
export const LOCKED_EVENT = 'seyyahname:locked';

export class ApiError extends Error {
  status: number;
  locked: boolean;
  constructor(message: string, status: number, locked = false) {
    super(message);
    this.status = status;
    this.locked = locked;
  }
}

/** Calls an app/api route. Bodies are JSON; the custom header blocks cross-site requests. */
export async function request<T>(path: string, init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const method = init.method ?? (init.body === undefined ? 'GET' : 'POST');
  const res = await fetch(path, {
    method,
    headers: { [CSRF_HEADER]: CSRF_VALUE, ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    credentials: 'same-origin',
    signal: init.signal,
  });
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) {
    if (res.status === 401 && data?.locked) window.dispatchEvent(new Event(LOCKED_EVENT));
    throw new ApiError(data?.error ?? `İstek başarısız (${res.status})`, res.status, Boolean(data?.locked));
  }
  if (data === null) throw new ApiError('Sunucu JSON yanıtı vermedi.', res.status);
  return data as T;
}

export class RemoteFS implements StateFS {
  private files = new Map<string, string>();
  private sessions = new Set<string>();
  private dirty = new Set<string>();
  private version = 0;
  loaded = false;

  async load() {
    const s = await request<StatePayload>('/api/state');
    this.files = new Map(Object.entries(s.files));
    this.sessions = new Set(s.sessions);
    this.dirty.clear();
    this.version = s.version;
    this.loaded = true;
  }

  get hasUnsaved() {
    return this.dirty.size > 0;
  }

  async read(name: string): Promise<string | null> {
    if (this.files.has(name)) return this.files.get(name) ?? null;
    const m = /^sessions\/(\d{4}-\d{2}-\d{2})\.md$/.exec(name);
    if (!m || !this.sessions.has(`${m[1]}.md`)) return null;
    const { content } = await request<SessionPayload>(`/api/state?session=${m[1]}`);
    this.files.set(name, content);
    return content;
  }

  async write(name: string, content: string) {
    this.files.set(name, content);
    this.dirty.add(name);
    const m = /^sessions\/(.+)$/.exec(name);
    if (m) this.sessions.add(m[1]);
  }

  async list(dir: string) {
    return dir === 'sessions' ? [...this.sessions] : [];
  }

  /** Writes every changed file in one request. Throws ApiError 409 if another device saved first. */
  async flush() {
    if (!this.dirty.size) return;
    const body: SaveRequest = { version: this.version, files: Object.fromEntries([...this.dirty].map((n) => [n, this.files.get(n) ?? ''])) };
    const { version } = await request<SaveResponse>('/api/state', { method: 'PUT', body });
    this.version = version;
    this.dirty.clear();
  }
}
