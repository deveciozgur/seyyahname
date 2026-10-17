'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeSlash, LockSimple, CircleNotch, Check } from '@phosphor-icons/react';
import { api } from '@/api';

type Phase = 'idle' | 'submitting' | 'success' | 'error';

const INVALID = 'Invalid security PIN. Access denied.';

/** The Seyyahname mark: a rounded tile with a champagne-to-silver sheen and an inner ring. */
function Emblem() {
  return (
    <svg viewBox="0 0 48 48" className="size-12 drop-shadow-[0_8px_24px_rgba(232,192,125,0.25)]" aria-hidden="true">
      <defs>
        <linearGradient id="sy-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6e0" />
          <stop offset="0.45" stopColor="#e8c07d" />
          <stop offset="1" stopColor="#7c6a4c" />
        </linearGradient>
        <linearGradient id="sy-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#sy-sheen)" />
      <rect x="2" y="2" width="44" height="22" rx="13" fill="url(#sy-gloss)" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="#17120a" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="24" cy="24" r="2.5" fill="#17120a" fillOpacity="0.45" />
    </svg>
  );
}

/** Cell sizes shrink for longer PINs and on the narrowest phones (320px) so the row never clips. */
function cellSize(digits: number) {
  if (digits <= 4) return 'h-14 w-12 min-[381px]:h-16 min-[381px]:w-14 sm:h-[4.5rem] sm:w-16';
  if (digits <= 6) return 'h-13 w-10 min-[381px]:h-14 min-[381px]:w-12 sm:h-16 sm:w-13';
  return 'h-12 w-8 min-[381px]:h-13 min-[381px]:w-10 sm:h-14 sm:w-11';
}

/**
 * Access portal for the workspace. A numeric PIN (4-8 digits) is entered in segmented boxes with
 * auto-advance, backspace navigation and paste-to-submit; any other secret uses one masked field.
 * The PIN is checked on the server (rate-limited); a correct PIN sets an HttpOnly, signed session cookie.
 */
