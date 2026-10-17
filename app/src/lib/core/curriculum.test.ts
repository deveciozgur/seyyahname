import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_CAN_DOS, SUB_BANDS, applyEvidence, bandStatus, curriculumState, practiceTask, suggestedWords } from './curriculum.ts';
import { normalizeProfile } from './schema.ts';

const fresh = (): any => normalizeProfile({ history: [] });
const ev = (over = {}) => ({ skill: 'writing', fn: 'interactional', level: 'A1', score: 90, taskId: 't1', date: '2026-10-17', ...over });

test('curriculum covers A1.1 to C2.2 with productive Can-Dos and consistent references', () => {
  assert.deepEqual(SUB_BANDS.map((b) => b.id), ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2.1', 'C2.2']);
  assert.equal(ALL_CAN_DOS.length, 48);
  for (const b of SUB_BANDS) {
    assert.ok(b.grammar_targets.length >= 4 && b.lexical_domains.length >= 2 && b.l1_interference_alerts.length >= 3 && b.speaking_scenarios.length >= 3, b.id);
    for (const s of b.speaking_scenarios) assert.ok(b.can_do_statements.some((c) => c.id === s.target_can_do), s.id);
  }
});

test('a Can-Do is mastered after 3 different successful tasks; repeats and low scores do not count', () => {
  const p = fresh();
  assert.equal(curriculumState(p).band, 'A1.1');
  let r = applyEvidence(p, ev());
  assert.deepEqual(r.credited.map((c) => [c.id, c.count]), [['A1.1-CD3', 1]]);
  r = applyEvidence(p, ev());
  assert.deepEqual(r.credited, [], 'the same task counts once');
  assert.deepEqual(applyEvidence(p, ev({ taskId: 't2', score: 70 })).credited, [], 'below 80');
  assert.deepEqual(applyEvidence(p, ev({ taskId: 't2', skill: 'reading' })).credited, [], 'receptive skills do not demonstrate these Can-Dos');
  applyEvidence(p, ev({ taskId: 't2' }));
  r = applyEvidence(p, ev({ taskId: 't3' }));
  assert.deepEqual(r.mastered.map((c) => c.id), ['A1.1-CD3']);
  assert.equal(p.can_do_mastered[0].id, 'A1.1-CD3');
  assert.equal(p.can_do_mastered[0].source, 'curriculum');
  assert.equal(bandStatus(p, 'A1.1').find((c) => c.id === 'A1.1-CD3').status, 'mastered');
});

test('feedback confirmation: with AI ids only confirmed Can-Dos count; a practice target counts offline', () => {
  const p = fresh();
  assert.deepEqual(applyEvidence(p, ev({ canDoIds: [] })).credited, [], 'AI saw no Can-Do');
  assert.deepEqual(applyEvidence(p, ev({ taskId: 'a', canDoIds: ['A1.1-CD4', 'A1.1-CD1'] })).credited.map((c) => c.id), ['A1.1-CD4'], 'only writing ids of the active band');
  assert.deepEqual(applyEvidence(p, ev({ taskId: 'b', skill: 'speaking', targetCanDo: 'A1.1-CD2' })).credited.map((c) => c.id), ['A1.1-CD2']);
});

test('mastering every Can-Do of the band moves the learner up one sub-band', () => {
  const p = fresh();
  let r;
  for (const c of SUB_BANDS[0].can_do_statements) for (const t of ['x', 'y', 'z']) r = applyEvidence(p, ev({ skill: c.skill, fn: c.function, taskId: `${c.id}-${t}`, targetCanDo: c.id }));
  assert.deepEqual(r.levelUp, { from: 'A1.1', to: 'A1.2' });
  assert.equal(p.curriculum.band, 'A1.2');
  assert.equal(p.curriculum.level_ups.length, 1);
  assert.equal(normalizeProfile(p).sub_band, 'A1.2', 'the overall sub-band follows the curriculum band');
  assert.deepEqual(applyEvidence(p, ev({ taskId: 'n1' })).credited.map((c) => c.id), ['A1.2-CD3'], 'evidence now goes to A1.2');
});

test('practice tasks and vault suggestions', () => {
  const t = practiceTask('B1.2', 'scenario', 'B1.2-SC2', 'writing');
  assert.equal(t.targetCanDo, 'B1.2-CD3');
  assert.match(t.prompt, /project/);
  assert.equal(practiceTask('A1.1', 'grammar', 'A1.1-G1', 'speaking').targetCanDo, 'A1.1-CD1');
  const s = suggestedWords('A1.2', ['get up', 'next to']);
  assert.equal(s.length, 3);
  assert.ok(s.every((w) => w.band === 'A1.2' && !['get up', 'next to'].includes(w.word)));
});
