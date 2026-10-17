// Triple-Layer feedback via Gemini (through /api/feedback, with CLAUDE.md as the system instruction),
// following the coach rules. Falls back to the offline heuristic engine when no API key is set
// on the server or a request fails, so the app always works.

import { heuristicFeedback, speakingMetrics } from './heuristics.ts';
import { readErrors, readProfile } from './store.ts';
import { bandStatus, curriculumState, getBand } from './curriculum.ts';
import type { FeedbackRequest } from '../api-contract.ts';

/** Sends a prompt and a JSON schema to the AI endpoint; resolves with the model's JSON text. */
export type AskJson = (req: FeedbackRequest) => Promise<{ text: string; model?: string }>;

const str = { type: 'string' };
const FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strengths', 'recast', 'score', 'estimatedLevel', 'summary', 'grammar', 'vocabulary', 'tone', 'pronunciation'],
  properties: {
    recast: {
      type: 'string',
      description: "The learner's whole text re-said naturally with all polish applied, keeping their ideas and words where possible (corrective recast).",
    },
    strengths: {
      type: 'array',
      description: '1-3 specific things the learner did well, each quoting their own words. The first is the most impressive.',
      items: str,
    },
    score: { type: 'integer', description: '0-100: accuracy and task achievement measured at the task level' },
    estimatedLevel: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    summary: { type: 'string', description: 'One or two encouraging sentences framing the polish points as keys to the next level' },
    grammar: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['before', 'after', 'rule', 'category', 'ipa', 'severity'],
        properties: { severity: { type: 'string', enum: ['local', 'global'], description: 'ACTFL: global = blocks or changes meaning; local = meaning still clear' }, before: str, after: str, rule: str, ipa: { type: 'string', description: 'British IPA of the key corrected word, e.g. "/wɜːks/", or empty string' }, category: { type: 'string', description: 'Short error category, e.g. "Present simple (3rd person -s)", "Prepositions of place", "Articles"' } },
      },
    },
    vocabulary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'upgrade', 'level', 'example', 'stretch', 'ipa'],
        properties: { original: str, upgrade: str, ipa: { type: 'string', description: 'British IPA of the upgrade word, e.g. "/ˈeksələnt/"' }, level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }, example: str, stretch: { type: 'string', description: 'Optional C1/C2 alternative for later, or empty string' } },
      },
    },
    tone: {
      type: 'object',
      additionalProperties: false,
      required: ['register', 'summary', 'notes'],
      properties: { register: { type: 'string', enum: ['informal', 'neutral', 'formal'] }, summary: str, notes: { type: 'array', items: str } },
    },
    pronunciation: {
      type: 'array',
      description: 'Up to 5 words from the learner text that a Turkish speaker may mispronounce based on spelling',
      items: { type: 'object', additionalProperties: false, required: ['word', 'ipa', 'tip'], properties: { word: str, ipa: str, tip: str } },
    },
  },
};

function buildPrompt({ mode, text, level, task, profile, topErrors, canDos = [] }) {
  return [
    `<learner_profile>\n${JSON.stringify({ skill_bands: profile.skill_bands, overall: profile.sub_band, target: profile.target_cefr, interests: profile.interests, weaknesses: profile.metrics?.weaknesses ?? [] })}\n</learner_profile>`,
    topErrors.length ? `<recurring_errors>\n${topErrors.map((e) => `- [${e.category}] "${e.before}" → "${e.after}" (×${e.count})`).join('\n')}\n</recurring_errors>` : '',
    `<task level="${level}" mode="${mode}">\n${task.title ?? ''}\n${task.prompt ?? ''}${task.minWords ? `\nTarget length: ${task.minWords}-${task.maxWords ?? task.minWords * 2} words.` : ''}${task.register ? `\nExpected register: ${task.register}.` : ''}\n</task>`,
    `<learner_${mode === 'speaking' ? 'transcript' : 'text'}>\n${text}\n</learner_${mode === 'speaking' ? 'transcript' : 'text'}>`,
    [
      'Give Triple-Layer feedback on the learner response above, as Seyyahname, following the Strength-First rule.',
      '- strengths: before any correction, name 1-3 concrete things done well or bravely attempted, quoting the learner (e.g. You used "since" instead of "because", which sounds fluent).',
      '- Frame every correction as a "quick polish" that unlocks the next level. Never use the words "wrong", "mistake" or "error" in rule or summary text; keep the tone warm and specific.',
      `- grammar: the most important errors first (at most 5). "before" and "after" must be short exact fragments from the text and their corrected form. Write "rule" as a short explanation the learner can understand at ${level}; a short Turkish gloss in parentheses is welcome for A1–A2.`,
      `- vocabulary: 1-4 upgrades one step above the learner's level (i+1), never far above it. Put the C1/C2 option in "stretch".`,
      '- tone: register plus cohesion notes (discourse markers, sentence variety).',
      ['A1', 'A2'].includes(level)
        ? '- ACTFL tolerance (A1-A2): local slips that keep the meaning clear are tolerated; mark them severity "local", keep them out of the score as far as possible, and model the fix through the recast instead of interrupting. Only meaning-blocking issues are "global".'
        : ['B1'].includes(level)
          ? '- ACTFL tolerance (B1): local slips count lightly; global (meaning-blocking) issues count fully.'
          : '- ACTFL (B2-C2): sociolinguistic appropriacy, idiomaticity and cultural fit are required. Flag register mismatches, unidiomatic collocations and culturally odd phrasing in tone notes and grammar items, and score them.',
      '- ipa: give British IPA between slashes for the key corrected word (grammar) and for each upgrade word (vocabulary).',
      '- pronunciation: up to 5 words from the learner text that a Turkish speaker may mispronounce, with IPA and a one-line tip.',
      mode === 'speaking' ? '- This is a speech-to-text transcript: ignore punctuation and capitalisation, and judge spoken grammar, collocations and fluency.' : '',
      '- If a recurring error appears again, list it first.',
      canDos.length
        ? `- can_do_ids: list the ids of the Can-Do statements below that this response clearly and successfully demonstrates (task achieved, meaning clear). Be strict: if unsure, leave it out. Empty list if none.\n<curriculum_can_dos band="${profile.curriculum?.band ?? profile.sub_band}">\n${canDos.map((c) => `${c.id}: ${c.text}`).join('\n')}\n</curriculum_can_dos>`
        : '',
      task.grammarFocus ? `- This is focused practice on "${task.grammarFocus}": comment on how well it was used.` : '',
    ].join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Gemini's responseSchema is an OpenAPI subset: upper-case types and no additionalProperties. */
export function toGeminiSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'additionalProperties') continue;
    out[k] = k === 'type' && typeof v === 'string' ? v.toUpperCase() : k === 'properties' ? Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toGeminiSchema(pv)])) : toGeminiSchema(v);
  }
  return out;
}

