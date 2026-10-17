'use client';

import { ALL_CAN_DOS, canDoById } from '@/lib/core/curriculum';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Vault as VaultIcon } from '@phosphor-icons/react';
import { api } from '@/api';
import { BAND_GOALS, FUNCTIONS, LEVEL_INFO, LEVELS, SKILLS, bandLevel, levelIndex, nextBand } from '@/lib/cefr';
import { vaultStats } from '@/lib/vault';
import { fnTr, skillTr } from '@/lib/tr';
import { SKILL_ICONS } from './ui';
import { slotsFilled } from './momentum';

export { SKILL_ICONS };

const ease = [0.16, 1, 0.3, 1] as const;
const stageDone = (s) => (typeof s === 'object' && s ? s.status : s) === 'completed';
const FN_SHORT = { transactional: 'T', interactional: 'I', evaluative: 'E' };

/** The three function slots (T, I, E) a skill needs for its next sub-band. */
export function FunctionSlots({ profile, skill, size = 'sm' }) {
  const band = profile.skill_bands[skill];
  const prog = profile.progress?.[skill]?.[band] ?? {};
  return (
    <span className="inline-flex gap-1" aria-label={`${FUNCTIONS.filter((f) => prog[f]).length} of 3 function tasks done for ${nextBand(band)}`}>
      {FUNCTIONS.map((f) => (
        <span
          key={f}
          title={`${fnTr(f)}${prog[f] ? ': done' : ': needed'}`}
          className={`grid place-items-center rounded-full font-mono font-semibold ${size === 'sm' ? 'size-[18px] text-[9.5px]' : 'size-6 text-[11px]'} ${prog[f] ? 'bg-amber text-paper' : 'border border-dashed border-line-strong text-ink-3'}`}
        >
          {FN_SHORT[f]}
        </span>
      ))}
    </span>
  );
}

/** Words due now and the Vault Confidence Index (see lib/vault.ts). */
function useVault(refreshKey) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api
      .vocabulary()
      .then((rows) => setStats(vaultStats(rows)))
      .catch(() => setStats(null));
  }, [refreshKey]);
  return stats;
}

