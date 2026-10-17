'use client';

// The signed-in app frame, shared by every page through app/(coach)/layout.tsx: learner sheet and
// navigation on the left, the page in the centre and, from 1280px, the coach chat as a persistent right
// column. Because it lives in the layout, the frame and the chat never unmount while the learner moves
// between pages; pages read the profile and actions from useCoach().
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import { IconContext, WarningCircle, SignOut, Sun, Moon, Notebook, ChatsCircle, Monitor, Vault as VaultIcon, Archive, Path, TrendUp } from '@phosphor-icons/react';
import { LOCKED_EVENT, api, refreshOnFocus } from '@/api';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getBand, type Scenario, type SubBand } from '@/lib/core/curriculum';
import LearnerSheet from '@/components/Sidebar';
import CoachChat, { ChatProvider, useChat } from '@/components/CoachChat';
import { Skeleton } from '@/components/ui';

export const APP_NAME = 'Seyyahname';

const NAV = [
  { href: '/', label: 'Studio', title: 'Studio', icon: Notebook },
  { href: '/curriculum', label: 'Curriculum', title: 'Curriculum & Roadmap', icon: Path },
  { href: '/coach', label: 'Coach', title: 'Coach', icon: ChatsCircle },
  { href: '/vault', label: 'Vault', title: 'Vault', icon: VaultIcon },
  { href: '/archive', label: 'Archive', title: 'Archive', icon: Archive },
] as const;

type ActivityResult = { profile?: any; curriculum?: { levelUp?: { from: string; to: string } | null } };
type CoachContextValue = {
  profile: any;
  refreshKey: number;
  llm: boolean;
  wide: boolean;
  /** Changes when "See the new band" should reset the roadmap to the new band. */
  roadmapKey: number;
  onActivitySaved: (result: ActivityResult) => void;
  rehearse: (band: SubBand, scenario: Scenario) => void;
};

const CoachContext = createContext<CoachContextValue | null>(null);

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach must be used inside <CoachShell>');
  return ctx;
}

const THEME_OPTIONS = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
] as const;

