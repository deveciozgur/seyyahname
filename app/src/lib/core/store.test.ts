import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { diskFS } from './test-fs.ts';

// Fixtures use earlier file layouts so the migration path is exercised too.
const OLD_VOCAB = `# Vocabulary Log

| Date | Word / Phrase | CEFR | Meaning (TR) | Example Sentence | C1/C2 Alternative |
|---|---|---|---|---|---|
| 2026-10-10 | get up | A1 | kalkmak | I get up at 7. | rise (formal) |
`;
const OLD_LEDGER = `# Error Ledger

## Active Errors

| # | Category | Error (before) | Correct (after) | Rule / Note | Count | First Seen | Last Seen |
|---|---|---|---|---|---|---|---|

## Resolved

| # | Category | Error | Correct | Resolved On |
|---|---|---|---|---|

## Watchlist (from previous profile, not yet observed)
- inversion
- third conditional
`;
const OLD_PROFILE = {
  user: { current_overall_level: 'A1', skills: { speaking: 'A1', writing: 'A1', reading: 'A1', listening: 'A1' }, target_level: 'C2', interests: ['Gaming'] },
  metrics: { vocabulary_size_estimate: 500, weaknesses: [], strengths: [] },
  diagnostic: { status: 'paused', stages: { reading: 'pending', writing: 'pending', listening: 'pending', speaking: 'pending' } },
  history: [],
  motivation: { daily_streak: 0, total_points: 0, unlocked_milestones: [], confidence_score: 50, level_points: 0, sublevel: 'A1' },
};

let tmp;
let store;
let md;
let heur;
let srs;

before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'coach-test-'));
  await fs.writeFile(path.join(tmp, 'vocabulary.md'), OLD_VOCAB);
  await fs.writeFile(path.join(tmp, 'error_ledger.md'), OLD_LEDGER);
  await fs.writeFile(path.join(tmp, 'profile.json'), JSON.stringify(OLD_PROFILE));
  await fs.writeFile(path.join(tmp, 'CLAUDE.md'), '# Coach');
  await fs.mkdir(path.join(tmp, 'sessions'));
  store = await import('./store.ts');
  store.useFileSystem(diskFS(tmp));
  md = await import('./markdown.ts');
  heur = await import('./heuristics.ts');
  srs = await import('./srs.ts');
});

after(async () => fs.rm(tmp, { recursive: true, force: true }));

const T = () => store.today();
const readJson = async () => JSON.parse(await fs.readFile(path.join(tmp, 'profile.json'), 'utf8'));

test('markdown tables round-trip, including escaped pipes', () => {
  const doc = '# T\n\n| a | b |\n|---|---|\n| 1 | x \\| y |\n\ntext after\n';
  const [t] = md.parseTables(doc);
  assert.deepEqual(t.rows, [['1', 'x | y']]);
  const out = md.replaceTableRows(doc, 'T', [...t.rows, ['2', 'z']]);
  assert.deepEqual(md.parseTables(out)[0].rows, [['1', 'x | y'], ['2', 'z']]);
});

