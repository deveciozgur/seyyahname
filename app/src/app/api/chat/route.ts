// The coach chat, streamed.
//   POST {messages, context?} → text/event-stream: `data: {"text": "..."}` per chunk, then {"done": true}
//   or {"error": "..."}. The upstream Gemini request stops when the browser disconnects.
import type { NextRequest } from 'next/server';
import type { ChatEvent, ChatRequest } from '@/lib/api-contract';
import { chatInstruction } from '@/lib/server/coach-prompt';
import { env } from '@/lib/server/env';
import { chatContents, streamChat } from '@/lib/server/gemini';
import { HttpError, NO_STORE, assertAuthenticated, assertSameApp, handle, readJson, storage } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export function POST(req: NextRequest) {
  return handle(async () => {
    await assertAuthenticated(req);
    assertSameApp(req);
    if (!env.geminiKey) throw new HttpError('Yapay zekâ koçu çevrimdışı: sunucuya GEMINI_API_KEY ekleyin.', 503);
    const body = await readJson<ChatRequest>(req, 512 * 1024);
    const contents = chatContents(body.messages);
    if (!contents.length || contents[contents.length - 1].role !== 'user') throw new HttpError('Sohbet bir öğrenci mesajıyla bitmeli.', 400);
    const learnerState = typeof body.context === 'string' ? body.context.slice(0, 8000) : '{}';
    const system = chatInstruction(await storage().readProfile(), learnerState);

    const upstream = new AbortController();
    req.signal.addEventListener('abort', () => upstream.abort(), { once: true });
    const encoder = new TextEncoder();
    const event = (e: ChatEvent) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const text of streamChat(system, contents, upstream.signal)) controller.enqueue(event({ text }));
          if (!upstream.signal.aborted) controller.enqueue(event({ done: true }));
        } catch (err) {
          if (!upstream.signal.aborted) controller.enqueue(event({ error: `${err instanceof Error ? err.message : String(err)}.` }));
        } finally {
          try {
            controller.close();
          } catch {
            /* already closed by a disconnect */
          }
        }
      },
      cancel() {
        upstream.abort();
      },
    });

    return new Response(stream, {
      headers: { ...NO_STORE, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
    });
  });
}
