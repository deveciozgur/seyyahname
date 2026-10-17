// The coach files on the server's disk. The coaching logic runs in the browser on a copy of these
// files; this module serves them, guards which files may be written and makes every write atomic:
//  - writes go to "<name>.<random>.tmp" and are renamed into place (a reader never sees half a file),
//  - saves are serialised in this process (a promise queue) and across processes (an O_EXCL lock file),
//  - a version number rejects a save based on stale files (409), so two devices never overwrite each other,
//  - the first save of a day copies the files to backups/YYYY-MM-DD/ (14 days are kept).
// A missing data folder or file is recreated from the starting templates on first use.
import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATE_RE, SESSION_FILE_RE, STATE_FILES, type SaveResponse, type StateFile, type StatePayload } from '../api-contract.ts';
import { TEMPLATES } from './templates.ts';

export const MAX_FILE_BYTES = 1024 * 1024;
const BACKUP_DAYS = 14;
const LOCK_STALE_MS = 15_000;
const LOCK_TIMEOUT_MS = 10_000;

export class StorageError extends Error {
  status: number;
  extra: Record<string, unknown>;
  constructor(message: string, status: number, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const today = () => new Date().toLocaleDateString('sv-SE');
const exists = (p: string) => fs.access(p).then(() => true, () => false);

async function writeAtomic(file: string, content: string) {
  const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    await fs.writeFile(tmp, content, 'utf8');
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

export function createStorage(dir: string) {
  let queue: Promise<unknown> = Promise.resolve();
  let inFlight: Promise<void> | null = null;

  /**
   * Creates data/, sessions/ and any missing starting file. Checked on every request (a few stat calls),
   * so a folder deleted or emptied while the server runs heals itself; concurrent calls share one run.
   */
  function bootstrap(): Promise<void> {
    inFlight ??= (async () => {
      await fs.mkdir(path.join(dir, 'sessions'), { recursive: true });
      for (const name of STATE_FILES) {
        const file = path.join(dir, name);
        // 'wx' never replaces a file that appeared in the meantime.
        if (!(await exists(file))) await fs.writeFile(file, TEMPLATES[name](), { encoding: 'utf8', flag: 'wx' }).catch((e) => (e.code === 'EEXIST' ? undefined : Promise.reject(e)));
      }
    })()
      .catch((err) => {
        throw new StorageError(`Veri klasörü hazırlanamadı (${dir}): ${err.message}. Sunucuya bu klasör için yazma izni verin ya da DATA_DIR ayarlayın.`, 500);
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  /** Cross-process lock: an exclusive lock file; one left behind by a crashed process expires. */
  async function withFileLock<T>(fn: () => Promise<T>): Promise<T> {
    const lock = path.join(dir, '.lock');
    const start = Date.now();
    for (;;) {
      try {
        const handle = await fs.open(lock, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
        await handle.writeFile(String(process.pid));
        await handle.close();
        break;
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
        const age = await fs.stat(lock).then((s) => Date.now() - s.mtimeMs, () => 0);
        if (age > LOCK_STALE_MS) await fs.rm(lock, { force: true });
        else if (Date.now() - start > LOCK_TIMEOUT_MS) throw new StorageError('Veriler şu an başka bir işlem tarafından yazılıyor. Biraz sonra tekrar deneyin.', 503);
        else await new Promise((r) => setTimeout(r, 25));
      }
    }
    try {
      return await fn();
    } finally {
      await fs.rm(lock, { force: true });
    }
  }

  function exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(() => withFileLock(fn));
    queue = run.catch(() => {});
    return run;
  }

  async function version(): Promise<number> {
    const raw = await fs.readFile(path.join(dir, '.version'), 'utf8').catch(() => '0');
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  async function sessionNames(): Promise<string[]> {
    const names = await fs.readdir(path.join(dir, 'sessions')).catch(() => [] as string[]);
    return names.filter((n) => /^\d{4}-\d{2}-\d{2}\.md$/.test(n)).sort();
  }

  async function dailyBackup() {
    const root = path.join(dir, 'backups');
    const target = path.join(root, today());
    if (await exists(target)) return;
    await fs.mkdir(target, { recursive: true });
    for (const name of STATE_FILES) await fs.copyFile(path.join(dir, name), path.join(target, name)).catch(() => {});
    const days = (await fs.readdir(root)).filter((n) => DATE_RE.test(n)).sort();
    for (const old of days.slice(0, Math.max(0, days.length - BACKUP_DAYS))) await fs.rm(path.join(root, old), { recursive: true, force: true });
  }

  /** Checks names, sizes and profile.json before anything is written. */
  function validate(files: Record<string, unknown>): Record<string, string> {
    const entries = Object.entries(files ?? {});
    if (!entries.length) throw new StorageError('files: dosya adı → içerik nesnesi olmalı.', 400);
    for (const [name, content] of entries) {
      if (!(STATE_FILES as readonly string[]).includes(name) && !SESSION_FILE_RE.test(name)) throw new StorageError(`"${name}" dosyasına yazma izni yok.`, 400);
      if (typeof content !== 'string' || Buffer.byteLength(content) > MAX_FILE_BYTES) throw new StorageError(`"${name}" 1 MB'tan küçük bir metin olmalı.`, 400);
      if (name === 'profile.json') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = null;
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new StorageError('profile.json bir JSON nesnesi olmalı.', 400);
      }
    }
    return files as Record<string, string>;
  }

  return {
    dir,
    bootstrap,

    async read(): Promise<StatePayload> {
      await bootstrap();
      const files = {} as Record<StateFile, string>;
      for (const name of STATE_FILES) files[name] = await fs.readFile(path.join(dir, name), 'utf8').catch(() => '');
      return { version: await version(), files, sessions: await sessionNames() };
    },

    async readProfile(): Promise<Record<string, any>> {
      await bootstrap();
      try {
        return JSON.parse(await fs.readFile(path.join(dir, 'profile.json'), 'utf8'));
      } catch {
        return {};
      }
    },

    async readSession(date: string): Promise<string> {
      if (!DATE_RE.test(date)) throw new StorageError('Geçersiz tarih.', 400);
      await bootstrap();
      const content = await fs.readFile(path.join(dir, 'sessions', `${date}.md`), 'utf8').catch(() => null);
      if (content === null) throw new StorageError('Oturum kaydı bulunamadı.', 404);
      return content;
    },

    async save(expected: unknown, input: Record<string, unknown>): Promise<SaveResponse> {
      const files = validate(input);
      await bootstrap();
      return exclusive(async () => {
        const current = await version();
        if (expected !== current) throw new StorageError('Dosyalar başka bir cihazdan değiştirildi. Güncel hâli yükleniyor.', 409, { version: current });
        await dailyBackup();
        for (const [name, content] of Object.entries(files)) await writeAtomic(path.join(dir, name), content);
        await writeAtomic(path.join(dir, '.version'), String(current + 1));
        return { version: current + 1, saved: Object.keys(files) };
      });
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;