const list = (v: unknown) => (Array.isArray(v) ? v : []);

/** Fills anything the model left out, so the feedback card always gets the full shape. */
export function normalizeFeedback(data: any) {
  const tone = data?.tone && typeof data.tone === 'object' ? data.tone : {};
  return {
    ...data,
    strengths: list(data?.strengths).filter((x) => typeof x === 'string' && x.trim()),
    recast: typeof data?.recast === 'string' ? data.recast : '',
    score: Math.max(0, Math.min(100, Math.round(Number(data?.score) || 0))),
    estimatedLevel: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(data?.estimatedLevel) ? data.estimatedLevel : 'A1',
    summary: typeof data?.summary === 'string' ? data.summary : '',
    grammar: list(data?.grammar).filter((g) => g?.before && g?.after).map((g) => ({ category: 'Grammar', rule: '', ipa: '', severity: 'local', ...g })),
    vocabulary: list(data?.vocabulary).filter((v) => v?.original && v?.upgrade).map((v) => ({ level: 'A2', example: '', stretch: '', ipa: '', ...v })),
    tone: { register: ['informal', 'neutral', 'formal'].includes(tone.register) ? tone.register : 'neutral', summary: tone.summary ?? '', notes: list(tone.notes) },
    pronunciation: list(data?.pronunciation).filter((p) => p?.word),
  };
}

export async function generateFeedback(input, ask: AskJson | null) {
  const { mode, text, durationSec } = input;
  if (!ask) return heuristicFeedback(input);

  try {
    const [profile, errors] = await Promise.all([readProfile(), readErrors()]);
    // Open Can-Dos of the active curriculum band for this skill: the feedback confirms which were demonstrated.
    const band = curriculumState(profile).band;
    const canDos = getBand(band) ? bandStatus(profile, band).filter((c) => c.skill === mode && !c.mastered) : [];
    const schema: any = structuredClone(FEEDBACK_SCHEMA);
    if (canDos.length) {
      schema.properties.can_do_ids = { type: 'array', description: 'Ids of the listed Can-Do statements this response clearly demonstrates', items: { type: 'string', enum: canDos.map((c) => c.id) } };
      schema.required.push('can_do_ids');
    }
    const reply = await ask({ prompt: buildPrompt({ ...input, task: input.task ?? {}, profile, topErrors: errors.active.slice(0, 5), canDos }), schema: toGeminiSchema(schema) });
    const data: any = normalizeFeedback(JSON.parse(reply.text));
    // Only ids we offered count; without the field the activity falls back to the offline rule.
    data.can_do_ids = canDos.length && Array.isArray(data.can_do_ids) ? data.can_do_ids.filter((id) => canDos.some((c) => c.id === id)) : undefined;
    const result: any = { source: 'gemini', model: reply.model, ...data, strength: data.strengths[0] ?? '' };
    if (mode === 'speaking') result.speaking = { ...speakingMetrics(text, durationSec), ipa: data.pronunciation };
    return result;
  } catch (err) {
    const reason = err instanceof SyntaxError ? 'The AI response could not be read' : err.message;
    return { ...heuristicFeedback(input), warning: `${reason}. Showing offline feedback instead.` };
  }
}
