'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Microphone, Stop, MagicWand, ArrowCounterClockwise, ArrowRight, WarningCircle, Play, Pause, Lightbulb } from '@phosphor-icons/react';
import { api } from '@/api';
import { useActivity } from '@/lib/useActivity';
import FeedbackCard, { feedbackToActivity } from './FeedbackCard';
import Waveform from './Waveform';
import { Button, Panel, SaveReceipt, TaskPicker, TaskTitle, Hint } from './ui';

const Recognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : null;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function useRecorder({ lang }) {
  const [recording, setRecording] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [error, setError] = useState(null);
  const rec = useRef(null);
  const media = useRef(null);
  const audioCtx = useRef(null);
  const active = useRef(false);
  const startedAt = useRef(0);
  const timer = useRef(null);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setError(null);
    setInterim('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    active.current = true;

    // Microphone: feeds the waveform and the self-review recording.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new AudioContext();
      const node = ctx.createAnalyser();
      node.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(node);
      audioCtx.current = ctx;
      setAnalyser(node);

      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })));
      };
      mr.start();
      media.current = mr;
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Microphone access is blocked. Allow it from the address bar, or type what you said.' : `Microphone unavailable: ${e.message}`);
      if (!Recognition) {
        active.current = false;
        return;
      }
    }

    if (Recognition) {
      const r = new Recognition();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        let interimText = '';
        let add = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) add += e.results[i][0].transcript.trim() + ' ';
          else interimText += e.results[i][0].transcript;
        }
        if (add) setFinalText((t) => (t + ' ' + add).replace(/\s+/g, ' ').trimStart());
        setInterim(interimText);
      };
      r.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        setError(e.error === 'not-allowed' ? 'Speech recognition permission was denied.' : e.error === 'network' ? 'Live transcription in Chrome needs an internet connection.' : `Speech recognition error: ${e.error}`);
      };
      // Chrome ends recognition after a silence; keep listening until Stop.
      r.onend = () => active.current && r.start();
      r.start();
      rec.current = r;
    }

    startedAt.current = Date.now() - elapsed * 1000;
    timer.current = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    setRecording(true);
  }

  function stop() {
    active.current = false;
    clearInterval(timer.current);
    rec.current?.stop();
    rec.current = null;
    if (media.current?.state === 'recording') media.current.stop();
    media.current = null;
    audioCtx.current?.close();
    audioCtx.current = null;
    setAnalyser(null);
    setInterim('');
    setRecording(false);
  }

  function reset() {
    stop();
    setFinalText('');
    setElapsed(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  return { recording, finalText, setFinalText, interim, elapsed, audioUrl, analyser, error, start, stop, reset };
}

function Playback({ url }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <audio ref={audio} src={url} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button
        onClick={() => (playing ? audio.current.pause() : audio.current.play())}
        className="grid size-9 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink"
        aria-label={playing ? 'Pause your recording' : 'Play your recording'}
      >
        {playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
      </button>
      <span className="text-sm text-ink-2">Your recording</span>
      <span className="font-mono text-xs text-ink-3">{fmt(time)}</span>
    </div>
  );
}

export default function SpeakingModule({ level, tasks, onActivitySaved, passedIds = [], shield = false }) {
  const [index, setIndex] = useState(0);
  const task = tasks[index];
  const [lang, setLang] = useState('en-GB');
  const r = useRecorder({ lang });
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activity = useActivity(onActivitySaved);

  const transcript = r.finalText.trim();
  // The frustration shield halves the target time.
  const targetSec = shield ? Math.ceil(task.targetSec / 2) : task.targetSec;
  const progress = Math.min(1, r.elapsed / targetSec);

  async function analyse() {
    r.stop();
    setLoading(true);
    setError(null);
    setSubmitted(transcript);
    activity.reset();
    try {
      const durationSec = Math.round(r.elapsed) || null;
      const fb = await api.feedback({ mode: 'speaking', text: transcript, level, durationSec, task: { title: task.title, prompt: task.prompt, grammarFocus: task.grammarFocus } });
      setFeedback(fb);
      await activity.save({
        skill: 'speaking',
        level,
        score: fb.score,
        taskId: task.id,
        fn: task.fn,
        targetCanDo: task.targetCanDo,
        taskTitle: task.title,
        response: transcript,
        summary: `${fb.summary} (estimated ${fb.estimatedLevel}; ${fb.speaking?.wordCount ?? 0} words in ${durationSec ?? '?'}s${fb.speaking?.wpm ? `, ${fb.speaking.wpm} wpm` : ''}; ${fb.source} feedback)`,
        ...feedbackToActivity(fb),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function go(i) {
    r.reset();
    setIndex(i);
    setFeedback(null);
    activity.reset();
  }

  return (
    <div className="grid [&>*]:min-w-0 gap-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @4xl:gap-10">
      <div className="space-y-6">
        <div className="space-y-4">
          <TaskTitle level={level} title={task.title} theme={task.theme} hook={task.hook} fn={task.fn} skill="speaking" canDoId={task.targetCanDo}>
            <TaskPicker tasks={tasks} index={index} onChange={go} passedIds={passedIds} />
          </TaskTitle>
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-ink">{task.prompt}</p>
          {task.hint && <Hint>{task.hint}</Hint>}
          {task.hints?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Lightbulb size={16} className="text-amber" aria-hidden />
              {task.hints.map((h) => (
                <span key={h} className="rounded-full border border-line bg-sunk px-2.5 py-1 text-[13.5px] text-ink-2">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        <Panel className="overflow-hidden">
          {/* The waveform strip is the record control. */}
          <div className="relative">
            <button
              onClick={r.recording ? r.stop : r.start}
              className="group relative block h-36 w-full text-left focus-visible:outline-offset-[-4px]"
              aria-label={r.recording ? 'Stop recording' : r.elapsed ? 'Resume recording' : 'Start speaking'}
            >
              <div className="absolute inset-x-6 inset-y-6">
                <Waveform analyser={r.analyser} active={r.recording} />
              </div>
              {!r.recording && (
                <span className="absolute inset-0 grid place-items-center">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-paper transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]">
                    <Microphone size={16} weight="fill" />
                    {r.elapsed ? 'Keep speaking' : 'Tap to start speaking'}
                  </span>
                </span>
              )}
            </button>
            {r.recording && (
              <button onClick={r.stop} className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-brick text-paper transition-transform active:scale-95" aria-label="Stop recording">
                <Stop size={14} weight="fill" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-line px-5 py-2.5">
            <span className="font-mono text-xs text-ink-2 tabular-nums">
              {fmt(r.elapsed)} <span className="text-ink-3">/ {fmt(targetSec)}</span>
            </span>
            <div className="h-px flex-1 bg-line">
              <motion.div className={`h-px origin-left ${progress >= 1 ? 'bg-emerald' : 'bg-ink'}`} animate={{ scaleX: progress }} transition={{ duration: 0.3 }} />
            </div>
            {r.recording && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brick" role="status">
                <span className="size-1.5 animate-pulse rounded-full bg-brick" aria-hidden /> Listening
              </span>
            )}
            <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={r.recording} className="h-7 rounded-full border border-line bg-transparent px-2 text-xs text-ink-2" aria-label="Transcription accent">
              <option value="en-GB">British</option>
              <option value="en-US">American</option>
            </select>
          </div>

          <div className="border-t border-line px-5 pt-4 pb-5">
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="transcript" className="text-sm font-semibold">
                Live transcript
              </label>
              <span className="text-xs text-ink-3">{r.recording ? 'Updates as you speak' : 'Keep the slips in; they help the analysis.'}</span>
            </div>
            {r.recording ? (
              <p className="min-h-[136px] text-[17px] leading-8" aria-live="polite">
                {r.finalText}
                {r.interim && <span className="text-ink-3"> {r.interim}</span>}
                <span className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-ink" aria-hidden />
              </p>
            ) : (
              <textarea
                id="transcript"
                value={r.finalText}
                onChange={(e) => r.setFinalText(e.target.value)}
                rows={4}
                placeholder={Recognition ? 'Your words will appear here as you speak.' : 'Live transcription is not available in this browser. Record yourself, then type what you said in English.'}
                className="block min-h-[136px] w-full resize-y bg-transparent text-[17px] leading-8 placeholder:text-ink-3 focus:outline-none"
              />
            )}
          </div>

          {(r.audioUrl || r.error || !Recognition) && (
            <div className="space-y-2 border-t border-line px-5 py-3.5">
              {r.audioUrl && <Playback url={r.audioUrl} />}
              {!Recognition && (
                <p className="flex items-start gap-2 text-[13px] text-amber">
                  <WarningCircle size={16} className="mt-px shrink-0" /> Live transcription works in Chrome and Edge.
                </p>
              )}
              {r.error && (
                <p className="flex items-start gap-2 text-[13px] text-brick" role="alert">
                  <WarningCircle size={16} className="mt-px shrink-0" /> {r.error}
                </p>
              )}
            </div>
          )}
        </Panel>

        <div className="flex flex-wrap gap-2">
          <Button onClick={analyse} disabled={!transcript || loading || r.recording}>
            <MagicWand size={16} /> Analyze
          </Button>
          <Button variant="secondary" onClick={() => go(index)} disabled={r.recording}>
            <ArrowCounterClockwise size={16} /> Start over
          </Button>
          {tasks.length > 1 && (
            <Button variant="ghost" onClick={() => go((index + 1) % tasks.length)}>
              Next task <ArrowRight size={16} />
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-brick" role="alert">
            {error}
          </p>
        )}
        <SaveReceipt result={activity.result} error={activity.error} />
      </div>

      <div className="@4xl:sticky @4xl:top-24 @4xl:self-start">
        <FeedbackCard feedback={feedback} loading={loading} text={submitted} level={level} />
      </div>
    </div>
  );
}
