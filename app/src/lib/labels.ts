// Display labels for the interface: skills, communicative functions, SM-2 interval stages and dates.
// The coach files (profile.json history, session logs) already store English labels and theme names,
// so wins, milestones and themes are shown as stored.

export const SKILL_LABELS: Record<string, string> = { reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking' };
export const skillLabel = (s: string) => SKILL_LABELS[s] ?? s;

export const FUNCTION_LABELS: Record<string, { label: string; about: string }> = {
  transactional: { label: 'Transactional', about: 'Getting things done: asking for and giving information, services, appointments.' },
  interactional: { label: 'Interactional', about: 'Building relationships: introductions, personal news, stories.' },
  evaluative: { label: 'Evaluative', about: 'Expressing and understanding opinions, feelings and comparisons.' },
};
export const fnLabel = (f: string) => FUNCTION_LABELS[f]?.label ?? f;

/** "1d" -> "1 day", "3d" -> "3 days" (SM-2 interval stages). */
export const stageLabel = (stage: string) => String(stage ?? '').replace(/^(\d+)d$/, (_, n) => `${n} ${n === '1' ? 'day' : 'days'}`);

/** Display date, e.g. "Sat, Oct 17, 2026". */
export const formatDate = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', opts);
