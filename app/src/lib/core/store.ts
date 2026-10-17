// File-backed state for the coach: profile.json, vocabulary.md, error_ledger.md, sessions/.
// All writes go through a single queue and are written atomically (tmp file + rename),
// so the Markdown/JSON files stay valid and remain the single source of truth.
//
// Rules implemented here (see ../CLAUDE.md):
// - Sub-bands (A1.1 -> A1.2 -> A2.1 ...): one Transactional, one Interactional and one Evaluative task
//   at 80%+ in a skill, each a distinct task at that skill's level, moves the skill up one sub-band.
// - Can-Do statements are achieved by passing a task of that skill, level and function at 80%+.
// - SM-2 spaced repetition (1, 3, 7, 14, 30 days, then ease-factor growth); a lapse returns to 1 day.
// - Error ledger: a pattern is resolved only after correct use in 3 sessions (days) in a row.
// - Sessions: a 5-line summary at the top of each day's file, refreshed after every activity.


import { findTable, parseBulletList, renderRow } from './markdown.ts';
import { onActivity, onQuickPlay, onReview } from './motivation.ts';
import { normalizeProfile, overallBand, validateProfile } from './schema.ts';
import { addDays, intervalDays, preview, schedule, toQuality } from './srs.ts';
import { applyEvidence, curriculumState, maxBand } from './curriculum.ts';
import { BANDS, FUNCTIONS, FUNCTION_INFO, LEVELS, SKILLS, bandLevel, nextBand } from '../cefr-data.ts';

export { LEVELS, SKILLS, addDays };

// ---------- storage ----------
// The store works on the coach files by name ('profile.json', 'sessions/2026-10-17.md', ...).
// Where they live is up to the adapter: in the browser, an in-memory copy synced through /api/state;
// in tests, a temporary folder on disk.
export interface StateFS {
  /** File contents, or null when the file does not exist. */
  read(name: string): Promise<string | null>;
  write(name: string, content: string): Promise<void>;
  /** File names (not paths) inside a folder, e.g. list('sessions'). */
  list(dir: string): Promise<string[]>;
}

let FS: StateFS | null = null;
export function useFileSystem(fs: StateFS) {
  FS = fs;
}
const storage = (): StateFS => {
  if (!FS) throw new Error('No storage configured: call useFileSystem() first');
  return FS;
};

export const MASTERY_THRESHOLD = 80;
export const STREAK_TO_RESOLVE = 3;

const file = (name: string) => name;

// ---------- write queue ----------
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function writeAtomic(target: string, content: string) {
  await storage().write(target, content);
}

async function readText(target: string, fallback: string | null = '') {
  const text = await storage().read(target);
  return text ?? fallback;
}

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0');
export function today(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, '').replace(/\s+/g, ' ').trim();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- tables by header name ----------
const headerKey = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Maps table rows to objects using header names (with aliases), so column order and old headers don't matter. */
function tableObjects(table, schema) {
  if (!table) return [];
  const idx = schema.map((f) => table.headers.findIndex((h) => [f.header, ...(f.aliases ?? [])].some((name) => headerKey(name) === headerKey(h))));
  return table.rows.map((cells) => Object.fromEntries(schema.map((f, i) => [f.key, idx[i] === -1 ? '' : (cells[idx[i]] ?? '')])));
}

function renderTable(schema, objs) {
  return [renderRow(schema.map((f) => f.header)), `|${schema.map(() => '---').join('|')}|`, ...objs.map((o) => renderRow(schema.map((f) => o[f.key] ?? '')))].join('\n');
}

// ---------- profile ----------
export async function readProfile() {
  const raw = await storage().read('profile.json');
  if (raw === null) throw Object.assign(new Error('profile.json is missing'), { status: 404 });
  return normalizeProfile(JSON.parse(raw));
}

const serialize = (profile) => JSON.stringify(profile, null, 2) + '\n';

export function writeProfile(input) {
  const errors = validateProfile(input);
  const profile = normalizeProfile(input);
  if (errors.length) return Promise.reject(Object.assign(new Error(errors.join('; ')), { status: 400 }));
  return exclusive(async () => {
    profile.srs_queue = srsQueue(await loadVocabulary());
    await writeAtomic(file('profile.json'), serialize(profile));
    return profile;
  });
}

/**
 * Merges a partial profile into profile.json (top-level keys; `gamification` one level deep),
 * so a client can send only what changed without wiping metrics, diagnostic or history.
 */
export function updateProfile(patch) {
  const errors = validateProfile(patch);
  if (errors.length) return Promise.reject(Object.assign(new Error(errors.join('; ')), { status: 400 }));
  return exclusive(async () => {
    const current = await readProfile();
    const profile = normalizeProfile({ ...current, ...patch, gamification: { ...current.gamification, ...patch.gamification } });
    profile.srs_queue = srsQueue(await loadVocabulary());
    await writeAtomic(file('profile.json'), serialize(profile));
    return profile;
  });
}

