import { create } from 'zustand';
import { getAllTrophies, markEarned, setProgress, type TrophyRow } from '../db/trophies';
import { todayISO } from '../utils/dates';

export interface TrophyDef extends TrophyRow {
  name: string;
  emoji: string;
  tint: string;
  cond: string;
  target?: number;
}

export const TROPHY_DEFS: Omit<TrophyDef, 'earned' | 'earnedOn' | 'progress'>[] = [
  { id: 'karibu',      name: 'Karibu!',           emoji: '🎉', tint: '#E0531F', cond: 'Log your first transaction' },
  { id: 'earlybird',   name: 'Early Bird',         emoji: '🌅', tint: '#A06A0B', cond: 'Track a payment before 8:00 AM' },
  { id: 'streak3',     name: 'On a Roll',          emoji: '🔥', tint: '#E0531F', cond: '3-day tracking streak' },
  { id: 'nospend',     name: 'No-Spend Day',       emoji: '🧘', tint: '#0E9488', cond: 'A full day with zero spending' },
  { id: 'saver',       name: 'Saver',              emoji: '💚', tint: '#0E9655', cond: 'Receive more than you spend in a week' },
  { id: 'underweek',   name: 'Under Budget',       emoji: '🎯', tint: '#2563EB', cond: 'Finish a week under your weekly limit' },
  { id: 'airtime_min', name: 'Airtime Minimalist', emoji: '📵', tint: '#0E9488', cond: 'Keep airtime under Ksh 200 for a week' },
  { id: 'streak7',     name: 'Week Warrior',       emoji: '⚔️', tint: '#7C53E0', cond: '7-day tracking streak',            target: 7 },
  { id: 'billboss',    name: 'Bill Boss',          emoji: '🏦', tint: '#C9337A', cond: 'Pay 3 bills before their due date', target: 3 },
  { id: 'tamed',       name: 'Spender Tamed',      emoji: '🛡️', tint: '#15171B', cond: 'Keep a day under Ksh 500',         target: 1 },
  { id: 'century',     name: 'Centurion',          emoji: '💯', tint: '#2563EB', cond: 'Track 100 transactions',           target: 100 },
  { id: 'mwezi',       name: 'Mwezi Mzima',        emoji: '👑', tint: '#A06A0B', cond: 'A whole month under budget',       target: 31 },
];

interface TrophyStore {
  trophies: TrophyDef[];
  load: () => Promise<void>;
  refresh: (transactions: { amount: number; dateIso: string; time: string; subType: string }[], streak: number, weekSpent: number, weekGoal: number) => void;
}

export const useTrophyStore = create<TrophyStore>((set, get) => ({
  trophies: [],

  load: async () => {
    const rows = await getAllTrophies();
    const rowMap: Record<string, TrophyRow> = {};
    for (const r of rows) rowMap[r.id] = r;
    const trophies: TrophyDef[] = TROPHY_DEFS.map(def => ({
      ...def,
      earned: rowMap[def.id]?.earned ?? false,
      earnedOn: rowMap[def.id]?.earnedOn ?? '',
      progress: rowMap[def.id]?.progress ?? 0,
    }));
    set({ trophies });
  },

  refresh: (txs, streak, weekSpent, weekGoal) => {
    const today = todayISO();

    const earn = (id: string) => {
      markEarned(id, today);
      set(s => ({
        trophies: s.trophies.map(t =>
          t.id === id && !t.earned ? { ...t, earned: true, earnedOn: today } : t,
        ),
      }));
    };

    const prog = (id: string, p: number) => {
      setProgress(id, p);
      set(s => ({
        trophies: s.trophies.map(t => t.id === id ? { ...t, progress: p } : t),
      }));
    };

    const notEarned = (id: string) => !get().trophies.find(t => t.id === id)?.earned;

    if (txs.length > 0 && notEarned('karibu')) earn('karibu');

    const earlyTx = txs.find(t => {
      const h = parseInt(t.time.split(':')[0], 10);
      return /AM/i.test(t.time) && h < 8 && t.amount < 0;
    });
    if (earlyTx && notEarned('earlybird')) earn('earlybird');

    if (streak >= 3 && notEarned('streak3')) earn('streak3');
    if (streak >= 7 && notEarned('streak7')) earn('streak7');
    if (streak < 7) prog('streak7', streak);

    const daySpend: Record<string, number> = {};
    for (const t of txs) {
      if (t.amount < 0) daySpend[t.dateIso] = (daySpend[t.dateIso] ?? 0) + Math.abs(t.amount);
    }
    const daysWithAnyTx = new Set(txs.map(t => t.dateIso));
    const noSpendDay = [...daysWithAnyTx].find(d => !daySpend[d]);
    if (noSpendDay && notEarned('nospend')) earn('nospend');

    const tamedDay = Object.entries(daySpend).find(([, s]) => s < 500);
    if (tamedDay && notEarned('tamed')) earn('tamed');

    const txCount = txs.length;
    prog('century', Math.min(txCount, 100));
    if (txCount >= 100 && notEarned('century')) earn('century');

    const billCount = txs.filter(t => t.subType === 'Pay Bill').length;
    prog('billboss', Math.min(billCount, 3));
    if (billCount >= 3 && notEarned('billboss')) earn('billboss');

    const weekIn = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    if (weekIn > weekSpent && notEarned('saver')) earn('saver');
    if (weekSpent <= weekGoal && weekGoal > 0 && notEarned('underweek')) earn('underweek');

    const weekAirtime = txs.filter(t => t.subType === 'Airtime').reduce((s, t) => s + Math.abs(t.amount), 0);
    if (weekAirtime < 200 && notEarned('airtime_min')) earn('airtime_min');
  },
}));
