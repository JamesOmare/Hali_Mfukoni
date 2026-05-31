import { getDb } from './schema';
import type { SQLBatchTuple } from '@op-engineering/op-sqlite';
import type { ParsedTransaction } from '../sms/parser';

export interface Transaction extends ParsedTransaction {
  note: string;
}

export async function insertTransaction(tx: ParsedTransaction): Promise<boolean> {
  try {
    await getDb().execute(
      `INSERT OR IGNORE INTO transactions
         (id, raw_sms, amount, name, sub_type, category, date_iso, time, balance, cost, who, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
      [tx.id, tx.rawSms, tx.amount, tx.name, tx.subType, tx.category,
       tx.dateIso, tx.time, tx.balance, tx.cost, tx.who],
    );
    return true;
  } catch {
    return false;
  }
}

export async function updateTransactionCategory(id: string, category: string): Promise<void> {
  await getDb().execute(`UPDATE transactions SET category = ? WHERE id = ?`, [category, id]);
}

export async function updateTransactionNote(id: string, note: string): Promise<void> {
  await getDb().execute(`UPDATE transactions SET note = ? WHERE id = ?`, [note, id]);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { rows } = await getDb().execute(
    `SELECT * FROM transactions ORDER BY date_iso DESC, time DESC`,
  );
  return (rows as Record<string, any>[]).map(rowToTx);
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const { rows } = await getDb().execute(
    `SELECT * FROM transactions WHERE id = ?`, [id],
  );
  const arr = rows as Record<string, any>[];
  return arr.length ? rowToTx(arr[0]) : null;
}

export async function transactionExists(id: string): Promise<boolean> {
  const { rows } = await getDb().execute(
    `SELECT id FROM transactions WHERE id = ? LIMIT 1`, [id],
  );
  return (rows as any[]).length > 0;
}

/** Tag an existing transaction as Fuliza and record the access fee in cost. */
export async function updateTransactionFuliza(code: string, fee: number): Promise<void> {
  await getDb().execute(
    `UPDATE transactions
     SET cost = ?, sub_type = sub_type || ' · Fuliza'
     WHERE id = ? AND sub_type NOT LIKE '% · Fuliza'`,
    [fee, code],
  );
}

/** Insert many transactions at once — much faster than one-by-one awaits. */
export async function batchInsertTransactions(txs: ParsedTransaction[]): Promise<number> {
  if (txs.length === 0) return 0;
  const commands: SQLBatchTuple[] = txs.map(tx => [
    `INSERT OR IGNORE INTO transactions
       (id, raw_sms, amount, name, sub_type, category, date_iso, time, balance, cost, who, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
    [tx.id, tx.rawSms, tx.amount, tx.name, tx.subType, tx.category,
     tx.dateIso, tx.time, tx.balance, tx.cost, tx.who],
  ]);
  const result = await getDb().executeBatch(commands);
  return result.rowsAffected ?? 0;
}

function rowToTx(r: Record<string, any>): Transaction {
  return {
    id: r.id,
    rawSms: r.raw_sms,
    amount: r.amount,
    name: r.name,
    subType: r.sub_type,
    category: r.category,
    dateIso: r.date_iso,
    time: r.time,
    balance: r.balance,
    cost: r.cost,
    who: r.who,
    note: r.note,
  };
}
