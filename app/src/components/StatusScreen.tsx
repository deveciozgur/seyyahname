// Full-screen status page (404, crashes) in the access portal's dark style. Server-safe: no hooks.
export default function StatusScreen({ code, title, message, children }: { code: string; title: string; message: string; children?: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#08080a] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-zinc-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
      <div aria-hidden className="unlock-dots pointer-events-none fixed inset-0" />
      <div className="relative m-auto w-full max-w-[460px] py-6 text-center">
        <p className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">{code}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-balance text-zinc-400">{message}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>
      </div>
    </main>
  );
}

export const primaryAction =
  'inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.99]';
export const secondaryAction =
  'inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white';
