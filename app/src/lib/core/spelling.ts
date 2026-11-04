// British → US spelling for answer matching. The app writes US English, but Turkish schools often teach
// British spelling, so typed answers are compared after mapping the common British patterns to US ones.
// -our is limited to known stems, so four, hour, your and tour stay as they are.

type Rule = [RegExp, string | ((match: string, ...groups: string[]) => string)];

const UK_TO_US: Rule[] = [
  [/\b(favo|colo|neighbo|humo|hono|flavo|behavio|labo|harbo|rumo|savo|vapo|vigo|ardo|cando|endeavo|odo|parlo|rigo|splendo|tumo)ur/g, '$1r'],
  [/\b(cent|theat|met|lit|fib|somb|spect|calib)re(s|d)?\b/g, (_, stem, end) => `${stem}er${end === 'd' ? 'ed' : (end ?? '')}`],
  [
    /\b(real|recogn|organ|summar|apolog|memor|personal|custom|optim|priorit|emphas|critic|special|categor|minim|familiar|visual|final|util|standard|modern|sympath|fantas|harmon|mobil|normal|popular)is(e|es|ed|ing|ation|ations)\b/g,
    '$1iz$2',
  ],
  [/\b(anal|paral)ys(e|es|ed|ing)\b/g, '$1yz$2'],
  [/\bpractis(e|es|ed|ing)\b/g, 'practic$1'],
  [/\b(travel|cancel|model|label|fuel|level|signal|total|marvel|quarrel)l(ed|ing|er|ers)\b/g, '$1$2'],
  [/\b(defen|offen|licen|preten)ce\b/g, '$1se'],
];

/** Error-ledger category for capital letters. Ledgers written before the US-English pass say "Capitalisation". */
export const CAPITALIZATION = 'Capitalization';
export const isCapitalization = (category?: string | null) => category === CAPITALIZATION || category === 'Capitalisation';

/** Maps British spellings in lower-case text to US ones ("favourite colour" → "favorite color"). */
export function usSpelling(text: string): string {
  let out = text;
  for (const [re, to] of UK_TO_US) out = typeof to === 'string' ? out.replace(re, to) : out.replace(re, to);
  return out;
}
