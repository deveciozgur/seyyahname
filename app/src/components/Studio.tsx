'use client';

import { useEffect, useState } from 'react';
import { CaretDown, ClipboardText, Coffee, Lifebuoy } from '@phosphor-icons/react';
import { api } from '@/api';
import DailyLoot from './DailyLoot';
import QuickPlay, { THEME_ICONS } from './QuickPlay';
import { THEMES } from '@/data/tasks-themes';
import { BANDS, FUNCTIONS, FUNCTION_INFO, LEVELS, MASTERY, SKILLS, bandLevel, cap, nextBand } from '@/lib/cefr';
import { tasksFor } from '@/data/tasks';
import { readStored, writeStored } from '@/lib/useActivity';
import { SKILL_ICONS, Segmented, LevelBadge, Button } from './ui';
import { fnLabel, skillLabel } from '@/lib/labels';
import { FunctionSlots } from './Sidebar';
import WarmUp, { CurriculumWords } from './WarmUp';
import ReadingModule from './ReadingModule';
import WritingModule from './WritingModule';
import ListeningModule from './ListeningModule';
import SpeakingModule from './SpeakingModule';

const MODULES = { reading: ReadingModule, writing: WritingModule, listening: ListeningModule, speaking: SpeakingModule };
const BLURBS = {
  reading: 'Read slowly, then answer. The questions test inference and vocabulary in context, not just recall.',
  writing: 'Write without spellcheck. Feedback comes in three layers: Strength Recognition, Natural Recast and Polish.',
  listening: 'The transcript stays blurred while you listen. Fill the gaps, then reveal it.',
  speaking: 'Speak freely for the target time. Your transcript and your voice are assessed together.',
};

