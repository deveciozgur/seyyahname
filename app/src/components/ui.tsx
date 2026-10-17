'use client';

import { motion } from 'motion/react';
import { BookOpenText, PenNib, Headphones, Microphone, CheckCircle, TrendUp, FileText, WarningCircle, Check, SealCheck } from '@phosphor-icons/react';
import { FUNCTIONS, FUNCTION_INFO, LEVELS, MASTERY, band, cap, canDoStatement, levelIndex } from '@/lib/cefr';
import { WinsBurst } from './momentum';
import { canDoById } from '@/lib/core/curriculum';
import { FUNCTION_TR, fnTr, skillTr, themeTr } from '@/lib/tr';

export const SKILL_ICONS = { reading: BookOpenText, writing: PenNib, listening: Headphones, speaking: Microphone };

// Static class maps so Tailwind can see every class name.
const BAND = {
  amber: { text: 'text-amber', soft: 'bg-amber-soft', fill: 'bg-amber', ring: 'ring-amber/30' },
  emerald: { text: 'text-emerald', soft: 'bg-emerald-soft', fill: 'bg-emerald', ring: 'ring-emerald/30' },
  indigo: { text: 'text-indigo', soft: 'bg-indigo-soft', fill: 'bg-indigo', ring: 'ring-indigo/30' },
};
export const bandClasses = (level) => BAND[band(level)];

export function LevelBadge({ level, size = 'sm', className = '' }) {
  const b = bandClasses(level);
  const sz = size === 'lg' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-[11px]';
  return <span className={`inline-flex items-center rounded-full font-mono font-medium tracking-wide ${b.soft} ${b.text} ${sz} ${className}`}>{level}</span>;
}

/** Six ticks from A1 to C2, filled up to the current level. */
export function CefrLadder({ level, label }) {
  const idx = levelIndex(level);
  const b = bandClasses(level);
  return (
    <div className="flex items-center gap-[3px]" role="meter" aria-label={label ?? `Seviye ${level}`} aria-valuemin={1} aria-valuemax={6} aria-valuenow={idx + 1} aria-valuetext={level}>
      {LEVELS.map((l, i) => (
        <span key={l} title={l} className={`h-[5px] flex-1 rounded-full transition-colors duration-500 ${i <= idx ? b.fill : 'bg-line'}`} />
      ))}
    </div>
  );
}

export function Panel({ as: Tag = 'div', className = '', children, ...props }: { as?: React.ElementType; className?: string; children?: React.ReactNode; [prop: string]: unknown }) {
  return (
    <Tag className={`rounded-[14px] border border-line bg-raised shadow-paper ${className}`} {...props}>
      {children}
    </Tag>
  );
}

