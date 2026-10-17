'use client';

import { motion } from 'motion/react';
import {
  Flame,
  Lightning,
  Smiley,
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
import { BANDS, FUNCTIONS, SKILLS, nextBand } from '@/lib/cefr';


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
      {win.points != null && <span className="font-mono text-[11px] opacity-80">+{win.points}</span>}
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

/**
 * Live progress toward the next sub-band: each passed Transactional, Interactional or Evaluative task
 * in a skill fills one of 12 slots (CLAUDE.md, section 3).
 */
export function MomentumBar({ profile, compact = false }) {
  const from = profile.sub_band;
  const to = nextBand(from);
  const filled = slotsFilled(profile);
  const value = filled / 12;
  const detail = `${filled}/12 functional steps`;

  return (
    <div className="space-y-1.5" aria-label={`Progress ${from} → ${to}: ${detail}`}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-mono font-medium">
          {from} <span className="text-ink-3">→</span> {to}
        </span>
        <span className="text-ink-3">{detail}</span>
      </div>
      <div className={`relative overflow-hidden rounded-full bg-line ${compact ? 'h-1.5' : 'h-2.5'}`}>
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-amber"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.02, value) }}
          transition={{ duration: 1, ease }}
        />
        <motion.div
          key={detail}
          className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ left: '-10%', opacity: 0.9 }}
          animate={{ left: '110%', opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function MomentumStats({ profile }) {
  const g = profile.gamification ?? {};
  const items = [
    { icon: Flame, label: 'Streak (days)', value: g.streak_days ?? 0, tone: 'text-amber' },
    { icon: Lightning, label: 'Total XP', value: g.xp_total ?? 0, tone: 'text-amber' },
    { icon: Smiley, label: 'Confidence', value: `${g.confidence_index ?? 80}`, tone: 'text-emerald' },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="rounded-[10px] bg-sunk/60 px-2.5 py-2">
          <dt className="flex items-center gap-1 text-[10.5px] text-ink-3">
            <Icon size={12} weight="fill" className={tone} /> {label}
          </dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
