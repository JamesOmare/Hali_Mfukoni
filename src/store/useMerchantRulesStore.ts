import { create } from 'zustand';
import { getMerchantRules, type MerchantRule } from '../db/merchantRules';

interface MerchantRulesStore {
  rules: MerchantRule[];
  load: () => Promise<void>;
}

export const useMerchantRulesStore = create<MerchantRulesStore>(set => ({
  rules: [],
  load: async () => {
    const rules = await getMerchantRules();
    set({ rules });
  },
}));
