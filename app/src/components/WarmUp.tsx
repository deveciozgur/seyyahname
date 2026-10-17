'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowsClockwise, Eye, ArrowRight, Timer, Plus, Check, Path } from '@phosphor-icons/react';
import { api } from '@/api';
import { readStored, writeStored } from '@/lib/useActivity';
import { Button, LevelBadge, Panel } from './ui';
import { stageLabel } from '@/lib/labels';
import { suggestedWords } from '@/lib/core/curriculum';
import { bandLevel } from '@/lib/cefr-data';

const ease = [0.16, 1, 0.3, 1] as const;
const todayKey = () => new Date().toLocaleDateString('sv-SE');
const WARMUP_SECONDS = 180;

// SM-2 grades (quality 1, 3, 4, 5); the Vault flashcards use the full 0-5 scale.
const GRADES = [
  { id: 'again', label: 'Again', description: "Didn't remember (SM-2: 1)", variant: 'secondary' },
  { id: 'hard', label: 'Hard', description: 'Remembered with effort (SM-2: 3)', variant: 'secondary' },
  { id: 'good', label: 'Good', description: 'Remembered after a moment (SM-2: 4)', variant: 'primary' },
  { id: 'easy', label: 'Easy', description: 'Remembered instantly (SM-2: 5)', variant: 'secondary' },
];

