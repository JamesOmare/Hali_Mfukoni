import { getDb } from './schema';

export interface MerchantRule {
  pattern:  string;
  category: string;
}

export async function getMerchantRules(): Promise<MerchantRule[]> {
  const { rows } = await getDb().execute(`SELECT pattern, category FROM merchant_rules ORDER BY pattern`);
  return (rows as Record<string, any>[]).map(r => ({ pattern: r.pattern, category: r.category }));
}

export async function upsertMerchantRule(pattern: string, category: string): Promise<void> {
  await getDb().execute(
    `INSERT OR REPLACE INTO merchant_rules (pattern, category) VALUES (?, ?)`,
    [pattern, category],
  );
}

export async function deleteMerchantRule(pattern: string): Promise<void> {
  await getDb().execute(`DELETE FROM merchant_rules WHERE pattern = ?`, [pattern]);
}

/** Returns matching category for a name, or null. */
export function matchRule(name: string, rules: MerchantRule[]): string | null {
  const upper = name.toUpperCase();
  for (const r of rules) {
    if (upper.includes(r.pattern.toUpperCase())) return r.category;
  }
  return null;
}

/**
 * Strip trailing numbers from a name to get a broader match pattern.
 * "DIRECT PAY 04" → "DIRECT PAY"  (covers 04, 05, 06, ...)
 * "Peter Kagwi"   → "Peter Kagwi" (no change)
 */
export function broadenPattern(name: string): string {
  return name.replace(/\s+\d+$/, '').trim();
}

/** Count transactions whose name contains the pattern (substring), excluding one id. */
export async function countByPattern(pattern: string, excludeId: string): Promise<number> {
  const { rows } = await getDb().execute(
    `SELECT COUNT(*) as n FROM transactions WHERE UPPER(name) LIKE UPPER(?) AND id != ?`,
    [`%${pattern}%`, excludeId],
  );
  return Number((rows as Record<string, any>[])[0]?.n ?? 0);
}

/** Apply a rule to all matching transactions. */
export async function applyRuleToExisting(pattern: string, category: string): Promise<void> {
  await getDb().execute(
    `UPDATE transactions SET category = ? WHERE UPPER(name) LIKE UPPER(?)`,
    [category, `%${pattern}%`],
  );
}
