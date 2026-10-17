// The app's data layer. The coach logic (SM-2, sub-bands, error ledger, sessions) runs here in the
// browser on the files /api/state serves, and every change is written straight back to the server's disk
// (atomically, with a version check). AI calls go through /api/feedback and /api/chat to Gemini.

import * as store from '@/lib/core/store';
import { generateFeedback } from '@/lib/core/feedback';
import { CSRF_HEADER, CSRF_VALUE, type AuthStatus, type ChatEvent, type ChatMessage, type ChatRequest, type FeedbackRequest, type FeedbackResponse, type VerifyResponse } from '@/lib/api-contract';
import { ApiError, LOCKED_EVENT, RemoteFS, request } from '@/lib/remote-fs';

export { LOCKED_EVENT };

const files = new RemoteFS();
store.useFileSystem(files);

let aiReady = false;
let loading: Promise<void> | null = null;
const ready = () => (files.loaded ? Promise.resolve() : (loading ??= files.load().finally(() => (loading = null))));

// One operation at a time: run it on the in-memory files, then save. If another device saved in the
// meantime (409), reload the latest files and run the operation once more on top of them.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(op: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    await ready();
    try {
      const result = await op();
      await files.flush();
      return result;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) throw err;
      await files.load();
      const result = await op();
      await files.flush();
      return result;
    }
  });
  queue = run.catch(() => {});
  return run;
}

const read = async <T>(op: () => Promise<T>): Promise<T> => {
  await ready();
  return op();
};

/** Picks up changes made on another device when the tab comes back into view. */
export function refreshOnFocus(onChange: () => void) {
  const handler = () => {
    if (document.visibilityState !== 'visible' || !files.loaded || files.hasUnsaved) return;
    files.load().then(onChange, () => {});
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

const askJson = (req: FeedbackRequest) => request<FeedbackResponse>('/api/feedback', { body: req });

export const api = {
  async authStatus() {
    const s = await request<AuthStatus>('/api/auth');
    aiReady = s.ai;
    return s;
  },
  verify: (pin: string) => request<VerifyResponse>('/api/auth', { body: { pin } }),
  async logout() {
    await request<VerifyResponse>('/api/auth', { method: 'DELETE' });
    files.loaded = false;
  },

  profile: () => read(() => store.readProfile()),
  saveProfile: (profile) => mutate(() => store.writeProfile(profile)),
  vocabulary: () => read(() => store.readVocabulary()),
  addVocabulary: (entries) => mutate(() => store.appendVocabulary(Array.isArray(entries) ? entries : [entries])),
  /** At most 6 due words for the warm-up (CLAUDE.md section 1); the Vault review may go through 50. */
  dueVocabulary: (scope: 'warmup' | 'vault' = 'warmup') => read(() => store.dueVocabulary(scope === 'vault' ? 50 : 6)),
  /** grade: SM-2 quality 0-5, or again | hard | good | easy */
  reviewVocabulary: (original: string, grade: string | number) => mutate(() => store.reviewVocabulary(original, grade)),
  errors: () => read(() => store.readErrors()),
  sessions: () => read(() => store.listSessions()),
  session: (date: string) => read(() => store.readSession(date)),
  feedback: (payload) => read(() => generateFeedback(payload, aiReady ? askJson : null)),
  completeActivity: (payload) => mutate(() => store.completeActivity(payload ?? {})),
  quickPlay: (payload) => mutate(() => store.completeQuickPlay(payload ?? {})),
  setMode: (mode: string) => mutate(() => store.setMode(mode)),
  loot: () => read(() => store.dailyLoot()),
};

/**
 * Streams a coach reply from POST /api/chat (Server-Sent Events relayed from Gemini).
 * Calls onText for every chunk and resolves when the reply is complete. Pass an AbortSignal to stop it.
 */
export async function streamChat(messages: ChatMessage[], { onText, signal }: { onText?: (t: string) => void; signal?: AbortSignal } = {}) {
  await ready();
  const body: ChatRequest = { messages, context: await chatContext() };
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: CSRF_VALUE },
    body: JSON.stringify(body),
    signal,
    credentials: 'same-origin',
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && data.locked) window.dispatchEvent(new Event(LOCKED_EVENT));
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, Boolean(data.locked));
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split('\n\n');
    buffer = events.pop();
    for (const ev of events) {
      const line = ev.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const data = JSON.parse(line.slice(6)) as ChatEvent;
      if ('error' in data) throw new Error(data.error);
      if ('text' in data) onText?.(data.text);
    }
  }
}

/** The learner's current state for the coach's system instruction (the chat route adds it after the coaching rules). */
async function chatContext() {
  const [profile, errors, due] = await Promise.all([store.readProfile(), store.readErrors(), store.dueVocabulary(6)]);
  const g = profile.gamification;
  return JSON.stringify({
    overall: profile.sub_band,
    skill_bands: profile.skill_bands,
    can_do_mastered: profile.can_do_mastered.map((c) => c.id),
    streak_days: g.streak_days,
    xp_total: g.xp_total,
    confidence_index: g.confidence_index,
    mode: g.mode,
    struggle_streak: g.struggle_streak,
    interests: profile.interests,
    due_words: due.map((d) => d.original),
    active_polish_patterns: errors.active.slice(0, 5).map((e) => `${e.before} -> ${e.after}`),
  });
}
