'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Marked } from 'marked';
import { PaperPlaneRight, Stop, Sparkle, ArrowCounterClockwise, ChatsCircle } from '@phosphor-icons/react';
import { streamChat } from '@/api';
import type { ChatMessage } from '@/lib/api-contract';
import { readStored, writeStored } from '@/lib/useActivity';
import { Button, Panel } from './ui';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Replies can quote the learner, so raw HTML is shown as text, never rendered.
const marked = new Marked({ gfm: true, breaks: true, renderer: { html: ({ text }) => escapeHtml(text) } });

const STARTERS = ['Start today’s lesson at my level.', 'Give me a short speaking drill about my daily routine.', 'Check this sentence: "I am working in a office since 2020."', 'Teach me 3 travel phrases with IPA.'];

/** The saved conversation (JSON in localStorage); anything unreadable starts a fresh chat. */
function loadHistory() {
  try {
    const list = JSON.parse(readStored('coach.chat', '[]'));
    return Array.isArray(list) ? list.filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string') : [];
  } catch {
    return [];
  }
}

type ChatState = {
  messages: ChatMessage[];
  draft: string;
  setDraft: (text: string) => void;
  busy: boolean;
  error: string | null;
  send: (text: string) => void;
  stop: () => void;
  clear: () => void;
};

const ChatContext = createContext<ChatState | null>(null);

/**
 * The conversation lives here, above the pages: the messages, the draft and a running stream survive
 * every navigation (Studio, Curriculum, Vault, Archive), whichever view shows the chat.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Loaded after hydration (the server has no localStorage); nothing is saved before that.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setMessages(loadHistory());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded && !busy) writeStored('coach.chat', JSON.stringify(messages.slice(-40)));
  }, [messages, busy, loaded]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const history: ChatMessage[] = [...messages, { role: 'user', content }];
      setMessages([...history, { role: 'assistant', content: '' }]);
      setDraft('');
      setError(null);
      setBusy(true);
      abort.current = new AbortController();
      try {
        await streamChat(history, {
          signal: abort.current.signal,
          onText: (t) => setMessages((ms) => [...ms.slice(0, -1), { role: 'assistant', content: ms.at(-1).content + t }]),
        });
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
        setMessages((ms) => (ms.at(-1)?.content ? ms : ms.slice(0, -1)));
      } finally {
        setBusy(false);
        abort.current = null;
      }
    },
    [busy, messages],
  );

  const value = useMemo<ChatState>(
    () => ({ messages, draft, setDraft, busy, error, send, stop: () => abort.current?.abort(), clear: () => setMessages([]) }),
    [messages, draft, busy, error, send],
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}

/**
 * The chat view. docked: the persistent right-hand column on wide screens (full height, its own scroll);
 * otherwise the full Coach page on smaller screens. Both read the same conversation from ChatProvider.
 */
export default function CoachChat({ llm, docked = false }: { llm: boolean; docked?: boolean }) {
  const { messages, draft, setDraft, busy, error, send, stop, clear } = useChat();
  const end = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The docked column scrolls itself; scrollIntoView would also move the page behind it.
    if (docked && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    else if (messages.length) end.current?.scrollIntoView({ block: 'end' });
  }, [messages, docked]);

  const offline = !llm && (
    <p className={`rounded-xl border border-dashed border-line-strong px-4 py-3 text-ink-2 ${docked ? 'mx-4 mt-3 text-[12.5px]' : 'text-sm'}`}>
      The AI coach is offline. Add <code className="font-mono">GEMINI_API_KEY</code> to the server environment variables (or the <code className="font-mono">.env</code> file). Studio tasks keep working with offline feedback.
    </p>
  );

  const newChat = messages.length > 0 && (
    <Button variant="ghost" size="sm" onClick={clear} disabled={busy}>
      <ArrowCounterClockwise size={14} /> New chat
    </Button>
  );

  const feed = (
    <div ref={scroller} className={docked ? 'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4' : 'flex-1 space-y-6 px-6 py-6'} aria-live="polite">
      {messages.length === 0 ? (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-sm text-ink-3">
            <Sparkle size={16} /> Try one of these
          </p>
          <div className={docked ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={!llm} className={`rounded-full border border-line-strong px-4 py-2 text-left hover:border-ink disabled:opacity-50 ${docked ? 'rounded-[12px] text-[13px]' : 'text-sm'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className={`ml-auto max-w-[85%] rounded-[12px] rounded-br-[4px] border border-line-strong bg-sunk px-3.5 py-2.5 whitespace-pre-wrap [overflow-wrap:anywhere] text-ink ${docked ? 'text-[14px]' : ''}`}>
              {m.content}
            </div>
          ) : (
            <div key={i} className={`prose-session max-w-[65ch] ${docked ? 'text-[14px]' : 'text-[15px]'}`}>
              {m.content ? <div dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }} /> : <span className="inline-block h-4 w-2 animate-pulse bg-ink-3" aria-label="The coach is typing" />}
            </div>
          ),
        )
      )}
      <div ref={end} />
    </div>
  );

  const form = (
    <>
      {error && (
        <p role="alert" className={`border-t border-line text-sm text-brick ${docked ? 'px-4 py-2.5' : 'px-6 py-3'}`}>
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className={`flex items-end gap-2 border-t border-line p-3 ${docked ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))]' : 'sticky bottom-0 z-10 rounded-b-[14px] bg-raised/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur'}`}
      >
        <label htmlFor={docked ? 'chat-input-docked' : 'chat-input'} className="sr-only">
          Message the coach
        </label>
        <textarea
          id={docked ? 'chat-input-docked' : 'chat-input'}
          rows={docked ? 3 : 2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder={llm ? 'Write in English, press Enter to send' : 'The AI coach is offline'}
          disabled={!llm}
          className={`min-h-12 flex-1 resize-none rounded-xl bg-sunk outline-none focus:ring-2 focus:ring-line-strong ${docked ? 'px-3 py-2.5 text-[14px]' : 'px-4 py-3'}`}
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={stop} aria-label="Stop" className={docked ? 'w-10 px-0' : ''}>
            <Stop size={16} /> {!docked && <span className="hidden sm:inline">Stop</span>}
          </Button>
        ) : (
          <Button type="submit" disabled={!draft.trim() || !llm} aria-label="Send" className={docked ? 'w-10 px-0' : ''}>
            <PaperPlaneRight size={16} /> {!docked && <span className="hidden sm:inline">Send</span>}
          </Button>
        )}
      </form>
    </>
  );

  if (docked) {
    return (
      <aside aria-label="Coach chat" className="flex h-full flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold">
            <ChatsCircle size={16} className="text-amber" /> Coach
            <i className={`size-1.5 rounded-full ${llm ? 'bg-emerald shadow-[0_0_8px_var(--emerald)]' : 'bg-ink-3'}`} aria-label={llm ? 'Connected' : 'Offline'} />
          </span>
          {newChat}
        </header>
        {offline}
        {feed}
        {form}
      </aside>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Coach</h1>
          <p className="mt-2 text-ink-2">Talk with Seyyahname in English. It knows your sub-bands, your streak, the words due for review and your Polish patterns.</p>
        </div>
        {newChat}
      </header>
      {offline}
      <Panel className="flex min-h-[460px] flex-col">
        {feed}
        {form}
      </Panel>
    </div>
  );
}
