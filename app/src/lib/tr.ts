// Display labels for the interface. The coach files (profile.json history, session logs) already use
// English labels, so these helpers only format them for display.

export const SKILL_TR: Record<string, string> = { reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking' };
export const skillTr = (s: string) => SKILL_TR[s] ?? s;

export const FUNCTION_TR: Record<string, { label: string; about: string }> = {
  transactional: { label: 'Transactional', about: 'Getting things done: asking for and giving information, services, appointments.' },
  interactional: { label: 'Interactional', about: 'Building relationships: introductions, personal news, stories.' },
  evaluative: { label: 'Evaluative', about: 'Expressing and understanding opinions, feelings and comparisons.' },
};
export const fnTr = (f: string) => FUNCTION_TR[f]?.label ?? f;

/** "1d" -> "1 day", "3d" -> "3 days" (SM-2 interval stages). */
export const stageTr = (stage: string) => String(stage ?? '').replace(/^(\d+)d$/, (_, n) => `${n} ${n === '1' ? 'day' : 'days'}`);

/** Win and milestone labels are stored in English; anything else passes through unchanged. */
export const winLabelTr = (label: string): string => label;

/** Display date, e.g. "Sat, Oct 17, 2026". */
export const dateTr = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', opts);

/** Interest themes are stored with their English names. */
export const themeTr = (t: string) => t;

export const plural = (n: number, word: string) => `${n} ${word}`;
