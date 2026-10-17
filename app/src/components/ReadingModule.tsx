'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowBendDownRight, ArrowCounterClockwise, ArrowRight, Lightbulb } from '@phosphor-icons/react';
import { MASTERY, normalize } from '@/lib/cefr';
import { useActivity } from '@/lib/useActivity';
import { Button, Panel, SaveReceipt, Score, TaskPicker, TaskTitle, TurkishHint } from './ui';

export function isCorrect(q, answer) {
  if (answer == null || answer === '') return false;
  if (q.type === 'mc') return Number(answer) === q.answer;
  if (q.type === 'yesno') return answer === q.answer;
  const a = ` ${normalize(answer)} `;
  return q.accept.every((group) => group.some((opt) => a.includes(normalize(opt))));
}

const correctText = (q) => (q.type === 'mc' ? q.options[q.answer] : q.type === 'yesno' ? (q.answer === 'yes' ? 'Yes' : 'No') : q.accept.map((g) => g[0]).join(', '));

const choice = (selected, state) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-left text-[15px] transition-colors ${
    state === 'right' ? 'border-emerald bg-emerald-soft' : state === 'wrong' ? 'border-amber bg-amber-soft' : state === 'hidden' ? 'pointer-events-none border-dashed border-line opacity-40 line-through' : selected ? 'border-ink bg-raised' : 'border-line hover:border-line-strong hover:bg-raised'
  }`;

/** Frustration-shield hint: a first-letters clue, one option removed, or where to look. */
function hintFor(q) {
  if (q.type === 'short') {
    const a = q.accept[0][0];
    return { text: `"${a.slice(0, Math.max(1, Math.ceil(a.length / 3)))}…" ile başlıyor` };
  }
  if (q.type === 'mc') return { text: 'Bir seçenek elendi. Kalanlar arasından seç.', remove: q.options.findIndex((_, i) => i !== q.answer) };
  return { text: 'Sorudaki anahtar kelimenin geçtiği cümleyi bul ve yavaşça oku.' };
}

function Question({ q, value, onChange, checked, shield }) {
  const ok = checked && isCorrect(q, value);
  const [hint, setHint] = useState(shield);
  useEffect(() => {
    if (shield) setHint(true);
  }, [shield]);
  const h = hint ? hintFor(q) : null;
  return (
    <fieldset className="space-y-3">
      <legend className="flex w-full items-start gap-3">
        <span className="w-5 shrink-0 pt-0.5 font-mono text-[13px] leading-none text-ink-3">{q.id}</span>
        <span className="flex-1">
          <span className="block text-[15.5px] leading-snug font-medium">{q.q}</span>
          {q.tr && <TurkishHint className="mt-1">{q.tr}</TurkishHint>}
        </span>
        {checked ? (
          ok ? (
            <Check size={20} weight="bold" className="shrink-0 text-emerald" aria-label="Doğru" />
          ) : (
            <ArrowBendDownRight size={20} weight="bold" className="shrink-0 text-amber" aria-label="Neredeyse" />
          )
        ) : (
          q.type !== 'yesno' && (
            <button onClick={() => setHint((x) => !x)} className={`shrink-0 rounded-full p-1 transition-colors ${hint ? 'text-amber' : 'text-ink-3 hover:text-amber'}`} aria-pressed={hint} aria-label="İpucu" title="İpucu">
              <Lightbulb size={18} weight={hint ? 'fill' : 'regular'} />
            </button>
          )
        )}
      </legend>
      {h && !checked && <p className="pl-8 text-[13.5px] text-amber">{h.text}</p>}

      <div className="pl-8">
        {q.type === 'short' && (
          <input
            type="text"
            value={value ?? ''}
            disabled={checked}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${q.id}. sorunun cevabı`}
            placeholder="Cevabın (İngilizce)"
            className={`h-11 w-full rounded-[10px] border bg-raised px-3.5 text-[15px] placeholder:text-ink-3 focus:border-ink focus:outline-none ${checked ? (ok ? 'border-emerald' : 'border-amber') : 'border-line-strong'}`}
          />
        )}
        {q.type === 'yesno' && (
          <div className="flex gap-2">
            {['yes', 'no'].map((opt) => {
              const sel = value === opt;
              const state = checked && sel ? (ok ? 'right' : 'wrong') : checked && opt === q.answer ? 'right' : null;
              return (
                <label key={opt} className={`${choice(sel, state)} w-auto px-5`}>
                  <input type="radio" className="sr-only" name={`q${q.id}`} checked={sel} disabled={checked} onChange={() => onChange(opt)} />
                  {opt === 'yes' ? 'Yes' : 'No'}
                </label>
              );
            })}
          </div>
        )}
        {q.type === 'mc' && (
          <div className="grid gap-1.5">
            {q.options.map((opt, i) => {
              const sel = String(value) === String(i);
              const state = checked && i === q.answer ? 'right' : checked && sel ? 'wrong' : !checked && h?.remove === i ? 'hidden' : null;
              return (
                <label key={i} className={choice(sel, state)}>
                  <input type="radio" className="sr-only" name={`q${q.id}`} checked={sel} disabled={checked} onChange={() => onChange(i)} />
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${sel ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-3'}`}>{String.fromCharCode(97 + i)}</span>
                  {opt}
                </label>
              );
            })}
          </div>
        )}
        {checked && !ok && q.type === 'short' && (
          <p className="mt-2 text-sm text-ink-2">
            Doğrusu: <span className="font-medium text-emerald">{correctText(q)}</span>
          </p>
        )}
      </div>
    </fieldset>
  );
}

