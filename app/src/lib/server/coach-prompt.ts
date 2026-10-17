// What Gemini is told about the coach and the learner: the coaching rules (CLAUDE.md), the active
// curriculum band with i+1 language rules, and for the chat the learner state the browser sends.
import fs from 'node:fs';
import path from 'node:path';
import { BANDS, bandLevel } from '../cefr-data.ts';
import { SUB_BANDS, getBand, maxBand } from '../core/curriculum.ts';

const FALLBACK_RULES = 'You are Seyyahname AI Coach, an elite English coach and CEFR assessor for a Turkish-speaking learner.';

let rulesCache: string | null = null;

/**
 * CLAUDE.md, read once per process. Development runs in app/ (the file is one folder up); the
 * standalone server runs in .next/standalone, where the build copies it. COACH_RULES_FILE overrides.
 */
export function coachRules(): string {
  if (rulesCache !== null) return rulesCache;
  const cwd = process.cwd();
  const candidates = [process.env.COACH_RULES_FILE, path.join(/* turbopackIgnore: true */ cwd, 'CLAUDE.md'), path.join(/* turbopackIgnore: true */ cwd, '..', 'CLAUDE.md')].filter(Boolean) as string[];
  for (const file of candidates) {
    try {
      const text = fs.readFileSync(file, 'utf8').trim();
      if (text) return (rulesCache = text);
    } catch {
      /* next candidate */
    }
  }
  return (rulesCache = FALLBACK_RULES);
}

/** How complex Gemini's own English should be at each level (Krashen i+1: the band level, one notch up). */
export const LEVEL_LANGUAGE: Record<string, string> = {
  A1: 'Use very short, simple sentences (5-10 words), present simple and "be", the most common words, no relative clauses, no idioms, no phrasal verbs. Add a short Turkish gloss in brackets for any key word that may be new.',
  A2: 'Use short sentences, past simple and "going to", basic connectors (and, but, because, so). Avoid complex subordinate clauses and idioms. Gloss rare words in Turkish.',
  B1: 'Use clear, everyday English with common connectors (although, however), present perfect and first/second conditionals. Explain idioms if you use any.',
  B2: 'Use natural, varied English: phrasal verbs, some idioms, contrast and concession, modals of speculation. Keep it clear.',
  C1: 'Answer with nuanced, idiomatic, sophisticated English: inversion, cleft sentences, hedging, precise collocations. Do not simplify.',
  C2: 'Answer as an articulate native speaker: stylistic range, irony and understatement where natural, rhetorical devices, precise connotation.',
};

/** The active band, its targets and the next band's structures, from profile.json. */
export function curriculumContext(profile: Record<string, any>): string {
  const stored = BANDS.includes(profile?.curriculum?.band) ? profile.curriculum.band : 'A1.1';
  const active = BANDS.includes(profile?.sub_band) ? maxBand(stored, profile.sub_band) : stored;
  const band = getBand(active) ?? SUB_BANDS[0];
  const next = SUB_BANDS[Math.min(SUB_BANDS.indexOf(band) + 1, SUB_BANDS.length - 1)];
  const level = bandLevel(band.id);
  const mastered = new Set<string>((profile?.can_do_mastered ?? []).map((c) => c?.id));
  const evidence = profile?.curriculum?.evidence ?? {};

  return [
    '## Curriculum context (Seyyahname Master English Curriculum)',
    `Learner: overall CEFR ${profile?.overall_cefr ?? level}, active sub-band ${band.id}, target ${profile?.target_cefr ?? 'C2'}.`,
    `Band goal: ${band.goal}`,
    `Your own English (i+1): ${LEVEL_LANGUAGE[level] ?? LEVEL_LANGUAGE.B1} Now and then use one structure from ${next.id} so the learner meets it in context.`,
    `Grammar targets of ${band.id}: ${band.grammar_targets.map((g) => `${g.title} (e.g. ${g.example})`).join(' | ')}`,
    `Lexical domains of ${band.id}: ${band.lexical_domains.map((d) => `${d.title}: ${d.items.map((i) => i.word).join(', ')}`).join(' | ')}`,
    `Can-Do targets of ${band.id}:`,
    ...band.can_do_statements.map((c) => `- ${c.id} [${c.skill}, ${mastered.has(c.id) ? 'mastered' : `${Math.min(3, Number(evidence[c.id]?.count) || 0)}/3`}]: ${c.text}`),
    `Turkish L1 interference to watch at this band: ${band.l1_interference_alerts.map((a) => `"${a.wrong}" -> "${a.right}"`).join(' | ')}`,
    `Polish rule: every Polish suggestion (feedback or chat) should move the learner toward ${next.id}. Prefer these structures and words: ${next.grammar_targets.map((g) => g.title).join('; ')}; ${next.lexical_domains
      .flatMap((d) => d.items.map((i) => i.word))
      .slice(0, 8)
      .join(', ')}.`,
    `Speaking scenarios available at this band (offer one when the learner wants practice): ${band.speaking_scenarios.map((s) => `${s.title} (${s.type})`).join(' | ')}`,
  ].join('\n');
}

export const feedbackInstruction = (profile: Record<string, any>) => `${coachRules()}\n\n---\n${curriculumContext(profile)}`;

export const chatInstruction = (profile: Record<string, any>, learnerState: string) =>
  `${coachRules()}\n\n---\n${curriculumContext(profile)}\n\n---\n## Current learner state (from the files on the server)\n\`\`\`json\n${learnerState}\n\`\`\`\n` +
  'This is a chat in the Seyyahname web app, whose interface is in Turkish. The app saves tasks, warm-up reviews and scores to the files itself; ' +
  "in this chat, coach and practise. Answer in English at the learner's level; add short Turkish help (explanations, glosses, encouragement) only when it unblocks them.";
