import { parseMpesaSms } from '../../src/sms/parser';

describe('parseMpesaSms', () => {
  test('returns null for non-M-Pesa message', () => {
    expect(parseMpesaSms('Hello from your bank')).toBeNull();
    expect(parseMpesaSms('')).toBeNull();
    expect(parseMpesaSms('ABC123 Hello')).toBeNull();
  });

  test('parses received money', () => {
    const sms = 'TFK7H2P9Q4 Confirmed. You have received Ksh1,500.00 from JOHN MWANGI 0712***456 on 30/05/2026 at 7:10 AM. New M-PESA balance is Ksh6,240.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('TFK7H2P9Q4');
    expect(result!.amount).toBe(1500);
    expect(result!.category).toBe('income');
    expect(result!.subType).toBe('Received');
    expect(result!.balance).toBe(6240);
    expect(result!.name).toBe('JOHN MWANGI');
    expect(result!.dateIso).toBe('2026-05-30');
    expect(result!.time).toBe('7:10 AM');
  });

  test('parses airtime purchase', () => {
    const sms = 'TFK9Q4R2VT Confirmed. You bought Ksh100.00 of airtime on 30/05/2026 at 11:20 AM. New M-PESA balance is Ksh5,740.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-100);
    expect(result!.category).toBe('airtime');
    expect(result!.name).toBe('Safaricom');
    expect(result!.cost).toBe(0);
  });

  test('parses withdrawal', () => {
    const sms = 'TFI9M3K7QP Confirmed. On 28/05/2026 at 5:40 PM Withdraw Ksh2,000.00 from EQUITY ATM — KENYATTA AVE New M-PESA balance is Ksh7,610.00. Transaction cost, Ksh28.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-2000);
    expect(result!.category).toBe('withdrawal');
    expect(result!.cost).toBe(28);
    expect(result!.balance).toBe(7610);
  });

  test('parses sent money to phone', () => {
    const sms = 'TFK3M1L8KX Confirmed. Ksh400.00 sent to MAMA WANJIRU 0722***118 on 30/05/2026 at 8:30 AM. New M-PESA balance is Ksh5,840.00. Transaction cost, Ksh0.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-400);
    expect(result!.category).toBe('family');
    expect(result!.name).toBe('MAMA WANJIRU');
    expect(result!.subType).toBe('Sent Money');
  });

  test('parses buy goods (till)', () => {
    const sms = 'TFK5B7N3WZ Confirmed. Ksh680.00 paid to NAIVAS SUPERMARKET — Till 400200 on 30/05/2026 at 1:45 PM. New M-PESA balance is Ksh5,060.00. Transaction cost, Ksh0.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-680);
    expect(result!.category).toBe('shopping');
    expect(result!.name).toBe('NAIVAS SUPERMARKET');
    expect(result!.subType).toBe('Buy Goods');
  });

  test('parses pay bill', () => {
    const sms = 'TFJ2K8M4LP Confirmed. Ksh500.00 sent to KPLC PREPAID 888880 on 29/05/2026 at 6:50 PM. New M-PESA balance is Ksh5,810.00. Transaction cost, Ksh0.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-500);
    expect(result!.category).toBe('paybill');
    expect(result!.name).toBe('KPLC PREPAID');
    expect(result!.subType).toBe('Pay Bill');
  });

  test('preserves raw SMS', () => {
    const sms = 'TFK9Q4R2VT Confirmed. You bought Ksh50.00 of airtime on 28/05/2026 at 7:30 AM. New M-PESA balance is Ksh10,610.00.';
    const result = parseMpesaSms(sms);
    expect(result!.rawSms).toBe(sms);
  });

  test('parses pay bill with alphanumeric account (DIRECT PAY format)', () => {
    const sms = 'JCY1234567 Confirmed. Ksh5,000.00 sent to DIRECT PAY for account #LIVRSTATUS on 31/05/2026 at 11:47 AM. Amount You can withdraw is Ksh4,930.00. Transaction from Ksh5,000.00. Transaction cost Ksh40.00.';
    const result = parseMpesaSms(sms);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-5000);
    expect(result!.category).toBe('paybill');
    expect(result!.name).toBe('DIRECT PAY');
    expect(result!.balance).toBe(4930);
    expect(result!.cost).toBe(40);
  });

  test('deduplication key is confirmation code', () => {
    const sms1 = 'TFK7H2P9Q4 Confirmed. You have received Ksh1,500.00 from JOHN MWANGI 0712***456 on 30/05/2026 at 7:10 AM. New M-PESA balance is Ksh6,240.00.';
    const sms2 = 'TFK7H2P9Q4 Confirmed. You have received Ksh1,500.00 from JOHN MWANGI 0712***456 on 30/05/2026 at 7:10 AM. New M-PESA balance is Ksh6,240.00.';
    const r1 = parseMpesaSms(sms1);
    const r2 = parseMpesaSms(sms2);
    expect(r1!.id).toBe(r2!.id);
  });
});
