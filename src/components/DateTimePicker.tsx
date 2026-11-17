import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { localeOf } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import { atTime, dayKey, fmtDate, fmtTime, fromWall, startOfDayPlus, wall } from '@/src/lib/tz';
import { colors, fonts, radius, TOUCH } from '@/src/theme/tokens';

const MONTHS_AHEAD = 6;
const HOURS = Array.from({ length: 24 }, (_, h) => (h + 6) % 24); // de 6 h à 5 h du matin
const MINUTES = [0, 15, 30, 45];

type Props = { value: Date; onChange: (d: Date) => void; locked?: boolean; accent: string; soft: string };

/** Choix de la date (calendrier sur 6 mois + raccourcis) et de l'heure (heures + quarts d'heure). */
export function DateTimePicker({ value, onChange, locked, accent, soft }: Props) {
  const { t, lang } = useI18n();
  const locale = localeOf(lang);
  const now = wall(new Date());
  const v = wall(value);
  const [month, setMonth] = useState({ y: v.y, m: v.m });
  const [open, setOpen] = useState(false);

  const todayKey = dayKey(new Date());
  const maxKey = dayKey(startOfDayPlus(MONTHS_AHEAD * 31));

  const pickDay = (y: number, m: number, d: number) => {
    if (locked) return;
    onChange(fromWall(y, m, d, v.h, v.min));
  };
  const pickTime = (h: number, min: number) => {
    if (locked) return;
    onChange(atTime(value, h, min));
  };

  // raccourcis : aujourd'hui, demain, samedi qui vient, dans une semaine
  const shortcuts = useMemo(() => {
    const dow = new Date(Date.UTC(now.y, now.m - 1, now.d)).getUTCDay();
    const toSat = ((6 - dow + 7) % 7) || 7;
    return [
      { key: 'today', label: t('create.today'), day: startOfDayPlus(0) },
      { key: 'tomorrow', label: t('create.tomorrow'), day: startOfDayPlus(1) },
      { key: 'weekend', label: t('calendar.weekend'), day: startOfDayPlus(toSat) },
      { key: 'week', label: t('calendar.nextWeek'), day: startOfDayPlus(7) },
    ];
  }, [now.y, now.m, now.d, t]);

  // grille du mois affiché (lundi en premier)
  const grid = useMemo(() => {
    const first = new Date(Date.UTC(month.y, month.m - 1, 1)).getUTCDay();
    const lead = (first + 6) % 7;
    const count = new Date(Date.UTC(month.y, month.m, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)] as (number | null)[];
  }, [month]);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => fmtDate(new Date(Date.UTC(2024, 0, 1 + i, 12)), locale, { weekday: 'narrow' })),
    [locale],
  );
  const monthLabel = fmtDate(fromWall(month.y, month.m, 15, 12, 0), locale, { month: 'long', year: 'numeric' });
  const canPrev = month.y > now.y || month.m > now.m;
  const monthsFromNow = (month.y - now.y) * 12 + (month.m - now.m);
  const canNext = monthsFromNow < MONTHS_AHEAD;
  const shift = (n: number) => setMonth(({ y, m }) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
  });

  const daysLeft = Math.round((startOfDayPlus(0, value).getTime() - startOfDayPlus(0).getTime()) / 86400000);
  const summary = `${fmtDate(value, locale, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(value, locale)}`;

  return (
    <View style={{ gap: 12, opacity: locked ? 0.55 : 1 }}>
      <View style={[styles.summary, { backgroundColor: soft }]}>
        <AppText style={{ fontSize: 26 }}>🗓️</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" style={{ textTransform: 'capitalize' }}>{summary}</AppText>
          <AppText variant="small" color={colors.sub}>
            {daysLeft <= 0 ? t('create.today') : daysLeft === 1 ? t('create.tomorrow') : t('calendar.inDays', { n: daysLeft })}
          </AppText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {shortcuts.map((s) => {
          const on = dayKey(s.day) === dayKey(value) && !open;
          return (
            <Pressable key={s.key} disabled={locked} onPress={() => { const w = wall(s.day); pickDay(w.y, w.m, w.d); setOpen(false); }}
              style={[styles.chip, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
              <AppText variant="label" color={on ? colors.white : colors.ink}>{s.label}</AppText>
            </Pressable>
          );
        })}
        <Pressable disabled={locked} onPress={() => setOpen((o) => !o)} style={[styles.chip, open && { backgroundColor: accent, borderColor: accent }]}>
          <AppText variant="label">📅 {t('calendar.pick')}</AppText>
        </Pressable>
      </ScrollView>

      {open ? (
        <View style={styles.cal}>
          <View style={styles.calHead}>
            <Pressable accessibilityLabel="‹" disabled={!canPrev} onPress={() => shift(-1)} style={[styles.nav, !canPrev && { opacity: 0.25 }]}>
              <AppText variant="heading">‹</AppText>
            </Pressable>
            <AppText variant="heading" style={{ textTransform: 'capitalize' }}>{monthLabel}</AppText>
            <Pressable accessibilityLabel="›" disabled={!canNext} onPress={() => shift(1)} style={[styles.nav, !canNext && { opacity: 0.25 }]}>
              <AppText variant="heading">›</AppText>
            </Pressable>
          </View>
          <View style={styles.week}>
            {weekdays.map((w, i) => <AppText key={i} variant="tag" color={colors.muted} style={styles.cellText}>{w.toUpperCase()}</AppText>)}
          </View>
          <View style={styles.grid}>
            {grid.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={styles.cell} />;
              const key = `${month.y}-${String(month.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const past = key < todayKey;
              const tooFar = key > maxKey;
              const selected = key === dayKey(value);
              const isToday = key === todayKey;
              const weekend = ((i % 7) === 5 || (i % 7) === 6);
              return (
                <Pressable key={key} disabled={past || tooFar || locked} onPress={() => pickDay(month.y, month.m, d)} style={styles.cell}
                  accessibilityState={{ selected, disabled: past || tooFar }}>
                  <View style={[styles.day, isToday && { borderWidth: 2, borderColor: colors.ink }, selected && { backgroundColor: colors.coral }]}>
                    <AppText variant="label" color={selected ? colors.white : past || tooFar ? colors.line : weekend ? colors.coralDark : colors.ink}>{d}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <AppText variant="tag" color={colors.sub}>{t('calendar.hour')}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}
        contentOffset={{ x: Math.max(0, HOURS.indexOf(v.h) - 2) * 60, y: 0 }}>
        {HOURS.map((h) => {
          const on = h === v.h;
          const pastHour = dayKey(value) === todayKey && h < now.h && h >= 6;
          return (
            <Pressable key={h} disabled={locked || pastHour} onPress={() => pickTime(h, v.min)}
              style={[styles.hour, on && { backgroundColor: colors.ink }, pastHour && { opacity: 0.3 }]}>
              <AppText style={[styles.hourText, on && { color: colors.white }]}>{String(h).padStart(2, '0')}</AppText>
              <AppText variant="tag" color={on ? colors.white : colors.muted}>h</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.minutes}>
        {MINUTES.map((m) => {
          const on = m === v.min;
          return (
            <Pressable key={m} disabled={locked} onPress={() => pickTime(v.h, m)} style={[styles.minute, on && { backgroundColor: accent, borderColor: accent }]}>
              <AppText variant="label">:{String(m).padStart(2, '0')}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: 14 },
  chip: { minHeight: TOUCH - 4, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' },
  cal: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, gap: 6 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellText: { width: `${100 / 7}%`, textAlign: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hour: { width: 54, height: 62, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  hourText: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  minutes: { flexDirection: 'row', gap: 8 },
  minute: { flex: 1, minHeight: TOUCH, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
});
