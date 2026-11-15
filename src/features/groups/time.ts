import { dayKey, fmtDate, fmtTime } from '@/src/lib/tz';

type T = (path: string, vars?: Record<string, string | number>) => string;

const LOCALES = { dar: 'ar-MA', fr: 'fr-FR', en: 'en-GB' } as const;
export const localeOf = (lang: string | null) => LOCALES[(lang ?? 'fr') as keyof typeof LOCALES] ?? 'fr-FR';

/** « dans 3 h 50 », « dans 20 min », « demain 21:00 » ou la date. */
export function relativeStart(iso: string, t: T, lang: string | null, now = new Date()) {
  const start = new Date(iso);
  const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
  const time = fmtTime(start, localeOf(lang));
  if (diffMin <= 0) return time;
  if (diffMin < 60) return t('explore.inMinutes', { m: diffMin });

  const sameDay = dayKey(start) === dayKey(now);
  if (sameDay) return t('explore.inHours', { h: Math.floor(diffMin / 60), m: String(diffMin % 60).padStart(2, '0') });

  if (dayKey(start) === dayKey(now.getTime() + 24 * 3600 * 1000)) return t('explore.tomorrow', { time });

  return `${fmtDate(start, localeOf(lang), { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`;
}
