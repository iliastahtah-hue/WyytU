/**
 * Toutes les heures de WyytU sont celles de Tanger (Africa/Casablanca),
 * même si le téléphone est réglé sur un autre fuseau (ex. Bruxelles).
 * Le Maroc est à UTC+1, et à UTC+0 pendant le Ramadan.
 */
export const TZ = 'Africa/Casablanca';

type Wall = { y: number; m: number; d: number; h: number; min: number };

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Date → année, mois, jour, heure, minute à Tanger */
export function wall(date: Date | string | number): Wall {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(date)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute };
}

function offsetMin(date: Date) {
  const w = wall(date);
  const asUtc = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min);
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

/** Heure de Tanger → instant réel (Date) */
export function fromWall(y: number, m: number, d: number, h: number, min: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, min);
  let result = guess - offsetMin(new Date(guess)) * 60000;
  const again = offsetMin(new Date(result));
  result = guess - again * 60000;
  return new Date(result);
}

/** « 2026-11-15 » à Tanger, pour comparer des jours */
export function dayKey(date: Date | string | number) {
  const w = wall(date);
  return `${w.y}-${String(w.m).padStart(2, '0')}-${String(w.d).padStart(2, '0')}`;
}

/** Minuit à Tanger, dans n jours */
export function startOfDayPlus(n: number, from: Date = new Date()): Date {
  const w = wall(from);
  const base = new Date(Date.UTC(w.y, w.m - 1, w.d + n));
  return fromWall(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), 0, 0);
}

/** Même jour (à Tanger) que `day`, à l'heure h:min */
export function atTime(day: Date, h: number, min: number): Date {
  const w = wall(day);
  return fromWall(w.y, w.m, w.d, h, min);
}

export const fmtTime = (date: Date | string, locale: string) =>
  new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: TZ });

export const fmtDate = (date: Date | string, locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString(locale, { ...opts, timeZone: TZ });

export const fmtDateTime = (date: Date | string, locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleString(locale, { ...opts, timeZone: TZ });
