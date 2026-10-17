import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createStorage } from './storage.ts';
import { createSessionToken, verifySessionToken } from './session.ts';
import { GLOBAL_MAX_FAILS, MAX_FAILS, WINDOW_MS, clientIp, createLimiter } from './rate-limit.ts';
import { curriculumContext } from './coach-prompt.ts';
import { chatContents } from './gemini.ts';

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'seyyahname-'));

test('storage bootstraps an empty data folder from the templates', async () => {
  const dir = path.join(await tmp(), 'data');
  const s = createStorage(dir);
  const state = await s.read();
  assert.equal(state.version, 0);
  assert.deepEqual(state.sessions, []);
  const profile = JSON.parse(state.files['profile.json']);
  assert.equal(profile.sub_band, 'A1.1');
  assert.ok(Array.isArray(profile.can_do_mastered));
  assert.match(state.files['vocabulary.md'], /\| Date \| Original \| Upgraded \| Meaning \(TR\) \| CEFR \| Ease Factor \| Repetitions \| Interval Stage \| Next Review \| Example \| Mastered\? \|/);
  assert.match(state.files['error_ledger.md'], /## Active Errors[\s\S]*## Resolved/);
});

test('storage heals a data folder deleted while the server runs', async () => {
  const dir = path.join(await tmp(), 'data');
  const s = createStorage(dir);
  await s.read();
  await fs.rm(dir, { recursive: true });
  assert.equal(JSON.parse((await s.read()).files['profile.json']).sub_band, 'A1.1');
});

test('storage never replaces existing files during bootstrap', async () => {
  const dir = await tmp();
  await fs.writeFile(path.join(dir, 'profile.json'), '{"sub_band":"B2.1","custom":1}');
  const s = createStorage(dir);
  assert.equal(JSON.parse((await s.read()).files['profile.json']).custom, 1);
});

test('storage saves atomically with a version check, whitelist and backups', async () => {
  const dir = await tmp();
  const s = createStorage(dir);
  await s.read();
  const r = await s.save(0, { 'profile.json': '{"a":1}', 'sessions/2026-10-17.md': '# day' });
  assert.deepEqual(r, { version: 1, saved: ['profile.json', 'sessions/2026-10-17.md'] });
  assert.equal(await s.readSession('2026-10-17'), '# day');
  await assert.rejects(s.save(0, { 'profile.json': '{}' }), (e: any) => e.status === 409 && e.extra.version === 1);
  await assert.rejects(s.save(1, { '../.env': 'x' }), (e: any) => e.status === 400);
  await assert.rejects(s.save(1, { 'profile.json': '[1]' }), (e: any) => e.status === 400);
  await assert.rejects(s.readSession('../../etc'), (e: any) => e.status === 400);
  const left = await fs.readdir(dir);
  assert.ok(!left.some((n) => n.endsWith('.tmp') || n === '.lock'), 'no temp or lock files remain');
  assert.equal((await fs.readdir(path.join(dir, 'backups'))).length, 1);
});

test('concurrent saves are serialised: exactly one wins per version', async () => {
  const dir = await tmp();
  const a = createStorage(dir);
  const b = createStorage(dir); // a second process on the same folder
  await a.read();
  const results = await Promise.allSettled([a.save(0, { 'profile.json': '{"by":"a"}' }), b.save(0, { 'profile.json': '{"by":"b"}' })]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal((await a.read()).version, 1);
});

test('session tokens verify, expire and reject tampering', async () => {
  process.env.APP_SECRET_PIN = 'pin-1234';
  process.env.APP_SESSION_SECRET = 'secret';
  const { token, maxAge } = await createSessionToken();
  assert.equal(maxAge, 7 * 86400);
  assert.equal(await verifySessionToken(token), true);
  assert.equal(await verifySessionToken(`${token.slice(0, -2)}xx`), false);
  const old = await createSessionToken(Date.now() - 8 * 86400 * 1000);
  assert.equal(await verifySessionToken(old.token), false);
  process.env.APP_SECRET_PIN = 'changed';
  assert.equal(await verifySessionToken(token), false, 'a new PIN signs everyone out');
});

test('pin limiter locks an address after 5 failures and everyone after 30', () => {
  let t = 0;
  const l = createLimiter(() => t);
  for (let i = 1; i < MAX_FAILS; i++) assert.equal(l.fail('1.1.1.1'), 0);
  assert.equal(l.fail('1.1.1.1'), WINDOW_MS);
  assert.ok(l.wait('1.1.1.1') > 0);
  assert.equal(l.wait('2.2.2.2'), 0);
  t += WINDOW_MS + 1;
  assert.equal(l.wait('1.1.1.1'), 0);
  for (let i = 0; i < GLOBAL_MAX_FAILS; i++) l.fail(`10.0.0.${i}`);
  assert.ok(l.wait('3.3.3.3') > 0);
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': 'forged, 9.9.9.9' })), '9.9.9.9');
});

test('curriculum context follows the active band and points Polish to the next one', () => {
  const ctx = curriculumContext({ sub_band: 'A1.1', curriculum: { band: 'A1.2', evidence: { 'A1.2-CD1': { count: 2 } } }, can_do_mastered: [] });
  assert.match(ctx, /active sub-band A1\.2/);
  assert.match(ctx, /A1\.2-CD1 \[speaking, 2\/3\]/);
  assert.match(ctx, /move the learner toward A2\.1/);
  assert.match(ctx, /no relative clauses/);
  assert.match(curriculumContext({ sub_band: 'C1.1' }), /nuanced, idiomatic/);
});

test('chat contents keep user/model turns and start with the learner', () => {
  const c = chatContents([
    { role: 'assistant', content: 'hi' },
    { role: 'user', content: ' hello ' },
    { role: 'assistant', content: '' },
    { role: 'assistant', content: 'welcome' },
  ]);
  assert.deepEqual(c, [
    { role: 'user', parts: [{ text: 'hello' }] },
    { role: 'model', parts: [{ text: 'welcome' }] },
  ]);
});
