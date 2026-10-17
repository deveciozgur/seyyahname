// Brute-force brake for the PIN: MAX_FAILS wrong PINs from one address lock it for the window;
// GLOBAL_MAX_FAILS from all addresses together lock everyone. In memory: one Node process serves the app.

export const MAX_FAILS = 5;
export const GLOBAL_MAX_FAILS = 30;
export const WINDOW_MS = 15 * 60 * 1000;

type Entry = { fails: number; until: number; last: number };

export function createLimiter(now: () => number = Date.now) {
  const ips = new Map<string, Entry>();
  let global: number[] = [];

  function prune(t: number) {
    global = global.filter((x) => x > t - WINDOW_MS);
    for (const [ip, e] of ips) if (e.until <= t && e.last <= t - WINDOW_MS) ips.delete(ip);
  }

  return {
    /** Milliseconds until this address may try again, or 0. */
    wait(ip: string): number {
      const t = now();
      prune(t);
      const e = ips.get(ip);
      if (e && e.until > t) return e.until - t;
      return global.length >= GLOBAL_MAX_FAILS ? global[0] + WINDOW_MS - t : 0;
    },
    /** Records a wrong PIN; returns the lockout in ms if this attempt triggered one, else 0. */
    fail(ip: string): number {
      const t = now();
      prune(t);
      const e = ips.get(ip) ?? { fails: 0, until: 0, last: 0 };
      e.fails += 1;
      e.last = t;
      global.push(t);
      if (e.fails >= MAX_FAILS) {
        ips.set(ip, { fails: 0, until: t + WINDOW_MS, last: t });
        return WINDOW_MS;
      }
      ips.set(ip, e);
      return global.length >= GLOBAL_MAX_FAILS ? WINDOW_MS : 0;
    },
    clear(ip: string) {
      ips.delete(ip);
    },
  };
}

/** One limiter per server process, kept across hot reloads in development. */
const g = globalThis as typeof globalThis & { __seyyahnamePinLimiter?: ReturnType<typeof createLimiter> };
export const pinLimiter = (g.__seyyahnamePinLimiter ??= createLimiter());

/**
 * The client address. Behind the hosting panel's reverse proxy the last X-Forwarded-For entry is the
 * one that proxy added (earlier entries come from the client and can be forged).
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return headers.get('x-real-ip')?.trim() || 'local';
}

export const lockedMessage = (ms: number) => `Too many attempts. Try again in ${Math.max(1, Math.ceil(ms / 60000))} minute${Math.ceil(ms / 60000) > 1 ? 's' : ''}.`;