/** Concept C proficiency card: sheen band numeral, A1-C2 ladder, next sub-band goal and step count. */
function LevelCard({ profile, compact = false }) {
  const band = profile.sub_band;
  const level = bandLevel(band);
  const next = nextBand(band);
  const filled = slotsFilled(profile);
  const idx = levelIndex(profile.overall_cefr);
  return (
    <div className="edge-top rounded-[14px] border border-line bg-gradient-to-b from-sunk to-panel p-4">
      <div className="flex items-baseline gap-2">
        <span className={`text-sheen leading-none font-semibold tracking-[-0.04em] ${compact ? 'text-[36px]' : 'text-[44px]'}`}>{band}</span>
        <span className="text-[15px] font-medium text-ink-3">{LEVEL_INFO[level].name}</span>
      </div>
      <div className="mt-3.5 grid grid-cols-6 gap-[3px]" role="meter" aria-label="Overall level from A1 to C2" aria-valuemin={1} aria-valuemax={6} aria-valuenow={idx + 1} aria-valuetext={profile.overall_cefr}>
        {LEVELS.map((l, i) => (
          <i key={l} className={`h-1 rounded-full ${i <= idx ? 'bg-amber shadow-[0_0_8px_var(--glow)]' : 'bg-line-strong'}`} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-6 font-mono text-[10px] text-ink-3">
        {LEVELS.map((l) => (
          <span key={l} className={l === profile.target_cefr ? 'text-amber' : ''}>
            {l}
          </span>
        ))}
      </div>
      {next !== band && (
        <p className="mt-3 text-[13px] leading-snug text-ink-2">
          <span className="text-ink">Next: {next}</span> · {BAND_GOALS[next]}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line-strong">
          <motion.div className="h-full origin-left rounded-full bg-amber" initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0.02, filled / 12) }} transition={{ duration: 0.9, ease }} />
        </div>
        <span className="font-mono text-[11px] text-ink-3" title="Function steps toward the next sub-band">
          {filled}/12
        </span>
      </div>
    </div>
  );
}

/** Hairline 2-column stat grid (Concept C "kv"). */
function StatGrid({ profile, vault, compact = false }) {
  const g = profile.gamification ?? {};
  const items = [
    { label: 'Streak', value: g.streak_days ?? 0, unit: (g.streak_days ?? 0) === 1 ? 'day' : 'days' },
    { label: 'XP', value: g.xp_total ?? 0, unit: 'xp' },
    { label: 'Due in vault', value: vault ? vault.due : '–', unit: vault ? `/ ${vault.total}` : '', tone: vault?.due ? 'text-amber' : '' },
    { label: 'Vault confidence', value: vault?.confidence ?? '–', meter: vault?.confidence },
    ...(compact
      ? []
      : [
          { label: 'Confidence index', value: g.confidence_index ?? 80 },
          { label: 'Can-Do', value: profile.can_do_mastered.filter((c) => canDoById(c.id)).length, unit: `/ ${ALL_CAN_DOS.length}` },
        ]),
  ];
  return (
    <dl className={`grid gap-px overflow-hidden rounded-xl border border-line bg-line ${compact ? 'grid-cols-4' : 'grid-cols-2'}`}>
      {items.map((it) => (
        <div key={it.label} className={`bg-panel ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
          <dt className={`text-ink-3 ${compact ? 'truncate text-[10px]' : 'text-[11px]'}`}>{it.label}</dt>
          <dd className={`font-medium tracking-[-0.01em] tabular-nums ${compact ? 'text-[15px]' : 'text-lg'} ${it.tone ?? ''}`}>
            {it.value}
            {it.unit && <span className="ml-1 text-[11.5px] font-normal text-ink-3">{it.unit}</span>}
          </dd>
          {it.meter != null && !compact && (
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-line-strong">
              <div className="h-full rounded-full bg-indigo" style={{ width: `${it.meter}%` }} />
            </div>
          )}
        </div>
      ))}
    </dl>
  );
}

function Eyebrow({ children }) {
  return <div className="px-1.5 pb-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">{children}</div>;
}

function Skills({ profile }) {
  return (
    <section aria-labelledby="skills-h">
      <Eyebrow>
        <span id="skills-h">Skills · T I E</span>
      </Eyebrow>
      <ul className="grid gap-px">
        {SKILLS.map((s) => {
          const Icon = SKILL_ICONS[s];
          const band = profile.skill_bands[s];
          const prog = profile.progress?.[s]?.[band] ?? {};
          const st = profile.stats?.per_skill?.[s];
          return (
            <li key={s} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[13px] text-ink-2" title={st?.attempts ? `Average ${st.average_score}` : `T, I and E tasks for ${nextBand(band)}`}>
              <span className="inline-flex items-center gap-2">
                <Icon size={15} aria-hidden /> {skillTr(s)}
              </span>
              <span className="flex gap-[3px]" aria-label={`${FUNCTIONS.filter((f) => prog[f]).length}/3`}>
                {FUNCTIONS.map((f) => (
                  <i key={f} className={`size-1.5 rounded-full ${prog[f] ? 'bg-amber' : 'bg-line-strong'}`} />
                ))}
              </span>
              <span className="font-mono text-[11px] text-ink-3">{band}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Diagnostic({ diagnostic }) {
  if (!diagnostic || diagnostic.status === 'completed') return null;
  const done = SKILLS.filter((s) => stageDone(diagnostic.stages?.[s])).length;
  return (
    <section aria-labelledby="diag-h" className="rounded-xl border border-dashed border-line-strong px-3 py-2.5">
      <div className="flex items-baseline justify-between text-[12px]">
        <h3 id="diag-h" className="font-medium text-ink-2">
          Placement
        </h3>
        <span className="font-mono text-[11px] text-ink-3">{done}/4</span>
      </div>
      <ol className="mt-2 flex gap-1.5">
        {SKILLS.map((s) => {
          const ok = stageDone(diagnostic.stages?.[s]);
          const Icon = SKILL_ICONS[s];
          return (
            <li key={s} title={`${skillTr(s)}: ${ok ? 'done' : 'pending'}`} className={`relative grid size-7 place-items-center rounded-full ${ok ? 'bg-emerald-soft text-emerald' : 'border border-dashed border-line-strong text-ink-3'}`}>
              <Icon size={13} weight={ok ? 'fill' : 'regular'} />
              {ok && (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-3 place-items-center rounded-full bg-emerald text-paper">
                  <Check size={8} weight="bold" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Desktop: full-height sidebar (brand, navigation, proficiency, stats, skills). Mobile: the compact top block. */
export default function LearnerSheet({ profile, refreshKey = 0, nav, header }) {
  const vault = useVault(refreshKey);
  const weaknesses = profile.metrics?.weaknesses ?? [];

  return (
    <aside aria-label="Learner profile" className="border-b border-line bg-panel lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex flex-col gap-5 px-4 py-4 lg:gap-6 lg:px-3.5 lg:py-[18px]">
        {header}
        {nav}

        {/* Mobile: compact */}
        <div className="space-y-3 lg:hidden">
          <LevelCard profile={profile} compact />
          <StatGrid profile={profile} vault={vault} compact />
        </div>

        {/* Desktop: full sheet */}
        <div className="hidden space-y-6 lg:block">
          <section>
            <Eyebrow>Proficiency</Eyebrow>
            <LevelCard profile={profile} />
          </section>
          <section aria-label="Statistics" className="space-y-2">
            <StatGrid profile={profile} vault={vault} />
            {vault && (
              <p className="flex items-center gap-1.5 px-1.5 text-[11.5px] text-ink-3">
                <VaultIcon size={13} /> SM-2 vault: {vault.total} {vault.total === 1 ? 'word' : 'words'}, {vault.mastered} mastered
              </p>
            )}
          </section>
          <Skills profile={profile} />
          <Diagnostic diagnostic={profile.diagnostic} />
          {weaknesses.length > 0 && (
            <section aria-labelledby="focus-h">
              <Eyebrow>
                <span id="focus-h">Next keys to unlock</span>
              </Eyebrow>
              <div className="flex flex-wrap gap-1.5 px-1">
                {weaknesses.map((w) => (
                  <span key={w} className="rounded-full border border-line bg-amber-soft px-2.5 py-0.5 text-[11.5px] text-amber">
                    {w}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
