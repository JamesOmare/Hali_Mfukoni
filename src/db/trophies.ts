import { getDb } from './schema';

export interface TrophyRow {
  id: string;
  earned: boolean;
  earnedOn: string;
  progress: number;
}

export async function getAllTrophies(): Promise<TrophyRow[]> {
  const { rows } = await getDb().execute(`SELECT * FROM trophies`);
  return (rows as Record<string, any>[]).map(r => ({
    id: r.id,
    earned: Boolean(r.earned),
    earnedOn: r.earned_on,
    progress: r.progress,
  }));
}

export async function markEarned(id: string, dateIso: string): Promise<void> {
  await getDb().execute(
    `UPDATE trophies SET earned=1, earned_on=? WHERE id=? AND earned=0`,
    [dateIso, id],
  );
}

export async function setProgress(id: string, progress: number): Promise<void> {
  await getDb().execute(`UPDATE trophies SET progress=? WHERE id=?`, [progress, id]);
}