test('migration produces the global-standard profile schema and SM-2 vocabulary columns', async () => {
  const changed = await store.migrateFiles();
  assert.deepEqual(changed.sort(), ['error_ledger.md', 'profile.json', 'vocabulary.md']);
  const p = await readJson();
  assert.equal(p.overall_cefr, 'A1');
  assert.equal(p.sub_band, 'A1.1');
  assert.deepEqual(p.skills, { reading: 'A1', writing: 'A1', listening: 'A1', speaking: 'A1' });
  assert.deepEqual(p.skill_bands, { reading: 'A1.1', writing: 'A1.1', listening: 'A1.1', speaking: 'A1.1' });
  assert.deepEqual(p.can_do_mastered, []);
  assert.equal(p.gamification.streak_days, 0);
  assert.equal(p.gamification.xp_total, 0);
  assert.equal(p.gamification.confidence_index, 80, 'no practice yet, so the 80 starting value');
  assert.equal(p.srs_queue[0].word, 'get up');
  assert.deepEqual(p.interests, ['Gaming']);
  assert.equal(p.user, undefined);
  assert.equal(p.motivation, undefined);
  const vocabMd = await fs.readFile(path.join(tmp, 'vocabulary.md'), 'utf8');
  assert.match(vocabMd, /\| Date \| Original \| Upgraded \| Meaning \(TR\) \| CEFR \| Ease Factor \| Repetitions \| Interval Stage \| Next Review \| Example \| Mastered\? \|/);
  const [row] = await store.readVocabulary();
  assert.deepEqual([row.original, row.upgraded, row.meaning, row.stage, row.ease, row.next, row.due], ['get up', 'rise (formal)', 'kalkmak', '1d', '2.50', '2026-10-11', true]);
  assert.deepEqual(await store.migrateFiles(), [], 'second migration is a no-op');
});

test('SM-2: ladder 1-3-7-14-30, then ease growth; hard repeats, easy skips, again resets', () => {
  const day = '2026-10-17';
  let row = { stage: '1d', ease: '2.50', reps: '0', mastered: 'No' };
  for (const expected of ['3d', '7d', '14d', '30d']) {
    row = { ...row, ...srs.schedule(row, 'good', day) };
    assert.equal(row.stage, expected);
  }
  assert.equal(row.mastered, 'No');
  row = { ...row, ...srs.schedule(row, 'good', day) };
  assert.equal(row.stage, '75d', '30 x ease 2.5');
  assert.equal(row.mastered, 'Yes');
  assert.equal(srs.schedule({ stage: '7d', ease: '2.50' }, 'hard', day).stage, '7d');
  assert.equal(srs.schedule({ stage: '3d', ease: '2.50' }, 'easy', day).stage, '14d');
  const lapse = srs.schedule({ stage: '14d', ease: '2.50', reps: '3', mastered: 'Yes' }, 'again', day);
  assert.deepEqual([lapse.stage, lapse.reps, lapse.mastered, lapse.next], ['1d', '0', 'No', '2026-10-18']);
  assert.equal(lapse.ease, '1.96');
  assert.equal(srs.updateEase(1.3, 1), 1.3, 'never below 1.3');
  assert.deepEqual(srs.preview({ stage: '1d', ease: '2.50' }, day), { again: '1d', hard: '1d', good: '3d', easy: '7d', 0: '1d', 1: '1d', 2: '1d', 3: '1d', 4: '3d', 5: '7d' });
  // full 0-5 quality scale: 0-2 lapse, 3 hard, 4 good, 5 easy; EF follows the SM-2 formula for each q
  assert.deepEqual([0, 1, 2].map((q) => srs.schedule({ stage: '7d', ease: '2.50' }, q, day).stage), ['1d', '1d', '1d']);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((q) => srs.updateEase(2.5, q)), [1.7, 1.96, 2.18, 2.36, 2.5, 2.6]);
  assert.equal(srs.schedule({ stage: '7d', ease: '2.50' }, '4', day).stage, '14d');
  assert.throws(() => srs.schedule({ stage: '1d' }, 6, day), /grade must be/);
});

test('reviews update vocabulary.md, srs_queue and today\'s session', async () => {
  const due = await store.dueVocabulary();
  assert.equal(due[0].original, 'get up');
  assert.deepEqual(due[0].preview, { again: '1d', hard: '1d', good: '3d', easy: '7d', 0: '1d', 1: '1d', 2: '1d', 3: '1d', 4: '3d', 5: '7d' });
  const r = await store.reviewVocabulary('get up', 'good');
  assert.equal(r.entry.stage, '3d');
  assert.equal(r.entry.due, false);
  const p = await readJson();
  assert.equal(p.srs_queue[0].interval, '3d');
  assert.equal(p.gamification.streak_days, 1);
  assert.match(await store.readSession(T()), /SRS review: \*\*get up\*\* graded good \(q=4, 1d → 3d, ease 2\.50\)/);
  await assert.rejects(store.reviewVocabulary('get up', 'maybe'), /grade must be/);
});