function DiagnosticStrip({ diagnostic, current, onPick }) {
  if (!diagnostic || diagnostic.status === 'completed') return null;
  const pending = SKILLS.filter((s) => (diagnostic.stages?.[s]?.status ?? diagnostic.stages?.[s]) !== 'completed');
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-dashed border-line-strong px-4 py-3 sm:flex-row sm:items-center">
      <p className="flex flex-1 items-start gap-2 text-sm text-ink-2">
        <ClipboardText size={18} className="mt-px shrink-0 text-amber" />
        <span>
          <span className="font-medium text-ink">Placement {diagnostic.status === 'paused' ? 'paused' : 'in progress'}.</span> The first task you finish in each skill sets your starting level. {pending.length} {pending.length === 1 ? 'skill' : 'skills'} to go.
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {pending.map((s) => {
          const Icon = SKILL_ICONS[s];
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${s === current ? 'bg-ink text-paper' : 'border border-line-strong text-ink-2 hover:border-ink hover:text-ink'}`}
            >
              <Icon size={14} /> {skillLabel(s)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Studio({ profile, onActivitySaved, refreshKey }) {
  const [skill, setSkill] = useState(() => {
    const stored = readStored('coach.skill', 'reading');
    return SKILLS.includes(stored) ? stored : 'reading';
  });
  const userLevel = profile.skills[skill];
  const band = profile.skill_bands[skill];
  const [level, setLevel] = useState(userLevel);

  useEffect(() => {
    writeStored('coach.skill', skill);
    setLevel(profile.skills[skill]);
  }, [skill]); // eslint-disable-line react-hooks/exhaustive-deps

  const interests = profile.interests ?? [];
  const { level: taskLevel, tasks } = tasksFor(skill, level, interests);
  const mode = profile.gamification?.mode ?? 'normal';
  const shield = (profile.gamification?.struggle_streak ?? 0) >= 2;

  async function changeMode(next) {
    const r = await api.setMode(next);
    onActivitySaved({ profile: r.profile });
  }
  async function toggleInterest(theme) {
    const next = interests.includes(theme) ? interests.filter((t) => t !== theme) : [...interests, theme];
    const saved = await api.saveProfile({ ...profile, interests: next });
    onActivitySaved({ profile: saved });
  }
  const Module = MODULES[skill];
  // Tasks already used for a sub-band at this level cannot count again (one distinct task per function).
  const passedIds = BANDS.filter((b) => bandLevel(b) === taskLevel).flatMap((b) => FUNCTIONS.map((f) => profile.progress?.[skill]?.[b]?.[f]).filter(Boolean));
  const missing = FUNCTIONS.filter((f) => !profile.progress?.[skill]?.[band]?.[f]);

  return (
    <div className="space-y-7">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Today's practice</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{BLURBS[skill]}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
          {mode !== 'low' && (
            <Button variant="ghost" size="sm" onClick={() => changeMode('low')} title="Switch to light, tap-only rounds">
              <Coffee size={15} /> Low-effort mode
            </Button>
          )}
          <label className="flex shrink-0 items-center gap-2 text-sm text-ink-3">
            Task level
            <span className="relative">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-9 appearance-none rounded-full border border-line-strong bg-sunk py-0 pr-8 pl-3.5 font-mono text-sm text-ink hover:border-ink-3"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                    {l === userLevel ? ' (you)' : ''}
                  </option>
                ))}
              </select>
              <CaretDown size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />
            </span>
          </label>
          </div>
        </div>

        <WarmUp refreshKey={refreshKey} onReviewed={(r) => onActivitySaved({ profile: r.profile })} />
        <CurriculumWords band={profile.curriculum?.band ?? profile.sub_band} refreshKey={refreshKey} />

        <DailyLoot refreshKey={refreshKey} />

        <div className="flex flex-wrap items-center gap-1.5" aria-label="Your interests">
          <span className="mr-1 text-[13px] text-ink-3">My interests</span>
          {THEMES.map((t) => {
            const Icon = THEME_ICONS[t];
            const on = interests.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleInterest(t)}
                aria-pressed={on}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${on ? 'bg-indigo-soft text-indigo ring-1 ring-indigo/30 ring-inset' : 'border border-line text-ink-3 hover:border-ink-3 hover:text-ink'}`}
              >
                <Icon size={14} weight={on ? 'fill' : 'regular'} /> {t}
              </button>
            );
          })}
        </div>

        <Segmented id="skill" items={SKILLS.map((s) => ({ id: s, label: skillLabel(s), icon: SKILL_ICONS[s] }))} value={skill} onChange={setSkill} />

        <DiagnosticStrip diagnostic={profile.diagnostic} current={skill} onPick={setSkill} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
          <span>
            Your {skillLabel(skill).toLowerCase()} band: <span className="font-mono font-medium text-ink">{band}</span> <LevelBadge level={userLevel} />
          </span>
          {band !== BANDS[BANDS.length - 1] && (
            <span className="inline-flex items-center gap-2">
              {missing.length
                ? `For ${nextBand(band)}: ${missing.map((f) => fnLabel(f)).join(', ')} ${userLevel} ${missing.length === 1 ? 'task' : 'tasks'} at ${MASTERY}%+`
                : `Ready for ${nextBand(band)}`}
              <FunctionSlots profile={profile} skill={skill} />
            </span>
          )}
          {taskLevel !== userLevel && <span className="text-amber">Practice only: sub-band steps count with {userLevel} tasks. {taskLevel} Can-Do progress still counts.</span>}
          {taskLevel !== level && <span>No {level} tasks yet, so {taskLevel} tasks are shown.</span>}
        </div>
      </header>

      {shield && mode !== 'low' && (
        <p className="flex items-start gap-2 rounded-[14px] border border-line bg-emerald-soft px-4 py-3 text-[14px] text-ink-2" role="status">
          <Lifebuoy size={18} className="mt-px shrink-0 text-emerald" />
          <span>
            <span className="font-medium text-ink">Frustration Shield is on.</span> The last rounds were tough, so hints are open, choices are offered and sentences come half-finished. Nothing gets harder until you're back in the flow.
          </span>
        </p>
      )}

      {/* Low-Effort Mode puts quick play first; the full task stays below so no feedback is lost. */}
      {mode === 'low' && <QuickPlay profile={profile} reason={profile.gamification?.mode_reason} onSaved={(r) => onActivitySaved({ profile: r.profile })} onExit={() => changeMode('normal')} />}
      <div className={mode === 'low' ? 'opacity-70 transition-opacity hover:opacity-100' : ''}>
        <Module key={`${skill}-${taskLevel}-${interests.join()}`} level={taskLevel} tasks={tasks} profile={profile} onActivitySaved={onActivitySaved} passedIds={passedIds} shield={shield} />
      </div>
    </div>
  );
}
