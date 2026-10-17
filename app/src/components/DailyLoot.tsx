'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gift, CaretDown, Flame, Medal, TrendUp, Trophy, BookmarkSimple, SealCheck } from '@phosphor-icons/react';
import { api } from '@/api';
import { readStored, writeStored } from '@/lib/useActivity';
import { Panel } from './ui';
import { skillTr, winLabelTr } from '@/lib/tr';
import { WinBadge } from './momentum';

const ease = [0.16, 1, 0.3, 1] as const;

/** "Bugün neler kazandın?": today's wins, words and obstacles cleared, like an end-of-level screen. */
export default function DailyLoot({ refreshKey }) {
  const [loot, setLoot] = useState(null);
  // Collapsed by default so practice stays in view; the choice is remembered on this device.
  const [open, setOpen] = useState(() => readStored('coach.loot.open', 'no') === 'yes');
  const toggle = () =>
    setOpen((o) => {
      writeStored('coach.loot.open', o ? 'no' : 'yes');
      return !o;
    });

  useEffect(() => {
    api.loot().then(setLoot).catch(() => setLoot(null));
  }, [refreshKey]);

  if (!loot || loot.activities + loot.reviews === 0) return null;

  // Milestones get their own medal row, so they are not repeated among the wins.
  const milestoneTitles = new Set(loot.milestones.map((x) => x.title));
  const wins = [...new Set<string>(loot.wins)].filter((w) => !milestoneTitles.has(w));
  const obstacles = [
    ...loot.bandUps.map((l) => ({ icon: TrendUp, text: `${skillTr(l.skill)} ${l.change}` })),
    ...loot.canDos.map((c) => ({ icon: SealCheck, text: `Can-Do: ${c.statement}` })),
    ...loot.resolved.map((e) => ({ icon: Trophy, text: `Ustalaştın: "${e.after}"` })),
  ];

  return (
    <Panel as="section" aria-label="Günlük ganimet" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-amber-soft blur-3xl" aria-hidden />
      <button onClick={toggle} aria-expanded={open} className="relative flex w-full items-center gap-4 px-6 py-4 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-amber-soft text-amber">
          <Gift size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-tight font-semibold tracking-[-0.02em]">Günlük Ganimet</span>
          <span className="block text-[13.5px] text-ink-3">
            Bugün neler kazandın?{!open && <span className="ml-2 text-xs">{wins.length} kazanım, {loot.milestones.length} rozet, {loot.words.length} kelime</span>}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[28px] leading-none font-semibold tracking-[-0.02em] text-amber tabular-nums">+{loot.points}</span>
          <span className="text-xs text-ink-3">bugünkü XP</span>
        </span>
        <CaretDown size={16} className={`shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4, ease }} className="relative overflow-hidden">
          <div className="space-y-5 border-t border-line px-6 pt-5 pb-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Seri', `${loot.streak} gün`, Flame],
                ['Görev', loot.activities, null],
                ['Tekrar', loot.reviews, null],
                ['Alt bant', loot.subBand, null],
              ].map(([label, value, Icon]) => (
                <div key={label}>
                  <dt className="flex items-center gap-1 text-xs text-ink-3">
                    {Icon && <Icon size={12} weight="fill" className="text-amber" />}
                    {label}
                  </dt>
                  <dd className="text-xl font-semibold tracking-[-0.02em] tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Kazanımlar</h3>
              <ul className="flex flex-wrap gap-1.5">
                {wins.map((w, i) => (
                  <WinBadge key={w} win={{ label: w }} index={i} size="sm" />
                ))}
              </ul>
            </div>

            {loot.milestones.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Açılan rozetler</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {loot.milestones.map((x) => (
                    <li key={x.id} className="shine relative flex items-center gap-2.5 overflow-hidden rounded-[10px] border border-line bg-amber-soft px-3 py-2.5 text-sm font-medium">
                      <Medal size={18} weight="fill" className="text-amber" /> {winLabelTr(x.title)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {obstacles.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Aşılan engeller</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {obstacles.map(({ icon: Icon, text }) => (
                    <li key={text} className="shine relative flex items-center gap-2.5 overflow-hidden rounded-[10px] border border-line bg-emerald-soft px-3 py-2.5 text-sm font-medium">
                      <Icon size={18} weight="fill" className="text-amber" /> {text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {loot.words.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <BookmarkSimple size={15} className="text-indigo" /> Yeni kelimeler ({loot.words.length})
                </h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {loot.words.map((w) => (
                    <li key={w.original} className="text-[16px] font-medium">
                      {w.original}
                      {(w.meaning || w.upgraded) && <span className="ml-1.5 font-sans text-xs text-ink-3">{w.meaning || `→ ${w.upgraded}`}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </Panel>
  );
}
