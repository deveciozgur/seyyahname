'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Stop, SpeakerSimpleHigh, ArrowCounterClockwise, ArrowRight, Check, ArrowBendDownRight, EyeSlash, Lightbulb } from '@phosphor-icons/react';
import { MASTERY, sameAnswer } from '@/lib/cefr';
import { useActivity } from '@/lib/useActivity';
import { Button, Panel, SaveReceipt, Score, Segmented, TaskPicker, TaskTitle } from './ui';

const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const SPEEDS = [0.7, 0.85, 1, 1.15];

export function parseScript(script) {
  let gap = 0;
  return script.split('\n').map((line) => {
    const [, speaker, rest] = /^([^:]+):\s*(.*)$/.exec(line) ?? [null, '', line];
    const parts = rest.split(/(\[[^\]]+\])/).filter(Boolean).map((p) => (p.startsWith('[') ? { gap: gap++, answer: p.slice(1, -1) } : { text: p }));
    return { speaker: speaker.trim(), parts, spoken: rest.replace(/\[([^\]]+)\]/g, '$1') };
  });
}

function useVoices() {
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!hasTTS) return;
    const load = () => {
      const all = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
      all.sort((a, b) => Number(b.lang === 'en-GB') - Number(a.lang === 'en-GB') || Number(b.localService) - Number(a.localService));
      setVoices(all);
    };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  return voices;
}

const closestSpeed = (r) => SPEEDS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));

