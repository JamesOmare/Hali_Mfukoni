import { getDb } from './schema';

export interface GoalConfig {
  daily: number;
  weekly: number;
  monthly: number;
  weeklyOn: boolean;
  monthlyOn: boolean;
}

export async function getGoals(): Promise<GoalConfig> {
  const { rows } = await getDb().execute(`SELECT * FROM goals WHERE id = 'config'`);
  const r = (rows as Record<string, any>[])[0];
  if (!r) return { daily: 1500, weekly: 14000, monthly: 56000, weeklyOn: true, monthlyOn: false };
  return {
    daily: r.daily,
    weekly: r.weekly,
    monthly: r.monthly,
    weeklyOn: Boolean(r.weekly_on),
    monthlyOn: Boolean(r.monthly_on),
  };
}

export async function saveGoals(g: GoalConfig): Promise<void> {
  await getDb().execute(
    `UPDATE goals SET daily=?, weekly=?, monthly=?, weekly_on=?, monthly_on=? WHERE id='config'`,
    [g.daily, g.weekly, g.monthly, g.weeklyOn ? 1 : 0, g.monthlyOn ? 1 : 0],
  );
}

export async function getOverride(dateIso: string): Promise<number | null> {
  const { rows } = await getDb().execute(
    `SELECT amount FROM goal_overrides WHERE date_iso = ?`, [dateIso],
  );
  const r = (rows as Record<string, any>[])[0];
  return r ? r.amount : null;
}

export async function setOverride(dateIso: string, amount: number): Promise<void> {
  await getDb().execute(
    `INSERT OR REPLACE INTO goal_overrides (date_iso, amount) VALUES (?, ?)`,
    [dateIso, amount],
  );
}

export async function removeOverride(dateIso: string): Promise<void> {
  await getDb().execute(`DELETE FROM goal_overrides WHERE date_iso = ?`, [dateIso]);
}

export async function getAllOverrides(): Promise<Record<string, number>> {
  const { rows } = await getDb().execute(`SELECT * FROM goal_overrides`);
  const result: Record<string, number> = {};
  for (const r of rows as Record<string, any>[]) {
    result[r.date_iso] = r.amount;
  }
  return result;
}

export function dailyLimitFor(dateIso: string, overrides: Record<string, number>, defaultDaily: number): number {
  return overrides[dateIso] ?? defaultDaily;
}
