// SM-2 based spaced repetition (CLAUDE.md, section 1).
// The first five successful reviews follow the fixed ladder 1, 3, 7, 14, 30 days; after that the
// interval grows by the SM-2 ease factor. A failed recall goes back to the 1-day pool.


export const LADDER = [1, 3, 7, 14, 30];
export const GRADES = { again: 1, hard: 3, good: 4, easy: 5 }; // SM-2 quality (0-5)
export const MIN_EASE = 1.3;
export const START_EASE = 2.5;

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return fmt(new Date(y, m - 1, d + n));
}

export const intervalDays = (stage: unknown): number => Math.max(1, parseInt(String(stage), 10) || 1);

/** SM-2 ease update: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), never below 1.3. */
export function updateEase(ease: unknown, q: number): number {
  const ef = (Number(ease) || START_EASE) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASE, Math.round(ef * 100) / 100);
}

export type GradeName = keyof typeof GRADES;
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
export interface SrsFields {
  stage: string;
  next: string;
  ease: string;
  reps: string;
  mastered: string;
}

/** Accepts an SM-2 quality 0-5 (number or numeric string) or a grade name (again | hard | good | easy). */
export function toQuality(grade: unknown): Quality {
  if (typeof grade === 'string' && grade in GRADES) return GRADES[grade as GradeName] as Quality;
  const q = typeof grade === 'number' ? grade : typeof grade === 'string' && grade.trim() !== '' ? Number(grade) : NaN;
  if (Number.isInteger(q) && q >= 0 && q <= 5) return q as Quality;
  throw Object.assign(new Error('grade must be an SM-2 quality 0-5 or again, hard, good, easy'), { status: 400 });
}

/**
 * Next schedule for a vocabulary row after a review of quality q (0-5).
 * q < 3: lapse, back to 1 day. q = 3 (hard): keep the interval. q = 4 (good): one step up the
 * 1-3-7-14-30 ladder. q = 5 (easy): skip a step. After 30 days the interval grows by the ease factor.
 */
export function schedule(row: Partial<SrsFields>, grade: GradeName | Quality | string | number, today: string): SrsFields {
  const q = toQuality(grade);
  const ease = updateEase(row.ease, q);
  const cur = intervalDays(row.stage);
  const top = LADDER[LADDER.length - 1];
  let reps = Number(row.reps) || 0;
  let days: number;
  if (q < 3) {
    days = 1;
    reps = 0;
  } else {
    reps += 1;
    const i = LADDER.indexOf(cur);
    if (q === 3) days = cur;
    else if (cur >= top || i === -1) days = Math.round(Math.max(cur, top) * ease * (q === 5 ? 1.3 : 1));
    else days = LADDER[Math.min(LADDER.length - 1, i + (q === 5 ? 2 : 1))];
  }
  const mastered = q < 3 ? 'No' : row.mastered === 'Yes' || (q >= 4 && cur >= top) ? 'Yes' : 'No';
  return { stage: `${days}d`, next: addDays(today, days), ease: ease.toFixed(2), reps: String(reps), mastered };
}

/** What each grade would do, for the review buttons: by name (again..easy) and by quality ("0".."5"). */
export function preview(row: Partial<SrsFields>, today: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of Object.keys(GRADES)) out[g] = schedule(row, g, today).stage;
  for (let q = 0; q <= 5; q++) out[q] = schedule(row, q, today).stage;
  return out;
}
