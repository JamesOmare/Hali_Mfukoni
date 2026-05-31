import { open, type DB } from '@op-engineering/op-sqlite';
import { to24h } from '../utils/dates';

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;
  _db = open({ name: 'halimfukoni.db' });
  return _db;
}

const TROPHY_IDS = [
  'karibu', 'earlybird', 'streak3', 'nospend', 'saver',
  'underweek', 'airtime_min', 'streak7', 'billboss', 'tamed',
  'century', 'mwezi',
];

export async function migrate(): Promise<void> {
  const db = getDb();

  // Schema version tracking — PRAGMA user_version is a free integer SQLite gives us.
  // We increment it when we need a one-time data fix.
  const { rows } = await db.execute(`PRAGMA user_version`);
  const version = ((rows as Record<string, any>[])[0]?.user_version as number) ?? 0;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id        TEXT PRIMARY KEY,
      raw_sms   TEXT NOT NULL DEFAULT '',
      amount    REAL NOT NULL,
      name      TEXT NOT NULL,
      sub_type  TEXT NOT NULL,
      category  TEXT NOT NULL,
      date_iso  TEXT NOT NULL,
      time      TEXT NOT NULL DEFAULT '',
      balance   REAL NOT NULL DEFAULT 0,
      cost      REAL NOT NULL DEFAULT 0,
      who       TEXT NOT NULL DEFAULT '',
      note      TEXT NOT NULL DEFAULT ''
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions (date_iso);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id          TEXT PRIMARY KEY DEFAULT 'config',
      daily       REAL NOT NULL DEFAULT 1500,
      weekly      REAL NOT NULL DEFAULT 14000,
      monthly     REAL NOT NULL DEFAULT 56000,
      weekly_on   INTEGER NOT NULL DEFAULT 1,
      monthly_on  INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.execute(`INSERT OR IGNORE INTO goals (id) VALUES ('config');`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS goal_overrides (
      date_iso  TEXT PRIMARY KEY,
      amount    REAL NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trophies (
      id        TEXT PRIMARY KEY,
      earned    INTEGER NOT NULL DEFAULT 0,
      earned_on TEXT NOT NULL DEFAULT '',
      progress  INTEGER NOT NULL DEFAULT 0
    );
  `);

  for (const id of TROPHY_IDS) {
    await db.execute(`INSERT OR IGNORE INTO trophies (id) VALUES (?);`, [id]);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS fuliza_state (
      id          TEXT PRIMARY KEY DEFAULT 'state',
      outstanding REAL NOT NULL DEFAULT 0,
      due_date    TEXT NOT NULL DEFAULT '',
      updated_on  TEXT NOT NULL DEFAULT ''
    );
  `);
  await db.execute(`INSERT OR IGNORE INTO fuliza_state (id) VALUES ('state');`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS merchant_rules (
      pattern  TEXT PRIMARY KEY,
      category TEXT NOT NULL
    );
  `);

  // v1 — remove raw sms_ entries created by the old buggy scanner.
  if (version < 1) {
    await db.execute(`DELETE FROM transactions WHERE id LIKE 'sms_%'`);
    await db.execute(`DELETE FROM transactions WHERE id LIKE '%_fuliza'`);
    await db.execute(`PRAGMA user_version = 1`);
  }

  // v2 — convert 12h time strings ("8:47 AM") to 24h ("08:47") for correct sorting.
  if (version < 2) {
    const { rows } = await db.execute(
      `SELECT id, time FROM transactions WHERE time LIKE '% AM' OR time LIKE '% PM'`,
    );
    for (const row of rows as Record<string, any>[]) {
      const t24 = to24h(row.time as string);
      if (t24 !== row.time) {
        await db.execute(`UPDATE transactions SET time = ? WHERE id = ?`, [t24, row.id]);
      }
    }
    // Also update category 'paybill' → 'utilities' for existing records
    await db.execute(`UPDATE transactions SET category = 'utilities' WHERE category = 'paybill'`);
    await db.execute(`PRAGMA user_version = 2`);
  }

  // v3 — Pay Bill was incorrectly bulk-set to 'utilities' in v2.
  if (version < 3) {
    await db.execute(
      `UPDATE transactions SET category = 'other' WHERE category = 'utilities' AND sub_type LIKE '%Pay Bill%'`,
    );
    await db.execute(`PRAGMA user_version = 3`);
  }

  // v4 — clean old names that include "for account ..." suffix, broaden rules.
  if (version < 4) {
    // Fix names like "DIRECT PAY 04 for account ATL1788..." → "DIRECT PAY 04"
    const { rows: dirty } = await db.execute(
      `SELECT id, name FROM transactions WHERE name LIKE '% for account %'`,
    );
    for (const row of dirty as Record<string, any>[]) {
      const clean = (row.name as string).replace(/\s+for\s+account\b.*/i, '').trim();
      if (clean !== row.name) {
        await db.execute(`UPDATE transactions SET name = ?, who = ? WHERE id = ?`, [clean, clean, row.id]);
      }
    }
    // Broaden existing rules: "DIRECT PAY 05" → "DIRECT PAY"
    const { rows: rules } = await db.execute(`SELECT pattern, category FROM merchant_rules`);
    for (const rule of rules as Record<string, any>[]) {
      const broad = (rule.pattern as string).replace(/\s+\d+$/, '').trim();
      if (broad !== rule.pattern) {
        await db.execute(`DELETE FROM merchant_rules WHERE pattern = ?`, [rule.pattern]);
        await db.execute(`INSERT OR REPLACE INTO merchant_rules (pattern, category) VALUES (?, ?)`, [broad, rule.category]);
      }
      // Re-apply the (possibly broadened) rule to all matching transactions
      await db.execute(
        `UPDATE transactions SET category = ? WHERE UPPER(name) LIKE UPPER(?)`,
        [rule.category, `%${broad}%`],
      );
    }
    await db.execute(`PRAGMA user_version = 4`);
  }
}