export default function ReadingModule({ level, tasks, onActivitySaved, passedIds = [], shield = false }) {
  const [index, setIndex] = useState(0);
  const task = tasks[index];
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const activity = useActivity(onActivitySaved);

  const correct = task.questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const score = Math.round((correct / task.questions.length) * 100);
  const answeredAll = task.questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== '');

  function check() {
    setChecked(true);
    const wrong = task.questions.filter((q) => !isCorrect(q, answers[q.id]));
    activity.save({
      skill: 'reading',
      level,
      score,
      taskId: task.id,
      fn: task.fn,
        taskTitle: task.title,
      summary: `${correct}/${task.questions.length} correct.`,
      details: wrong.map((q) => `Missed Q${q.id} "${q.q}": answered "${q.type === 'mc' ? (q.options[answers[q.id]] ?? '-') : (answers[q.id] ?? '-')}", expected "${correctText(q)}"`),
      vocabulary: task.vocab,
    });
  }

  function go(i) {
    setIndex(i);
    setAnswers({});
    setChecked(false);
    activity.reset();
  }

  const paragraphs = task.text.split('\n\n');

  return (
    <div className="grid [&>*]:min-w-0 gap-10 @4xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @4xl:gap-12">
      <Panel as="article" className="self-start px-6 py-7 sm:px-10 sm:py-10">
        <TaskTitle level={level} title={task.title} theme={task.theme} hook={task.hook} fn={task.fn} skill="reading">
          <TaskPicker tasks={tasks} index={index} onChange={go} passedIds={passedIds} />
        </TaskTitle>
        <div className="reading mt-7 max-w-[62ch]">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:text-[3.2em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-amber' : ''}>
              {p}
            </p>
          ))}
        </div>

        <AnimatePresence>
          {checked && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="overflow-hidden" aria-label="Anahtar kelimeler">
              <div className="mt-9 border-t border-line pt-6">
                <h3 className="mb-4 text-sm font-semibold">Anahtar kelimeler artık kasanda</h3>
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {task.vocab.map((v) => (
                    <div key={v.word}>
                      <dt className="text-lg font-semibold tracking-[-0.01em]">{v.word}</dt>
                      <dd lang="tr" className="text-sm text-ink-3">
                        {v.meaning}
                      </dd>
                      <dd className="mt-0.5 text-[14.5px] text-ink-2">{v.example}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </Panel>

      <div className="space-y-8 @4xl:pt-4">
        {task.questions.map((q) => (
          <Question key={`${task.id}-${q.id}`} q={q} value={answers[q.id]} checked={checked} shield={shield} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
        ))}

        <div className="border-t border-line pt-6">
          {!checked ? (
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={check} disabled={!answeredAll} size="lg">
                Cevapları kontrol et
              </Button>
              {!answeredAll && <span className="text-sm text-ink-3">Her soruyu cevapla. Emin değil misin? &ldquo;I don&rsquo;t know&rdquo; yaz.</span>}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Score value={score} />
                <div>
                  <div className="font-medium">
                    {task.questions.length} sorudan {correct} doğru
                  </div>
                  <p className="text-sm text-ink-2">{score >= MASTERY ? `Güçlü bir okuma. Bu metin ${level} ustalığına sayılıyor.` : `${correct} doğru cevap, güzel bir başlangıç. Metni yeniden oku, gerisi oturacak; istersen ipuçları hazır.`}</p>
                </div>
              </div>
              <SaveReceipt result={activity.result} error={activity.error} />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => go(index)}>
                  <ArrowCounterClockwise size={16} /> Tekrar dene
                </Button>
                {tasks.length > 1 && (
                  <Button variant="ghost" onClick={() => go((index + 1) % tasks.length)}>
                    Sonraki metin <ArrowRight size={16} />
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
