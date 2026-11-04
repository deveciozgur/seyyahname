'use client';

import { motion } from 'motion/react';
import {
  Flame,
  Sparkle,
  CheckCircle,
  Star,
  Target,
  BookmarkSimple,
  MagicWand,
  Trophy,
  TrendUp,
  Rocket,
  Medal,
  ArrowsClockwise,
  GameController,
  SealCheck,
} from '@phosphor-icons/react';
import { BANDS, FUNCTIONS, SKILLS } from '@/lib/cefr';

const ease = [0.16, 1, 0.3, 1] as const;

const WIN_STYLE = {
  streak: { icon: Flame, tone: 'amber' },
  effort: { icon: Sparkle, tone: 'amber' },
  complete: { icon: CheckCircle, tone: 'emerald' },
  score: { icon: Star, tone: 'amber' },
  context: { icon: Target, tone: 'emerald' },
  words: { icon: BookmarkSimple, tone: 'indigo' },
  polish: { icon: MagicWand, tone: 'emerald' },
  resolved: { icon: Trophy, tone: 'amber' },
  level: { icon: TrendUp, tone: 'emerald' },
  brave: { icon: Rocket, tone: 'indigo' },
  milestone: { icon: Medal, tone: 'amber' },
  review: { icon: ArrowsClockwise, tone: 'indigo' },
  quickplay: { icon: GameController, tone: 'indigo' },
  cando: { icon: SealCheck, tone: 'emerald' },
};
const TONE = {
  amber: 'bg-amber-soft text-amber ring-amber/25',
  emerald: 'bg-emerald-soft text-emerald ring-emerald/25',
  indigo: 'bg-indigo-soft text-indigo ring-indigo/25',
};

/** Guess a win's kind from its label (history stores labels only). */
export function kindFromLabel(label) {
  const l = label.toLowerCase();
  if (l.startsWith('can-do')) return 'cando';
  if (l.includes('streak')) return 'streak';
  if (l.startsWith('showed up')) return 'effort';
  if (l.startsWith('context') || l.includes('task cleared')) return 'context';
  if (l.includes('word')) return 'words';
  if (l.startsWith('used correctly')) return 'polish';
  if (l.startsWith('mastered')) return 'resolved';
  if (l.includes(' reached ')) return 'level';
  if (l.startsWith('brave')) return 'brave';
  if (l.startsWith('recalled') || l.startsWith('reviewed')) return 'review';
  if (l.startsWith('quick play')) return 'quickplay';
  if (l.includes('task done')) return 'complete';
  if (/%/.test(l)) return 'score';
  return 'milestone';
}

export function WinBadge({ win, index = 0, size = 'md' }) {
  const kind = win.kind ?? kindFromLabel(win.label);
  const { icon: Icon, tone } = WIN_STYLE[kind] ?? WIN_STYLE.milestone;
  const shiny = kind === 'milestone' || kind === 'level' || kind === 'resolved';
  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22, delay: index * 0.07 }}
      className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full ring-1 ring-inset ${TONE[tone]} ${shiny ? 'shine' : ''} ${size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'} font-medium`}
    >
      <Icon size={size === 'sm' ? 13 : 15} weight="fill" aria-hidden />
      <span className="text-ink">{win.label}</span>
      {win.points != null && <span className="font-mono text-[12px] opacity-80">+{win.points}</span>}
    </motion.li>
  );
}

/** The micro-wins of one activity, shown right after it is saved. */
export function WinsBurst({ motivation }) {
  if (!motivation?.wins?.length) return null;
  return (
    <div className="space-y-2.5" role="status" aria-label="Wins">
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-[-0.02em] text-amber tabular-nums">+{motivation.points}</span>
        <span className="text-sm text-ink-2">XP, {motivation.wins.length} {motivation.wins.length === 1 ? 'win' : 'wins'}</span>
      </motion.div>
      <ul className="flex flex-wrap gap-1.5">
        {motivation.wins.map((w, i) => (
          <WinBadge key={`${w.label}-${i}`} win={w} index={i} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Progress units toward the next overall sub-band. The overall band is the floor of the four skills' average,
 * so it moves when the skills together are 4 sub-band steps above it: each step counts as 3 units and each
 * filled function slot in a skill's current band as 1, out of 12.
 */
export function slotsFilled(profile) {
  const base = BANDS.indexOf(profile.sub_band);
  const units = SKILLS.reduce((n, s) => {
    const band = profile.skill_bands[s];
    const prog = profile.progress?.[s]?.[band] ?? {};
    return n + Math.max(0, BANDS.indexOf(band) - base) * 3 + FUNCTIONS.filter((f) => prog[f]).length;
  }, 0);
  return Math.min(12, units);
}
