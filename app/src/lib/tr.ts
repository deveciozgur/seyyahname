// Turkish interface strings. The learning content (tasks, texts, feedback, Can-Do statements) stays
// in English; the coach files (profile.json history, session logs) also keep their English labels,
// so they are translated here, at display time, instead of being rewritten on disk.

export const SKILL_TR: Record<string, string> = { reading: 'Okuma', writing: 'Yazma', listening: 'Dinleme', speaking: 'Konuşma' };
export const skillTr = (s: string) => SKILL_TR[s] ?? s;

export const FUNCTION_TR: Record<string, { label: string; about: string }> = {
  transactional: { label: 'İşlemsel', about: 'İş halletme: bilgi alma-verme, hizmet, randevu.' },
  interactional: { label: 'Etkileşimsel', about: 'İlişki kurma: tanışma, haber verme, kişisel hikâyeler.' },
  evaluative: { label: 'Değerlendirici', about: 'Görüş, duygu ve karşılaştırma ifade etme ve anlama.' },
};
export const fnTr = (f: string) => FUNCTION_TR[f]?.label ?? f;

/** "3d" -> "3 gün" (SM-2 interval stages). */
export const stageTr = (stage: string) => String(stage ?? '').replace(/^(\d+)d$/, '$1 gün');

const MILESTONES_TR: Record<string, string> = {
  'First steps: your first practice': 'İlk adım: ilk çalışman',
  'Memory spark: first spaced review': 'Hafıza kıvılcımı: ilk aralıklı tekrar',
  'Three-day streak': 'Üç günlük seri',
  'One-week streak': 'Bir haftalık seri',
  'Thirty-day streak': 'Otuz günlük seri',
  '10 words in your vault': 'Kasada 10 kelime',
  '25 words in your vault': 'Kasada 25 kelime',
  '50 words in your vault': 'Kasada 50 kelime',
  'First 80%+ score': 'İlk %80+ puan',
  'Perfect score': 'Kusursuz puan',
  'First linking word used': 'İlk bağlaç kullanımı',
  'First Can-Do statement achieved': 'İlk Can-Do kazanımı',
  'First sub-band step': 'İlk alt bant adımı',
  'First skill level up': 'İlk beceri seviye atlaması',
  'First pattern mastered': 'İlk kalıpta ustalaşma',
  'All four skills in one day': 'Bir günde dört beceri',
  'Brave attempt: 80%+ above your level': 'Cesur deneme: seviyenin üstünde %80+',
  'Low-effort win: first quick play': 'Hafif tur: ilk hızlı oyun',
};

const SKILL_EN = '(Reading|Writing|Listening|Speaking)';
const FN_EN = '(Transactional|Interactional|Evaluative)';
const fnFromLabel = (s: string) => fnTr(s.toLowerCase());
const skillFromLabel = (s: string) => skillTr(s.toLowerCase());

const RULES: [RegExp, (...m: string[]) => string][] = [
  [/^Day 1: streak started$/, () => '1. gün: seri başladı'],
  [/^\+1 daily streak: day (\d+)$/, (_, d) => `+1 gün: ${d} günlük seri`],
  [/^Showed up today$/, () => 'Bugün de buradasın'],
  [new RegExp(`^${SKILL_EN} task done$`), (_, s) => `${skillFromLabel(s)} görevi tamamlandı`],
  [/^Perfect (\d+)% on (.+)$/, (_, n, t) => `Kusursuz %${n}: ${t}`],
  [/^(\d+)% on (.+)$/, (_, n, t) => `%${n}: ${t}`],
  [new RegExp(`^${FN_EN} task cleared at (.+)$`), (_, f, b) => `${fnFromLabel(f)} görev tamam (${b})`],
  [/^Can-Do: (.+)$/, (_, c) => `Can-Do kazanıldı: ${c}`],
  [/^(\d+) new words? added to your vault$/, (_, n) => `Kasaya ${n} yeni kelime eklendi`],
  [/^Used correctly: (.+)$/, (_, w) => `Doğru kullandın: ${w}`],
  [/^Mastered: (.+)$/, (_, w) => `Ustalaştın: ${w}`],
  [/^Curriculum reached (.+)$/, (_, b) => `Müfredat ${b} bandına ulaştı`],
  [new RegExp(`^${SKILL_EN} reached (.+)$`), (_, s, b) => `${skillFromLabel(s)} ${b} seviyesine ulaştı`],
  [/^Brave attempt above your level$/, () => 'Seviyenin üstünde cesur deneme'],
  [/^Recalled "(.+)" \(next in (.+)\)$/, (_, w, st) => `"${w}" hatırlandı (sonraki: ${stageTr(st)})`],
  [/^Reviewed "(.+)" \(back tomorrow\)$/, (_, w) => `"${w}" tekrar edildi (yarın yeniden)`],
  [/^Quick play: (\d+)\/(\d+)$/, (_, a, b) => `Hızlı tur: ${a}/${b}`],
];

/** Translates a win / milestone label from the coach files for display. Unknown labels pass through. */
export function winLabelTr(label: string): string {
  if (MILESTONES_TR[label]) return MILESTONES_TR[label];
  for (const [re, fn] of RULES) {
    const m = re.exec(label);
    if (m) return fn(...m);
  }
  return label;
}

/** Turkish date, e.g. "17 Eki 2026 Cum". */
export const dateTr = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('tr-TR', opts);

export const THEME_TR: Record<string, string> = { Gaming: 'Oyun', Travel: 'Seyahat', Tech: 'Teknoloji', Culture: 'Kültür', 'Daily life': 'Günlük yaşam' };
export const themeTr = (t: string) => THEME_TR[t] ?? t;

export const plural = (n: number, word: string) => `${n} ${word}`;