/** Keeps skills, overall level and sub-band consistent with the per-skill sub-bands. */
/** The overall sub-band is the higher of the skills' average and the curriculum band (completed Can-Dos). */
function syncLevels(profile) {
  for (const s of SKILLS) profile.skills[s] = bandLevel(profile.skill_bands[s]);
  profile.sub_band = maxBand(overallBand(profile.skill_bands), profile.curriculum?.band ?? '');
  profile.overall_cefr = bandLevel(profile.sub_band);
  curriculumState(profile);
}

const bandProgress = (profile, skill, band) => profile.progress?.[skill]?.[band] ?? { transactional: null, interactional: null, evaluative: null, passed: [] };
const usedAtLevel = (profile, skill, level) =>
  new Set(BANDS.filter((b) => bandLevel(b) === level).flatMap((b) => FUNCTIONS.map((f) => bandProgress(profile, skill, b)[f]).filter(Boolean)));

// ---------- vocabulary (SM-2 spaced repetition) ----------
const VOCAB_HEADING = 'Vocabulary Log';
const VOCAB_SCHEMA = [
  { key: 'date', header: 'Date' },
  { key: 'original', header: 'Original', aliases: ['Word / Phrase', 'Word'] },
  { key: 'upgraded', header: 'Upgraded', aliases: ['C1/C2 Alternative', 'Alternative', 'Target Upgrade'] },
  { key: 'meaning', header: 'Meaning (TR)', aliases: ['Meaning'] },
  { key: 'cefr', header: 'CEFR' },
  { key: 'ease', header: 'Ease Factor', aliases: ['Ease'] },
  { key: 'reps', header: 'Repetitions', aliases: ['Reps'] },
  { key: 'stage', header: 'Interval Stage' },
  { key: 'next', header: 'Next Review' },
  { key: 'example', header: 'Example', aliases: ['Example Sentence'] },
  { key: 'mastered', header: 'Mastered?', aliases: ['Mastered'] },
];

function renderVocabulary(rows) {
  return `# ${VOCAB_HEADING}

Words and phrases under SM-2 spaced repetition. Review intervals: 1, 3, 7, 14 and 30 days, then the interval grows by the ease factor.
- **Original**: the word as learned, or the learner's own word that was upgraded.
- **Upgraded**: a higher-level alternative (C1/C2 where possible).
- **Interval Stage / Next Review**: Good moves one step up the ladder, Easy skips a step, Hard repeats the interval, Again returns to 1 day.
- **Ease Factor / Repetitions**: SM-2 ease (starts at 2.50, never below 1.30) and successful reviews in a row.
- **Mastered?**: Yes after a successful review at the 30-day stage; mastered words still return on long intervals.

${renderTable(VOCAB_SCHEMA, rows)}
`;
}

function withSrsDefaults(r) {
  const stage = `${intervalDays(r.stage)}d`;
  const mastered = /^y/i.test(r.mastered) ? 'Yes' : 'No';
  const base = DATE_RE.test(r.date) ? r.date : today();
  const next = DATE_RE.test(r.next) ? r.next : addDays(base, intervalDays(stage));
  const ease = Number(r.ease) >= 1.3 ? Number(r.ease).toFixed(2) : '2.50';
  const reps = String(Number(r.reps) || 0);
  return { ...r, stage, mastered, next, ease, reps };
}

async function loadVocabulary() {
  const md = await readText(file('vocabulary.md'));
  return tableObjects(findTable(md, VOCAB_HEADING), VOCAB_SCHEMA).map(withSrsDefaults);
}

const isDue = (r, day = today()) => r.next <= day;

