'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MagnifyingGlass, BookmarkSimple, MagicWand, Plus, Checks, Eye, X, ArrowRight, SealCheck, Cards } from '@phosphor-icons/react';
import { api } from '@/api';
import { FUNCTIONS, FUNCTION_INFO, LEVELS, SKILLS, cap } from '@/lib/cefr';
import { bandStatus, canDoById, curriculum } from '@/lib/core/curriculum';
import { SKILL_ICONS } from './ui';
import { Button, LevelBadge, Panel, Segmented, Skeleton } from './ui';
import Flashcards from './Flashcards';
import { formatDate, fnLabel, skillLabel, stageLabel } from '@/lib/labels';

const ease = [0.16, 1, 0.3, 1] as const;

function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[10px] border border-line-strong bg-raised pr-3 pl-10 text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none"
      />
    </label>
  );
}

const pill = (on) => `h-8 rounded-full px-3 text-[13px] font-medium transition-colors ${on ? 'bg-ink text-paper' : 'border border-line text-ink-2 hover:border-ink-3 hover:text-ink'}`;

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'h-10 rounded-[10px] border border-line-strong bg-raised px-3 text-sm focus:border-ink focus:outline-none';

function AddWordForm({ onAdded, onClose }) {
  const [form, setForm] = useState({ original: '', upgraded: '', cefr: 'A1', meaning: '', example: '' });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    try {
      const added = await api.addVocabulary([form]);
      if (!added.length) return setError('This word is already in your vault.');
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.35, ease }} onSubmit={submit} className="overflow-hidden">
      <Panel className="mb-6 grid gap-4 p-5 @lg:grid-cols-2 @3xl:grid-cols-[1.2fr_0.6fr_1fr]">
        <Field label="Word or phrase">
          <input required value={form.original} onChange={set('original')} className={inputCls} />
        </Field>
        <Field label="Level">
          <select value={form.cefr} onChange={set('cefr')} className={`${inputCls} font-mono`}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Meaning">
          <input value={form.meaning} onChange={set('meaning')} className={inputCls} />
        </Field>
        <Field label="Example sentence">
          <input value={form.example} onChange={set('example')} className={inputCls} />
        </Field>
        <Field label="Higher-level alternative">
          <input value={form.upgraded} onChange={set('upgraded')} className={inputCls} />
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit">Add to vault</Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-brick @lg:col-span-2 @3xl:col-span-3">{error}</p>}
      </Panel>
    </motion.form>
  );
}

function SrsStatus({ r }) {
  const meta = (
    <span className="font-mono" title="SM-2 ease factor and successful reviews in a row">
      ease {r.ease}, reps {r.reps}
    </span>
  );
  if (r.due)
    return (
      <>
        <span className="rounded-full bg-amber-soft px-2 py-0.5 text-amber">Due now · {stageLabel(r.stage)}</span>
        {meta}
      </>
    );
  return (
    <>
      {r.mastered === 'Yes' && <span className="rounded-full bg-emerald-soft px-2 py-0.5 text-emerald">Mastered</span>}
      <span className="font-mono" title={`Interval ${stageLabel(r.stage)}`}>
        next {r.next} ({stageLabel(r.stage)})
      </span>
      {meta}
    </>
  );
}

