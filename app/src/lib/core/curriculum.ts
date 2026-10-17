// Master English Curriculum (A1.1-C2.2): lookups and the Can-Do progression engine.
//
// Progress lives in profile.json under the `curriculum` key (added alongside the existing keys):
//   curriculum: { band: "A1.1", evidence: { "<can-do id>": { count, tasks[], dates[] } }, level_ups: [{ from, to, date }] }
// A Can-Do is mastered after `rules.mastery_evidence` (3) successful demonstrations: speaking or
// writing tasks of that skill at the active band's level or above, scored 80+, each a different task,
// and confirmed by the Triple-Layer feedback (Gemini lists the Can-Do ids it saw; offline, the task's
// target Can-Do or a skill + function match counts). Mastered Can-Dos are added to
// profile.can_do_mastered with their curriculum id. When every Can-Do of the active band is mastered,
// the learner moves up one sub-band.

import CURRICULUM from '../../data/curriculum.json' with { type: 'json' };
import { BANDS, LEVELS, bandLevel, nextBand } from '../cefr-data.ts';

export type CanDo = { id: string; skill: string; function: string; text: string };
export type GrammarTarget = { id: string; title: string; explanation_tr: string; example: string };
export type LexItem = { word: string; meaning_tr: string; example: string };
export type LexDomain = { id: string; title: string; title_tr: string; items: LexItem[] };
export type L1Alert = { id: string; wrong: string; right: string; note_tr: string };
export type Scenario = { id: string; type: string; title: string; setting: string; task: string; target_can_do: string; target_grammar: string };
export type SubBand = {
  id: string;
  goal: string;
  goal_tr: string;
  grammar_targets: GrammarTarget[];
  lexical_domains: LexDomain[];
  can_do_statements: CanDo[];
  l1_interference_alerts: L1Alert[];
  speaking_scenarios: Scenario[];
};
export type Level = { level: string; name: string; name_tr: string; summary_tr: string; sub_bands: SubBand[] };

export const curriculum = CURRICULUM as unknown as { version: number; title: string; rules: { mastery_evidence: number; pass_score: number; evidence_skills: string[] }; levels: Level[] };
export const RULES = curriculum.rules;
export const SUB_BANDS: SubBand[] = curriculum.levels.flatMap((l) => l.sub_bands);
const BY_ID = new Map(SUB_BANDS.map((b) => [b.id, b]));
const CAN_DO_INDEX = new Map(SUB_BANDS.flatMap((b) => b.can_do_statements.map((c) => [c.id, { ...c, band: b.id }] as const)));

export const getBand = (id: string): SubBand | undefined => BY_ID.get(id);
export const canDoById = (id: string) => CAN_DO_INDEX.get(id);
export const ALL_CAN_DOS = [...CAN_DO_INDEX.values()];
export const levelOf = (bandId: string) => curriculum.levels.find((l) => l.sub_bands.some((b) => b.id === bandId));

/** The higher of two sub-bands (unknown values lose). */
export const maxBand = (a: string, b: string) => (BANDS.indexOf(b) > BANDS.indexOf(a) ? b : a);

export type CurriculumState = { band: string; evidence: Record<string, { count: number; tasks: string[]; dates: string[] }>; level_ups: { from: string; to: string; date: string }[] };

/** Reads (and repairs) profile.curriculum; the active band never trails the overall sub-band. */
export function curriculumState(profile): CurriculumState {
  const c = profile.curriculum && typeof profile.curriculum === 'object' ? profile.curriculum : {};
  const band = BANDS.includes(c.band) ? maxBand(c.band, profile.sub_band) : profile.sub_band;
  profile.curriculum = { band, evidence: c.evidence && typeof c.evidence === 'object' ? c.evidence : {}, level_ups: Array.isArray(c.level_ups) ? c.level_ups : [] };
  return profile.curriculum;
}

export const isMastered = (profile, id: string) => (profile.can_do_mastered ?? []).some((c) => c.id === id);

/** Status of every Can-Do in a band: mastered, in progress (with evidence count) or not started. */
export function bandStatus(profile, bandId: string) {
  const state = profile.curriculum ?? { evidence: {} };
  const band = getBand(bandId);
  return (band?.can_do_statements ?? []).map((c) => {
    const mastered = isMastered(profile, c.id);
    const count = Math.min(RULES.mastery_evidence, state.evidence?.[c.id]?.count ?? 0);
    return { ...c, mastered, count: mastered ? RULES.mastery_evidence : count, status: mastered ? 'mastered' : count > 0 ? 'in_progress' : 'not_started' };
  });
}

export type Evidence = {
  skill: string;
  fn?: string | null;
  level: string;
  score: number;
  taskId: string;
  date: string;
  /** Can-Do ids the Triple-Layer feedback confirmed (Gemini). Undefined when no AI judged the answer. */
  canDoIds?: string[] | null;
  /** The Can-Do a curriculum practice task targets. */
  targetCanDo?: string | null;
};

/**
 * Records one finished activity as Can-Do evidence for the active band.
 * Returns what changed: credited Can-Dos (with counts), newly mastered ones and a level-up, if any.
 */
