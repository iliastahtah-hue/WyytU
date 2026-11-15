type T = (path: string, vars?: Record<string, string | number>) => string;

const LOCALES = { dar: 'ar-MA', fr: 'fr-FR', en: 'en-GB' } as const;
export const localeOf = (lang: string | null) => LOCALES[(lang ?? 'fr') as keyof typeof LOCALES] ?? 'fr-FR';

/** « dans 3 h 50 », « dans 20 min », « demain 21:00 » ou la date. */
export function relativeStart(iso: string, t: T, lang: string | null, now = new Date()) {
  const start = new Date(iso);
  const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
  const time = start.toLocaleTimeString(localeOf(lang), { hour: '2-digit', minute: '2-digit' });
  if (diffMin <= 0) return time;
  if (diffMin < 60) return t('explore.inMinutes', { m: diffMin });

  const sameDay = start.toDateString() === now.toDateString();
  if (sameDay) return t('explore.inHours', { h: Math.floor(diffMin / 60), m: String(diffMin % 60).padStart(2, '0') });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (start.toDateString() === tomorrow.toDateString()) return t('explore.tomorrow', { time });

  return start.toLocaleDateString(localeOf(lang), { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${time}`;
}