/** Derived snapshot for profile.json: the next reviews in date order (vocabulary.md is authoritative). */
function srsQueue(rows, limit = 20) {
  return [...rows]
    .sort((a, b) => a.next.localeCompare(b.next) || a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((r) => ({ word: r.original, next_review: r.next, interval: r.stage, ease: Number(r.ease), due: isDue(r) }));
}

export async function readVocabulary() {
  return (await loadVocabulary()).map((r) => ({ ...r, due: isDue(r) }));
}

export async function dueVocabulary(limit = 6) {
  const rows = (await loadVocabulary()).filter((r) => isDue(r));
  rows.sort((a, b) => a.next.localeCompare(b.next) || a.date.localeCompare(b.date));
  return rows.slice(0, limit).map((r) => ({ ...r, due: true, preview: preview(r, today()) }));
}

/** Accepts both the app's task shape ({word, alternative}) and the file shape ({original, upgraded}). */
function toVocabRow(e) {
  const date = e.date ?? today();
  return {
    date,
    original: String(e.original ?? e.word ?? '').trim(),
    upgraded: String(e.upgraded ?? e.alternative ?? '').trim(),
    stage: '1d',
    mastered: 'No',
    next: addDays(date, 1),
    ease: '2.50',
    reps: '0',
    cefr: e.cefr ?? '',
    meaning: e.meaning ?? '',
    example: e.example ?? '',
  };
}

async function appendVocabularyUnlocked(entries) {
  const rows = await loadVocabulary();
  const seen = new Set(rows.map((r) => r.original.toLowerCase()));
  const added = [];
  for (const e of entries) {
    const row = toVocabRow(e);
    if (!row.original || seen.has(row.original.toLowerCase())) continue;
    seen.add(row.original.toLowerCase());
    rows.push(row);
    added.push(row);
  }
  if (added.length) await writeAtomic(file('vocabulary.md'), renderVocabulary(rows));
  return { added, rows };
}

export const appendVocabulary = (entries) =>
  exclusive(async () => {
    const { added, rows } = await appendVocabularyUnlocked(entries);
    if (added.length) {
      const profile = await readProfile();
      profile.srs_queue = srsQueue(rows);
      await writeAtomic(file('profile.json'), serialize(profile));
    }
    return added;
  });

const GRADE_ALIASES = { got: 'good' };
const gradeName = (q: number) => (q < 3 ? 'again' : q === 3 ? 'hard' : q === 4 ? 'good' : 'easy');

/** Grades one review: an SM-2 quality 0-5, or again | hard | good | easy (= 1 | 3 | 4 | 5). */
export const reviewVocabulary = (original, gradeIn) =>
  exclusive(async () => {
    const quality = toQuality(GRADE_ALIASES[gradeIn] ?? gradeIn);
    const grade = gradeName(quality);
    const rows = await loadVocabulary();
    const row = rows.find((r) => r.original.toLowerCase() === String(original ?? '').toLowerCase());
    if (!row) throw Object.assign(new Error(`"${original}" is not in vocabulary.md`), { status: 404 });
    const from = row.stage;
    Object.assign(row, schedule(row, quality, today()));
    await writeAtomic(file('vocabulary.md'), renderVocabulary(rows));

    const profile = await readProfile();
    const motivation = onReview(profile, { date: today(), yesterday: addDays(today(), -1), grade, word: row.original, stage: row.stage });
    profile.history.push({ date: today(), time: clock(), event: 'review', word: row.original, grade, quality, interval: `${from}→${row.stage}`, ease: Number(row.ease), points: motivation.points, wins: motivation.wins.map((w) => w.label) });
    profile.stats.reviews_completed = (profile.stats.reviews_completed ?? 0) + 1;
    profile.srs_queue = srsQueue(rows);
    await writeAtomic(file('profile.json'), serialize(profile));

    const line = `- ${clock()} SRS review: **${row.original}** graded ${grade} (q=${quality}, ${from} → ${row.stage}, ease ${row.ease})`;
    const sessionFile = await writeSessionUnlocked(line, profile);
    return { entry: { ...row, due: isDue(row) }, profile, motivation, files: ['vocabulary.md', 'profile.json', sessionFile] };
  });

// ---------- error ledger ----------
const ACTIVE_HEADING = 'Active Errors';
const RESOLVED_HEADING = 'Resolved';
const ACTIVE_SCHEMA = [
  { key: 'id', header: '#' },
  { key: 'category', header: 'Category' },
  { key: 'before', header: 'Error (before)', aliases: ['Error'] },
  { key: 'after', header: 'Correct (after)', aliases: ['Correct'] },
  { key: 'rule', header: 'Rule / Note', aliases: ['Rule'] },
  { key: 'count', header: 'Count' },
  { key: 'firstSeen', header: 'First Seen' },
  { key: 'lastSeen', header: 'Last Seen' },
  { key: 'streak', header: 'Correct Streak' },
  { key: 'lastCorrect', header: 'Last Correct' },
];
const RESOLVED_SCHEMA = [
  { key: 'id', header: '#' },
  { key: 'category', header: 'Category' },
  { key: 'before', header: 'Error', aliases: ['Error (before)'] },
  { key: 'after', header: 'Correct', aliases: ['Correct (after)'] },
  { key: 'resolvedOn', header: 'Resolved On' },
];

function renderLedger({ active, resolved, watchlist }) {
  return `# Error Ledger

Persistent grammar and spelling patterns.
- When a pattern comes back, its **Count** goes up and its **Correct Streak** resets to 0.
- Using the correct form in a later session (without the old pattern) adds 1 to the streak, at most once per day. The day the pattern happened does not count.
- A pattern moves to **Resolved** only after it is used correctly in ${STREAK_TO_RESOLVE} sessions in a row.

## ${ACTIVE_HEADING}

${renderTable(ACTIVE_SCHEMA, active)}

## ${RESOLVED_HEADING}

${renderTable(RESOLVED_SCHEMA, resolved)}

## Watchlist (from previous profile, not yet observed)
${watchlist.map((w) => `- ${w}`).join('\n')}
`;
}

export async function readErrors() {
  const md = await readText(file('error_ledger.md'));
  const active = tableObjects(findTable(md, ACTIVE_HEADING), ACTIVE_SCHEMA).map((r) => ({ ...r, count: Number(r.count) || 0, streak: Number(r.streak) || 0 }));
  const resolved = tableObjects(findTable(md, RESOLVED_HEADING), RESOLVED_SCHEMA);
  const watchlist = parseBulletList(md, 'Watchlist');
  return { active, resolved, watchlist };
}

const sortActive = (active) => active.sort((a, b) => b.count - a.count || Number(a.id) - Number(b.id));

async function logErrorsUnlocked(entries) {
  const ledger = await readErrors();
  const { active, resolved } = ledger;
  let nextId = Math.max(0, ...[...active, ...resolved].map((r) => Number(r.id) || 0)) + 1;
  const date = today();
  const logged = [];
  for (const e of entries) {
    if (!e.before || !e.after) continue;
    const existing = active.find((r) => norm(r.before) === norm(e.before) || (r.category === e.category && norm(r.after) === norm(e.after)));
    if (existing) {
      existing.count += 1;
      existing.lastSeen = date;
      existing.streak = 0;
      existing.lastCorrect = '';
      logged.push({ ...existing, repeated: true });
    } else {
      const row = { id: String(nextId++), category: e.category || 'Grammar', before: e.before, after: e.after, rule: e.rule ?? '', count: 1, firstSeen: date, lastSeen: date, streak: 0, lastCorrect: '' };
      active.push(row);
      logged.push({ ...row, repeated: false });
    }
  }
  if (logged.length) await writeAtomic(file('error_ledger.md'), renderLedger({ ...ledger, active: sortActive(active) }));
  return logged;
}

export const logErrors = (entries) => exclusive(() => logErrorsUnlocked(entries));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whether `text` contains `phrase` as whole words. Capitalisation patterns are matched case-sensitively. */
function containsPhrase(text, phrase, caseSensitive) {
  const p = String(phrase ?? '').trim().replace(/[.!?]+$/, '');
  if (!p) return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(p)}(?![\\p{L}\\p{N}])`, caseSensitive ? 'u' : 'iu').test(text);
}

/**
 * Credits correct use of logged patterns in a learner response: +1 streak per day when the correct form
 * appears and the old pattern does not. Patterns reaching the streak target move to Resolved.
 */
async function creditCorrectUseUnlocked(response, skipIds) {
  if (!response?.trim()) return { credited: [], resolvedNow: [] };
  const ledger = await readErrors();
  const date = today();
  const credited = [];
  const resolvedNow = [];
  for (const e of ledger.active) {
    // The session where the pattern happened never counts; later sessions count once each.
    if (skipIds.has(e.id) || e.lastCorrect === date || e.lastSeen === date) continue;
    const cs = e.category === 'Capitalisation';
    if (containsPhrase(response, e.after, cs) && !containsPhrase(response, e.before, cs)) {
      e.streak += 1;
      e.lastCorrect = date;
      credited.push({ ...e });
      if (e.streak >= STREAK_TO_RESOLVE) resolvedNow.push(e);
    }
  }
  if (!credited.length) return { credited, resolvedNow };
  const active = ledger.active.filter((e) => !resolvedNow.includes(e));
  const resolved = [...ledger.resolved, ...resolvedNow.map((e) => ({ id: e.id, category: e.category, before: e.before, after: e.after, resolvedOn: date }))];
  await writeAtomic(file('error_ledger.md'), renderLedger({ ...ledger, active: sortActive(active), resolved }));
  return { credited, resolvedNow };
}

// ---------- sessions ----------
export async function listSessions() {
  const names = await storage().list('sessions');
  return names.filter((n) => n.endsWith('.md') && DATE_RE.test(n.replace(/\.md$/, ''))).map((n) => n.replace(/\.md$/, '')).sort().reverse();
}

export async function readSession(date) {
  if (!DATE_RE.test(date)) throw Object.assign(new Error('Invalid date'), { status: 400 });
  const md = await readText(`sessions/${date}.md`, null);
  if (md === null) throw Object.assign(new Error('Session not found'), { status: 404 });
  return md;
}

const missingFunctions = (profile, skill) => {
  const prog = bandProgress(profile, skill, profile.skill_bands[skill]);
  return FUNCTIONS.filter((f) => !prog[f]);
};

/** The next concrete goal: the most frequent pattern plus the skill closest to its next sub-band. */
export function nextMilestone(profile, active) {
  const candidates = SKILLS.filter((s) => profile.skill_bands[s] !== BANDS[BANDS.length - 1]).map((s) => ({ s, missing: missingFunctions(profile, s) }));
  candidates.sort((a, b) => a.missing.length - b.missing.length);
  const parts = [];
  const top = active[0];
  if (top) parts.push(`polish "${top.category}" (${top.before} → ${top.after})`);
  const c = candidates[0];
  if (c) parts.push(`${cap(c.s)} needs ${c.missing.map((f) => `one ${FUNCTION_INFO[f].label}`).join(', ')} ${profile.skills[c.s]} task at 80%+ to reach ${nextBand(profile.skill_bands[c.s])}`);
  return parts.length ? cap(parts.join('; ')) + '.' : 'Keep practising.';
}

/** Exactly five lines, regenerated from the day's data. */
function renderSummary(profile, active, addedToday) {
  const date = today();
  const events = profile.history.filter((h) => h.date === date);
  const acts = events.filter((h) => h.event === 'activity');
  const reviews = events.filter((h) => h.event === 'review');
  const skillsDone = [...new Set(acts.map((a) => a.skill))];
  const points = events.reduce((n, h) => n + (h.points ?? 0), 0);
  const g = profile.gamification;

  const scores = SKILLS.filter((s) => acts.some((a) => a.skill === s)).map((s) => {
    const list = acts.filter((a) => a.skill === s);
    return `${cap(s)} ${Math.round(list.reduce((n, a) => n + a.score, 0) / list.length)}`;
  });
  const ups = acts.filter((a) => a.band_change).map((a) => `${cap(a.skill)} ${a.band_change}`);
  const canDos = profile.can_do_mastered.filter((c) => c.date === date).length;
  const bands = SKILLS.map((s) => `${cap(s)} ${profile.skill_bands[s]} (${FUNCTIONS.length - missingFunctions(profile, s).length}/3)`);
  const errorsToday = active.filter((e) => e.lastSeen === date);
  const topToday = [...errorsToday].sort((a, b) => b.count - a.count)[0];
  const recalled = reviews.filter((r) => r.grade && r.grade !== 'again').length;

  return [
    `- **Practice:** ${acts.length} ${acts.length === 1 ? 'activity' : 'activities'}${skillsDone.length ? ` (${skillsDone.map(cap).join(', ')})` : ''}; ${reviews.length} SRS review${reviews.length === 1 ? '' : 's'} (${recalled} recalled); ${addedToday} new word${addedToday === 1 ? '' : 's'}; +${points} XP; day ${g.streak_days} streak.`,
    `- **Scores:** ${scores.length ? scores.join(', ') : 'no scored tasks yet'}; confidence index ${g.confidence_index}.`,
    `- **CEFR:** overall ${profile.sub_band}; ${bands.join(', ')}${ups.length ? `. Sub-band up: ${ups.join(', ')}` : ''}${canDos ? `. Can-Do achieved: ${canDos}` : ''}.`,
    `- **Polish:** ${errorsToday.length ? `${errorsToday.length} pattern${errorsToday.length === 1 ? '' : 's'} logged or repeated today; most frequent: ${topToday.category} (×${topToday.count})` : 'no persistent patterns today'}.`,
    `- **Next:** ${nextMilestone(profile, active)}`,
  ].join('\n');
}

/** Puts the summary section first (after the title) and appends `entryMd` to the Activity Log. */
async function writeSessionUnlocked(entryMd, profile) {
  const target = `sessions/${today()}.md`;
  let md = await readText(target, `# Session ${today()}\n`);
  const [{ active }, vocab] = await Promise.all([readErrors(), loadVocabulary()]);
  const summary = `## Session Summary\n\n${renderSummary(profile, active, vocab.filter((v) => v.date === today()).length)}\n`;

  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^## Session Summary\s*$/.test(l));
  if (start !== -1) {
    let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    if (end === -1) end = lines.length;
    lines.splice(start, end - start, ...summary.split('\n'));
    md = lines.join('\n');
  } else {
    const firstH2 = lines.findIndex((l) => /^## /.test(l));
    if (firstH2 === -1) md = md.trimEnd() + '\n\n' + summary;
    else md = [...lines.slice(0, firstH2), ...summary.split('\n'), ...lines.slice(firstH2)].join('\n');
  }

  if (!/^## Activity Log\s*$/m.test(md)) md = md.trimEnd() + '\n\n## Activity Log\n';
  md = md.trimEnd() + '\n\n' + entryMd.trim() + '\n';
  await writeAtomic(target, md.replace(/\n{3,}/g, '\n\n'));
  return target;
}

// ---------- activity completion ----------
function sessionEntry(a, outcome, loggedErrors, addedWords, credit, canDo, cur = null) {
  const lines = [`### ${clock()} ${cap(a.skill)} (${a.level}${a.fn ? `, ${FUNCTION_INFO[a.fn].label}` : ''}), ${a.score}%`, `- **Task:** ${a.taskTitle}`];
  if (a.summary) lines.push(`- **Summary:** ${a.summary}`);
  if (a.response) lines.push(`- **Response:** ${String(a.response).replace(/\s+/g, ' ').slice(0, 600)}`);
  if (a.details?.length) lines.push(...a.details.map((d) => `- ${d}`));
  if (loggedErrors.length) lines.push(`- **Patterns logged:** ${loggedErrors.map((e) => `"${e.before}" → "${e.after}"${e.repeated ? ` (×${e.count})` : ''}`).join('; ')}`);
  if (a.wins?.length) lines.push(`- **Wins:** ${a.wins.join('; ')}`);
  if (credit.credited.length) lines.push(`- **Correct use:** ${credit.credited.map((e) => `"${e.after}" (streak ${e.streak}/${STREAK_TO_RESOLVE})`).join('; ')}`);
  if (credit.resolvedNow.length) lines.push(`- **Resolved:** ${credit.resolvedNow.map((e) => `"${e.before}" → "${e.after}"`).join('; ')}`);
  if (addedWords.length) lines.push(`- **New words:** ${addedWords.map((w) => w.original).join(', ')}`);
  if (cur?.credited.length) lines.push(`- **Curriculum (${cur.band}):** ${cur.credited.map((c) => `${c.id} ${c.count}/3`).join(', ')}`);
  if (canDo) lines.push(`- **Can-Do achieved:** ${canDo}`);
  lines.push(`- **CEFR:** ${outcome}`);
  return lines.join('\n');
}

/**
 * Applies a finished activity to every state file:
 * profile.json (bands, can-dos, progress, gamification, stats, diagnostic, history, srs_queue),
 * vocabulary.md, error_ledger.md, sessions/<today>.md.
 */
export const completeActivity = (a) =>
  exclusive(async () => {
    if (!SKILLS.includes(a.skill)) throw Object.assign(new Error('Unknown skill'), { status: 400 });
    if (!LEVELS.includes(a.level)) throw Object.assign(new Error('Unknown level'), { status: 400 });
    if (a.fn && !FUNCTIONS.includes(a.fn)) throw Object.assign(new Error('Unknown function'), { status: 400 });
    const score = Math.max(0, Math.min(100, Math.round(Number(a.score) || 0)));
    const taskId = String(a.taskId ?? a.taskTitle ?? 'task');
    a = { ...a, score };

    const loggedErrors = a.errors?.length ? await logErrorsUnlocked(a.errors) : [];
    const credit = await creditCorrectUseUnlocked(a.response, new Set(loggedErrors.map((e) => e.id)));
    const { added: addedWords, rows: vocabRows } = a.vocabulary?.length ? await appendVocabularyUnlocked(a.vocabulary) : { added: [], rows: await loadVocabulary() };

    const profile = await readProfile();
    const band = profile.skill_bands[a.skill];
    const current = bandLevel(band);
    const passed = score >= MASTERY_THRESHOLD;


    // Sub-band progress: one distinct passed task per function at the skill's current level.
    profile.progress[a.skill] ??= {};
    const prog = (profile.progress[a.skill][band] ??= { transactional: null, interactional: null, evaluative: null, passed: [] });
    if (passed && !prog.passed.includes(taskId) && a.level === current) prog.passed.push(taskId);
    let slotFilled = false;
    if (passed && a.fn && a.level === current && !prog[a.fn] && !usedAtLevel(profile, a.skill, current).has(taskId)) {
      prog[a.fn] = taskId;
      slotFilled = true;
    }

    let bandChange = null;
    let levelChange = null;
    let outcome;
    const filled = FUNCTIONS.filter((f) => prog[f]);
    if (filled.length === FUNCTIONS.length && band !== BANDS[BANDS.length - 1]) {
      const to = nextBand(band);
      bandChange = { skill: a.skill, from: band, to };
      if (bandLevel(to) !== current) levelChange = { skill: a.skill, from: current, to: bandLevel(to) };
      profile.skill_bands[a.skill] = to;
      outcome = `${cap(a.skill)} ${band} → ${to} (Transactional, Interactional and Evaluative tasks at ${MASTERY_THRESHOLD}%+)`;
    } else if (!passed) {
      outcome = `building toward ${MASTERY_THRESHOLD}%: one more round with the polish points above, then this task counts`;
    } else if (a.level !== current) {
      outcome = LEVELS.indexOf(a.level) > LEVELS.indexOf(current) ? `${MASTERY_THRESHOLD}%+ above your level, noted; sub-band steps use ${current} tasks` : `review task below your level (${current})`;
    } else if (slotFilled) {
      outcome = `${FUNCTION_INFO[a.fn].label} task cleared at ${band} (${filled.length}/3)`;
    } else {
      const missing = FUNCTIONS.filter((f) => !prog[f]).map((f) => FUNCTION_INFO[f].label);
      outcome = `well done; for ${nextBand(band)} you still need ${missing.join(' and ')} ${current} task${missing.length === 1 ? '' : 's'} (a different task each)`;
    }
    syncLevels(profile);

    // Curriculum Can-Dos: speaking/writing evidence confirmed by the Triple-Layer feedback (3 = mastered).
    const cur = applyEvidence(profile, { skill: a.skill, fn: a.fn, level: a.level, score, taskId, date: today(), canDoIds: Array.isArray(a.canDoIds) ? a.canDoIds : undefined, targetCanDo: a.targetCanDo });
    const canDo = cur.mastered[0]?.text ?? null;
    if (cur.levelUp) outcome += `; curriculum ${cur.levelUp.from} → ${cur.levelUp.to} (all Can-Dos mastered)`;
    syncLevels(profile);

    // stats
    const stats = profile.stats;
    stats.per_skill ??= {};
    stats.activities_completed = (stats.activities_completed ?? 0) + 1;
    stats.last_activity = new Date().toISOString();
    const ps = (stats.per_skill[a.skill] ??= { attempts: 0, average_score: 0, last_score: null });
    ps.average_score = Math.round((ps.average_score * ps.attempts + score) / (ps.attempts + 1));
    ps.attempts += 1;
    ps.last_score = score;

    // metrics
    profile.metrics.vocabulary_size_estimate = (profile.metrics.vocabulary_size_estimate ?? 0) + addedWords.length;
    const { active } = await readErrors();
    const byCat: Record<string, number> = {};
    for (const e of active) byCat[e.category] = (byCat[e.category] ?? 0) + e.count;
    profile.metrics.weaknesses = Object.entries(byCat).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([c]) => c);
    profile.metrics.strengths = SKILLS.filter((s) => (stats.per_skill[s]?.average_score ?? 0) >= 90).map((s) => `${s} (${profile.skill_bands[s]})`);
    profile.metrics.next_milestone = nextMilestone(profile, active);

    // diagnostic: the first finished task per skill records the baseline
    const diag = profile.diagnostic;
    if (diag && diag.status !== 'completed') {
      diag.status = 'in_progress';
      const prev = diag.stages?.[a.skill];
      if (typeof prev !== 'object' || prev === null || prev.status !== 'completed') diag.stages[a.skill] = { status: 'completed', task_level: a.level, score, date: today() };
      if (SKILLS.every((s) => diag.stages[s]?.status === 'completed')) {
        diag.status = 'completed';
        diag.completed_at = today();
        diag.result = { ...profile.skill_bands, overall: profile.sub_band };
      }
    }

    // history
    const entry: Record<string, any> = {
      date: today(),
      time: clock(),
      event: 'activity',
      skill: a.skill,
      level: a.level,
      function: a.fn ?? null,
      score,
      task: a.taskTitle,
      task_id: taskId,
      ...(a.response ? { words: String(a.response).trim().split(/\s+/).length } : {}),
      ...(bandChange ? { band_change: `${bandChange.from}→${bandChange.to}` } : {}),
    };
    profile.history.push(entry);

    const motivation = onActivity(profile, {
      date: today(),
      yesterday: addDays(today(), -1),
      skill: a.skill,
      level: a.level,
      current,
      band,
      score,
      title: a.taskTitle,
      slotFilled,
      fnLabel: a.fn ? FUNCTION_INFO[a.fn].label : '',
      canDo,
      curriculumLevelUp: cur.levelUp,
      bandChange,
      levelChange,
      addedWords: addedWords.length,
      credited: credit.credited,
      resolved: credit.resolvedNow,
      response: a.response,
      minWords: a.minWords,
      vocabSize: vocabRows.length,
    });
    entry.points = motivation.points;
    entry.wins = motivation.wins.map((w) => w.label);
    profile.srs_queue = srsQueue(vocabRows);

    await writeAtomic(file('profile.json'), serialize(profile));
    const sessionFile = await writeSessionUnlocked(sessionEntry({ ...a, wins: entry.wins }, outcome, loggedErrors, addedWords, credit, canDo, cur), profile);

    const nowBand = profile.skill_bands[a.skill];
    const nowProg = bandProgress(profile, a.skill, nowBand);
    return {
      profile,
      motivation,
      bandChange,
      levelChange,
      outcome,
      canDo,
      curriculum: cur,
      functions: { band: nowBand, done: FUNCTIONS.filter((f) => nowProg[f]) },
      loggedErrors,
      credited: credit.credited,
      resolvedErrors: credit.resolvedNow,
      addedWords,
      files: ['profile.json', sessionFile, ...(addedWords.length ? ['vocabulary.md'] : []), ...(loggedErrors.length || credit.credited.length ? ['error_ledger.md'] : [])],
    };
  });

/** Low-Effort Mode quick play: light, tap-only questions. Rewards effort, never affects levels. */
export const completeQuickPlay = ({ correct, total, theme }) =>
  exclusive(async () => {
    const c = Math.max(0, Math.round(Number(correct) || 0));
    const t = Math.max(1, Math.round(Number(total) || 1));
    const profile = await readProfile();
    const motivation = onQuickPlay(profile, { date: today(), yesterday: addDays(today(), -1), correct: c, total: t });
    profile.history.push({ date: today(), time: clock(), event: 'quickplay', theme: theme ?? null, correct: c, total: t, points: motivation.points, wins: motivation.wins.map((w) => w.label) });
    await writeAtomic(file('profile.json'), serialize(profile));
    const sessionFile = await writeSessionUnlocked(`- ${clock()} Quick play${theme ? ` (${theme})` : ''}: ${c}/${t}, +${motivation.points} XP`, profile);
    return { profile, motivation, files: ['profile.json', sessionFile] };
  });

export const setMode = (mode) =>
  exclusive(async () => {
    if (!['normal', 'low'].includes(mode)) throw Object.assign(new Error('mode must be "normal" or "low"'), { status: 400 });
    const profile = await readProfile();
    profile.gamification.mode = mode;
    profile.gamification.mode_reason = mode === 'low' ? 'chosen by you' : null;
    if (mode === 'normal') profile.gamification.struggle_streak = 0;
    await writeAtomic(file('profile.json'), serialize(profile));
    return { profile };
  });

/** "Daily Loot": everything won on a given day. */
export async function dailyLoot(date = today()) {
  if (!DATE_RE.test(date)) throw Object.assign(new Error('Invalid date'), { status: 400 });
  const [profile, vocab, ledger] = await Promise.all([readProfile(), loadVocabulary(), readErrors()]);
  const events = profile.history.filter((h) => h.date === date);
  const g = profile.gamification;
  return {
    date,
    points: events.reduce((n, h) => n + (h.points ?? 0), 0),
    activities: events.filter((h) => h.event === 'activity').length,
    reviews: events.filter((h) => h.event === 'review').length,
    wins: events.flatMap((h) => h.wins ?? []),
    words: vocab.filter((v) => v.date === date).map((v) => ({ original: v.original, upgraded: v.upgraded, meaning: v.meaning })),
    resolved: ledger.resolved.filter((e) => e.resolvedOn === date),
    milestones: g.unlocked_milestones.filter((x) => x.date === date),
    canDos: profile.can_do_mastered.filter((c) => c.date === date),
    bandUps: events.filter((h) => h.band_change).map((h) => ({ skill: h.skill, change: h.band_change })),
    streak: g.streak_days,
    confidence: g.confidence_index,
    subBand: profile.sub_band,
  };
}

/** Rewrites vocabulary.md, error_ledger.md and profile.json in the current schema, keeping all data. */
export const migrateFiles = (): Promise<string[]> =>
  exclusive(async () => {
    const changed: string[] = [];
    const vocabMd = await readText(file('vocabulary.md'), null);
    const rows = await loadVocabulary();
    if (vocabMd !== null) {
      const next = renderVocabulary(rows);
      if (next !== vocabMd) {
        await writeAtomic(file('vocabulary.md'), next);
        changed.push('vocabulary.md');
      }
    }
    const ledgerMd = await readText(file('error_ledger.md'), null);
    if (ledgerMd !== null) {
      const next = renderLedger(await readErrors());
      if (next !== ledgerMd) {
        await writeAtomic(file('error_ledger.md'), next);
        changed.push('error_ledger.md');
      }
    }
    const profileText = await readText(file('profile.json'), null);
    if (profileText !== null) {
      const profile = await readProfile();
      profile.srs_queue = srsQueue(rows);
      const next = serialize(profile);
      if (next !== profileText) {
        await writeAtomic(file('profile.json'), next);
        changed.push('profile.json');
      }
    }
    return changed;
  });