export function applyEvidence(profile, ev: Evidence) {
  const state = curriculumState(profile);
  const band = getBand(state.band);
  const result = { band: state.band, credited: [] as { id: string; text: string; count: number }[], mastered: [] as CanDo[], levelUp: null as null | { from: string; to: string } };
  if (!band || !RULES.evidence_skills.includes(ev.skill) || ev.score < RULES.pass_score) return result;
  if (LEVELS.indexOf(ev.level) < LEVELS.indexOf(bandLevel(state.band))) return result;

  const open = band.can_do_statements.filter((c) => c.skill === ev.skill && !isMastered(profile, c.id));
  let targets: CanDo[];
  if (Array.isArray(ev.canDoIds)) {
    // Feedback-confirmed only: the AI named what the answer demonstrated.
    targets = open.filter((c) => ev.canDoIds.includes(c.id));
  } else if (ev.targetCanDo) {
    targets = open.filter((c) => c.id === ev.targetCanDo);
  } else {
    const byFn = open.find((c) => c.function === ev.fn);
    targets = byFn ? [byFn] : open.slice(0, 1);
  }

  for (const c of targets) {
    const e = (state.evidence[c.id] ??= { count: 0, tasks: [], dates: [] });
    if (e.tasks.includes(ev.taskId)) continue; // each task counts once per Can-Do
    e.count += 1;
    e.tasks.push(ev.taskId);
    e.dates.push(ev.date);
    result.credited.push({ id: c.id, text: c.text, count: Math.min(e.count, RULES.mastery_evidence) });
    if (e.count >= RULES.mastery_evidence) {
      profile.can_do_mastered.push({ id: c.id, skill: c.skill, level: bandLevel(band.id), band: band.id, function: c.function, statement: c.text, task: ev.taskId, date: ev.date, source: 'curriculum' });
      result.mastered.push(c);
    }
  }

  if (band.can_do_statements.every((c) => isMastered(profile, c.id)) && band.id !== BANDS[BANDS.length - 1]) {
    const to = nextBand(band.id);
    state.band = to;
    state.level_ups.push({ from: band.id, to, date: ev.date });
    result.levelUp = { from: band.id, to };
  }
  return result;
}

/** Curriculum words of the active band and below that are not in the vault yet (for warm-up suggestions). */
export function suggestedWords(bandId: string, vaultWords: string[], limit = 3) {
  const have = new Set(vaultWords.map((w) => w.toLowerCase()));
  const upto = BANDS.indexOf(bandId);
  const out: (LexItem & { band: string; domain: string })[] = [];
  for (const b of SUB_BANDS.filter((x) => BANDS.indexOf(x.id) <= upto).reverse()) {
    for (const d of b.lexical_domains) for (const it of d.items) if (!have.has(it.word.toLowerCase())) out.push({ ...it, band: b.id, domain: d.title_tr });
    if (out.length >= limit * 3) break;
  }
  // Active band first, then earlier bands that were skipped.
  return out.slice(0, limit);
}

/** A writing or speaking task built from a scenario or grammar target, for focused practice. */
export function practiceTask(bandId: string, kind: 'scenario' | 'grammar', id: string, skill: 'writing' | 'speaking') {
  const band = getBand(bandId);
  if (!band) return null;
  const level = bandLevel(bandId);
  const words = { A1: [25, 60], A2: [40, 90], B1: [80, 150], B2: [120, 200], C1: [150, 250], C2: [180, 300] }[level];
  const seconds = { A1: 45, A2: 60, B1: 90, B2: 120, C1: 150, C2: 180 }[level];
  if (kind === 'scenario') {
    const s = band.speaking_scenarios.find((x) => x.id === id);
    if (!s) return null;
    const cd = canDoById(s.target_can_do);
    const g = band.grammar_targets.find((x) => x.id === s.target_grammar);
    return {
      id: `cur-${s.id}-${skill}`,
      title: s.title,
      theme: 'Daily life',
      hook: s.setting,
      fn: cd?.function ?? 'interactional',
      prompt: skill === 'writing' ? `${s.setting} ${s.task} Write it as you would say it (or as a message).` : `${s.setting} ${s.task}`,
      tr: `Hedef: ${g?.title ?? ''}`,
      hints: g ? [g.example] : [],
      minWords: words[0],
      maxWords: words[1],
      targetSec: seconds,
      register: s.type === 'professional' || s.type === 'interview' ? 'formal' : 'neutral',
      targetCanDo: cd?.skill === skill ? s.target_can_do : band.can_do_statements.find((c) => c.skill === skill && c.function === cd?.function)?.id ?? null,
      grammarFocus: g?.title,
    };
  }
  const g = band.grammar_targets.find((x) => x.id === id);
  if (!g) return null;
  const cd = band.can_do_statements.find((c) => c.skill === skill);
  return {
    id: `cur-${g.id}-${skill}`,
    title: g.title,
    theme: 'Daily life',
    hook: g.explanation_tr,
    fn: cd?.function ?? 'interactional',
    prompt: `${skill === 'writing' ? 'Write' : 'Say'} ${words[0] < 50 ? '4-6 sentences' : 'a short text'} about your own life that use "${g.title}" naturally. Example: ${g.example}`,
    tr: g.explanation_tr,
    hints: [g.example],
    minWords: Math.round(words[0] * 0.8),
    maxWords: words[1],
    targetSec: seconds,
    register: 'neutral',
    targetCanDo: cd?.id ?? null,
    grammarFocus: g.title,
  };
}
