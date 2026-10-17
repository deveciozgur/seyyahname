import { LEVELS } from './cefr-data';

export { LEVELS, SKILLS, BANDS, FUNCTIONS, FUNCTION_INFO, CAN_DO, bandLevel, nextBand, canDoId, canDoStatement, BAND_GOALS } from './cefr-data';
export const MASTERY = 80;

export const LEVEL_INFO = {
  A1: { name: 'Beginner', tr: 'Başlangıç' },
  A2: { name: 'Elementary', tr: 'Temel' },
  B1: { name: 'Intermediate', tr: 'Orta' },
  B2: { name: 'Upper-Intermediate', tr: 'Orta üstü' },
  C1: { name: 'Advanced', tr: 'İleri' },
  C2: { name: 'Mastery', tr: 'Ustalık' },
};

export const levelIndex = (l) => LEVELS.indexOf(l);
export const levelProgress = (l) => ((levelIndex(l) + 1) / LEVELS.length) * 100;
export const nextLevel = (l) => LEVELS[Math.min(LEVELS.length - 1, levelIndex(l) + 1)];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Normalises answers for lenient matching: lower-case, no punctuation, single spaces.
export const normalize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/** Lenient equality for typed answers: case/punctuation-insensitive and "12" == "twelve". */
export function sameAnswer(given, expected) {
  const toWord = (s) => normalize(s).replace(/\b\d+\b/g, (n) => NUMBER_WORDS[Number(n)] ?? n);
  return toWord(given) === toWord(expected);
}

/** CEFR band colour: A = amber, B = emerald, C = indigo (see tokens in index.css). */
export const band = (level) => ({ A: 'amber', B: 'emerald', C: 'indigo' })[String(level ?? 'A')[0]] ?? 'amber';