export default function ListeningModule({ level, tasks, onActivitySaved, passedIds = [], shield = false }) {
  const [index, setIndex] = useState(0);
  const task = tasks[index];
  const lines = useMemo(() => parseScript(task.script), [task.script]);
  const gaps = lines.flatMap((l) => l.parts.filter((p) => p.gap !== undefined));
  const speakers = [...new Set(lines.map((l) => l.speaker))];

  const voices = useVoices();
  // The frustration shield slows speech down and shows first letters.
  const [rate, setRate] = useState(shield ? SPEEDS[0] : closestSpeed(task.rate ?? 1));
  const [letters, setLetters] = useState(shield);
  useEffect(() => {
    if (!shield) return;
    setLetters(true);
    setRate(SPEEDS[0]);
  }, [shield]);
  const [playing, setPlaying] = useState(null); // line index or 'all'
  const [plays, setPlays] = useState(0);
  const [gapAnswers, setGapAnswers] = useState({});
  const [mc, setMc] = useState({});
  const [checked, setChecked] = useState(false);
  const activity = useActivity(onActivitySaved);
  const playToken = useRef(0); // ignores events from utterances that were cancelled

  useEffect(() => () => hasTTS && speechSynthesis.cancel(), []);

  function speakLines(idxs) {
    if (!hasTTS) return;
    speechSynthesis.cancel();
    const token = ++playToken.current;
    setPlays((n) => n + 1);
    setPlaying(idxs.length > 1 ? 'all' : idxs[0]);
    idxs.forEach((i, k) => {
      const u = new SpeechSynthesisUtterance(lines[i].spoken);
      u.lang = 'en-GB';
      u.rate = rate;
      const v = voices.length ? voices[speakers.indexOf(lines[i].speaker) % voices.length] : null;
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      if (voices.length < 2) u.pitch = speakers.indexOf(lines[i].speaker) % 2 ? 0.8 : 1.15; // tell speakers apart
      if (k === idxs.length - 1) u.onend = () => token === playToken.current && setPlaying(null);
      speechSynthesis.speak(u);
    });
  }

  function stop() {
    playToken.current++;
    if (hasTTS) speechSynthesis.cancel();
    setPlaying(null);
  }

  const gapOk = (g) => sameAnswer(gapAnswers[g.gap], g.answer);
  const mcOk = (q) => mc[q.id] === q.answer;
  const correct = gaps.filter(gapOk).length + task.questions.filter(mcOk).length;
  const total = gaps.length + task.questions.length;
  const score = Math.round((correct / total) * 100);
  const reveal = checked || !hasTTS;

  function check() {
    stop();
    setChecked(true);
    activity.save({
      skill: 'listening',
      level,
      score,
      taskId: task.id,
      fn: task.fn,
        taskTitle: task.title,
      summary: `${correct}/${total} correct (gaps ${gaps.filter(gapOk).length}/${gaps.length}, questions ${task.questions.filter(mcOk).length}/${task.questions.length}); played ${plays}× at ${rate}× speed.`,
      details: gaps.filter((g) => !gapOk(g)).map((g) => `Gap: heard "${gapAnswers[g.gap] ?? '-'}", expected "${g.answer}"`),
      vocabulary: task.vocab,
    });
  }

  function go(i) {
    stop();
    setIndex(i);
    setRate(shield ? SPEEDS[0] : closestSpeed(tasks[i].rate ?? 1));
    setPlays(0);
    setGapAnswers({});
    setMc({});
    setChecked(false);
    activity.reset();
  }

  const isPlayingAll = playing === 'all';

  return (
    <div className="grid [&>*]:min-w-0 gap-10 @4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @4xl:gap-12">
      <Panel className="self-start overflow-hidden">
        <div className="px-6 pt-7 sm:px-9">
          <TaskTitle level={level} title={task.title} theme={task.theme} hook={task.hook} fn={task.fn} skill="listening">
            <TaskPicker tasks={tasks} index={index} onChange={go} passedIds={passedIds} />
          </TaskTitle>
        </div>

        {/* Transport */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-line bg-sunk/60 px-6 py-4 sm:px-9">
          <button
            onClick={() => (isPlayingAll ? stop() : speakLines(lines.map((_, i) => i)))}
            disabled={!hasTTS}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:bg-line-strong"
            aria-label={isPlayingAll ? 'Stop' : 'Play the dialogue'}
          >
            {isPlayingAll ? <Stop size={18} weight="fill" /> : <Play size={18} weight="fill" className="translate-x-px" />}
          </button>
          <div className="min-w-0">
            <div className="text-sm font-medium">{isPlayingAll ? 'Playing the dialogue' : plays ? 'Play again, or tap a single line' : 'Play the dialogue'}</div>
            <div className="text-xs text-ink-3">
              Played {plays}×
              {!hasTTS && ', speech synthesis is not available in this browser'}
            </div>
          </div>
          <button
            onClick={() => setLetters((x) => !x)}
            aria-pressed={letters}
            className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${letters ? 'bg-amber-soft text-amber' : 'border border-line text-ink-3 hover:border-ink-3 hover:text-ink'}`}
          >
            <Lightbulb size={14} weight={letters ? 'fill' : 'regular'} /> First letters
          </button>
          <div>
            <Segmented id="speed" size="sm" value={rate} onChange={setRate} items={SPEEDS.map((s) => ({ id: s, label: `${s}×` }))} />
          </div>
        </div>

        <ol className="space-y-5 px-6 py-7 sm:px-9">
          {lines.map((l, i) => {
            const alt = speakers.indexOf(l.speaker) % 2 === 1;
            return (
              <li key={i} className="flex items-start gap-4">
                <button
                  onClick={() => (playing === i ? stop() : speakLines([i]))}
                  disabled={!hasTTS}
                  className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full transition-colors ${playing === i ? 'bg-ink text-paper' : 'border border-line text-ink-3 hover:border-ink hover:text-ink'}`}
                  aria-label={`Play line ${i + 1}`}
                >
                  <SpeakerSimpleHigh size={14} weight={playing === i ? 'fill' : 'regular'} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-[12.5px] font-semibold ${alt ? 'text-amber' : 'text-ink-2'}`}>{l.speaker}</div>
                  <p className="text-[16.5px] leading-9">
                    {l.parts.map((p, k) =>
                      p.text !== undefined ? (
                        <span key={k} className={`transition-[filter] duration-700 ${reveal ? '' : 'blur-[5px] select-none'}`} aria-hidden={!reveal}>
                          {p.text}
                        </span>
                      ) : (
                        <span key={k} className="inline-flex items-baseline">
                          <input
                            value={gapAnswers[p.gap] ?? ''}
                            disabled={checked}
                            onChange={(e) => setGapAnswers((a) => ({ ...a, [p.gap]: e.target.value }))}
                            aria-label={`Gap ${p.gap + 1}`}
                            placeholder={letters && !checked ? `${p.answer[0]}${'_'.repeat(Math.max(0, p.answer.length - 1))}` : ''}
                            autoComplete="off"
                            className={`mx-1 w-28 border-0 border-b-2 bg-transparent px-1 text-center text-[17px] tracking-wide placeholder:text-ink-3/70 focus:outline-none ${!checked ? 'border-line-strong focus:border-ink' : gapOk(p) ? 'border-emerald text-emerald' : 'border-amber text-ink-3 line-through'}`}
                          />
                          {checked && !gapOk(p) && <span className="font-medium text-emerald">{p.answer}</span>}
                        </span>
                      ),
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {!reveal && (
          <p className="flex items-center gap-2 border-t border-line px-6 py-3.5 text-[13px] text-ink-3 sm:px-9">
            <EyeSlash size={16} /> The transcript stays blurred until you check, so you practise listening instead of reading.
          </p>
        )}
      </Panel>

      <div className="space-y-8 @4xl:pt-4">
        {task.questions.map((q) => (
          <fieldset key={q.id} className="space-y-3">
            <legend className="flex w-full items-start gap-3">
              <span className="w-5 shrink-0 pt-0.5 font-mono text-[13px] leading-none text-ink-3">{q.id}</span>
              <span className="flex-1 text-[15.5px] leading-snug font-medium">{q.q}</span>
              {checked && (mcOk(q) ? <Check size={20} weight="bold" className="text-emerald" aria-label="Correct" /> : <ArrowBendDownRight size={20} weight="bold" className="text-amber" aria-label="Almost" />)}
            </legend>
            <div className="grid gap-1.5 pl-8">
              {q.options.map((opt, i) => {
                const sel = mc[q.id] === i;
                const right = checked && i === q.answer;
                const wrong = checked && sel && !right;
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-[15px] transition-colors ${right ? 'border-emerald bg-emerald-soft' : wrong ? 'border-amber bg-amber-soft' : sel ? 'border-ink bg-raised' : 'border-line hover:border-line-strong hover:bg-raised'}`}
                  >
                    <input type="radio" className="sr-only" name={`lq${q.id}`} checked={sel} disabled={checked} onChange={() => setMc((m) => ({ ...m, [q.id]: i }))} />
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${sel ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-3'}`}>{String.fromCharCode(97 + i)}</span>
                    {opt}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="border-t border-line pt-6">
          {!checked ? (
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={check} disabled={plays === 0 && hasTTS} size="lg">
                Check answers
              </Button>
              {plays === 0 && hasTTS && <span className="text-sm text-ink-3">Play the dialogue at least once.</span>}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Score value={score} />
                <div>
                  <div className="font-medium">
                    {correct} of {total} correct
                  </div>
                  <p className="text-sm text-ink-2">{score >= MASTERY ? 'Great ear! Try a faster speed next time.' : `You already caught ${correct}. Replay single lines at 0.7× with first letters on, and the rest will come through.`}</p>
                </div>
              </div>
              <SaveReceipt result={activity.result} error={activity.error} />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => go(index)}>
                  <ArrowCounterClockwise size={16} /> Try again
                </Button>
                {tasks.length > 1 && (
                  <Button variant="ghost" onClick={() => go((index + 1) % tasks.length)}>
                    Next dialogue <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
