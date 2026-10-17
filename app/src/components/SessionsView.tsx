'use client';

import { useEffect, useState } from 'react';
import { Marked } from 'marked';
import { FileText } from '@phosphor-icons/react';
import { api } from '@/api';
import { Panel, Skeleton } from './ui';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Session logs contain the learner's own answers, so raw HTML is shown as text, never rendered.
const marked = new Marked({ gfm: true, renderer: { html: ({ text }) => escapeHtml(text) } });

const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function SessionsView({ refreshKey }) {
  const [dates, setDates] = useState(null);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .sessions()
      .then((d) => {
        setDates(d);
        setSelected((s) => s ?? d[0] ?? null);
      })
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  useEffect(() => {
    if (!selected) return;
    api
      .session(selected)
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [selected, refreshKey]);

  return (
    <div className="space-y-7">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Archive</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">One page per day. Every activity you finish is written to that day's session file.</p>
      </header>
      {error && (
        <p className="text-sm text-brick" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-8 @2xl:grid-cols-[200px_minmax(0,1fr)] @2xl:gap-10">
        <nav aria-label="Session days">
          {dates === null ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : dates.length === 0 ? (
            <p className="text-sm text-ink-3">No sessions yet.</p>
          ) : (
            <ul className="flex gap-1 overflow-x-auto @2xl:flex-col">
              {dates.map((d) => (
                <li key={d}>
                  <button
                    onClick={() => setSelected(d)}
                    aria-current={selected === d ? 'page' : undefined}
                    className={`w-full rounded-full px-4 py-2 text-left text-sm whitespace-nowrap transition-colors ${selected === d ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-hover hover:text-ink'}`}
                  >
                    {fmtDate(d)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <Panel as="article" className="min-w-0 px-6 py-7 sm:px-10 sm:py-9">
          {selected && content !== null ? (
            <>
              <div className="mb-5 flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                <FileText size={13} /> sessions/{selected}.md
              </div>
              <div className="prose-session max-w-[68ch]" dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
            </>
          ) : selected ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <p className="text-ink-3">Pick a day.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
