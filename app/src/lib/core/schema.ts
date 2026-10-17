// profile.json schema (CLAUDE.md, section 7). normalizeProfile() upgrades any earlier layout
// (user.*, motivation.*) to the current one and is idempotent.


import { BANDS, LEVELS, SKILLS, bandLevel, firstBand } from '../cefr-data.ts';

export function overallBand(skillBands) {
  const idx = SKILLS.map((s) => BANDS.indexOf(skillBands[s]));
  return BANDS[Math.floor(idx.reduce((a, b) => a + b, 0) / idx.length)];
}

export function normalizeProfile(raw) {
  const p = { ...raw };
  const u = p.user ?? {};
  const old = p.motivation ?? {};

  const skills = {};
  const skill_bands = {};
  for (const s of SKILLS) {
    const lvl = LEVELS.includes(p.skills?.[s]) ? p.skills[s] : LEVELS.includes(u.skills?.[s]) ? u.skills[s] : 'A1';
    const band = p.skill_bands?.[s];
    skill_bands[s] = BANDS.includes(band) && bandLevel(band) === lvl ? band : firstBand(lvl);
    skills[s] = bandLevel(skill_bands[s]);
  }
  // The curriculum band (all Can-Dos of the previous band mastered) can lift the overall sub-band.
  const curBand = BANDS.includes(p.curriculum?.band) ? p.curriculum.band : null;
  const skillsBand = overallBand(skill_bands);
  const sub_band = curBand && BANDS.indexOf(curBand) > BANDS.indexOf(skillsBand) ? curBand : skillsBand;

  const hadPractice = (p.history ?? []).some((h) => h.event === 'activity' || h.event === 'review');
  const g = { ...(p.gamification ?? {}) };
  g.streak_days ??= old.daily_streak ?? 0;
  g.xp_total ??= old.total_points ?? 0;
  g.confidence_index ??= hadPractice && typeof old.confidence_score === 'number' ? old.confidence_score : 80;
  g.longest_streak ??= old.longest_streak ?? 0;
  g.last_active_date ??= old.last_active_date ?? null;
  g.unlocked_milestones ??= old.unlocked_milestones ?? [];
  g.struggle_streak ??= old.struggle_streak ?? 0;
  g.mode ??= old.mode ?? 'normal';
  g.mode_reason ??= old.mode_reason ?? null;

  // progress[skill][band] = { transactional, interactional, evaluative, passed[] }.
  // Earlier layouts keyed progress by level; their task ids are kept as passed history.
  const progress = {};
  for (const [skill, byKey] of Object.entries(p.progress ?? {})) {
    progress[skill] = {};
    for (const [key, val] of Object.entries(byKey ?? {})) {
      if (BANDS.includes(key)) progress[skill][key] = { transactional: null, interactional: null, evaluative: null, passed: [], ...val };
      else if (LEVELS.includes(key)) progress[skill][firstBand(key)] = { transactional: null, interactional: null, evaluative: null, passed: [...(val?.passed ?? [])] };
    }
  }

  const out = {
    overall_cefr: bandLevel(sub_band),
    sub_band,
    target_cefr: LEVELS.includes(p.target_cefr) ? p.target_cefr : LEVELS.includes(u.target_level) ? u.target_level : 'C2',
    skills,
    skill_bands,
    can_do_mastered: Array.isArray(p.can_do_mastered) ? p.can_do_mastered : [],
    gamification: g,
    srs_queue: Array.isArray(p.srs_queue) ? p.srs_queue : [],
    interests: p.interests ?? u.interests ?? [],
    progress,
    stats: p.stats ?? { activities_completed: 0, per_skill: {} },
    metrics: p.metrics ?? {},
    diagnostic: p.diagnostic,
    history: p.history ?? [],
  };
  for (const [k, v] of Object.entries(p)) if (!(k in out) && k !== 'user' && k !== 'motivation') out[k] = v;
  if (out.diagnostic === undefined) delete out.diagnostic;
  return out;
}

/** Validates the fields that are present (input from the API may be partial). */
export function validateProfile(p) {
  const errors = [];
  for (const s of SKILLS) {
    if (p?.skills && !LEVELS.includes(p.skills[s])) errors.push(`skills.${s} must be one of ${LEVELS.join(', ')}`);
    if (p?.skill_bands && !BANDS.includes(p.skill_bands[s])) errors.push(`skill_bands.${s} must be one of ${BANDS.join(', ')}`);
  }
  if (p?.overall_cefr !== undefined && !LEVELS.includes(p.overall_cefr)) errors.push('overall_cefr must be a CEFR level');
  if (p?.sub_band !== undefined && !BANDS.includes(p.sub_band)) errors.push(`sub_band must be one of ${BANDS.join(', ')}`);
  if (p?.target_cefr !== undefined && !LEVELS.includes(p.target_cefr)) errors.push('target_cefr must be a CEFR level');
  if (p?.interests !== undefined && !Array.isArray(p.interests)) errors.push('interests must be a list');
  return errors;
}
