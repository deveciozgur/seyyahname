// The HTTP contract between the browser and the app/api routes. Both sides import these types,
// so a change to a request or response shape is a type error on the other side.

/** Every mutating request carries this header; a cross-site form or fetch cannot set it without CORS. */
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'seyyahname';

export const STATE_FILES = ['profile.json', 'vocabulary.md', 'error_ledger.md'] as const;
export type StateFile = (typeof STATE_FILES)[number];
export const SESSION_FILE_RE = /^sessions\/\d{4}-\d{2}-\d{2}\.md$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ApiErrorBody = { error: string; locked?: boolean; version?: number };

// GET /api/auth · POST /api/auth {pin} · DELETE /api/auth
export type AuthStatus = { authenticated: boolean; ai: boolean; model: string; version: string };
export type VerifyRequest = { pin: string };
export type VerifyResponse = { authenticated: boolean };

// GET /api/state · GET /api/state?session=YYYY-MM-DD · PUT /api/state
export type StatePayload = { version: number; files: Record<StateFile, string>; sessions: string[] };
export type SessionPayload = { date: string; content: string };
export type SaveRequest = { version: number; files: Record<string, string> };
export type SaveResponse = { version: number; saved: string[] };

// POST /api/feedback
export type FeedbackRequest = { prompt: string; schema?: Record<string, unknown> };
export type FeedbackResponse = { text: string; model: string };

// POST /api/chat  →  text/event-stream of ChatEvent
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ChatRequest = { messages: ChatMessage[]; context?: string };
export type ChatEvent = { text: string } | { done: true } | { error: string };