test('sub-bands: one Transactional, Interactional and Evaluative task each; distinct tasks per level', async () => {
  const run = (taskId, fn, score = 90, level = 'A1') => store.completeActivity({ skill: 'reading', level, fn, score, taskId, taskTitle: taskId });
  let r = await run('t1', 'transactional');
  assert.deepEqual(r.functions, { band: 'A1.1', done: ['transactional'] });
  assert.equal(r.canDo, null, 'reading tasks build skill bands; curriculum Can-Dos come from speaking/writing');
  assert.deepEqual(r.curriculum.credited, []);
  r = await run('t2', 'transactional');
  assert.deepEqual(r.functions.done, ['transactional'], 'a second task of the same function does not fill another slot');
  r = await run('i1', 'interactional', 60);
  assert.deepEqual(r.functions.done, ['transactional'], 'below 80% does not count');
  r = await run('e-a2', 'evaluative', 100, 'A2');
  assert.deepEqual(r.functions.done, ['transactional'], 'above-level success does not jump');
  await run('i1', 'interactional');
  r = await run('e1', 'evaluative');
  assert.deepEqual(r.bandChange, { skill: 'reading', from: 'A1.1', to: 'A1.2' });
  assert.equal(r.levelChange, null);
  assert.equal(r.profile.skill_bands.reading, 'A1.2');
  assert.equal(r.profile.skills.reading, 'A1');

  // A1.2 needs three new tasks: t1/i1/e1 were used for A1.1.
  r = await run('t1', 'transactional');
  assert.deepEqual(r.functions.done, []);
  await run('t2', 'transactional');
  await run('i2', 'interactional');
  r = await run('e2', 'evaluative');
  assert.deepEqual(r.bandChange, { skill: 'reading', from: 'A1.2', to: 'A2.1' });
  assert.deepEqual(r.levelChange, { skill: 'reading', from: 'A1', to: 'A2' });
  assert.equal(r.profile.skills.reading, 'A2');
  assert.equal(r.profile.sub_band, 'A1.1', 'overall moves when the average of the four skills does');
  assert.deepEqual(r.profile.can_do_mastered, []);
});

test('session file starts with a 5-line summary including CEFR bands', async () => {
  const s = await store.readSession(T());
  const lines = s.split('\n');
  const i = lines.indexOf('## Session Summary');
  const summary = lines.slice(i + 1).filter((l) => l.trim()).slice(0, 5);
  assert.equal(summary.length, 5);
  assert.match(summary[0], /^- \*\*Practice:\*\* \d+ activities \(Reading\); 1 SRS review \(1 recalled\)/);
  assert.match(summary[1], /confidence index \d+/);
  assert.match(summary[2], /^- \*\*CEFR:\*\* overall A1\.1; Reading A2\.1 \(0\/3\).*Sub-band up: Reading A1\.1→A1\.2, Reading A1\.2→A2\.1/);
  assert.match(summary[4], /^- \*\*Next:\*\*/);
  assert.equal(lines.filter((l) => l === '## Session Summary').length, 1);
  assert.match(s, /Reading \(A1, Evaluative\), 90%/);
});

