export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

export function formatDateLong(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'short',
  });
}

export function formatDateShort(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short',
  });
}

export function weekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function monthStartISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/** "8:47 AM" or "18:09" → "18:09" (24h, sortable). */
export function to24h(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return time; // already 24h or empty
  let h = parseInt(m[1]);
  const min = m[2];
  const pm = m[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

/** "18:09" → "6:09 PM". Handles legacy "8:47 AM" records unchanged. */
export function formatTime(time: string): string {
  if (!time) return '';
  if (/[AP]M$/i.test(time)) return time; // legacy 12h records
  const [hStr, mStr] = time.split(':');
  if (!hStr || !mStr) return time;
  const h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

export function last30DaysStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
