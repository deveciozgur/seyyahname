// Triple-Layer feedback from Gemini as JSON.
//   POST {prompt, schema?} → FeedbackResponse
import type { NextRequest } from 'next/server';
import type { FeedbackRequest, FeedbackResponse } from '@/lib/api-contract';
import { feedbackInstruction } from '@/lib/server/coach-prompt';
import { env } from '@/lib/server/env';
import { generateFeedbackJson } from '@/lib/server/gemini';
import { HttpError, assertAuthenticated, assertSameApp, handle, json, readJson, storage } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export function POST(req: NextRequest) {
  return handle(async () => {
    await assertAuthenticated(req);
    assertSameApp(req);
    if (!env.geminiKey) throw new HttpError('GEMINI_API_KEY tanımlı değil.', 503);
    const body = await readJson<FeedbackRequest>(req, 256 * 1024);
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 20000) : '';
    if (!prompt) throw new HttpError('prompt gerekli.', 400);
    const schema = body.schema && typeof body.schema === 'object' && !Array.isArray(body.schema) ? body.schema : undefined;
    const result = await generateFeedbackJson(feedbackInstruction(await storage().readProfile()), prompt, schema);
    return json<FeedbackResponse>(result);
  });
}