const BTN = {
  primary: 'bg-ink text-paper hover:bg-ink-2 disabled:bg-line-strong disabled:text-paper',
  secondary: 'border border-line-strong bg-sunk/50 text-ink hover:border-ink-3 hover:bg-hover disabled:text-ink-3 disabled:border-line',
  ghost: 'text-ink-2 hover:bg-hover hover:text-ink disabled:text-ink-3',
  danger: 'bg-brick text-paper hover:opacity-90',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4 text-sm';
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 ease-out-quint active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${BTN[variant]} ${sz} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Segmented control with a sliding indicator (shared layout animation). */
export function Segmented({ id, items, value, onChange, size = 'md', className = '' }) {
  return (
    <div role="tablist" className={`inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-line bg-sunk/60 p-1 ${className}`}>
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${size === 'sm' ? 'h-7 px-3 text-[12.5px]' : 'h-9 px-3 text-sm sm:px-4'} ${active ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full border border-line bg-raised shadow-paper" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {it.icon && <it.icon size={size === 'sm' ? 14 : 16} weight={active ? 'fill' : 'regular'} aria-hidden className={size === 'sm' ? '' : 'hidden sm:block'} />}
              {it.label}
              {it.count != null && <span className={`font-mono text-[11px] ${active ? 'text-ink-2' : 'text-ink-3'}`}>{it.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Large score numeral with a hairline arc. */
export function Score({ value, label = 'puan' }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const tone = value >= MASTERY ? 'text-emerald' : 'text-amber';
  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center" role="img" aria-label={`${label} ${value} / 100`}>
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
        <circle cx="30" cy="30" r={r} strokeWidth="1.5" className="fill-none stroke-line" />
        <motion.circle
          cx="30"
          cy="30"
          r={r}
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`fill-none stroke-current ${tone}`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
        />
      </svg>
      <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-sunk ${className}`} />;
}

/** Confirms which state files an activity wrote, the level outcome, and ledger changes. */
export function SaveReceipt({ result, error }) {
  if (error)
    return (
      <p className="flex items-start gap-2 text-sm text-brick" role="alert">
        <WarningCircle size={18} className="mt-px shrink-0" /> İlerleme kaydedilemedi: {error}
      </p>
    );
  if (!result) return null;
  const { bandChange, files, loggedErrors = [], addedWords = [], functions, canDo, credited = [], resolvedErrors = [] } = result;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-3 text-sm" role="status">
      <WinsBurst motivation={result.motivation} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald">
          <CheckCircle size={18} weight="fill" /> Kaydedildi
        </span>
        {bandChange ? (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <TrendUp size={16} /> {skillTr(bandChange.skill)} {bandChange.from} → {bandChange.to}
          </span>
        ) : (
          functions && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3" title={`${functions.band} bandından sonraki alt banda doğru tamamlanan fonksiyonel görevler`}>
              {FUNCTIONS.map((f) => (
                <span key={f} className={`grid size-[18px] place-items-center rounded-full font-mono text-[9.5px] font-semibold ${functions.done.includes(f) ? 'bg-emerald text-paper' : 'border border-dashed border-line-strong'}`}>
                  {FUNCTION_INFO[f].short}
                </span>
              ))}
              {functions.band} bandında
            </span>
          )
        )}
        {addedWords.length > 0 && <span className="text-ink-3">{addedWords.length} yeni kelime</span>}
        {loggedErrors.length > 0 && <span className="text-ink-3">{loggedErrors.length} kalıp deftere yazıldı</span>}
      </div>
      {canDo && (
        <p className="flex items-start gap-1.5 font-medium text-emerald">
          <SealCheck size={17} weight="fill" className="mt-px shrink-0" /> Can-Do kazanıldı: <span className="font-normal text-ink">{canDo}</span>
        </p>
      )}
      {result.curriculum?.levelUp && (
        <p className="flex items-start gap-1.5 font-medium text-amber">
          <TrendUp size={17} className="mt-px shrink-0" /> Müfredat: {result.curriculum.levelUp.from} → {result.curriculum.levelUp.to} bandı açıldı
        </p>
      )}
      {result.curriculum?.credited?.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
          <span>Can-Do ilerlemesi:</span>
          {result.curriculum.credited.map((c) => (
            <span key={c.id} title={c.text} className="font-mono text-ink-2">
              {c.id} {c.count}/3
            </span>
          ))}
        </p>
      )}
      {(credited.length > 0 || resolvedErrors.length > 0) && (
        <p className="text-ink-2">
          {resolvedErrors.length > 0 && <span className="font-medium text-emerald">Çözüldü: {resolvedErrors.map((e) => e.after).join(', ')}. </span>}
          {credited.filter((e) => !resolvedErrors.some((r) => r.id === e.id)).map((e) => `"${e.after}" doğru kullanıldı (${e.streak}/3)`).join(', ')}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {files.map((f) => (
          <span key={f} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-ink-3">
            <FileText size={12} /> {f}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function TaskPicker({ tasks, index, onChange, passedIds = [] }) {
  if (tasks.length < 2) return null;
  return (
    <div className="flex flex-wrap justify-end gap-1" aria-label="Görev seç">
      {tasks.map((t, i) => {
        const passed = passedIds.includes(t.id);
        return (
          <button
            key={t.id}
            onClick={() => onChange(i)}
            title={`${t.title}${passed ? ' (%80+ ile geçildi)' : ''}`}
            aria-pressed={i === index}
            aria-label={`Görev ${i + 1}${passed ? ', geçildi' : ''}`}
            className={`relative grid size-7 place-items-center rounded-full font-mono text-xs transition-colors ${i === index ? 'bg-ink text-paper' : passed ? 'bg-emerald-soft text-emerald' : 'text-ink-3 hover:bg-hover hover:text-ink'}`}
          >
            {passed && i !== index ? <Check size={13} weight="bold" /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

/** Turkish support line for A1–A2 learners. */
export function TurkishHint({ children, className = '' }) {
  if (!children) return null;
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="rounded-full bg-sunk px-1.5 py-px font-mono text-[10px] text-ink-3" aria-label="Türkçe">
        TR
      </span>
      <span lang="tr" className="text-[14px] text-ink-3">
        {children}
      </span>
    </span>
  );
}

const THEME_TONE = { Gaming: 'text-indigo', Travel: 'text-emerald', Tech: 'text-indigo', Culture: 'text-amber', 'Daily life': 'text-ink-2' };

export function TaskTitle({ level, title, theme, hook, fn, skill, canDoId = null, children }) {
  // Curriculum practice tasks name their own Can-Do; the rest use the skill/level/function statement.
  const canDo = canDoId ? `${canDoId}: ${canDoById(canDoId)?.text ?? ''}` : fn && skill ? canDoStatement(skill, level, fn) : '';
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <LevelBadge level={level} />
          <h2 className="truncate text-[22px] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
        </div>
        {children}
      </div>
      {(theme || hook) && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
          {theme && <span className={`text-[12px] font-semibold ${THEME_TONE[theme] ?? 'text-ink-2'}`}>{themeTr(theme)}</span>}
          {hook && <span className="text-ink-2">{hook}</span>}
        </p>
      )}
      {fn && (
        <p className="flex items-start gap-2 text-[12.5px] text-ink-3" title={FUNCTION_TR[fn]?.about}>
          <span className="shrink-0 rounded-full border border-line bg-sunk px-2 py-0.5 font-medium text-ink-2">{fnTr(fn)}</span>
          <span>{canDo}</span>
        </p>
      )}
    </div>
  );
}