test('error ledger: repeat resets streak; 3 later sessions of correct use resolve the pattern', async () => {
  const write = (response, errors = []) => store.completeActivity({ skill: 'writing', level: 'A1', fn: 'interactional', score: 50, taskId: 'w1', taskTitle: 'w1', response, errors });
  const ledgerPath = path.join(tmp, 'error_ledger.md');
  const nextDay = async () => {
    const txt = await fs.readFile(ledgerPath, 'utf8');
    await fs.writeFile(ledgerPath, txt.replaceAll(T(), '2000-01-01'));
  };
  const err = { category: 'Verb choice', before: 'I have 30 years', after: 'I am 30 years old', rule: 'age' };
  await write('i have 30 years', [err]);
  let r = await write('Hello. I am 30 years old.');
  assert.equal(r.credited.length, 0, 'the session with the pattern does not count');
  await nextDay();
  r = await write('Hello. I am 30 years old.');
  assert.equal(r.credited[0].streak, 1);
  await nextDay();
  r = await write('I have 30 years', [err]);
  assert.equal(r.loggedErrors[0].streak, 0, 'repeating resets the streak');
  for (const expected of [1, 2]) {
    await nextDay();
    r = await write('I am 30 years old.');
    assert.equal(r.credited[0].streak, expected);
  }
  await nextDay();
  r = await write('I am 30 years old.');
  assert.equal(r.resolvedErrors.length, 1);
  assert.equal((await store.readErrors()).active.length, 0);
});

test('profile validation and safe session paths', async () => {
  const p = await store.readProfile();
  await assert.rejects(store.writeProfile({ ...p, target_cefr: 'Z9' }), /target_cefr must be/);
  const saved = await store.writeProfile({ ...p, interests: ['Travel'] });
  assert.deepEqual(saved.interests, ['Travel']);
  await assert.rejects(store.readSession('../profile'), /Invalid date/);
});

test('partial profile updates merge instead of replacing the file', async () => {
  const before = await store.readProfile();
  await assert.rejects(store.updateProfile({ overall_cefr: 'Z9' }), /overall_cefr must be/);
  const saved = await store.updateProfile({ interests: ['Gaming'], gamification: { mode: 'low' } });
  assert.deepEqual(saved.interests, ['Gaming']);
  assert.equal(saved.gamification.mode, 'low');
  assert.equal(saved.gamification.xp_total, before.gamification.xp_total);
  assert.deepEqual(saved.skill_bands, before.skill_bands);
  assert.deepEqual(saved.history, before.history);
});

test('heuristics catch common Turkish-L1 slips without false positives', () => {
  const fixes = heur.analyzeGrammar('i have 25 years. She work in a office. My wife work here. I listen music on the morning.').map((g) => g.after);
  for (const f of ['I am 25 years old', 'She works', 'My wife works', 'an office', 'listen to music', 'in the morning']) assert.ok(fixes.includes(f), `missing fix: ${f}`);
  assert.deepEqual(heur.analyzeGrammar('Does she like coffee? He can go home. I am 25 years old. It has two rooms.'), []);
});

test('ACTFL tolerance: A1 local slips cost little and are recast; B2 demands register', () => {
  const text = 'hello my name is Mehmet. i have 30 years. I work in a office.';
  const a1 = heur.heuristicFeedback({ mode: 'writing', text, level: 'A1' });
  const b2 = heur.heuristicFeedback({ mode: 'writing', text, level: 'B2' });
  assert.ok(a1.score >= 90, `A1 score ${a1.score}`);
  assert.ok(b2.score < a1.score - 15);
  assert.ok(a1.grammar.every((g) => g.severity === 'local'));
  assert.equal(a1.recast, 'Hello my name is Mehmet. I am 30 years old. I work in an office.');
  const formal = heur.heuristicFeedback({ mode: 'writing', text: "Hey guys, I'm gonna complain about the laptop. It's broken lol.", level: 'B2', task: { register: 'formal' } });
  assert.match(formal.tone.notes[0], /Sociolinguistic appropriacy/);
  assert.ok(formal.tone.notes.some((n) => /contractions/.test(n)));
});

test('strength-first and speaking rules', () => {
  const fb = heur.heuristicFeedback({ mode: 'speaking', text: 'um i like football because it is fun she work in a bank', level: 'A1', durationSec: 2 });
  assert.match(fb.strength, /because/);
  assert.ok(fb.grammar.every((g) => !['Capitalisation', 'Punctuation'].includes(g.category)));
  assert.equal(fb.speaking.wpm, null);
});
