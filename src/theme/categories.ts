export type CategoryKey =
  | 'food' | 'transport' | 'entertainment' | 'health' | 'shopping'
  | 'utilities' | 'internet' | 'family' | 'income' | 'airtime' | 'withdrawal' | 'fuliza' | 'pochi' | 'other';

export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
  ink: string;
  bg: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  food:          { key: 'food',          label: 'Food & Drinks',  emoji: '🍽️', ink: '#B45309', bg: '#FEF3C7' },
  transport:     { key: 'transport',     label: 'Transport',      emoji: '🚌', ink: '#1D4ED8', bg: '#EFF6FF' },
  entertainment: { key: 'entertainment', label: 'Entertainment',  emoji: '🎮', ink: '#7C3AED', bg: '#F5F3FF' },
  health:        { key: 'health',        label: 'Health',         emoji: '💊', ink: '#059669', bg: '#ECFDF5' },
  shopping:      { key: 'shopping',      label: 'Shopping',       emoji: '🛒', ink: '#E0531F', bg: '#FCE9DF' },
  utilities:     { key: 'utilities',     label: 'Utilities',      emoji: '⚡', ink: '#2563EB', bg: '#E4ECFD' },
  internet:      { key: 'internet',      label: 'Internet & Data', emoji: '🌐', ink: '#0284C7', bg: '#E0F2FE' },
  family:        { key: 'family',        label: 'Send Money',     emoji: '👨‍👩‍👧', ink: '#7C53E0', bg: '#EEE8FB' },
  income:        { key: 'income',        label: 'Received',       emoji: '💰', ink: '#0E9655', bg: '#DEF3E8' },
  airtime:       { key: 'airtime',       label: 'Airtime',        emoji: '📱', ink: '#0E9488', bg: '#D9F0ED' },
  withdrawal:    { key: 'withdrawal',    label: 'Withdrawal',     emoji: '🏧', ink: '#A06A0B', bg: '#F7EFD9' },
  fuliza:        { key: 'fuliza',        label: 'Fuliza',         emoji: '🔄', ink: '#B45309', bg: '#FEF3C7' },
  pochi:         { key: 'pochi',         label: 'Pochi',          emoji: '🏪', ink: '#0F766E', bg: '#CCFBF1' },
  other:         { key: 'other',         label: 'Other',          emoji: '📩', ink: '#64748B', bg: '#F1F5F9' },
};

// Order shown in filter chips and category picker
export const CATEGORY_ORDER: CategoryKey[] = [
  'food', 'transport', 'internet', 'entertainment', 'health', 'shopping',
  'utilities', 'family', 'pochi', 'income', 'airtime', 'withdrawal', 'fuliza', 'other',
];
