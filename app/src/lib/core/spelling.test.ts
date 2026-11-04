import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCapitalization, usSpelling } from './spelling.ts';

test('the capitalization category also matches the British label older ledgers carry', () => {
  assert.ok(isCapitalization('Capitalization'));
  assert.ok(isCapitalization('Capitalisation'));
  assert.ok(!isCapitalization('Punctuation'));
});

test('maps common British spellings to US', () => {
  const cases = {
    'my favourite colour': 'my favorite color',
    'the neighbourhood centre': 'the neighborhood center',
    'we realised it was cancelled': 'we realized it was canceled',
    'she practises every day while travelling': 'she practices every day while traveling',
    'analyse the defence': 'analyze the defense',
    'centred and organised': 'centered and organized',
  };
  for (const [uk, us] of Object.entries(cases)) assert.equal(usSpelling(uk), us);
});

test('leaves US spellings and look-alike words unchanged', () => {
  for (const s of ['four hours of your tour', 'our flour', 'a detour', 'practice', 'color', 'theater tickets', 'more', 'genre', 'acre', 'massacre', 'mediocre'])
    assert.equal(usSpelling(s), s);
});