/** Curriculum Can-Do statements per sub-band (A1.1-C2.2), with progress and what has been achieved. */
function CanDoBoard({ profile }) {
  const [level, setLevel] = useState(profile?.overall_cefr ?? 'A1');
  const all = profile?.can_do_mastered ?? [];
  const byId = new Map<string, { date: string }>(all.map((c) => [c.id, c]));
  // Records from before the curriculum (id "skill.level.function") stay in profile.json and are listed here.
  const legacy = all.filter((c) => c.source !== 'curriculum' && !canDoById(c.id));
  const bands = curriculum.levels.find((l) => l.level === level)?.sub_bands ?? [];
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[14px] text-ink-2">
          The curriculum’s 48 action-oriented goals. A Can-Do is earned after you use it in 3 different tasks (80%+), confirmed by feedback. Earned so far: {all.filter((c) => canDoById(c.id)).length}.
        </p>
        <Segmented id="cdlevel" size="sm" value={level} onChange={setLevel} items={LEVELS.map((l) => ({ id: l, label: l }))} />
      </div>
      <div className="grid gap-5 @3xl:grid-cols-2">
        {bands.map((b) => (
          <Panel key={b.id} className="p-5">
            <h3 className="mb-1 font-mono text-sm font-semibold">{b.id}</h3>
            <p className="mb-3 text-[12.5px] text-ink-3">{b.goal}</p>
            <ul className="space-y-3">
              {bandStatus(profile, b.id).map((c) => {
                const done = byId.get(c.id);
                const Icon = SKILL_ICONS[c.skill];
                return (
                  <li key={c.id} className="flex gap-3">
                    <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald text-paper' : 'border border-dashed border-line-strong text-ink-3'}`}>
                      {done ? <SealCheck size={14} weight="fill" /> : <span className="font-mono text-[10px]">{c.count}/3</span>}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[15px] leading-snug ${done ? 'text-ink' : 'text-ink-2'}`}>{c.text}</p>
                      <p className="flex items-center gap-1 text-[11.5px] text-ink-3">
                        <Icon size={12} /> {skillLabel(c.skill)} · {fnLabel(c.function)}
                        {done ? `, earned ${formatDate(done.date, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
      {legacy.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12px] font-semibold tracking-[0.06em] text-ink-3 uppercase">Earned before the curriculum</h3>
          <ul className="space-y-1.5 text-[13.5px] text-ink-2">
            {legacy.map((c) => (
              <li key={c.id}>
                {c.statement} <span className="font-mono text-[11.5px] text-ink-3">{c.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function VocabularyVault({ rows, reload, loading }) {
  const [q, setQ] = useState('');
  const [levels, setLevels] = useState([]);
  const [sort, setSort] = useState('newest');
  const [status, setStatus] = useState('all');
  const [adding, setAdding] = useState(false);

  const counts = { due: rows.filter((r) => r.due).length, mastered: rows.filter((r) => r.mastered === 'Yes').length };
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const text = (r) => [r.original, r.upgraded, r.meaning, r.example].join(' ').toLowerCase();
    let out = rows.filter(
      (r) => (!levels.length || levels.includes(r.cefr)) && (!needle || text(r).includes(needle)) && (status === 'all' || (status === 'due' ? r.due : r.mastered === 'Yes')),
    );
    if (sort === 'az') out = [...out].sort((a, b) => a.original.localeCompare(b.original));
    else if (sort === 'level') out = [...out].sort((a, b) => LEVELS.indexOf(a.cefr) - LEVELS.indexOf(b.cefr));
    else out = [...out].reverse();
    return out;
  }, [rows, q, levels, sort, status]);

  const toggle = (l) => setLevels((ls) => (ls.includes(l) ? ls.filter((x) => x !== l) : [...ls, l]));

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
        <SearchBox value={q} onChange={setQ} placeholder="Search words, meanings or examples" label="Search words" />
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by level">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => toggle(l)} aria-pressed={levels.includes(l)} className={`${pill(levels.includes(l))} font-mono`}>
              {l}
            </button>
          ))}
        </div>
        <Segmented
          id="vsort"
          size="sm"
          value={sort}
          onChange={setSort}
          items={[
            { id: 'newest', label: 'Newest' },
            { id: 'az', label: 'A-Z' },
            { id: 'level', label: 'Level' },
          ]}
        />
        <Button variant="secondary" onClick={() => setAdding((a) => !a)}>
          {adding ? <X size={16} /> : <Plus size={16} />} {adding ? 'Close' : 'Add word'}
        </Button>
      </div>

      <Segmented
        id="vstatus"
        size="sm"
        className="mb-6"
        value={status}
        onChange={setStatus}
        items={[
          { id: 'all', label: 'All', count: rows.length },
          { id: 'due', label: 'Due today', count: counts.due },
          { id: 'mastered', label: 'Mastered', count: counts.mastered },
        ]}
      />

      {adding && <AddWordForm onAdded={reload} onClose={() => setAdding(false)} />}

      {loading ? (
        <div className="grid gap-x-10 gap-y-6 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 border-t border-line pt-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="max-w-md py-12">
          <p className="text-2xl font-semibold tracking-[-0.02em]">{rows.length ? 'No matching words' : 'Your vault is empty'}</p>
          <p className="mt-2 text-ink-2">{rows.length ? 'Clear the search or level filters to see every word.' : 'Finish a reading or listening task and its key words are collected here. You can also add words yourself.'}</p>
        </div>
      ) : (
        <dl className="grid gap-x-10 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {filtered.map((r, i) => (
            <motion.div
              key={r.original}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03, ease }}
              className="border-t border-line py-4"
            >
              <dt className="flex items-baseline justify-between gap-3">
                <span className="text-[19px] leading-tight font-semibold tracking-[-0.01em]">{r.original}</span>
                {r.cefr && <LevelBadge level={r.cefr} />}
              </dt>
              {r.meaning && (
                <dd className="mt-0.5 text-sm text-ink-2">
                  {r.meaning}
                </dd>
              )}
              {r.example && <dd className="mt-1.5 text-[14.5px] text-ink-2">&ldquo;{r.example}&rdquo;</dd>}
              <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                {r.upgraded && (
                  <span className="inline-flex items-center gap-1 text-indigo">
                    <ArrowRight size={12} /> {r.upgraded}
                  </span>
                )}
                <SrsStatus r={r} />
              </dd>
            </motion.div>
          ))}
        </dl>
      )}
      <p className="mt-6 text-xs text-ink-3">
        {filtered.length} of {rows.length} words, source: <code className="font-mono">vocabulary.md</code>
      </p>
    </section>
  );
}

function StreakMeter({ streak }) {
  return (
    <span className="flex flex-col items-end gap-1" title={`Correct in ${streak} of 3 sessions in a row`}>
      <span className="inline-flex gap-[3px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-4 rounded-full ${i < streak ? 'bg-emerald' : 'bg-line-strong'}`} />
        ))}
      </span>
      <span className="text-[10.5px] text-ink-3">{streak}/3 sessions</span>
    </span>
  );
}

