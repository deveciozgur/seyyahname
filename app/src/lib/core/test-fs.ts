// Test helper (Node only, never imported by the app): a StateFS on a real folder,
// laid out like the data/ folder the server keeps (src/lib/server/storage.ts).
import fs from 'node:fs/promises';
import path from 'node:path';

export const diskFS = (root: string) => ({
  read: (name: string) => fs.readFile(path.join(root, name), 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e))),
  write: async (name: string, content: string) => {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), content, 'utf8');
  },
  list: (dir: string) => fs.readdir(path.join(root, dir)).catch((e) => (e.code === 'ENOENT' ? [] : Promise.reject(e))),
});
