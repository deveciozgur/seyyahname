// Gemini through the official Google Gen AI SDK (@google/genai).
import { ApiError, GoogleGenAI, type Content } from '@google/genai';
import type { ChatMessage } from '../api-contract.ts';
import { env } from './env.ts';

let client: { key: string; base: string; ai: GoogleGenAI } | null = null;

function ai(): GoogleGenAI {
  const key = env.geminiKey;
  const base = env.geminiBaseUrl;
  if (!client || client.key !== key || client.base !== base) {
    client = { key, base, ai: new GoogleGenAI({ apiKey: key, ...(base ? { httpOptions: { baseUrl: base } } : {}) }) };
  }
  return client.ai;
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** A learner-readable message for an SDK or network failure. */
export function geminiMessage(err: unknown): string {
  const status = err instanceof ApiError ? err.status : 0;
  const msg = err instanceof Error ? err.message : String(err);
  if ((status === 400 && /api key/i.test(msg)) || status === 401 || status === 403) return 'Gemini rejected the API key';
  if (status === 404) return `Gemini model "${env.geminiModel}" was not found. Check GEMINI_MODEL`;
  if (status === 429) return 'Gemini rate limit reached. Please try again in a minute';
  return `Gemini error (${status || 'no connection'})${msg ? `: ${msg.slice(0, 300)}` : ''}`;
}

/** Triple-Layer feedback as JSON. A schema the model rejects (400) is retried in plain JSON mode. */
export async function generateFeedbackJson(systemInstruction: string, prompt: string, schema?: Record<string, unknown>) {
  const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const base = { systemInstruction, responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192 };
  const call = (withSchema: boolean) => ai().models.generateContent({ model: env.geminiModel, contents, config: withSchema && schema ? { ...base, responseJsonSchema: schema } : base });
  let res;
  try {
    res = await call(true);
  } catch (err) {
    if (!(schema && err instanceof ApiError && err.status === 400 && !/api key/i.test(err.message))) throw new GeminiError(geminiMessage(err));
    try {
      res = await call(false);
    } catch (retryErr) {
      throw new GeminiError(geminiMessage(retryErr));
    }
  }
  const text = res.text ?? '';
  if (!text) throw new GeminiError(`Gemini returned no answer (${res.candidates?.[0]?.finishReason ?? res.promptFeedback?.blockReason ?? 'empty'})`);
  return { text, model: res.modelVersion ?? env.geminiModel };
}

/** The app's chat history as Gemini contents: roles user/model, the last 24 turns, starting with the learner. */
export function chatContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = [];
  for (const m of (Array.isArray(messages) ? messages : []).slice(-24)) {
    const text = typeof m?.content === 'string' ? m.content.trim() : '';
    if (!text || (m.role !== 'user' && m.role !== 'assistant')) continue;
    contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: text.slice(0, 6000) }] });
  }
  while (contents.length && contents[0].role !== 'user') contents.shift();
  return contents;
}

/** Streams the coach's reply as text chunks; aborting the signal stops the upstream request. */
export async function* streamChat(systemInstruction: string, contents: Content[], signal: AbortSignal): AsyncGenerator<string> {
  let stream;
  try {
    stream = await ai().models.generateContentStream({ model: env.geminiModel, contents, config: { systemInstruction, temperature: 0.7, maxOutputTokens: 4096, abortSignal: signal } });
  } catch (err) {
    throw new GeminiError(geminiMessage(err));
  }
  try {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (err) {
    if (signal.aborted) return;
    throw new GeminiError(geminiMessage(err));
  }
}
