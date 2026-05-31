import { create } from 'zustand';
import {
  getGoals, saveGoals, getAllOverrides,
  setOverride, removeOverride, dailyLimitFor,
  type GoalConfig,
} from '../db/goals';

interface GoalStore extends GoalConfig {
  overrides: Record<string, number>;
  load: () => Promise<void>;
  setDaily: (v: number) => void;
  setWeekly: (v: number) => void;
  setMonthly: (v: number) => void;
  setWeeklyOn: (v: boolean) => void;
  setMonthlyOn: (v: boolean) => void;
  setDayOverride: (dateIso: string, amount: number) => void;
  removeDayOverride: (dateIso: string) => void;
  limitFor: (dateIso: string) => number;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  daily: 1500, weekly: 14000, monthly: 56000,
  weeklyOn: true, monthlyOn: false, overrides: {},

  load: async () => {
    const [g, overrides] = await Promise.all([getGoals(), getAllOverrides()]);
    set({ ...g, overrides });
  },

  setDaily: v => {
    set({ daily: v });
    saveGoals({ ...get(), daily: v });
  },
  setWeekly: v => {
    set({ weekly: v });
    saveGoals({ ...get(), weekly: v });
  },
  setMonthly: v => {
    set({ monthly: v });
    saveGoals({ ...get(), monthly: v });
  },
  setWeeklyOn: v => {
    set({ weeklyOn: v });
    saveGoals({ ...get(), weeklyOn: v });
  },
  setMonthlyOn: v => {
    set({ monthlyOn: v });
    saveGoals({ ...get(), monthlyOn: v });
  },

  setDayOverride: (dateIso, amount) => {
    setOverride(dateIso, amount);
    set(s => ({ overrides: { ...s.overrides, [dateIso]: amount } }));
  },

  removeDayOverride: dateIso => {
    removeOverride(dateIso);
    set(s => {
      const overrides = { ...s.overrides };
      delete overrides[dateIso];
      return { overrides };
    });
  },

  limitFor: dateIso => dailyLimitFor(dateIso, get().overrides, get().daily),
}));
