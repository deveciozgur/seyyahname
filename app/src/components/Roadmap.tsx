'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Circle, CircleHalf, Lock, PenNib, Microphone, ChatsCircle, Plus, Check, Warning, Path } from '@phosphor-icons/react';
import { api } from '@/api';
import { BANDS, bandLevel } from '@/lib/cefr-data';
import { bandStatus, curriculum, getBand, practiceTask, type SubBand } from '@/lib/core/curriculum';
import { Button, LevelBadge, Panel } from './ui';
import WritingModule from './WritingModule';
import SpeakingModule from './SpeakingModule';

const ease = [0.16, 1, 0.3, 1] as const;
const SCENARIO_TR = { 'role-play': 'Canlandırma', daily: 'Günlük', interview: 'Mülakat', professional: 'İş' };
const SKILL_TR = { speaking: 'Konuşma', writing: 'Yazma' };

type Practice = { task: ReturnType<typeof practiceTask>; skill: 'writing' | 'speaking' };

/** Where a sub-band stands relative to the learner's active curriculum band. */
const bandState = (id: string, active: string) => {
  const d = BANDS.indexOf(id) - BANDS.indexOf(active);
  return d < 0 ? 'done' : d === 0 ? 'active' : 'locked';
};

function Tree({ active, selected, onSelect, profile }) {
  return (
    <ol className="space-y-4" aria-label="A1 → C2 yol haritası">
      {curriculum.levels.map((lvl) => (
        <li key={lvl.level}>
          <div className="mb-1.5 flex items-center gap-2">
            <LevelBadge level={lvl.level} />
            <span className="text-[13px] font-medium text-ink-2">{lvl.name_tr}</span>
          </div>
          <ul className="ml-[13px] space-y-1 border-l border-line pl-3">
            {lvl.sub_bands.map((b) => {
              const st = bandState(b.id, active);
              const mastered = bandStatus(profile, b.id).filter((c) => c.mastered).length;
              const Icon = st === 'done' ? CheckCircle : st === 'active' ? CircleHalf : Lock;
              const on = selected === b.id;
              return (
                <li key={b.id}>
                  <button
                    onClick={() => onSelect(b.id)}
                    aria-current={on ? 'true' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${on ? 'bg-sunk text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]' : 'text-ink-2 hover:bg-hover hover:text-ink'}`}
                  >
                    <Icon size={16} weight={st === 'locked' ? 'regular' : 'fill'} className={st === 'done' ? 'text-emerald' : st === 'active' ? 'text-amber' : 'text-ink-3'} />
                    <span className="font-mono font-medium">{b.id}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-3">{b.goal_tr}</span>
                    <span className="font-mono text-[11px] text-ink-3">{mastered}/4</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2.5 border-t border-line pt-5">
      <h3 className="text-[12px] font-semibold tracking-[0.06em] text-ink-3 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ band, state, profile, vault, onPractice, onRehearse, onAddWords }) {
  const status = bandStatus(profile, band.id);
  const missing = (items) => items.filter((it) => !vault.has(it.word.toLowerCase()));
  return (
    <motion.div key={band.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-mono text-[22px] font-semibold tracking-[-0.02em]">{band.id}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${state === 'done' ? 'bg-emerald-soft text-emerald' : state === 'active' ? 'bg-amber-soft text-amber' : 'border border-line-strong text-ink-3'}`}>
            {state === 'done' ? 'Tamamlandı' : state === 'active' ? 'Aktif bant' : 'Sırada'}
          </span>
        </div>
        <p className="max-w-[60ch] text-[16px] leading-relaxed text-ink">{band.goal_tr}</p>
        <p className="text-[13px] text-ink-3">{band.goal}</p>
        {state === 'locked' && <p className="text-[12.5px] text-ink-3">Bu bandın pratikleri açık; ancak Can-Do kanıtı yalnızca aktif bantta sayılır.</p>}
      </div>

      <Section title="Can-Do hedefleri">
        <ul className="space-y-2">
          {status.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 text-[14px]">
              {c.mastered ? (
                <CheckCircle size={18} weight="fill" className="mt-px shrink-0 text-emerald" />
              ) : c.status === 'in_progress' ? (
                <CircleHalf size={18} weight="fill" className="mt-px shrink-0 text-amber" />
              ) : (
                <Circle size={18} className="mt-px shrink-0 text-ink-3" />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-ink">{c.text}</span>
                <span className="mt-0.5 block font-mono text-[11.5px] text-ink-3">
                  {c.id} · {SKILL_TR[c.skill]} · {c.mastered ? 'tamamlandı' : c.status === 'in_progress' ? `${c.count}/3 başarılı kullanım` : state === 'locked' ? 'sırada' : '0/3'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Dilbilgisi hedefleri">
        <ul className="divide-y divide-line">
          {band.grammar_targets.map((g) => (
            <li key={g.id} className="flex flex-wrap items-start gap-3 py-3 first:pt-0">
              <div className="min-w-0 flex-1 basis-[260px]">
                <p className="text-[14.5px] font-medium">{g.title}</p>
                <p className="text-[13px] text-ink-2">{g.explanation_tr}</p>
                <p className="mt-1 font-mono text-[12.5px] text-ink-3">{g.example}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => onPractice('grammar', g.id, 'writing')}>
                  <PenNib size={14} /> Yazma
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onPractice('grammar', g.id, 'speaking')}>
                  <Microphone size={14} /> Konuşma
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Konuşma senaryoları">
        <ul className="grid gap-3 @xl:grid-cols-3">
          {band.speaking_scenarios.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 rounded-[12px] border border-line bg-sunk/50 p-3.5">
              <span className="text-[11px] font-semibold tracking-[0.06em] text-amber uppercase">{SCENARIO_TR[s.type] ?? s.type}</span>
              <p className="text-[14px] font-medium">{s.title}</p>
              <p className="flex-1 text-[12.5px] text-ink-2">{s.setting}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" onClick={() => onPractice('scenario', s.id, 'speaking')}>
                  <Microphone size={14} /> Başlat
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onPractice('scenario', s.id, 'writing')} title="Yazılı olarak dene">
                  <PenNib size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onRehearse(band, s)} title="Koçla canlandır">
                  <ChatsCircle size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Kelime alanları">
        <div className="grid gap-3 @xl:grid-cols-2">
          {band.lexical_domains.map((d) => {
            const add = missing(d.items);
            return (
              <div key={d.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-medium">
                    {d.title_tr} <span className="text-ink-3">· {d.title}</span>
                  </p>
                  {add.length > 0 ? (
                    <Button size="sm" variant="ghost" onClick={() => onAddWords(add)}>
                      <Plus size={13} /> Kasaya ekle ({add.length})
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] text-emerald">
                      <Check size={13} /> Kasada
                    </span>
                  )}
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {d.items.map((it) => {
                    const has = vault.has(it.word.toLowerCase());
                    return (
                      <li key={it.word} title={`${it.meaning_tr} · ${it.example}`} className={`rounded-full px-2.5 py-1 text-[12.5px] ${has ? 'bg-emerald-soft text-emerald' : 'border border-line-strong text-ink-2'}`}>
                        {it.word}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Türkçe kaynaklı tuzaklar">
        <ul className="space-y-2.5">
          {band.l1_interference_alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-2.5 text-[13.5px]">
              <Warning size={16} className="mt-0.5 shrink-0 text-amber" />
              <span>
                <span className="text-ink-3 line-through decoration-brick/60">{a.wrong}</span> <span className="text-ink-3">→</span> <span className="font-medium text-ink">{a.right}</span>
                <span className="block text-[12.5px] text-ink-2">{a.note_tr}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </motion.div>
  );
}

/** Müfredat & Yol Haritası: the A1.1-C2.2 curriculum tree, Can-Do status and focused practice. */
export default function Roadmap({ profile, onActivitySaved, onRehearse, refreshKey }) {
  const active = profile.curriculum?.band ?? profile.sub_band ?? 'A1.1';
  const [selected, setSelected] = useState(active);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [vault, setVault] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    api
      .vocabulary()
      .then((rows) => setVault(new Set(rows.map((r) => String(r.original).toLowerCase()))))
      .catch(() => {});
  }, [refreshKey]);

  // After a level up, jump to the newly opened band.
  useEffect(() => setSelected(active), [active]);

  const band: SubBand = useMemo(() => getBand(selected) ?? getBand(active), [selected, active]);
  const totals = useMemo(() => {
    const all = BANDS.flatMap((id) => bandStatus(profile, id));
    return { mastered: all.filter((c) => c.mastered).length, total: all.length };
  }, [profile]);

  function startPractice(kind, id, skill) {
    const task = practiceTask(band.id, kind, id, skill);
    if (task) setPractice({ task, skill });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function addWords(items) {
    const level = bandLevel(band.id);
    try {
      await api.addVocabulary(items.map((it) => ({ word: it.word, meaning: it.meaning_tr, cefr: level, example: it.example })));
      setVault((v) => new Set([...v, ...items.map((it) => it.word.toLowerCase())]));
      setNote(`${items.length} kelime kasaya eklendi; yarın ısınmada karşına çıkacak.`);
    } catch (e) {
      setNote(`Eklenemedi: ${e.message}`);
    }
  }

  if (practice) {
    const Module = practice.skill === 'writing' ? WritingModule : SpeakingModule;
    return (
      <div className="space-y-4">
        <button onClick={() => setPractice(null)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
          <ArrowLeft size={15} /> Yol haritasına dön
        </button>
        <p className="text-[13px] text-ink-3">
          Odaklı pratik · <span className="font-mono text-ink-2">{band.id}</span> · {SKILL_TR[practice.skill]}
          {practice.task.grammarFocus && <> · hedef yapı: {practice.task.grammarFocus}</>}
        </p>
        <Module key={practice.task.id} level={bandLevel(band.id)} tasks={[practice.task]} onActivitySaved={onActivitySaved} passedIds={[]} shield={profile.gamification?.mode === 'low'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-[-0.02em]">
            <Path size={22} className="text-amber" /> Müfredat & Yol Haritası
          </h1>
          <p className="text-[14px] text-ink-2">
            Aktif bant <span className="font-mono font-medium text-ink">{active}</span>. Her Can-Do, geri bildirimle onaylanan 3 başarılı kullanımla tamamlanır; bandın 4 hedefi bitince sıradaki bant açılır.
          </p>
        </div>
        <span className="font-mono text-[13px] text-ink-3">
          {totals.mastered}/{totals.total} Can-Do
        </span>
      </header>
      {note && (
        <p role="status" className="text-[13px] text-emerald">
          {note}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 @4xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="h-fit p-4 @4xl:sticky @4xl:top-[68px]">
          <Tree active={active} selected={band.id} onSelect={setSelected} profile={profile} />
        </Panel>
        <Panel className="@container p-5 sm:p-6">
          <Detail band={band} state={bandState(band.id, active)} profile={profile} vault={vault} onPractice={startPractice} onRehearse={onRehearse} onAddWords={addWords} />
        </Panel>
      </div>
    </div>
  );
}
