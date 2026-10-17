'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cards, Eye, CheckCircle } from '@phosphor-icons/react';
import { api } from '@/api';
import { CardFace } from './WarmUp';
import { Button, Panel, Skeleton } from './ui';
import { stageLabel } from '@/lib/labels';

const ease = [0.16, 1, 0.3, 1] as const;

// The full SM-2 quality scale. 0-2 send the card back to 1 day, 3 keeps the interval,
// 4 climbs one step of the 1-3-7-14-30 ladder, 5 skips a step.
const QUALITIES = [
  { q: 0, label: 'Blank', description: 'No idea at all', tone: 'lapse' },
  { q: 1, label: 'Wrong', description: 'Wrong, but I recognized the answer', tone: 'lapse' },
  { q: 2, label: 'Almost', description: 'Wrong, but very close', tone: 'lapse' },
  { q: 3, label: 'Hard', description: 'Right, but it took effort', tone: 'hard' },
  { q: 4, label: 'Good', description: 'Right, after a moment', tone: 'good' },
  { q: 5, label: 'Perfect', description: 'Instant and effortless', tone: 'good' },
] as const;

const TONE = {
  lapse: 'border-line-strong bg-sunk/50 hover:border-brick hover:text-brick',
  hard: 'border-line-strong bg-sunk/50 hover:border-amber hover:text-amber',
  good: 'border-line-strong bg-sunk/50 hover:border-emerald hover:text-emerald',
};

type Card = { original: string; meaning?: string; upgraded?: string; example?: string; cefr?: string; stage: string; ease: string; preview?: Record<string, string> };
type Result = { word: string; q: number; stage: string };

/** Vault review session: every due card as a flashcard, graded on the 0-5 SM-2 scale. */
export default function Flashcards({ onReviewed }: { onReviewed?: (r: { profile: unknown }) => void }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dueVocabulary('vault')
      .then(setCards)
      .catch((e) => setError(e.message));
  }, []);

  async function grade(q: number) {
    setBusy(true);
    try {
      const r = await api.reviewVocabulary(cards[i].original, q);
      setResults((rs) => [...rs, { word: cards[i].original, q, stage: r.entry.stage }]);
      onReviewed?.(r);
      setRevealed(false);
      setI((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-sm text-brick" role="alert">{error}</p>;
  if (!cards) return <Skeleton className="h-72 w-full rounded-[14px]" />;

  if (!cards.length && !results.length) {
    return (
      <Panel className="flex flex-col items-start gap-3 px-5 py-8 sm:px-6 sm:py-10">
        <CheckCircle size={28} className="text-emerald" />
        <p className="text-2xl font-semibold tracking-[-0.02em]">No cards are due in your vault.</p>
        <p className="max-w-md text-ink-2">Every word is resting until its next review. New words from today’s tasks will show up tomorrow.</p>
      </Panel>
    );
  }

  if (i >= cards.length) {
    const recalled = results.filter((r) => r.q >= 3).length;
    return (
      <Panel className="space-y-4 px-6 py-8">
        <p className="text-2xl font-semibold tracking-[-0.02em]">
          Round complete: you recalled {recalled} of {results.length} cards.
        </p>
        <ul className="flex flex-wrap gap-2">
          {results.map((r) => (
            <li key={r.word} className={`rounded-full px-3 py-1 text-[13px] ${r.q < 3 ? 'bg-amber-soft text-amber' : 'bg-emerald-soft text-emerald'}`}>
              {r.word}: {r.q}/5 · {r.q < 3 ? 'back tomorrow' : `next in ${stageLabel(r.stage)}`}
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  const card = cards[i];
  return (
    <Panel as="section" aria-label="Vault cards" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3.5">
        <Cards size={18} className="text-amber" />
        <h2 className="text-sm font-semibold">Card review</h2>
        <span className="text-[13px] text-ink-3">
          Card {i + 1} of {cards.length}
        </span>
        <div className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-sunk" aria-hidden>
          <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(i / cards.length) * 100}%` }} />
        </div>
      </div>
      <div className="px-6 py-7">
        <AnimatePresence mode="wait">
          <motion.div key={card.original} initial={{ opacity: 0, rotateX: -8, y: 8 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }} className="space-y-6">
            <CardFace card={card} revealed={revealed} />
            {!revealed ? (
              <Button variant="secondary" onClick={() => setRevealed(true)}>
                <Eye size={16} /> Show answer
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] text-ink-3">How well did you remember it? (SM-2 quality score, 0-5)</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="Recall quality, 0-5">
                  {QUALITIES.map(({ q, label, description, tone }) => (
                    <button
                      key={q}
                      onClick={() => grade(q)}
                      disabled={busy}
                      title={description}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-colors active:scale-[0.98] disabled:opacity-50 ${TONE[tone]}`}
                    >
                      <span className="text-2xl leading-none font-semibold tabular-nums">{q}</span>
                      <span className="text-[12px] font-medium">{label}</span>
                      <span className="font-mono text-[10.5px] text-ink-3">{stageLabel(card.preview?.[q])}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  );
}