function ErrorLedger({ data, loading }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const categories = [...new Set<string>(data.active.map((e) => e.category))].sort();
  const needle = q.toLowerCase();
  const active = data.active.filter((e) => (!cat || e.category === cat) && (!needle || [e.before, e.after, e.rule, e.category].some((v) => v.toLowerCase().includes(needle))));
  const groups = categories.map((c) => [c, active.filter((e) => e.category === c)]).filter(([, list]) => list.length);

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search patterns, fixes or rules" label="Search patterns" />
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Filter by category">
            <button onClick={() => setCat('')} className={pill(!cat)} aria-pressed={!cat}>
              All
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c === cat ? '' : c)} className={pill(c === cat)} aria-pressed={c === cat}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-[14px]" />
      ) : groups.length === 0 ? (
        <div className="max-w-md">
          <p className="text-2xl font-semibold tracking-[-0.02em]">{data.active.length ? 'No matching patterns' : 'Nothing to polish yet'}</p>
          <p className="mt-2 text-ink-2">{data.active.length ? 'Clear the search or category filter.' : 'Patterns from your writing and speaking feedback are kept here. Use the correct form in 3 sessions in a row and the pattern resolves itself.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([c, list]) => (
            <div key={c}>
              <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                {c} <span className="font-mono text-xs font-normal text-ink-3">{list.reduce((s, e) => s + e.count, 0)}×</span>
              </h3>
              <Panel as="ul" className="divide-y divide-line">
                {list.map((e) => (
                  <li key={e.id} className="grid gap-3 px-5 py-4 @2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] @2xl:items-center @2xl:gap-6">
                    <div className="text-[15.5px] leading-snug">
                      <span className="text-ink-3 line-through decoration-ink-3/60">{e.before}</span>
                      <ArrowRight size={13} className="mx-2 inline text-ink-3" />
                      <span className="text-emerald">{e.after}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-ink-2">{e.rule}</p>
                    <div className="flex items-center gap-4 @2xl:justify-end">
                      <span className="text-right" title={`First seen ${e.firstSeen}`}>
                        <span className={`block text-2xl leading-none font-semibold tracking-[-0.02em] tabular-nums ${e.count >= 3 ? 'text-amber' : ''}`}>×{e.count}</span>
                        <span className="font-mono text-[10.5px] text-ink-3">{e.lastSeen}</span>
                      </span>
                      <StreakMeter streak={e.streak} />
                    </div>
                  </li>
                ))}
              </Panel>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-10 border-t border-line pt-8 @3xl:grid-cols-2">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Checks size={16} className="text-emerald" /> Resolved <span className="font-mono text-xs font-normal text-ink-3">{data.resolved.length}</span>
          </h3>
          {data.resolved.length ? (
            <ul className="space-y-2">
              {data.resolved.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span>
                    <span className="text-ink-3 line-through">{e.before}</span> <span className="text-ink">{e.after}</span>
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">{e.resolvedOn}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">Patterns move here on their own once you use them correctly in 3 sessions in a row.</p>
          )}
        </div>
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Eye size={16} className="text-amber" /> Watchlist
          </h3>
          <p className="mb-3 text-sm text-ink-3">Weak spots carried over from your previous profile. Not seen in your answers yet.</p>
          <div className="flex flex-wrap gap-1.5">
            {data.watchlist.map((w) => (
              <span key={w} className="rounded-full bg-amber-soft px-2.5 py-1 text-[13px] text-amber">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-ink-3">
        Source: <code className="font-mono">error_ledger.md</code>
      </p>
    </section>
  );
}

export default function Vault({ refreshKey, profile, onReviewed = undefined }) {
  const [tab, setTab] = useState('vocab');
  const [vocab, setVocab] = useState([]);
  const [errors, setErrors] = useState({ active: [], resolved: [], watchlist: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  async function reload() {
    try {
      const [v, e] = await Promise.all([api.vocabulary(), api.errors()]);
      setVocab(v);
      setErrors(e);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [refreshKey]);

  return (
    <div className="space-y-7">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Vault</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">Every word you’ve collected and every pattern you’re working on, read live from your coach files.</p>
      </header>
      <Segmented
        id="vault"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'review', label: 'Cards', icon: Cards, count: vocab.filter((v) => v.due).length },
          { id: 'vocab', label: 'Words', icon: BookmarkSimple, count: vocab.length },
          { id: 'errors', label: 'Polish list', icon: MagicWand, count: errors.active.length },
          { id: 'cando', label: 'Can-Do', icon: SealCheck, count: profile?.can_do_mastered?.length ?? 0 },
        ]}
      />
      {loadError && (
        <p className="text-sm text-brick" role="alert">
          {loadError}
        </p>
      )}
      {tab === 'review' && (
        <Flashcards
          onReviewed={(r) => {
            onReviewed?.(r);
            reload();
          }}
        />
      )}
      {tab === 'vocab' && <VocabularyVault rows={vocab} reload={reload} loading={loading} />}
      {tab === 'errors' && <ErrorLedger data={errors} loading={loading} />}
      {tab === 'cando' && <CanDoBoard profile={profile} />}
    </div>
  );
}