export default function Gatekeeper({ next = null, digits = null }: { next?: string | null; digits?: number | null }) {
  const router = useRouter();
  const segmented = typeof digits === 'number';
  const count = digits ?? 0;
  const [cells, setCells] = useState<string[]>(() => Array(count).fill(''));
  const [secret, setSecret] = useState('');
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const field = useRef<HTMLInputElement>(null);

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(count - 1, i))];
    el?.focus();
    el?.select();
  };

  useEffect(() => {
    if (segmented) focusCell(0);
    else field.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = phase === 'submitting' || phase === 'success';
  const value = segmented ? cells.join('') : secret;
  const complete = segmented ? value.length === count : value.length > 0;

  const submit = useCallback(
    async (pin: string) => {
      if (!pin || busy) return;
      setPhase('submitting');
      setError(null);
      try {
        await api.verify(pin);
        setPhase('success');
        // The coach lives in its own page on phones and tablets, and in the right-hand column of the
        // studio on wide screens.
        const target = next ?? (window.matchMedia('(min-width: 1280px)').matches ? '/' : '/coach');
        setTimeout(() => {
          router.replace(target);
          router.refresh();
        }, 420);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        setError(status === 429 || status === 503 ? (err as Error).message : INVALID);
        setPhase('error');
        setShakeKey((k) => k + 1);
        setCells(Array(count).fill(''));
        setSecret('');
        requestAnimationFrame(() => (segmented ? focusCell(0) : field.current?.focus()));
      }
    },
    [busy, count, next, router, segmented], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function fill(from: number, input: string) {
    const digitsIn = input.replace(/\D/g, '');
    if (!digitsIn) return;
    const nextCells = [...cells];
    let i = from;
    for (const d of digitsIn) {
      if (i >= count) break;
      nextCells[i++] = d;
    }
    setCells(nextCells);
    if (phase === 'error') setPhase('idle');
    if (nextCells.every(Boolean)) submit(nextCells.join(''));
    else focusCell(i);
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const nextCells = [...cells];
      if (nextCells[i]) nextCells[i] = '';
      else if (i > 0) {
        nextCells[i - 1] = '';
        focusCell(i - 1);
      }
      setCells(nextCells);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCell(i + 1);
    } else if (e.key === 'Enter' && complete) {
      submit(value);
    }
  }

  const success = phase === 'success';
  const failed = phase === 'error';

  return (
    <main className="unlock-canvas relative flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-auto bg-[#08080a] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-zinc-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
      <div aria-hidden className="unlock-dots pointer-events-none fixed inset-0" />

      <div className="relative m-auto flex w-full max-w-[420px] flex-col items-center py-6">
        <form
          key={shakeKey}
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
          className={`w-full rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-opacity duration-500 min-[381px]:p-6 sm:p-8 ${shakeKey ? 'animate-shake' : 'animate-rise'} ${success ? 'opacity-90' : ''}`}
          aria-describedby="unlock-help"
        >
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[11px] tracking-widest text-zinc-400 uppercase">
              <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              Restricted workspace
            </span>
            <div className="mt-6">
              <Emblem />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-balance text-white">Seyyahname Studio</h1>
            <p id="unlock-help" className="mt-1.5 text-sm leading-relaxed text-balance text-zinc-400">
              {segmented ? `Enter your ${count}-digit security PIN to unlock the workspace.` : 'Enter your security PIN to unlock the workspace.'}
            </p>
          </div>

          <fieldset disabled={busy} className="mt-7">
            <legend className="sr-only">Security PIN</legend>
            {segmented ? (
              <div className="flex justify-center gap-2 min-[381px]:gap-2.5 sm:gap-3" onPaste={(e) => (e.preventDefault(), fill(0, e.clipboardData.getData('text')))}>
                {cells.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => {
                      // One-time-code autofill or a typed digit over an existing one: a full code fills
                      // every cell, otherwise the newest digit replaces this cell.
                      const v = e.target.value.replace(/\D/g, '');
                      if (v.length >= count) fill(0, v);
                      else fill(i, v.slice(-1));
                    }}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={count}
                    type="text"
                    aria-label={`Digit ${i + 1} of ${count}`}
                    aria-invalid={failed}
                    className={`${cellSize(count)} pin-mask shrink-0 rounded-xl border text-center font-mono text-2xl font-bold text-white outline-none focus-visible:outline-none transition-all duration-200 focus:scale-105 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-80 ${
                      success ? 'border-emerald-500/50 bg-emerald-500/10' : failed ? 'border-rose-500/40 bg-black/50' : 'border-white/[0.1] bg-black/50'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={field}
                  type={show ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    if (phase === 'error') setPhase('idle');
                  }}
                  autoComplete="current-password"
                  aria-label="Security PIN"
                  aria-invalid={failed}
                  className={`h-14 w-full rounded-xl border pr-12 pl-4 font-mono text-lg tracking-[0.2em] break-all text-white outline-none focus-visible:outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                    success ? 'border-emerald-500/50 bg-emerald-500/10' : failed ? 'border-rose-500/40 bg-black/50' : 'border-white/[0.1] bg-black/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide PIN' : 'Show PIN'}
                  className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-200"
                >
                  {show ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <p role="alert" aria-live="assertive" className="mt-2 min-h-[1.25rem] text-center text-xs text-rose-400">
              {failed && error}
            </p>

            <button
              type="submit"
              disabled={!complete || busy}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check size={16} weight="bold" /> Unlocked
                </>
              ) : phase === 'submitting' ? (
                <>
                  <CircleNotch size={16} className="animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Unlock Workspace <ArrowRight size={15} weight="bold" />
                </>
              )}
            </button>
          </fieldset>
        </form>

        <a href="https://seyyahname.com" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center px-3 text-xs text-zinc-500 transition-colors hover:text-zinc-300">
          ← Back to seyyahname.com
        </a>
        <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] text-zinc-600">
          <LockSimple size={12} weight="fill" aria-hidden /> TLS-encrypted, signed session
        </p>
      </div>
    </main>
  );
}
