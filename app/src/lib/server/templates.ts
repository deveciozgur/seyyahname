// Starting files for an empty data folder (self-healing bootstrap). Same layout as the coach files in
// the repository root; the store reads and upgrades them like any other version.
import { normalizeProfile } from '../core/schema.ts';

export const TEMPLATES: Record<'profile.json' | 'vocabulary.md' | 'error_ledger.md', () => string> = {
  'profile.json': () => `${JSON.stringify(normalizeProfile({ history: [] }), null, 2)}\n`,
  'vocabulary.md': () => `# Vocabulary Log

Words and phrases under SM-2 spaced repetition. Review intervals: 1, 3, 7, 14 and 30 days, then the interval grows by the ease factor.
- **Original**: the word as learned, or the learner's own word that was upgraded.
- **Upgraded**: a higher-level alternative (C1/C2 where possible).
- **Interval Stage / Next Review**: Good moves one step up the ladder, Easy skips a step, Hard repeats the interval, Again returns to 1 day.
- **Ease Factor / Repetitions**: SM-2 ease (starts at 2.50, never below 1.30) and successful reviews in a row.
- **Mastered?**: Yes after a successful review at the 30-day stage; mastered words still return on long intervals.

| Date | Original | Upgraded | Meaning (TR) | CEFR | Ease Factor | Repetitions | Interval Stage | Next Review | Example | Mastered? |
|---|---|---|---|---|---|---|---|---|---|---|
`,
  'error_ledger.md': () => `# Error Ledger

Persistent grammar and spelling patterns.
- When a pattern comes back, its **Count** goes up and its **Correct Streak** resets to 0.
- Using the correct form in a later session (without the old pattern) adds 1 to the streak, at most once per day. The day the pattern happened does not count.
- A pattern moves to **Resolved** only after it is used correctly in 3 sessions in a row.

## Active Errors

| # | Category | Error (before) | Correct (after) | Rule / Note | Count | First Seen | Last Seen | Correct Streak | Last Correct |
|---|---|---|---|---|---|---|---|---|---|

## Resolved

| # | Category | Error | Correct | Resolved On |
|---|---|---|---|---|
`,
};
