// Minimal GitHub-flavoured Markdown table helpers.
// The coach files (vocabulary.md, error_ledger.md) keep their data in pipe tables,
// so we parse them into row objects and write them back without touching the rest
// of the document.


export function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (s[i] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += s[i];
    }
  }
  cells.push(cur.trim());
  return cells;
}

export function escapeCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

export function renderRow(cells) {
  return `| ${cells.map(escapeCell).join(' | ')} |`;
}

const isSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

/** Returns every table in the document with the heading it sits under. */
export function parseTables(md) {
  const lines = md.split('\n');
  const tables = [];
  let heading = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      heading = h[2].trim();
      i++;
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const start = i;
      const headers = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      tables.push({ heading, headers, rows, start, end: i - 1 });
      continue;
    }
    i++;
  }
  return tables;
}

export function findTable(md, heading) {
  return parseTables(md).find((t) => t.heading === heading) ?? null;
}

/** Replaces the body rows of the table under `heading`, keeping its header row. */
export function replaceTableRows(md, heading, rows) {
  const table = findTable(md, heading);
  if (!table) throw new Error(`Table under heading "${heading}" not found`);
  const lines = md.split('\n');
  const sep = `|${table.headers.map(() => '---').join('|')}|`;
  const newLines = [renderRow(table.headers), sep, ...rows.map(renderRow)];
  lines.splice(table.start, table.end - table.start + 1, ...newLines);
  return lines.join('\n');
}

/** Bullet items ("- foo") directly under a heading, up to the next heading. */
export function parseBulletList(md, heading) {
  const lines = md.split('\n');
  const idx = lines.findIndex((l) => /^#{1,6}\s+/.test(l) && l.replace(/^#{1,6}\s+/, '').trim().startsWith(heading));
  if (idx === -1) return [];
  const items = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) break;
    const m = /^\s*[-*]\s+(.*)$/.exec(lines[i]);
    if (m) items.push(m[1].trim());
  }
  return items;
}