/** System / Dark / Light. "System" follows the OS setting; a manual choice is remembered and wins. */
function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();
  const pill = useId(); // the top bar and the mobile header each have a switch
  if (compact) {
    // Phones: one 44px button that cycles System → Dark → Light, so the header fits at 320px.
    const i = THEME_OPTIONS.findIndex((o) => o.id === mode);
    const current = THEME_OPTIONS[i < 0 ? 0 : i];
    const next = THEME_OPTIONS[(Math.max(0, i) + 1) % THEME_OPTIONS.length];
    const Icon = current.icon;
    return (
      <button
        onClick={() => setMode(next.id)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        title={`Theme: ${current.label}`}
        className="grid size-11 shrink-0 place-items-center rounded-lg border border-line-strong bg-sunk/60 text-ink-2 transition-colors hover:text-ink"
      >
        <Icon size={17} weight="fill" />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className="relative flex shrink-0 items-center gap-0.5 rounded-lg border border-line-strong bg-sunk/60 p-0.5">
      {THEME_OPTIONS.map(({ id, label, icon: Icon }) => {
        const on = mode === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={on}
            aria-label={`Theme: ${label}`}
            title={label}
            onClick={() => setMode(id)}
            className={`relative grid size-7 place-items-center rounded-md transition-colors ${on ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            {on && <motion.span layoutId={pill} className="absolute inset-0 rounded-md bg-panel shadow-[inset_0_0_0_1px_var(--line-strong)]" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }} />}
            <Icon size={14} weight={on ? 'fill' : 'regular'} className="relative" />
          </button>
        );
      })}
    </div>
  );
}

/** True on screens wide enough for the persistent chat column (Tailwind xl, 1280px). */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1280px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

function LockButton({ onLogout }) {
  if (!onLogout) return null;
  return (
    <button onClick={onLogout} className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-hover hover:text-ink" aria-label="Lock" title="Lock">
      <SignOut size={17} />
    </button>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1.5">
      <span className="size-[26px] shrink-0 rounded-lg bg-[radial-gradient(circle_at_30%_30%,#fff3d6,#e8c07d_45%,#8a6a35)] shadow-[0_0_18px_var(--glow)]" aria-hidden />
      <span className="font-semibold tracking-[-0.01em]">{APP_NAME}</span>
      <span className="hidden rounded-[5px] border border-line-strong px-1.5 font-mono text-[10.5px] whitespace-nowrap text-ink-3 min-[400px]:inline">AI Coach</span>
    </div>
  );
}

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

/** Sidebar navigation: a vertical list on desktop, five tabs on mobile. Coach lives in the right column on wide screens. */
function Nav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main menu" className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-0.5 xl:[&>a:nth-child(3)]:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] leading-tight transition-colors sm:flex-row sm:gap-2.5 sm:px-2.5 sm:py-[7px] sm:text-[13.5px] lg:justify-start ${active ? 'bg-sunk text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]' : 'text-ink-2 hover:bg-hover hover:text-ink'}`}
          >
            <Icon size={16} weight={active ? 'fill' : 'regular'} className="shrink-0 opacity-80" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Slim top bar over the content (Concept C): current page, AI status, theme and lock. */
function TopBar({ pathname, llm, onLogout }: { pathname: string; llm: boolean; onLogout: () => void }) {
  const current = NAV.find((n) => isActive(pathname, n.href));
  return (
    <div className="sticky top-0 z-20 hidden h-[52px] items-center gap-3 border-b border-line bg-paper/80 px-7 backdrop-blur-md lg:flex">
      <span className="text-[13px] text-ink-3">
        {APP_NAME} <span className="mx-1">›</span> <b className="font-medium text-ink">{current?.title}</b>
      </span>
      <span
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-[3px] text-xs text-ink-2"
        title={llm ? 'Feedback is generated by Gemini' : 'Add GEMINI_API_KEY on the server to enable AI feedback'}
      >
        <i className={`size-1.5 rounded-full ${llm ? 'bg-emerald shadow-[0_0_8px_var(--emerald)]' : 'bg-ink-3'}`} />
        {llm ? 'Gemini connected' : 'Offline feedback'}
      </span>
      <ThemeSwitch />
      <LockButton onLogout={onLogout} />
    </div>
  );
}

/** Shown once when a band's four Can-Dos are all mastered and the next sub-band opens. */
function LevelUp({ up, onClose, onRoadmap }) {
  const next = getBand(up.to);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-paper/70 px-4 py-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        onClick={(e) => e.stopPropagation()}
        className="edge-top w-full max-w-[420px] space-y-4 rounded-[16px] border border-line bg-panel p-6 shadow-paper"
      >
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-amber-soft text-amber shadow-[0_0_24px_var(--glow)]">
          <TrendUp size={20} weight="bold" />
        </span>
        <div className="space-y-1.5">
          <h2 id="levelup-title" className="text-[22px] font-semibold tracking-[-0.02em]">
            Level up: <span className="text-sheen font-mono">{up.from} → {up.to}</span>
          </h2>
          <p className="text-[14px] text-ink-2">You mastered all four Can-Do goals of {up.from}. Your next goal:</p>
          {next && <p className="text-[15px] text-ink">{next.goal}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRoadmap} className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-paper active:scale-[0.98]">
            See the new band
          </button>
          <button onClick={onClose} className="h-10 rounded-full border border-line-strong px-4 text-sm text-ink-2 hover:text-ink">
            Keep going
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[272px_minmax(0,1fr)]">
      <div className="space-y-4 border-r border-line bg-panel p-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[420px] w-full max-w-3xl rounded-[14px]" />
      </div>
    </div>
  );
}

export default function CoachShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <Frame>{children}</Frame>
    </ChatProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wide = useWide();
  const chat = useChat();
  const [profile, setProfile] = useState(null);
  const [llm, setLlm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [roadmapKey, setRoadmapKey] = useState(0);
  const [levelUp, setLevelUp] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    // An expired session makes any API call answer 401: back to the lock screen.
    const lock = () => router.replace(`/unlock${pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`);
    window.addEventListener(LOCKED_EVENT, lock);
    return () => window.removeEventListener(LOCKED_EVENT, lock);
  }, [router, pathname]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.authStatus(), api.profile()])
      .then(([status, p]) => {
        if (!alive) return;
        setLlm(status.ai);
        setProfile(p);
      })
      .catch((e) => alive && !e.locked && setError(e.message));
    // Changes saved from another device show up when this tab is focused again.
    const stop = refreshOnFocus(() =>
      api.profile().then((p) => {
        setProfile(p);
        setRefreshKey((k) => k + 1);
      }),
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  // The Coach page is the chat itself; on wide screens the chat column already shows it.
  useEffect(() => {
    if (wide && pathname === '/coach') router.replace('/');
  }, [wide, pathname, router]);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    router.replace('/unlock');
  }, [router]);

  const onActivitySaved = useCallback((result: ActivityResult) => {
    if (result.profile) setProfile(result.profile);
    setRefreshKey((k) => k + 1);
    if (result.curriculum?.levelUp) setLevelUp(result.curriculum.levelUp);
  }, []);

  // "Role-play with the coach": the scenario, written out as a ready-to-send message in the chat.
  const { setDraft } = chat;
  const rehearse = useCallback(
    (band: SubBand, s: Scenario) => {
      setDraft(`Let's role-play a ${band.id} scenario: "${s.title}". ${s.setting} ${s.task} You play the other person; keep your English at my level and start the conversation.`);
      if (!wide) router.push('/coach');
    },
    [setDraft, wide, router],
  );

  const value = useMemo<CoachContextValue>(() => ({ profile, refreshKey, llm, wide, roadmapKey, onActivitySaved, rehearse }), [profile, refreshKey, llm, wide, roadmapKey, onActivitySaved, rehearse]);

  return (
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
        {error ? (
          <div className="mx-auto max-w-lg px-4 py-24">
            <div className="flex items-center gap-2 font-medium text-brick">
              <WarningCircle size={22} /> Can't reach your data
            </div>
            <p className="mt-2 text-ink-2">{error}</p>
            <p className="mt-4 text-sm text-ink-3">Check the server log and environment variables (APP_SECRET_PIN, DATA_DIR), then reload the page.</p>
          </div>
        ) : !profile ? (
          <LoadingShell />
        ) : (
          <CoachContext.Provider value={value}>
            <div className="min-h-dvh pt-[env(safe-area-inset-top)] lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:pt-0 xl:grid-cols-[272px_minmax(0,1fr)_minmax(340px,400px)]">
              <LearnerSheet
                profile={profile}
                refreshKey={refreshKey}
                header={
                  <div className="flex items-center justify-between gap-2">
                    <Brand />
                    <span className="flex items-center gap-1 lg:hidden">
                      <ThemeSwitch compact />
                      <LockButton onLogout={logout} />
                    </span>
                  </div>
                }
                nav={<Nav pathname={pathname} />}
              />
              <div className="min-w-0">
                <TopBar pathname={pathname} llm={llm} onLogout={logout} />
                <main className="@container mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
                  <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                    {children}
                  </motion.div>
                </main>
              </div>
              {/* Persistent chat column (xl+): mounted once in the layout, it stays as the pages change. */}
              {wide && (
                <div className="sticky top-0 h-dvh border-l border-line bg-panel">
                  <CoachChat docked llm={llm} />
                </div>
              )}
              <AnimatePresence>
                {levelUp && (
                  <LevelUp
                    up={levelUp}
                    onClose={() => setLevelUp(null)}
                    onRoadmap={() => {
                      setLevelUp(null);
                      setRoadmapKey((k) => k + 1); // leave a practice screen and show the new band
                      router.push('/curriculum');
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </CoachContext.Provider>
        )}
      </IconContext.Provider>
    </MotionConfig>
  );
}
