'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { api } from '@/api';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Anonymous lock screen: a PIN field and a sign-in button, nothing that names the site.
 * The PIN is checked on the server (APP_SECRET_PIN); a correct PIN sets an HttpOnly session cookie
 * (a signed JWT) and the page continues to where the visitor was going.
 */
export default function Gatekeeper({ next = '/' }: { next?: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), [shake]);

  async function submit(e) {
    e.preventDefault();
    if (!pin || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.verify(pin);
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setShake((n) => n + 1);
      setPin('');
      setBusy(false); // on success the button stays busy until the app has loaded
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <motion.form
        key={shake}
        onSubmit={submit}
        initial={shake ? { x: 0 } : { opacity: 0, y: 8 }}
        animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: shake ? 0.35 : 0.5, ease }}
        className="edge-top w-full max-w-[320px] space-y-3 rounded-[14px] border border-line bg-panel p-5 shadow-paper"
      >
        <label htmlFor="pin" className="sr-only">
          PIN
        </label>
        <div className="relative">
          <input
            ref={input}
            id="pin"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'pin-error' : undefined}
            className="h-11 w-full rounded-[10px] border border-line-strong bg-sunk px-3.5 pr-11 font-mono text-[15px] tracking-[0.25em] text-ink outline-none placeholder:tracking-normal placeholder:text-ink-3 focus:border-ink-3"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'PIN’i gizle' : 'PIN’i göster'}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:text-ink"
          >
            {show ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && (
          <p id="pin-error" role="alert" className="text-[13px] text-brick">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!pin || busy}
          className="h-11 w-full rounded-[10px] bg-ink text-[14px] font-medium text-paper transition-[transform,background-color] active:scale-[0.98] disabled:bg-line-strong disabled:text-ink-3"
        >
          {busy ? '…' : 'Giriş'}
        </button>
      </motion.form>
    </main>
  );
}
