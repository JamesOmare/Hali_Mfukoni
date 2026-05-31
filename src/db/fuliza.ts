import { getDb } from './schema';

export interface FulizaState {
  outstanding: number;
  dueDate: string;   // ISO date e.g. "2026-06-24"
  updatedOn: string; // ISO date of the latest Fuliza message scanned
}

export async function getFulizaState(): Promise<FulizaState> {
  const { rows } = await getDb().execute(`SELECT * FROM fuliza_state WHERE id = 'state'`);
  const r = (rows as Record<string, any>[])[0];
  if (!r) return { outstanding: 0, dueDate: '', updatedOn: '' };
  return { outstanding: r.outstanding, dueDate: r.due_date, updatedOn: r.updated_on };
}

export async function updateFulizaState(
  outstanding: number,
  dueDate: string,
  updatedOn: string,
): Promise<void> {
  await getDb().execute(
    `UPDATE fuliza_state SET outstanding = ?, due_date = ?, updated_on = ? WHERE id = 'state'`,
    [outstanding, dueDate, updatedOn],
  );
}
