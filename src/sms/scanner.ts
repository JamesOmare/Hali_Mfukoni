import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { parseMpesaSms, parseFulizaSms } from './parser';
import { batchInsertTransactions, updateTransactionFuliza } from '../db/transactions';
import { updateFulizaState } from '../db/fuliza';
import { getMerchantRules, matchRule } from '../db/merchantRules';
import type { CategoryKey } from '../theme/categories';
import type { ParsedTransaction } from './parser';

export async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    return results[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function checkSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
}

export interface ScanResult {
  totalSms: number;
  mpesaSms: number;
  parsed: number;
  rawFallback: number;
  inserted: number;
}

interface SmsMessage {
  body: string;
  date: string;
  address: string;
}

function monthStartMs(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function localDateIso(tsMs: number): string {
  const d = new Date(tsMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTimeStr(tsMs: number): string {
  const d = new Date(tsMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function extractRawAmount(body: string): number {
  const matches = [...body.matchAll(/Ksh\s?([\d,]+(?:\.\d{2})?)/gi)];
  if (!matches.length) return 0;
  const first = parseFloat(matches[0][1].replace(/,/g, ''));
  const lc = body.toLowerCase();
  if (/\b(sent|paid|charged|deducted|withdraw|bought)\b/.test(lc)) return -first;
  if (/\b(received|refund)\b/.test(lc)) return first;
  return 0;
}

function getAllInboxSms(minDateMs: number): Promise<SmsMessage[]> {
  return new Promise(resolve => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', minDate: minDateMs, maxCount: 3000 }),
      (fail: string) => { console.warn('SMS read failed:', fail); resolve([]); },
      (_count: number, smsList: string) => {
        try { resolve(JSON.parse(smsList)); }
        catch { resolve([]); }
      },
    );
  });
}

/**
 * Scan inbox for current month's M-Pesa and Fuliza messages.
 *
 * Fuliza messages share the same transaction code as their MPESA counterpart.
 * Rather than storing two rows, we:
 *   1. Insert the MPESA transaction normally.
 *   2. Run an UPDATE to tag it as Fuliza and add the access fee to cost.
 *
 * This means one list row per transaction, with the access fee shown as a
 * sub-line and included in daily/weekly/monthly totals.
 */
export async function scanInbox(): Promise<ScanResult> {
  const messages = await getAllInboxSms(monthStartMs());

  // All M-Pesa messages (Fuliza companions also come from MPESA address)
  const mpesaMsgs = messages.filter(msg =>
    (msg.address ?? '').toUpperCase().includes('MPESA'),
  );

  // Load merchant rules once — applied to every parsed transaction
  const rules = await getMerchantRules();

  const toInsert: ParsedTransaction[] = [];
  let rawCount = 0;

  // Map: mpesa code → Fuliza info (for merging via UPDATE after insert)
  const fulizaMap = new Map<string, { fee: number; outstanding: number; dueDate: string }>();
  let latestTs = 0;
  let latestOutstanding = 0;
  let latestDueDate = '';
  let latestUpdatedOn = '';

  for (const msg of mpesaMsgs) {
    const body = msg.body ?? '';
    const ts   = parseInt(msg.date, 10);

    // Fuliza companion messages share the MPESA sender — detect by body content
    if (/Fuliza M-PESA amount is/i.test(body)) {
      const parsed = parseFulizaSms(body);
      if (parsed) {
        const code = parsed.id.replace('_fuliza', '');
        // Only keep the latest Fuliza info per code (Safaricom sometimes sends duplicates)
        if (!fulizaMap.has(code)) {
          fulizaMap.set(code, { fee: parsed.cost, outstanding: parsed.balance, dueDate: parsed.who });
        }
        if (ts > latestTs) {
          latestTs          = ts;
          latestOutstanding = parsed.balance;
          latestDueDate     = parsed.who;
          latestUpdatedOn   = localDateIso(ts);
        }
      }
      // Never store a Fuliza companion as its own row — it gets merged into the main transaction
      continue;
    }

    // Normal MPESA transaction message
    const parsed = parseMpesaSms(body);
    if (parsed) {
      if (!parsed.dateIso) parsed.dateIso = localDateIso(ts);
      if (!parsed.time)    parsed.time    = localTimeStr(ts);
      // Apply merchant rule if one exists for this payee
      const ruleCategory = matchRule(parsed.name, rules);
      if (ruleCategory) parsed.category = ruleCategory as CategoryKey;
      toInsert.push(parsed);
    } else {
      rawCount++;
      toInsert.push({
        id: `sms_${msg.date}`, rawSms: body,
        amount: extractRawAmount(body),
        name: body.slice(0, 70).trim(), subType: 'Other', category: 'other',
        dateIso: localDateIso(ts), time: localTimeStr(ts),
        balance: 0, cost: 0, who: '',
      });
    }
  }

  // ── Insert all MPESA + raw entries ───────────────────────────────────────
  const inserted = await batchInsertTransactions(toInsert);

  // ── Enrich MPESA records that have a Fuliza companion ───────────────────
  // This adds the access fee and "· Fuliza" tag without creating a second row.
  for (const [code, info] of fulizaMap) {
    await updateTransactionFuliza(code, info.fee);
  }

  // ── Persist latest Fuliza outstanding balance ────────────────────────────
  if (latestOutstanding > 0) {
    await updateFulizaState(latestOutstanding, latestDueDate, latestUpdatedOn);
  }

  return {
    totalSms:    messages.length,
    mpesaSms:    mpesaMsgs.length,
    parsed:      toInsert.length - rawCount,
    rawFallback: rawCount,
    inserted,
  };
}
