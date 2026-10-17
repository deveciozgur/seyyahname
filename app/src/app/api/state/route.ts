// The coach files.
//   GET                        → StatePayload (profile.json, vocabulary.md, error_ledger.md, session list)
//   GET ?session=YYYY-MM-DD    → SessionPayload
//   PUT {version, files}       → SaveResponse; 409 with the current version when the files changed meanwhile
import type { NextRequest } from 'next/server';
import type { SaveRequest, SaveResponse, SessionPayload, StatePayload } from '@/lib/api-contract';
import { assertAuthenticated, assertSameApp, handle, json, readJson, storage } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return handle(async () => {
    await assertAuthenticated(req);
    const date = req.nextUrl.searchParams.get('session');
    if (date !== null) return json<SessionPayload>({ date, content: await storage().readSession(date) });
    return json<StatePayload>(await storage().read());
  });
}

export function PUT(req: NextRequest) {
  return handle(async () => {
    await assertAuthenticated(req);
    assertSameApp(req);
    const body = await readJson<SaveRequest>(req);
    return json<SaveResponse>(await storage().save(body.version, body.files as Record<string, unknown>));
  });
}
