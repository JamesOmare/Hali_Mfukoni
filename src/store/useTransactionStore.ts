import { create } from 'zustand';
import {
  getAllTransactions,
  updateTransactionCategory,
  updateTransactionNote,
  type Transaction,
} from '../db/transactions';
import { weekStartISO, monthStartISO, todayISO } from '../utils/dates';

interface TransactionStore {
  transactions: Transaction[];
  loaded: boolean;
  load: () => Promise<void>;
  changeCategory: (id: string, category: string) => Promise<void>;
  saveNote: (id: string, note: string) => Promise<void>;
  todayTx: () => Transaction[];
  weekTx: () => Transaction[];
  monthTx: () => Transaction[];
  streak: () => number;
  /** Latest M-Pesa balance from the most recent non-Fuliza transaction. null = unknown. */
  latestBalance: () => number | null;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loaded: false,

  load: async () => {
    const transactions = await getAllTransactions();
    set({ transactions, loaded: true });
  },

  changeCategory: async (id, category) => {
    await updateTransactionCategory(id, category);
    set(s => ({
      transactions: s.transactions.map(t =>
        t.id === id ? { ...t, category: category as Transaction['category'] } : t,
      ),
    }));
  },

  saveNote: async (id, note) => {
    await updateTransactionNote(id, note);
    set(s => ({
      transactions: s.transactions.map(t =>
        t.id === id ? { ...t, note } : t,
      ),
    }));
  },

  todayTx: () => {
    const today = todayISO();
    return get().transactions.filter(t => t.dateIso === today);
  },

  weekTx: () => {
    const start = weekStartISO();
    const today = todayISO();
    return get().transactions.filter(t => t.dateIso >= start && t.dateIso <= today);
  },

  monthTx: () => {
    const start = monthStartISO();
    const today = todayISO();
    return get().transactions.filter(t => t.dateIso >= start && t.dateIso <= today);
  },

  latestBalance: () => {
    for (const t of get().transactions) { // already sorted date DESC
      if (!t.subType?.includes('Fuliza') && t.category !== 'other') {
        return t.balance;
      }
    }
    return null;
  },

  streak: () => {
    const days = new Set(get().transactions.map(t => t.dateIso));
    let count = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().slice(0, 10);
      if (!days.has(iso)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  },
}));

export function sumOut(txs: Transaction[]): number {
  return txs.filter(t => t.amount < 0).reduce((s, t) => {
    const fee = t.subType?.includes('Fuliza') ? (t.cost ?? 0) : 0;
    return s + Math.abs(t.amount) + fee;
  }, 0);
}

export function sumIn(txs: Transaction[]): number {
  return txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
}
