/** "14/03/1998" → Date (ou null si invalide) */
export function parseFrDate(input: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (d.getUTCDate() !== Number(dd) || d.getUTCMonth() !== Number(mm) - 1) return null;
  if (Number(yyyy) < 1920) return null;
  return d;
}

export function ageFrom(birth: Date | string, now = new Date()): number {
  const b = typeof birth === 'string' ? new Date(birth) : birth;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

/** Ajoute les "/" automatiquement pendant la saisie de la date. */
export function maskFrDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
