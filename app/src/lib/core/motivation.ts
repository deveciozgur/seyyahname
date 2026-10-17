// Motivation engine (CLAUDE.md, section 6): XP, daily streak, milestones, confidence index,
// micro-wins, the Frustration Shield and Low-Effort Mode. Pure functions over profile.gamification;
// store.js persists the result. Sub-band progress itself comes from functional tasks, not XP.


import { LEVELS } from '../cefr-data.ts';

export const SHIELD_AFTER = 2; // consecutive struggles before hints and lighter formats kick in
export const STRUGGLE_BELOW = 60; // a score under this counts as a struggle

const CONNECTORS = /\b(because|so|but|however|although|then|also|and then|after that|first|finally)\b/i;

export const MILESTONES = {
  first_steps: 'First steps: your first practice',
  first_review: 'Memory spark: first spaced review',
  streak_3: 'Three-day streak',
  streak_7: 'One-week streak',
  streak_30: 'Thirty-day streak',
  words_10: '10 words in your vault',
  words_25: '25 words in your vault',
  words_50: '50 words in your vault',
  first_80: 'First 80%+ score',
  perfect: 'Perfect score',
  first_connector: 'First linking word used',
  first_can_do: 'First Can-Do statement achieved',
  first_band: 'First sub-band step',
  first_level_up: 'First skill level up',
  first_resolved: 'First pattern mastered',
  all_skills_day: 'All four skills in one day',
  brave: 'Brave attempt: 80%+ above your level',
  quick_play: 'Low-effort win: first quick play',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const sum = (wins) => wins.reduce((n, w) => n + w.points, 0);

function award(profile, wins) {
  profile.gamification.xp_total += sum(wins);
  return wins;
}

function unlock(profile, id, date, wins, title = MILESTONES[id]) {
  const g = profile.gamification;
  if (g.unlocked_milestones.some((x) => x.id === id)) return;
  g.unlocked_milestones.push({ id, title, date });
  wins.push({ kind: 'milestone', label: title, points: 15 });
}

/** Daily streak: consecutive days with any practice. Adds two wins on the first practice of a day. */
function touchStreak(profile, date, yesterday, wins) {
  const g = profile.gamification;
  if (g.last_active_date === date) return false;
  g.streak_days = g.last_active_date === yesterday ? g.streak_days + 1 : 1;
  g.longest_streak = Math.max(g.longest_streak, g.streak_days);
  g.last_active_date = date;
  wins.push({ kind: 'streak', label: g.streak_days === 1 ? 'Day 1: streak started' : `+1 daily streak: day ${g.streak_days}`, points: 5 });
  wins.push({ kind: 'effort', label: 'Showed up today', points: 5 });
  for (const [n, id] of [
    [3, 'streak_3'],
    [7, 'streak_7'],
    [30, 'streak_30'],
  ])
    if (g.streak_days >= n) unlock(profile, id, date, wins);
  return true;
}

const wordCount = (t) => (String(t ?? '').trim() ? String(t).trim().split(/\s+/).length : 0);

/**
 * Called after an activity is applied (history entry already pushed).
 * Returns { wins, points, shield, lowEffort }.
 */
export function onActivity(profile, ctx) {
  const g = profile.gamification;
  const { date, yesterday, skill, level, current, score, title, slotFilled, fnLabel, canDo, curriculumLevelUp, bandChange, levelChange, addedWords, credited, resolved, response, minWords, vocabSize } = ctx;
  const wins = [];
  touchStreak(profile, date, yesterday, wins);

  wins.push({ kind: 'complete', label: `${cap(skill)} task done`, points: 10 });
  if (score >= 80) wins.push({ kind: 'score', label: score === 100 ? `Perfect ${score}% on ${title}` : `${score}% on ${title}`, points: score === 100 ? 10 : 5 });
  if (slotFilled) wins.push({ kind: 'context', label: `${fnLabel} task cleared at ${ctx.band}`, points: 10 });
  if (canDo) wins.push({ kind: 'cando', label: `Can-Do: ${canDo}`, points: 10 });
  if (addedWords > 0) wins.push({ kind: 'words', label: `${addedWords} new word${addedWords > 1 ? 's' : ''} added to your vault`, points: 2 * addedWords });
  if (credited.length) wins.push({ kind: 'polish', label: `Used correctly: ${credited.slice(0, 2).map((e) => `"${e.after}"`).join(', ')}${credited.length > 2 ? '…' : ''}`, points: 5 * credited.length });
  for (const e of resolved) wins.push({ kind: 'resolved', label: `Mastered: "${e.after}"`, points: 15 });
  if (curriculumLevelUp) wins.push({ kind: 'level', label: `Curriculum reached ${curriculumLevelUp.to}`, points: 50 });
  if (bandChange) wins.push({ kind: 'level', label: `${cap(skill)} reached ${bandChange.to}`, points: levelChange ? 50 : 25 });
  const above = LEVELS.indexOf(level) > LEVELS.indexOf(current);
  if (above) wins.push({ kind: 'brave', label: 'Brave attempt above your level', points: 5 });

  const acts = (profile.history ?? []).filter((h) => h.event === 'activity');
  if (acts.length <= 1) unlock(profile, 'first_steps', date, wins);
  if (score >= 80) unlock(profile, 'first_80', date, wins);
  if (score === 100) unlock(profile, 'perfect', date, wins);
  if (canDo) unlock(profile, 'first_can_do', date, wins);
  if (bandChange) unlock(profile, 'first_band', date, wins);
  if (levelChange) unlock(profile, 'first_level_up', date, wins);
  if (bandChange) unlock(profile, `band_${skill}_${bandChange.to}`, date, wins, `Reached ${bandChange.to} in ${cap(skill)}`);
  if (resolved.length) unlock(profile, 'first_resolved', date, wins);
  if (above && score >= 80) unlock(profile, 'brave', date, wins);
  if (response && CONNECTORS.test(response)) unlock(profile, 'first_connector', date, wins);
  if (new Set(acts.filter((h) => h.date === date).map((h) => h.skill)).size === 4) unlock(profile, 'all_skills_day', date, wins);
  for (const [n, id] of [
    [10, 'words_10'],
    [25, 'words_25'],
    [50, 'words_50'],
  ])
    if (vocabSize >= n) unlock(profile, id, date, wins);

  // confidence index: drifts toward recent scores, with a small bonus for effort and for stretching
  g.confidence_index = clamp(g.confidence_index + (score - g.confidence_index) * 0.15 + 1 + (above && score >= 60 ? 2 : 0));

  // Frustration Shield
  g.struggle_streak = score < STRUGGLE_BELOW ? g.struggle_streak + 1 : 0;
  const shield = g.struggle_streak >= SHIELD_AFTER;

  // Low-Effort Mode: repeated struggle, or answers getting much shorter
  let lowReason = null;
  if (shield) lowReason = `${g.struggle_streak} tough rounds in a row`;
  const words = wordCount(response);
  if (response && !lowReason) {
    const prev = acts.filter((h) => typeof h.words === 'number').slice(-4, -1).map((h) => h.words);
    const avg = prev.length >= 2 ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
    if ((avg && words < avg * 0.5) || (minWords && words < minWords * 0.4)) lowReason = 'your answers are getting shorter';
  }
  if (lowReason) {
    g.mode = 'low';
    g.mode_reason = lowReason;
  } else if (score >= 80 && g.mode === 'low') {
    g.mode = 'normal';
    g.mode_reason = null;
  }

  award(profile, wins);
  return { wins, points: sum(wins), shield, lowEffort: { active: g.mode === 'low', reason: g.mode_reason }, words };
}

/** SM-2 review: recall is rewarded, a lapse still earns a little for the effort. */
export function onReview(profile, { date, yesterday, grade, word, stage }) {
  const wins = [];
  touchStreak(profile, date, yesterday, wins);
  const recalled = grade !== 'again';
  wins.push(recalled ? { kind: 'review', label: `Recalled "${word}" (next in ${stage})`, points: grade === 'easy' ? 4 : 3 } : { kind: 'review', label: `Reviewed "${word}" (back tomorrow)`, points: 1 });
  unlock(profile, 'first_review', date, wins);
  if (recalled) profile.gamification.confidence_index = clamp(profile.gamification.confidence_index + 1);
  award(profile, wins);
  return { wins, points: sum(wins) };
}

export function onQuickPlay(profile, { date, yesterday, correct, total }) {
  const wins = [];
  touchStreak(profile, date, yesterday, wins);
  wins.push({ kind: 'quickplay', label: `Quick play: ${correct}/${total}`, points: 3 + 2 * correct });
  unlock(profile, 'quick_play', date, wins);
  const g = profile.gamification;
  g.confidence_index = clamp(g.confidence_index + (correct / Math.max(1, total) >= 0.6 ? 2 : 1));
  g.struggle_streak = 0;
  award(profile, wins);
  return { wins, points: sum(wins) };
}
