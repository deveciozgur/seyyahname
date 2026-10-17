'use client';

import { useEffect, useState } from 'react';
import { PaperPlaneRight, ArrowCounterClockwise, ArrowRight, Lightbulb } from '@phosphor-icons/react';
import { api } from '@/api';
import { readStored, useActivity, writeStored } from '@/lib/useActivity';
import FeedbackCard, { feedbackToActivity } from './FeedbackCard';
import { Button, Panel, SaveReceipt, TaskPicker, TaskTitle, Hint } from './ui';

/** A half-finished answer built from the sentence starters, for the frustration shield. */
const starter = (task) => (task.hints ?? []).join(' ');

const countWords = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

// Ruled-paper background aligned to the 32px line height of the textarea.
const RULED = {
  backgroundImage: 'linear-gradient(to bottom, transparent 31px, var(--line) 31px, var(--line) 32px)',
  backgroundSize: '100% 32px',
  backgroundPositionY: '20px',
};

export default function WritingModule({ level, tasks, onActivitySaved, passedIds = [], shield = false }) {
  const [index, setIndex] = useState(0);
  const task = tasks[index];
  const draftKey = `coach.draft.${task.id}`;
  const [text, setText] = useState(() => readStored(draftKey, ''));
  const [submitted, setSubmitted] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activity = useActivity(onActivitySaved);

  useEffect(() => writeStored(draftKey, text), [draftKey, text]);

  const words = countWords(text);
  const enough = words >= task.minWords;

  async function submit() {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSubmitted(text);
    activity.reset();
    try {
      const fb = await api.feedback({ mode: 'writing', text, level, task: { title: task.title, prompt: task.prompt, minWords: task.minWords, maxWords: task.maxWords, register: task.register, grammarFocus: task.grammarFocus } });
      setFeedback(fb);
      await activity.save({
        skill: 'writing',
        level,
        score: fb.score,
        taskId: task.id,
        fn: task.fn,
        targetCanDo: task.targetCanDo,
        taskTitle: task.title,
        response: text,
        summary: `${fb.summary} (estimated ${fb.estimatedLevel}, ${words} words, ${fb.source} feedback)`,
        ...feedbackToActivity(fb),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function go(i) {
    setIndex(i);
    setText(readStored(`coach.draft.${tasks[i].id}`, ''));
    setFeedback(null);
    activity.reset();
  }

  return (
    <div className="grid [&>*]:min-w-0 gap-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @4xl:gap-10">
      <div className="space-y-6">
        <div className="space-y-4">
          <TaskTitle level={level} title={task.title} theme={task.theme} hook={task.hook} fn={task.fn} skill="writing" canDoId={task.targetCanDo}>
            <TaskPicker tasks={tasks} index={index} onChange={go} passedIds={passedIds} />
          </TaskTitle>
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-ink">{task.prompt}</p>
          {task.hint && <Hint>{task.hint}</Hint>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
            <span>
              {task.minWords}–{task.maxWords} words
            </span>
            <span>Register: {({ informal: 'informal', neutral: 'neutral', formal: 'formal' })[task.register] ?? task.register}</span>
          </div>
          {task.hints?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Lightbulb size={16} className="text-amber" aria-hidden />
              <span className="sr-only">Sentence starters:</span>
              {task.hints.map((h) => (
                <button
                  key={h}
                  onClick={() => setText((t) => (t ? `${t.trimEnd()} ${h}` : h))}
                  className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[13.5px] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                  title="Add to your text"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {shield && !text.trim() && (
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-emerald-soft px-4 py-3">
            <p className="min-w-0 flex-1 text-[15px] text-ink-2">{starter(task)}</p>
            <Button size="sm" onClick={() => setText(starter(task))}>
              Get me started
            </Button>
          </div>
        )}

        <Panel className="overflow-hidden focus-within:ring-2 focus-within:ring-amber/40">
          <label htmlFor="writing-input" className="sr-only">
            Your text
          </label>
          <textarea
            id="writing-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={11}
            spellCheck={false}
            placeholder="Write in English here. Spellcheck is off so we can see your natural English."
            style={RULED}
            className="block w-full resize-y bg-transparent px-6 pt-5 pb-6 text-[16.5px] leading-[32px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className={`font-mono text-xs ${enough ? 'text-emerald' : 'text-ink-3'}`} aria-live="polite">
              {words} / {task.minWords}+ words
            </span>
            <Button onClick={submit} disabled={!words || loading}>
              <PaperPlaneRight size={16} weight="fill" /> {feedback ? 'Resubmit' : 'Get feedback'}
            </Button>
          </div>
        </Panel>

        {error && (
          <p className="text-sm text-brick" role="alert">
            {error}
          </p>
        )}
        <SaveReceipt result={activity.result} error={activity.error} />
        {feedback && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setFeedback(null)}>
              <ArrowCounterClockwise size={16} /> Revise
            </Button>
            {tasks.length > 1 && (
              <Button variant="ghost" onClick={() => go((index + 1) % tasks.length)}>
                Next task <ArrowRight size={16} />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="@4xl:sticky @4xl:top-[72px] @4xl:self-start">
        <FeedbackCard feedback={feedback} loading={loading} text={submitted} level={level} />
      </div>
    </div>
  );
}
