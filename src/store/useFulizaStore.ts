import { create } from 'zustand';
import { getFulizaState } from '../db/fuliza';

interface FulizaStore {
  outstanding: number;
  dueDate: string;
  updatedOn: string;
  load: () => Promise<void>;
}

export const useFulizaStore = create<FulizaStore>(set => ({
  outstanding: 0,
  dueDate: '',
  updatedOn: '',
  load: async () => {
    const state = await getFulizaState();
    set(state);
  },
}));
