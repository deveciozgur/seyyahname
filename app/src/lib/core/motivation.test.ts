import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { onActivity, onQuickPlay, onReview } from './motivation.ts';
import { normalizeProfile } from './schema.ts';
import { diskFS } from './test-fs.ts';

const baseProfile = () => normalizeProfile({ history: [] });
const ctx = (over = {}) => ({
  date: '2026-10-17',
  yesterday: '2026-10-16',
  skill: 'reading',
  level: 'A1',
  current: 'A1',
  band: 'A1.1',
  score: 100,
  title: 'T',
  slotFilled: true,
  fnLabel: 'Transactional',
  canDo: 'Can find simple facts.',
  bandChange: null,
  levelChange: null,
  addedWords: 3,
  credited: [],
  resolved: [],
  response: '',
  vocabSize: 3,
  ...over,
});
const act = (p, over: any = {}) => {
  p.history.push({ event: 'activity', date: over?.date ?? '2026-10-17', skill: over?.skill ?? 'reading', ...(over?.words != null ? { words: over.words } : {}) });
  return onActivity(p, ctx(over));
};

test('first activity of the day yields at least 3 wins, a streak, Can-Do and milestones', () => {
  const p = baseProfile();
  const r = act(p);
  const kinds = r.wins.map((w) => w.kind);
  for (const k of ['streak', 'effort', 'complete', 'score', 'context', 'cando', 'words']) assert.ok(kinds.includes(k), k);
  assert.equal(p.gamification.streak_days, 1);
  assert.equal(p.gamification.xp_total, r.points);
  assert.deepEqual(p.gamification.unlocked_milestones.map((m) => m.id).sort(), ['first_80', 'first_can_do', 'first_steps', 'perfect']);
});

test('streak counts consecutive days, resets after a gap, and tracks the longest', () => {
  const p = baseProfile();
  act(p, { date: '2026-10-15', yesterday: '2026-10-14' });
  act(p, { date: '2026-10-16', yesterday: '2026-10-15' });
  act(p, { date: '2026-10-16', yesterday: '2026-10-15' });
  assert.equal(p.gamification.streak_days, 2);
  act(p, { date: '2026-10-17', yesterday: '2026-10-16' });
  assert.equal(p.gamification.streak_days, 3);
  act(p, { date: '2026-10-20', yesterday: '2026-10-19' });
  assert.equal(p.gamification.streak_days, 1);
  assert.equal(p.gamification.longest_streak, 3);
});

test('Frustration Shield after 2 struggles; Low-Effort Mode on, then off after an 80%+ round', () => {
  const p = baseProfile();
  assert.equal(act(p, { score: 40, slotFilled: false, canDo: null }).shield, false);
  const r = act(p, { score: 50, slotFilled: false, canDo: null });
  assert.equal(r.shield, true);
  assert.equal(r.lowEffort.active, true);
  act(p, { score: 90 });
  assert.equal(p.gamification.mode, 'normal');
});

test('shrinking answers switch to Low-Effort Mode', () => {
  const p = baseProfile();
  act(p, { skill: 'writing', response: 'x '.repeat(40), words: 40 });
  act(p, { skill: 'writing', response: 'x '.repeat(44), words: 44 });
  const r = act(p, { skill: 'writing', response: 'yes ok fine', words: 3, score: 70, slotFilled: false, canDo: null });
  assert.match(r.lowEffort.reason, /shorter/);
});

test('confidence index starts at 80 and moves with performance; band steps unlock milestones', () => {
  const p = baseProfile();
  assert.equal(p.gamification.confidence_index, 80);
  act(p, { score: 30, slotFilled: false, canDo: null });
  assert.ok(p.gamification.confidence_index < 80);
  const r = act(p, { bandChange: { skill: 'reading', from: 'A1.1', to: 'A1.2' } });
  assert.ok(r.wins.some((w) => w.label === 'Reading reached A1.2'));
  assert.ok(p.gamification.unlocked_milestones.some((m) => m.id === 'band_reading_A1.2'));
});

test('SM-2 reviews and quick play reward effort, even after a lapse', () => {
  const p = baseProfile();
  const lapse = onReview(p, { date: '2026-10-17', yesterday: '2026-10-16', grade: 'again', word: 'next to', stage: '1d' });
  assert.ok(lapse.points > 0);
  p.gamification.struggle_streak = 2;
  const q = onQuickPlay(p, { date: '2026-10-17', yesterday: '2026-10-16', correct: 2, total: 5 });
  assert.ok(q.wins.some((w) => w.kind === 'quickplay'));
  assert.equal(p.gamification.struggle_streak, 0);
});

// ---------- store integration ----------
let tmp;
let store;
before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'coach-motivation-'));
  await fs.writeFile(path.join(tmp, 'vocabulary.md'), '# Vocabulary Log\n\n| Date | Original |\n|---|---|\n');
  await fs.writeFile(path.join(tmp, 'error_ledger.md'), '# Error Ledger\n\n## Active Errors\n\n| # |\n|---|\n\n## Resolved\n\n| # |\n|---|\n\n## Watchlist\n- inversion\n');
  await fs.writeFile(path.join(tmp, 'profile.json'), JSON.stringify({ history: [] }));
  await fs.mkdir(path.join(tmp, 'sessions'));
  store = await import('./store.ts');
  store.useFileSystem(diskFS(tmp));
});
after(async () => fs.rm(tmp, { recursive: true, force: true }));

test('activity returns wins; daily loot collects wins, words, Can-Dos and XP', async () => {
  const r = await store.completeActivity({ skill: 'writing', level: 'A1', fn: 'evaluative', score: 85, taskId: 'w', taskTitle: 'About Me', response: 'I like games because they are fun.', vocabulary: [{ word: 'level up', meaning: 'move up to the next level' }] });
  assert.ok(r.motivation.wins.length >= 3);
  assert.ok(r.profile.gamification.unlocked_milestones.some((m) => m.id === 'first_connector'));
  await store.completeQuickPlay({ correct: 4, total: 5, theme: 'Gaming' });
  const loot = await store.dailyLoot();
  assert.ok(loot.points >= r.motivation.points);
  assert.deepEqual(loot.words.map((w) => w.original), ['level up']);
  assert.deepEqual(r.curriculum.credited.map((c) => [c.id, c.count]), [['A1.1-CD3', 1]], 'one step toward the first open A1.1 writing Can-Do');
  assert.deepEqual(loot.canDos, [], 'mastered only after 3 demonstrations');
  assert.equal(loot.streak, 1);
  assert.match(await store.readSession(store.today()), /XP; day 1 streak/);
});

test('mode can be switched back to normal by the learner', async () => {
  assert.equal((await store.setMode('normal')).profile.gamification.mode, 'normal');
  await assert.rejects(store.setMode('turbo'), /mode must be/);
});
