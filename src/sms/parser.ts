import type { CategoryKey } from '../theme/categories';
import { to24h } from '../utils/dates';

export interface ParsedTransaction {
  id: string;
  rawSms: string;
  amount: number;       // negative = out, positive = in
  name: string;
  subType: string;
  category: CategoryKey;
  dateIso: string;
  time: string;
  balance: number;
  cost: number;
  who: string;
}

// Parse "Ksh1,234.56" or "Ksh 1,234" → number
function parseKsh(s: string): number {
  return parseFloat(s.replace(/[Kk][Ss][Hh]\s?/g, '').replace(/,/g, '')) || 0;
}

// "30/05/2026" or "30/5/26" → "2026-05-30"
function normaliseDate(d: string): string {
  const parts = d.split('/');
  if (parts.length !== 3) return d;
  const yr = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  return `${yr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

// Extract the transaction confirmation code (first word before "Confirmed")
function extractCode(raw: string): string {
  const m = raw.match(/^([A-Z0-9]{3,15})\s+Confirmed/i);
  return m?.[1] ?? '';
}

function datePart(raw: string): string {
  const m = raw.match(/(?:on\s+|On\s+)(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  return m ? normaliseDate(m[1]) : '';
}

function timePart(raw: string): string {
  const m = raw.match(/at\s+(\d{1,2}:\d{2}\s*[AP]M)/i)?.[1] ?? '';
  return m ? to24h(m) : '';
}

// Handle BOTH "New M-PESA balance is Ksh..." AND "Amount You can withdraw is Ksh..."
function balancePart(raw: string): number {
  const m = raw.match(/(?:balance is|withdraw is)\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
  return m ? parseKsh(m[1]) : 0;
}

function costPart(raw: string): number {
  const m = raw.match(/[Tt]ransaction cost[,.]?\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
  return m ? parseKsh(m[1]) : 0;
}

// Extract amount from patterns like "Ksh5,000.00 sent" or "Confirmed. Ksh500 paid"
function amountAfterConfirmed(raw: string): number {
  const m = raw.match(/Confirmed\.\s+(Ksh\s?[\d,]+(?:\.\d{2})?)\s+(?:sent|paid)/i);
  return m ? parseKsh(m[1]) : 0;
}

interface Pattern {
  test: (raw: string) => boolean;
  subType: string;
  category: CategoryKey;
  extract: (raw: string) => Partial<ParsedTransaction> | null;
}

const PATTERNS: Pattern[] = [
  // ── RECEIVED ────────────────────────────────────────────────────────────────
  // "You have received Ksh..." OR "received Ksh...from..."
  {
    test: r => /you have received/i.test(r),
    subType: 'Received',
    category: 'income',
    extract: raw => {
      const amt = raw.match(/received\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
      const from = raw.match(/from\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = from?.[1]?.trim() ?? 'Unknown';
      return {
        amount: parseKsh(amt[1]),
        name: who.replace(/\s+07[\d*]+.*$/, '').trim() || who,
        who,
      };
    },
  },

  // ── AIRTIME ────────────────────────────────────────────────────────────────
  {
    test: r => /you bought.*airtime/i.test(r),
    subType: 'Airtime',
    category: 'airtime',
    extract: raw => {
      const amt = raw.match(/bought\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
      if (!amt) return null;
      return { amount: -parseKsh(amt[1]), name: 'Safaricom', who: 'Safaricom' };
    },
  },

  // ── AIRTIME v2 (Ksh amount of airtime) ────────────────────────────────────
  {
    test: r => /Ksh[\s\d,.]+ of airtime/i.test(r),
    subType: 'Airtime',
    category: 'airtime',
    extract: raw => {
      const amt = raw.match(/(Ksh\s?[\d,]+(?:\.\d{2})?)\s+of airtime/i);
      if (!amt) return null;
      return { amount: -parseKsh(amt[1]), name: 'Safaricom', who: 'Safaricom' };
    },
  },

  // ── WITHDRAWAL ─────────────────────────────────────────────────────────────
  {
    test: r => /[Ww]ithdraw\s+Ksh/i.test(r),
    subType: 'Withdrawal',
    category: 'withdrawal',
    extract: raw => {
      const amt = raw.match(/[Ww]ithdraw\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
      const from = raw.match(/from\s+(.+?)\s+(?:New|Amount)/i);
      if (!amt) return null;
      const who = from?.[1]?.trim() ?? 'Agent';
      return { amount: -parseKsh(amt[1]), name: who, who };
    },
  },

  // ── BUY GOODS (Till number) ─────────────────────────────────────────────────
  {
    test: r => /paid to\s+.+[Tt]ill\s+\d/i.test(r),
    subType: 'Buy Goods',
    category: 'shopping',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/paid to\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = to?.[1]?.trim() ?? 'Merchant';
      const name = who.replace(/\s*[—-]\s*[Tt]ill.*$/, '').trim() || who;
      return { amount: -amt, name, who };
    },
  },

  // ── PAY BILL — account reference ("for account #X" OR "account #X") ────────
  {
    test: r => /sent to\s+.+(?:for\s+)?account[\s#]/i.test(r),
    subType: 'Pay Bill',
    category: 'other',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/sent to\s+(.+?)\s+(?:for\s+)?account[\s#]/i);
      if (!amt) return null;
      const who = to?.[1]?.trim() ?? 'Unknown';
      return { amount: -amt, name: who, who };
    },
  },

  // ── PAY BILL — numeric paybill number ──────────────────────────────────────
  {
    test: r => /sent to\s+\S.*\s\d{5,}/i.test(r),
    subType: 'Pay Bill',
    category: 'other',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/sent to\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = to?.[1]?.trim() ?? 'Unknown';
      const name = who.replace(/\s+\d{5,}.*$/, '').trim() || who;
      return { amount: -amt, name, who };
    },
  },

  // ── SENT MONEY to phone number ──────────────────────────────────────────────
  {
    test: r => /sent to\s+\S.*07\d/i.test(r),
    subType: 'Sent Money',
    category: 'family',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/sent to\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = to?.[1]?.trim() ?? 'Unknown';
      const name = who.replace(/\s+07[\d*]+.*$/, '').trim() || who;
      return { amount: -amt, name, who };
    },
  },

  // ── POCHI LA BIASHARA ───────────────────────────────────────────────────────
  {
    test: r => /[Pp]ochi/i.test(r),
    subType: 'Pochi',
    category: 'pochi',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/(?:paid|sent) to\s+(.+?)\s+[Pp]ochi/i);
      if (!amt) return null;
      const who = to?.[1]?.trim().replace(/\.$/, '') ?? 'Pochi';
      return { amount: -amt, name: who, who };
    },
  },

  // ── SENT MONEY — name only, no phone (e.g. "sent to JOHN KAMAU on 31/5/26") ─
  {
    test: r => /sent to\s+\S.+\s+on\s+\d{1,2}\/\d/i.test(r),
    subType: 'Sent Money',
    category: 'family',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/sent to\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = to?.[1]?.trim() ?? 'Unknown';
      return { amount: -amt, name: who, who };
    },
  },

  // ── BUY GOODS — no Till number (e.g. "paid to MERCHANT. on 30/5/26") ───────
  {
    test: r => /paid to\s+\S.+\s+on\s+\d{1,2}\/\d/i.test(r),
    subType: 'Buy Goods',
    category: 'shopping',
    extract: raw => {
      const amt = amountAfterConfirmed(raw);
      const to = raw.match(/paid to\s+(.+?)\s+on\s+\d/i);
      if (!amt) return null;
      const who = to?.[1]?.trim().replace(/\.$/, '') ?? 'Merchant';
      return { amount: -amt, name: who, who };
    },
  },

  // ── FULIZA / OVERDRAFT ──────────────────────────────────────────────────────
  {
    test: r => /[Ff]uliza/i.test(r) && /[Dd]educted/i.test(r),
    subType: 'Fuliza',
    category: 'other',
    extract: raw => {
      const amt = raw.match(/[Dd]educted\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
      if (!amt) return null;
      return { amount: -parseKsh(amt[1]), name: 'Fuliza M-Pesa', who: 'Fuliza' };
    },
  },
];

/**
 * Parse a Fuliza companion message (sender address "Fuliza").
 * Same transaction code as the M-Pesa message but stored with id = CODE_fuliza
 * so both records coexist.  Amount = access fee only (the main spend is on the
 * M-Pesa record).  balance field = outstanding Fuliza balance.
 */
export function parseFulizaSms(raw: string): ParsedTransaction | null {
  const trimmed = raw.trim();
  if (!/^[A-Z0-9]{3,15}\s+Confirmed/i.test(trimmed)) return null;
  if (!/Fuliza/i.test(trimmed)) return null;

  const code = extractCode(trimmed);
  if (!code) return null;

  const feePart  = trimmed.match(/Access Fee charged\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
  const outPart  = trimmed.match(/outstanding amount is\s+(Ksh\s?[\d,]+(?:\.\d{2})?)/i);
  const duePart  = trimmed.match(/due on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);

  const fee         = feePart  ? parseKsh(feePart[1])  : 0;
  const outstanding = outPart  ? parseKsh(outPart[1])  : 0;
  const dueDate     = duePart  ? normaliseDate(duePart[1]) : '';

  return {
    id:       `${code}_fuliza`,
    rawSms:   raw,
    amount:   -fee,
    name:     'Fuliza M-PESA',
    subType:  'Fuliza',
    category: 'fuliza',
    dateIso:  datePart(trimmed),
    time:     timePart(trimmed),
    balance:  outstanding,   // outstanding Fuliza balance, not M-Pesa balance
    cost:     fee,
    who:      dueDate,       // due date ISO string stored here
  };
}

export function parseMpesaSms(raw: string): ParsedTransaction | null {
  const trimmed = raw.trim();

  // Must contain "Confirmed." to be an M-Pesa transaction confirmation
  if (!/Confirmed\./i.test(trimmed)) return null;

  // Code must be the first token (3-15 alphanumeric chars)
  if (!/^[A-Z0-9]{3,15}\s+Confirmed/i.test(trimmed)) return null;

  for (const p of PATTERNS) {
    if (!p.test(trimmed)) continue;
    const extra = p.extract(trimmed);
    if (!extra) continue;
    const txCode = extractCode(trimmed);
    if (!txCode) continue;
    return {
      id: txCode,
      rawSms: raw,
      amount: extra.amount ?? 0,
      name: extra.name ?? 'Unknown',
      subType: p.subType,
      category: p.category,
      dateIso: datePart(trimmed),
      time: timePart(trimmed),
      balance: balancePart(trimmed),
      cost: costPart(trimmed),
      who: extra.who ?? extra.name ?? '',
    };
  }
  return null;
}