/** A meaning card for learned words; an upgrade card for the learner's own words that got a stronger alternative. */
export function CardFace({ card, revealed }) {
  const isUpgrade = !card.meaning;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[13px] text-ink-3">
        {card.cefr && <LevelBadge level={card.cefr} />}
        <span>{isUpgrade ? 'Say a stronger alternative:' : 'What does it mean? Use it in a sentence.'}</span>
        <span className="ml-auto font-mono text-[11px]" title={`SM-2 ease factor ${card.ease}`}>
          {stageLabel(card.stage)} · ease {card.ease}
        </span>
      </div>
      <p className="text-[36px] leading-tight font-semibold tracking-[-0.03em]">{card.original}</p>
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
            <div className="space-y-1.5 border-t border-line pt-4">
              {isUpgrade ? (
                <p className="flex items-center gap-2 text-2xl font-semibold text-emerald">
                  <ArrowRight size={18} /> {card.upgraded}
                </p>
              ) : (
                <p className="text-lg">
                  {card.meaning}
                </p>
              )}
              {card.example && <p className="text-[15px] text-ink-2">&ldquo;{card.example}&rdquo;</p>}
              {!isUpgrade && card.upgraded && <p className="text-[13px] text-indigo">Level up: {card.upgraded}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Curriculum vocabulary for the warm-up: up to 3 words from the active band's lexical domains that are
 * not in vocabulary.md yet. Adding one writes a new SM-2 row (EF 2.50, 0 reps, 1d), due tomorrow.
 */
export function CurriculumWords({ band, refreshKey, onAdded = null }: { band: string; refreshKey: number; onAdded?: (() => void) | null }) {
  const [words, setWords] = useState(null);
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .vocabulary()
      .then((rows) => setWords(suggestedWords(band, rows.map((r) => r.original), 3)))
      .catch(() => setWords([]));
  }, [band, refreshKey]);

  if (!words?.length) return null;

  async function add(items) {
    setError(null);
    try {
      await api.addVocabulary(items.map((w) => ({ word: w.word, meaning: w.meaning, cefr: bandLevel(w.band), example: w.example })));
      setAdded((a) => [...a, ...items.map((w) => w.word)]);
      onAdded?.();
    } catch (e) {
      setError(e.message);
    }
  }

  const open = words.filter((w) => !added.includes(w.word));
  return (
    <section aria-label="Curriculum word suggestions" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-dashed border-line-strong px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
        <Path size={15} className="text-amber" /> From the {band} curriculum:
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {words.map((w) => {
          const done = added.includes(w.word);
          return (
            <li key={w.word}>
              <button
                onClick={() => !done && add([w])}
                disabled={done}
                title={`${w.meaning} · ${w.example}`}
                className={`inline-flex items-start gap-1.5 rounded-2xl px-3 py-1.5 text-left text-[12.5px] leading-snug transition-colors ${done ? 'bg-emerald-soft text-emerald' : 'border border-line-strong text-ink-2 hover:bg-hover hover:text-ink'}`}
              >
                {done ? <Check size={12} className="mt-[3px] shrink-0" /> : <Plus size={12} className="mt-[3px] shrink-0" />}
                <span>
                  {w.word} <span className="text-ink-3">· {w.meaning}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {open.length > 1 && (
        <button onClick={() => add(open)} className="text-[12.5px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
          Add all
        </button>
      )}
      <span className="basis-full text-[12px] text-ink-3">{added.length ? 'Added. You’ll see them in tomorrow’s warm-up.' : 'Words you add to the vault join tomorrow’s warm-up.'}</span>
      {error && <span className="basis-full text-[12px] text-brick">{error}</span>}
    </section>
  );
}

/**
 * SM-2 warm-up: the first three minutes of the day go to due vocabulary (CLAUDE.md, section 1).
 * Results update vocabulary.md, profile.json (srs_queue, history, XP) and today's session log.
 */
export default function WarmUp({ refreshKey, onReviewed }) {
  const [cards, setCards] = useState(null);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [left, setLeft] = useState(WARMUP_SECONDS);
  const [skipped, setSkipped] = useState(() => readStored('coach.warmup.skipped', '') === todayKey());
  const timer = useRef(null);

  useEffect(() => {
    if (results.length) return; // keep the finished state until the next day
    api
      .dueVocabulary()
      .then(setCards)
      .catch((e) => setError(e.message));
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = cards?.length > 0 && !skipped;
  useEffect(() => {
    if (!active) return undefined;
    timer.current = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer.current);
  }, [active]);

  if (error) return <p className="text-sm text-brick">The warm-up isn’t available right now: {error}</p>;
  if (!cards || skipped) return null;
  if (!cards.length && !results.length) {
    return <p className="text-[13px] text-ink-3">No words are due today. New words from today’s tasks will show up tomorrow.</p>;
  }

  // The warm-up ends when the cards run out or the three minutes are up (the current card is finished first).
  const done = i >= cards.length || (left === 0 && !revealed && results.length > 0);
  if (done && timer.current) clearInterval(timer.current);

  async function grade(g) {
    setBusy(true);
    try {
      const r = await api.reviewVocabulary(cards[i].original, g);
      setResults((rs) => [...rs, { word: cards[i].original, grade: g, stage: r.entry.stage }]);
      onReviewed?.(r);
      setRevealed(false);
      setI((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    writeStored('coach.warmup.skipped', todayKey());
    setSkipped(true);
  }

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <Panel as="section" aria-label="Spaced repetition warm-up" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3.5">
        <ArrowsClockwise size={18} className="text-amber" />
        <h2 className="text-sm font-semibold">Warm-up</h2>
        <span className="text-[13px] text-ink-3">{done ? 'Done for today' : `Word ${i + 1} of ${cards.length}`}</span>
        {!done && (
          <span className="inline-flex items-center gap-1 font-mono text-[12px] text-ink-3" aria-label={`${mm} left`}>
            <Timer size={13} /> {mm}
          </span>
        )}
        {!done && (
          <button onClick={skip} className="ml-auto text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            Skip today
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        {done ? (
          <div className="space-y-3">
            <p className="text-xl font-semibold tracking-[-0.02em]">Warm-up done. Your memory just got a little stronger.</p>
            <ul className="flex flex-wrap gap-2">
              {results.map((r) => (
                <li key={r.word} className={`rounded-full px-3 py-1 text-[13px] ${r.grade === 'again' ? 'bg-amber-soft text-amber' : 'bg-emerald-soft text-emerald'}`}>
                  {r.word}: {r.grade === 'again' ? 'back tomorrow' : `next in ${stageLabel(r.stage)}`}
                </li>
              ))}
            </ul>
            {i < cards.length && <p className="text-[13px] text-ink-3">{cards.length - i} more {cards.length - i === 1 ? 'word is' : 'words are'} waiting; they’ll come first tomorrow.</p>}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={cards[i].original} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3, ease }} className="space-y-5">
              <CardFace card={cards[i]} revealed={revealed} />
              {!revealed ? (
                <Button variant="secondary" onClick={() => setRevealed(true)}>
                  <Eye size={16} /> Show answer
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2" role="group" aria-label="How well did you remember it?">
                  {GRADES.map((g) => (
                    <Button key={g.id} variant={g.variant} onClick={() => grade(g.id)} disabled={busy} title={g.description}>
                      {g.label}
                      <span className="font-mono text-[11px] opacity-70">{stageLabel(cards[i].preview?.[g.id])}</span>
                    </Button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Panel>
  );
}
