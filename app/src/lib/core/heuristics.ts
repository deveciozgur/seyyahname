// Offline, rule-based Triple-Layer feedback. Used when no Gemini API key is
// configured (or a request fails). It is deliberately conservative: it only flags
// patterns it can detect reliably, with a focus on typical Turkish-L1 interference.


import { LEVELS } from './store.ts';

// [pattern, replacement (string or fn), category, rule]
const GRAMMAR_RULES: [RegExp, string | ((...m: string[]) => string), string, string][] = [
  [/\b(I|i) have (\d+) years?( old)?\b/g, (m, _i, n) => `I am ${n} years old`, 'Verb choice (be/have)', 'Age uses "be", not "have": I am 25 years old. (TR: 25 yaşındayım)'],
  [/\b(he|she|it) have (\d+) years?( old)?\b/gi, (m, p, n) => `${p} is ${n} years old`, 'Verb choice (be/have)', 'Age uses "be": She is 30 years old.'],
  [/\bI am agree\b/gi, 'I agree', 'Verb form', '"Agree" is a verb, not an adjective: I agree.'],
  // lookbehind skips correct questions/negatives/modals: "Does she like…", "Can he go…"
  [/(?<!\b(?:does|doesn't|did|didn't|do|don't|can|can't|will|won't|would|should|could|must|might|may|not)\s)\b(he|she) (go|do|have|like|want|work|live|play|watch|need|make|come|eat|drink|read|write|speak|say|know|think|get|take)\b/gi, (m, p, v) => `${p} ${thirdPerson(v)}`, 'Present simple (3rd person -s)', 'He/She/It + verb-s in the present simple: she works, he goes, it has.'],
  [/\b(my|his|her|our|their|your) (wife|husband|mother|father|mum|mom|dad|sister|brother|friend|son|daughter|boss|teacher|family) (go|do|have|like|want|work|live|play|watch|need|speak|teach|cook|love|study)\b/gi, (m, d, n, v) => `${d} ${n} ${thirdPerson(v)}`, 'Present simple (3rd person -s)', 'One person (my wife, my brother…) takes verb-s: my wife works.'],
  [/(?<!\b(?:does|doesn't|did|didn't|can|will|would|should|could|must|might|may|not|make|let)\s)\bit have\b/gi, 'it has', 'Present simple (3rd person -s)', 'It + has in the present simple: it has two rooms.'],
  [/\b(I|you|we|they) (goes|does|has|likes|wants|works|lives|plays|watches|needs|makes|comes)\b/gi, (m, p, v) => `${p} ${baseForm(v)}`, 'Present simple (3rd person -s)', 'No -s after I/you/we/they: I work, they live.'],
  [/\b(people|children|police) (is|was|has)\b/gi, (m, n, v) => `${n} ${{ is: 'are', was: 'were', has: 'have' }[v.toLowerCase()]}`, 'Subject-verb agreement', `"People/children/police" are plural.`],
  [/\b(didn't|did not|doesn't|does not|don't|do not) (went|goes|did|had|saw|came|ate|made|took)\b/gi, (m, aux, v) => `${aux} ${baseForm(v)}`, 'Auxiliary + base verb', 'After do/does/did, use the base verb: I didn\'t go.'],
  [/\b(can|could|should|must|will|would|might) (to )([a-z]+)\b/gi, (m, modal, _to, v) => `${modal} ${v}`, 'Modal verbs', 'No "to" after modal verbs: I can swim.'],
  [/\bmore (better|worse|bigger|easier|happier)\b/gi, (m, adj) => adj, 'Comparatives', 'Do not use "more" with -er comparatives: better, not more better.'],
  [/\blisten (music|the music|songs|radio|the radio)\b/gi, (m, obj) => `listen to ${obj}`, 'Prepositions', '"Listen" needs "to": listen to music.'],
  [/\bgo to home\b/gi, 'go home', 'Prepositions', '"Home" takes no "to" after go/come: go home.'],
  [/\b(on|in) the weekend\b/gi, 'at the weekend', 'Prepositions of time', 'British: at the weekend (American: on the weekend).'],
  [/\bon the (morning|afternoon|evening)\b/gi, (m, t) => `in the ${t}`, 'Prepositions of time', 'Parts of the day: in the morning, in the evening (but at night).'],
  [/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/gi, (m, d) => `on ${cap(d)}`, 'Prepositions of time', 'Days take "on": on Monday.'],
  [/\b(in|at) (\d{1,2}) o'?clock\b/gi, (m, _p, n) => `at ${n} o'clock`, 'Prepositions of time', 'Clock times take "at": at 7 o\'clock.'],
  [/\bmarried with\b/gi, 'married to', 'Prepositions', 'Married to someone (not with).'],
  [/\bdiscuss about\b/gi, 'discuss', 'Verb patterns', '"Discuss" takes a direct object: discuss the plan.'],
  [/\bexplain me\b/gi, 'explain to me', 'Verb patterns', 'Explain something to someone: explain it to me.'],
  [/\bmake (a )?(photo|photos|picture|pictures)\b/gi, (m, a, p) => `take ${a ?? ''}${p}`, 'Collocations', 'We take photos (not make).'],
  [/\bmake (a )?mistake(s)? (on|in)\b/gi, (m, a, s) => `make ${a ?? ''}mistake${s ?? ''} with`, 'Collocations', 'Make a mistake with/about something.'],
  [/\b(very|so) (like|love)\b/gi, (m, _a, v) => `really ${v}`, 'Adverbs', 'Use "really" (or "very much" at the end): I really like it / I like it very much.'],
  [/\ba ([aeiou][a-z]+)\b/gi, (m, w) => (/^(uni|use|eu|one|once)/i.test(w) ? m : `an ${w}`), 'Articles', 'Use "an" before a vowel sound: an apple, an hour.'],
  [/\ban ([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi, (m, w) => (/^(h(our|onest|onou?r))/i.test(w) ? m : `a ${w}`), 'Articles', 'Use "a" before a consonant sound: a book, a university.'],
  [/(?<=^|[\s.!?,"(])i(?=\s|'m|'ve|'ll|'d|,|\.|!|\?|$)/g, 'I', 'Capitalisation', 'The pronoun "I" is always a capital letter.'],
];

const IRREGULAR_BASE = { went: 'go', goes: 'go', did: 'do', does: 'do', had: 'have', has: 'have', saw: 'see', came: 'come', ate: 'eat', made: 'make', took: 'take' };
function baseForm(v) {
  const l = v.toLowerCase();
  if (IRREGULAR_BASE[l]) return IRREGULAR_BASE[l];
  if (/(ch|sh|ss|x)es$/.test(l)) return l.slice(0, -2);
  if (l.endsWith('s')) return l.slice(0, -1);
  return l;
}
function thirdPerson(v) {
  const l = v.toLowerCase();
  if (l === 'have') return 'has';
  if (l === 'go' || l === 'do') return `${l}es`;
  if (/(ch|sh|ss|x)$/.test(l)) return `${l}es`;
  return `${l}s`;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Upgrade one level above the learner, never far above it (i+1).
const UPGRADES = {
  good: [['A2', 'great', 'The film was great.'], ['B1', 'excellent', 'She gave an excellent presentation.'], ['C1', 'outstanding', 'It was an outstanding performance.']],
  bad: [['A2', 'terrible', 'The weather was terrible.'], ['B1', 'awful', 'The traffic was awful today.'], ['C1', 'dire', 'The situation became dire.']],
  big: [['A2', 'large', 'They live in a large house.'], ['B1', 'huge', 'It was a huge success.'], ['C1', 'substantial', 'a substantial increase in sales']],
  small: [['A2', 'little', 'a little café'], ['B1', 'tiny', 'a tiny flat'], ['C1', 'modest', 'a modest improvement']],
  nice: [['A2', 'lovely', 'What a lovely day!'], ['B1', 'pleasant', 'We had a pleasant evening.'], ['C1', 'delightful', 'a delightful surprise']],
  happy: [['A2', 'glad', "I'm glad you came."], ['B1', 'delighted', "I'm delighted with the result."], ['C1', 'thrilled', 'She was thrilled to hear the news.']],
  sad: [['A2', 'unhappy', 'He looks unhappy.'], ['B1', 'upset', 'She was upset about the news.'], ['C1', 'devastated', 'They were devastated by the loss.']],
  important: [['B1', 'essential', 'Sleep is essential for learning.'], ['B2', 'crucial', 'This is a crucial decision.'], ['C1', 'pivotal', 'a pivotal moment in my career']],
  think: [['B1', 'believe', 'I believe this is the right choice.'], ['B2', 'reckon', 'I reckon it will rain.'], ['C1', 'would argue', 'I would argue that…']],
  start: [['A2', 'begin', 'The lesson begins at nine.'], ['B1', 'launch', 'They launched a new product.'], ['C1', 'embark on', 'embark on a new career']],
  help: [['B1', 'support', 'My family supported me.'], ['B2', 'assist', 'Can I assist you?'], ['C1', 'facilitate', 'facilitate communication']],
  show: [['B1', 'demonstrate', 'The results demonstrate…'], ['B2', 'illustrate', 'This example illustrates…'], ['C1', 'underscore', 'This underscores the need for…']],
  problem: [['B1', 'issue', 'There is an issue with my order.'], ['B2', 'challenge', 'Learning English is a challenge.'], ['C1', 'setback', 'a temporary setback']],
  'a lot of': [['B1', 'plenty of', 'We have plenty of time.'], ['B2', 'a great deal of', 'a great deal of effort'], ['C1', 'a wealth of', 'a wealth of experience']],
  very: [['A2', 'really', 'It was really cold.'], ['B1', 'extremely', 'extremely difficult'], ['C1', 'remarkably', 'remarkably calm']],
  get: [['B1', 'receive', 'I received your email.'], ['B2', 'obtain', 'obtain a visa'], ['C1', 'acquire', 'acquire new skills']],
  want: [['B1', 'would like', 'I would like a coffee.'], ['B2', 'hope to', 'I hope to visit London.'], ['C1', 'aspire to', 'I aspire to work abroad.']],
  like: [['A2', 'enjoy', 'I enjoy reading.'], ['B1', 'am fond of', "I'm fond of jazz."], ['C1', 'have a soft spot for', 'I have a soft spot for old films.']],
  'very much': [['B1', 'greatly', 'I greatly appreciate it.'], ['C1', 'immensely', 'I enjoyed it immensely.']],
  but: [['B1', 'however', 'However, it was expensive.'], ['B2', 'nevertheless', 'Nevertheless, we continued.']],
  because: [['B1', 'since', 'Since it was late, we left.'], ['B2', 'as a result of', 'as a result of the delay']],
  also: [['B1', 'in addition', 'In addition, I speak German.'], ['B2', 'furthermore', 'Furthermore, the plan is cheap.']],
};

const MECHANICS = new Set(['Capitalisation', 'Punctuation']);

const CONNECTORS = ['and', 'but', 'because', 'so', 'then', 'also', 'however', 'although', 'though', 'while', 'whereas', 'therefore', 'moreover', 'furthermore', 'in addition', 'as a result', 'on the other hand', 'nevertheless', 'unless', 'if', 'when', 'since', 'despite', 'in spite of'];
const ADVANCED_CONNECTORS = ['however', 'although', 'whereas', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'on the other hand', 'as a result', 'despite', 'in spite of'];
const INFORMAL = ['gonna', 'wanna', 'gotta', 'hey', 'yeah', 'cool', 'kinda', 'stuff', 'guys', 'lol', 'ok', 'okay'];
const FORMAL = ['dear', 'sincerely', 'regards', 'furthermore', 'therefore', 'consequently', 'i would like to', 'please find', 'i am writing'];
const FILLERS = ['um', 'uh', 'er', 'erm', 'hmm', 'like', 'you know', 'i mean', 'actually', 'basically', 'so yeah', 'kind of', 'sort of'];

// Words Turkish speakers frequently mispronounce because of spelling.
const IPA_TIPS = {
  the: ['/ðə/', 'Tongue between the teeth for "th", not /d/ or /z/.'],
  think: ['/θɪŋk/', '"th" is voiceless /θ/: air through the teeth, not /t/ or /s/.'],
  three: ['/θriː/', 'Voiceless /θ/, not "tree".'],
  thank: ['/θæŋk/', 'Voiceless /θ/ + open /æ/.'],
  this: ['/ðɪs/', 'Voiced /ð/, not /d/.'],
  world: ['/wɜːld/', 'Long /ɜː/, not "vorld"; start with rounded lips /w/.'],
  work: ['/wɜːk/', '/w/ (not /v/) and long /ɜː/, different from walk /wɔːk/.'],
  word: ['/wɜːd/', '/w/ (not /v/).'],
  walk: ['/wɔːk/', 'Silent "l".'],
  talk: ['/tɔːk/', 'Silent "l".'],
  comfortable: ['/ˈkʌmftəbl/', 'Three syllables: KUMF-tuh-bul.'],
  vegetable: ['/ˈvedʒtəbl/', 'Three syllables: VEJ-tuh-bul.'],
  wednesday: ['/ˈwenzdeɪ/', 'The first "d" is silent: WENZ-day.'],
  island: ['/ˈaɪlənd/', 'Silent "s".'],
  clothes: ['/kləʊðz/', 'One syllable, sounds like "close".'],
  often: ['/ˈɒfn/', 'The "t" is usually silent.'],
  people: ['/ˈpiːpl/', 'Long /iː/, two syllables.'],
  very: ['/ˈveri/', '/v/ with teeth on lip; contrast with "wary" /w/.'],
  water: ['/ˈwɔːtə/', 'Start with /w/, not /v/.'],
  would: ['/wʊd/', 'Silent "l"; /w/ not /v/.'],
  women: ['/ˈwɪmɪn/', 'Sounds like "wimmin".'],
  live: ['/lɪv/', 'Short /ɪ/ (verb), while "leave" is long /iː/.'],
  coffee: ['/ˈkɒfi/', 'Stress on the first syllable.'],
  hotel: ['/həʊˈtel/', 'Stress on the second syllable: ho-TEL.'],
  teacher: ['/ˈtiːtʃə/', 'Long /iː/; the final "r" is silent in British English.'],
  usually: ['/ˈjuːʒuəli/', 'Middle sound is /ʒ/ like the "j" in Turkish "jandarma".'],
  breakfast: ['/ˈbrekfəst/', '"break" here is /brek/, not /breɪk/.'],
  kitchen: ['/ˈkɪtʃɪn/', 'Silent "t".'],
  answer: ['/ˈɑːnsə/', 'Silent "w".'],
  listen: ['/ˈlɪsn/', 'Silent "t".'],
  knife: ['/naɪf/', 'Silent "k".'],
  know: ['/nəʊ/', 'Silent "k".'],
  hour: ['/ˈaʊə/', 'Silent "h".'],
  colleague: ['/ˈkɒliːɡ/', 'Two syllables: KOL-eeg.'],
};

const words = (t: string): string[] => t.toLowerCase().match(/[a-z']+/g) ?? [];
const sentences = (t) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
const countPhrase = (text, phrase) => (text.toLowerCase().match(new RegExp(`\\b${phrase.replace(/ /g, '\\s+')}\\b`, 'g')) ?? []).length;

// British IPA for upgrade words and common corrected forms, so feedback can show a phonetic badge.
const WORD_IPA = {
  great: 'ɡreɪt', excellent: 'ˈeksələnt', outstanding: 'aʊtˈstændɪŋ', terrible: 'ˈterəbl', awful: 'ˈɔːfl', dire: 'ˈdaɪə',
  large: 'lɑːdʒ', huge: 'hjuːdʒ', substantial: 'səbˈstænʃl', little: 'ˈlɪtl', tiny: 'ˈtaɪni', modest: 'ˈmɒdɪst',
  lovely: 'ˈlʌvli', pleasant: 'ˈpleznt', delightful: 'dɪˈlaɪtfl', glad: 'ɡlæd', delighted: 'dɪˈlaɪtɪd', thrilled: 'θrɪld',
  unhappy: 'ʌnˈhæpi', upset: 'ʌpˈset', devastated: 'ˈdevəsteɪtɪd', essential: 'ɪˈsenʃl', crucial: 'ˈkruːʃl', pivotal: 'ˈpɪvətl',
  believe: 'bɪˈliːv', reckon: 'ˈrekən', begin: 'bɪˈɡɪn', begins: 'bɪˈɡɪnz', launch: 'lɔːntʃ', embark: 'ɪmˈbɑːk',
  support: 'səˈpɔːt', assist: 'əˈsɪst', facilitate: 'fəˈsɪlɪteɪt', demonstrate: 'ˈdemənstreɪt', illustrate: 'ˈɪləstreɪt',
  underscore: 'ˌʌndəˈskɔː', issue: 'ˈɪʃuː', challenge: 'ˈtʃælɪndʒ', setback: 'ˈsetbæk', plenty: 'ˈplenti', wealth: 'welθ',
  really: 'ˈrɪəli', extremely: 'ɪkˈstriːmli', remarkably: 'rɪˈmɑːkəbli', receive: 'rɪˈsiːv', obtain: 'əbˈteɪn', acquire: 'əˈkwaɪə',
  enjoy: 'ɪnˈdʒɔɪ', fond: 'fɒnd', greatly: 'ˈɡreɪtli', immensely: 'ɪˈmensli', however: 'haʊˈevə', nevertheless: 'ˌnevəðəˈles',
  since: 'sɪns', furthermore: 'ˌfɜːðəˈmɔː', addition: 'əˈdɪʃn', aspire: 'əˈspaɪə', hope: 'həʊp', would: 'wʊd',
  works: 'wɜːks', goes: 'ɡəʊz', has: 'hæz', does: 'dʌz', office: 'ˈɒfɪs', engineer: 'ˌendʒɪˈnɪə', morning: 'ˈmɔːnɪŋ',
  evening: 'ˈiːvnɪŋ', music: 'ˈmjuːzɪk', years: 'jɪəz', old: 'əʊld', agree: 'əˈɡriː', married: 'ˈmærid', discuss: 'dɪˈskʌs',
  explain: 'ɪkˈspleɪn', photo: 'ˈfəʊtəʊ', photos: 'ˈfəʊtəʊz', weekend: 'ˌwiːkˈend', home: 'həʊm', better: 'ˈbetə',
};
const IPA_SKIP = new Set(['a', 'an', 'i', 'in', 'on', 'at', 'to', 'the', 'my', 'he', 'she', 'it', 'is', 'am', 'are', 'and', 'of', 'with']);

/** First meaningful word in a fragment that has a known pronunciation. */
export function ipaFor(fragment) {
  for (const w of words(fragment)) {
    if (IPA_SKIP.has(w)) continue;
    const ipa = WORD_IPA[w] ?? IPA_TIPS[w]?.[0]?.replace(/^\/|\/$/g, '');
    if (ipa) return { word: w, ipa: `/${ipa}/` };
  }
  return null;
}

/** Words from the learner's own text that Turkish speakers often mispronounce. */
export function pronunciationWatch(text, limit = 6) {
  const out = [];
  for (const w of new Set(words(text))) {
    if (IPA_TIPS[w]) out.push({ word: w, ipa: IPA_TIPS[w][0], tip: IPA_TIPS[w][1] });
    if (out.length >= limit) break;
  }
  return out;
}

export function analyzeGrammar(text) {
  const issues = [];
  const seen = new Set();
  for (const [re, repl, category, rule] of GRAMMAR_RULES) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const before = m[0].trim();
      const after = (typeof repl === 'function' ? repl(...m) : repl).trim();
      if (!before || before === after) continue;
      const key = `${before.toLowerCase()}→${after.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({ before, after, rule, category, context: snippet(text, m.index, m[0].length) });
    }
  }
  // sentence-level checks
  for (const s of sentences(text)) {
    if (/^[a-z]/.test(s) && !/^i\b/.test(s)) {
      const after = s.charAt(0).toUpperCase() + s.slice(1);
      issues.push({ before: s.split(' ').slice(0, 4).join(' '), after: after.split(' ').slice(0, 4).join(' '), rule: 'Start every sentence with a capital letter.', category: 'Capitalisation', context: s });
    }
  }
  const trimmed = text.trim();
  if (trimmed && !/[.!?]["')]?$/.test(trimmed)) {
    const last = trimmed.split(/\s+/).slice(-3).join(' ');
    issues.push({ before: last, after: `${last}.`, rule: 'End the sentence with a full stop (.), question mark or exclamation mark.', category: 'Punctuation', context: last });
  }
  return issues;
}

function snippet(text, index, len) {
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, index - 25)));
  const end = Math.min(text.length, index + len + 25);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

export function suggestUpgrades(text, learnerLevel) {
  const li = LEVELS.indexOf(learnerLevel);
  const lower = text.toLowerCase();
  const out = [];
  for (const [word, options] of Object.entries(UPGRADES)) {
    if (!new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`).test(lower)) continue;
    // pick the first option above the learner's level, but at most two levels up (i+1/i+2)
    const pick = options.find(([lvl]) => LEVELS.indexOf(lvl) > li && LEVELS.indexOf(lvl) <= li + 2) ?? null;
    if (!pick) continue;
    const stretch = options.find(([lvl]) => LEVELS.indexOf(lvl) >= 4);
    out.push({ original: word, upgrade: pick[1], level: pick[0], example: pick[2], stretch: stretch && stretch !== pick ? `${stretch[1]} (${stretch[0]})` : '', ipa: ipaFor(pick[1])?.ipa ?? '' });
    if (out.length >= 5) break;
  }
  return out;
}

export function analyzeTone(text, task: any = {}) {
  const lower = text.toLowerCase();
  const ws = words(text);
  const ss = sentences(text);
  const informal = INFORMAL.filter((w) => countPhrase(lower, w) > 0);
  const formal = FORMAL.filter((w) => lower.includes(w));
  const contractions = (text.match(/\b\w+'(m|re|s|ve|ll|d|t)\b/gi) ?? []).length;
  const usedConnectors = CONNECTORS.filter((c) => countPhrase(lower, c) > 0);
  const avgLen = ss.length ? ws.length / ss.length : 0;
  const register = formal.length > informal.length + 1 ? 'formal' : informal.length > 0 || contractions > 2 ? 'informal' : 'neutral';

  const notes = [];
  if (task.register && task.register !== register) notes.push(`The task asks for a ${task.register} register, but your text reads as ${register}.`);
  if (usedConnectors.length <= 1 && ss.length > 2) notes.push('Link your ideas with connectors: and, but, because, so, then.');
  else if (usedConnectors.length) notes.push(`Connectors used: ${usedConnectors.join(', ')}.`);
  if (avgLen < 6 && ss.length > 2) notes.push('Your sentences are very short. Try joining two of them with "and", "but" or "because".');
  if (avgLen > 28) notes.push('Some sentences are very long. Split them to keep the reader with you.');
  if (informal.length) notes.push(`Informal words: ${informal.join(', ')}. Fine for friends, avoid in formal emails.`);
  const openers = new Set(ss.map((s) => words(s)[0]).filter(Boolean));
  if (ss.length >= 4 && openers.size / ss.length < 0.5) notes.push('Many sentences start the same way. Vary your openers (Then, Usually, After that, In my opinion…).');

  return {
    register,
    summary: `Register: ${register}. ${ss.length} sentence(s), about ${Math.round(avgLen)} words per sentence.`,
    notes,
    connectors: usedConnectors,
  };
}

export function estimateLevel(text) {
  const ws = words(text);
  const ss = sentences(text);
  if (ws.length < 5) return 'A1';
  const lower = text.toLowerCase();
  const avgLen = ws.length / Math.max(1, ss.length);
  const variety = new Set(ws).size / ws.length;
  const advanced = ADVANCED_CONNECTORS.filter((c) => countPhrase(lower, c) > 0).length;
  const longWords = ws.filter((w) => w.length >= 9).length / ws.length;
  const pastOrPerfect = /\b(was|were|had|have been|has been|\w+ed)\b/.test(lower);
  const conditional = /\bif\b.*\b(would|will|could|might)\b/.test(lower) || /\bhad\b.*\b(would have|could have)\b/.test(lower);
  let points = 0;
  if (avgLen > 8) points++;
  if (avgLen > 13) points++;
  if (variety > 0.6) points++;
  if (pastOrPerfect) points++;
  if (conditional) points++;
  points += Math.min(2, advanced);
  if (longWords > 0.08) points++;
  return LEVELS[Math.min(4, Math.floor(points / 1.6))];
}

export function speakingMetrics(text, durationSec) {
  const ws = words(text);
  const lower = text.toLowerCase();
  const fillers: Record<string, number> = {};
  for (const f of FILLERS) {
    const n = countPhrase(lower, f);
    if (n) fillers[f] = n;
  }
  const ss = sentences(text);
  const openers = new Set(ss.map((s) => words(s)[0]).filter(Boolean));
  const ipa = pronunciationWatch(text);
  return {
    wordCount: ws.length,
    durationSec: durationSec || null,
    // under ~10 s the rate is noise (or the transcript was typed), so don't report it
    wpm: durationSec >= 10 ? Math.round((ws.length / durationSec) * 60) : null,
    fillers,
    fillerTotal: Object.values(fillers).reduce((a, b) => a + b, 0),
    sentenceVariety: ss.length ? Math.round((openers.size / ss.length) * 100) : 0,
    ipa,
  };
}


// ---------- strength-first (CLAUDE.md: praise one concrete thing before any polish) ----------
const PRAISE_CONNECTORS = ['because', 'however', 'although', 'so', 'but', 'then', 'after that', 'also', 'and then', 'when', 'if'];
const S_VERBS = 'works|lives|likes|goes|has|does|wants|plays|watches|needs|makes|comes|eats|drinks|reads|writes|speaks|says|knows|thinks|gets|takes|teaches|cooks|loves|studies|travels|uses';
const PAST = /\b(went|was|were|had|did|saw|made|took|came|ate|bought|found|got|met|felt|thought|told|played|watched|visited|worked|lived|liked|started|finished|walked|talked|stayed|moved|tried|studied)\b/i;

function sentenceWith(text, re) {
  return sentences(text).find((s) => re.test(s)) ?? null;
}
const quote = (s) => {
  const t = s.replace(/[.!?]+$/, '');
  return t.length > 90 ? `${t.slice(0, 87).trimEnd()}…` : t;
};

/** Up to three concrete, true strengths found in the learner text. The first is the headline. */
export function findStrengths(text, grammar, task: any = {}) {
  const out = [];
  const cats = new Set(grammar.map((g) => g.category));
  const lower = text.toLowerCase();
  const conn = PRAISE_CONNECTORS.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(lower));
  if (conn) {
    const s = sentenceWith(text, new RegExp(`\\b${conn}\\b`, 'i'));
    out.push(`You linked ideas with "${conn}"${s ? `: "${quote(s)}"` : ''}. That is exactly how fluent speakers connect thoughts.`);
  }
  const sv = new RegExp(`\\b(he|she|it|(?:my|his|her|our|their) \\w+) (${S_VERBS})\\b`, 'i');
  const svm = sv.exec(text);
  if (svm && !cats.has('Present simple (3rd person -s)')) out.push(`You nailed the -s ending: "${svm[0]}". Many learners miss this one.`);
  const past = PAST.exec(text);
  if (past) out.push(`You told part of it in the past tense ("${past[0]}"). That makes your English feel like a real story.`);
  if (/\?/.test(text)) out.push('You asked a question, which keeps a conversation alive.');
  const ws = words(text);
  if (task.minWords && ws.length >= task.minWords) out.push(`You reached the target length (${ws.length} words). That stamina is what builds fluency.`);
  if (ws.length >= 20 && new Set(ws).size / ws.length >= 0.7) out.push('You used lots of different words, so your vocabulary range is showing.');
  if (/\bI\b/.test(text) && !cats.has('Capitalisation')) out.push('Every "I" is a capital letter. Clean and careful.');
  if (!out.length) out.push(`You wrote ${ws.length} word${ws.length === 1 ? '' : 's'} in English and kept going. Every sentence you try builds the habit.`);
  return out.slice(0, 3);
}

const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Corrective recast: the learner's own text with every polish point applied, nothing else changed. */
export function recastText(text, grammar) {
  let out = text;
  for (const g of grammar) {
    if (!g.before?.trim() || g.before === g.after) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(g.before.trim())}(?![\\p{L}\\p{N}])`, g.category === 'Capitalisation' ? 'gu' : 'giu');
    out = out.replace(re, g.after.trim());
  }
  return out;
}

// ACTFL-style tolerance: how much a polish point costs, by learner level and severity.
const PENALTY = {
  A1: { mechanics: 1, local: 3, global: 10 },
  A2: { mechanics: 1, local: 3, global: 10 },
  B1: { mechanics: 3, local: 6, global: 10 },
  B2: { mechanics: 4, local: 10, global: 12 },
  C1: { mechanics: 4, local: 10, global: 12 },
  C2: { mechanics: 4, local: 10, global: 12 },
};
const ADVANCED = new Set(['B2', 'C1', 'C2']);

export function heuristicFeedback({ mode, text, level, task = {}, durationSec }: { mode: string; text: string; level: string; task?: any; durationSec?: number }) {
  // Speech-to-text output has no reliable capitals/punctuation, so skip mechanics for speaking.
  // The rule set only catches slips that keep the meaning clear, so every item is "local".
  const grammar = analyzeGrammar(text)
    .filter((g) => mode !== 'speaking' || !MECHANICS.has(g.category))
    .sort((a, b) => Number(MECHANICS.has(a.category)) - Number(MECHANICS.has(b.category)))
    .slice(0, 8)
    .map((g) => ({ ...g, severity: 'local', ipa: ipaFor(g.after)?.ipa ?? '' }));
  const vocabulary = suggestUpgrades(text, level);
  const tone = analyzeTone(text, task);
  const estimatedLevel = estimateLevel(text);
  const wc = words(text).length;
  const pen = PENALTY[level] ?? PENALTY.A1;

  let score = 100 - grammar.reduce((sum, g) => sum + (MECHANICS.has(g.category) ? pen.mechanics : pen[g.severity]), 0);
  if (task.minWords && wc < task.minWords) score -= Math.round(((task.minWords - wc) / task.minWords) * 40);

  // B2-C2: sociolinguistic appropriacy is required, not optional.
  if (task.register && task.register !== tone.register) {
    score -= ADVANCED.has(level) ? 15 : 5;
    if (ADVANCED.has(level)) tone.notes.unshift(`Sociolinguistic appropriacy: this task needs a ${task.register} register. At ${level}, matching tone to reader and purpose is part of the score.`);
  }
  const contractions = (text.match(/\b\w+'(m|re|s|ve|ll|d|t)\b/gi) ?? []).length;
  if (ADVANCED.has(level) && task.register === 'formal' && contractions) {
    score -= 5;
    tone.notes.push(`Formal register: write contractions in full (${contractions} found), e.g. "I am" rather than "I'm".`);
  }
  score = Math.max(10, Math.min(100, score));

  const result: any = {
    source: 'heuristic',
    score,
    estimatedLevel,
    grammar,
    vocabulary,
    tone,
    pronunciation: pronunciationWatch(text),
    strengths: findStrengths(text, grammar, task),
    recast: grammar.length ? recastText(text, grammar) : '',
    summary:
      grammar.length === 0
        ? 'Nothing to polish in the patterns I check. Great work! (The offline checker only knows common patterns; add a Gemini API key for full feedback.)'
        : ['A1', 'A2'].includes(level)
          ? `Your message comes across clearly. ${grammar.length} small polish point${grammar.length === 1 ? '' : 's'} for the next level, shown in the natural version below.`
          : `${grammar.length} next-level polish point${grammar.length === 1 ? '' : 's'}. Start with ${grammar[0].category.toLowerCase()}.`,
  };
  result.strength = result.strengths[0];
  if (mode === 'speaking') result.speaking = speakingMetrics(text, durationSec);
  return result;
}
