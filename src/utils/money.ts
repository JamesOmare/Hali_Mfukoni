export function kes(n: number): string {
  const abs = Math.abs(n);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  return hasCents
    ? abs.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(abs).toLocaleString('en-KE');
}

export function kesLabel(n: number): string {
  return `Ksh ${kes(n)}`;
}
