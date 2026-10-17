// SM-2 vault statistics shown in the sidebar. Pure functions, safe on client and server.

export interface VaultRow {
  next?: string;
  stage?: string;
  ease?: string;
  mastered?: string;
}

export const todayISO = () => new Date().toLocaleDateString('sv-SE');

/**
 * Vault Confidence Index (0-100): the average memory strength of all words.
 * Each word counts half for its ease factor (1.30 = 0, 2.50 or more = full) and half for how far it
 * has climbed the 1-3-7-14-30 day ladder (30 days or mastered = full). Overdue words lose a third.
 */
export function vaultStats(rows: VaultRow[], today = todayISO()) {
  const due = rows.filter((r) => !r.next || r.next <= today).length;
  if (!rows.length) return { total: 0, due: 0, mastered: 0, confidence: null as number | null };
  const strength = (r: VaultRow) => {
    const ease = Math.min(1, Math.max(0, (Number(r.ease || 2.5) - 1.3) / 1.2));
    const interval = r.mastered === 'Yes' ? 1 : Math.min(1, (parseInt(r.stage ?? '1', 10) || 1) / 30);
    const overdue = r.next && r.next < today ? 2 / 3 : 1;
    return (ease * 0.5 + interval * 0.5) * overdue;
  };
  const confidence = Math.round((rows.reduce((sum, r) => sum + strength(r), 0) / rows.length) * 100);
  return { total: rows.length, due, mastered: rows.filter((r) => r.mastered === 'Yes').length, confidence };
}
