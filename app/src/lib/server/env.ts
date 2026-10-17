// Server configuration from the environment (.env, .env.local or the hosting panel). Read on use, so
// tests and a changed panel setting need no rebuild.
import path from 'node:path';

const str = (key: string, fallback = '') => {
  const v = process.env[key];
  return v === undefined || v.trim() === '' ? fallback : v.trim();
};

export const APP_VERSION = '2.0.0';

export const env = {
  get pin() {
    return str('APP_SECRET_PIN');
  },
  get sessionSecret() {
    return str('APP_SESSION_SECRET');
  },
  get sessionDays() {
    const n = Number(str('SESSION_DAYS', '7'));
    return Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7;
  },
  get geminiKey() {
    return str('GEMINI_API_KEY');
  },
  /** "gemini-flash-latest" always points to Google's current Flash model. */
  get geminiModel() {
    return str('GEMINI_MODEL', 'gemini-flash-latest');
  },
  /** Only for tests against a local stand-in; empty means Google's endpoint. */
  get geminiBaseUrl() {
    return str('GEMINI_BASE_URL');
  },
  /**
   * profile.json, vocabulary.md, error_ledger.md and sessions/. Default: data/ in the project folder,
   * also when running the standalone server (.next/standalone is replaced on every build).
   */
  get dataDir() {
    // turbopackIgnore: a runtime location, not a file for the build to trace and copy.
    const cwd = process.cwd();
    const inBuild = path.basename(cwd) === 'standalone' && path.basename(path.dirname(cwd)) === '.next';
    const project = inBuild ? path.resolve(/* turbopackIgnore: true */ cwd, '..', '..') : cwd;
    return path.resolve(/* turbopackIgnore: true */ project, str('DATA_DIR', 'data'));
  },
};
