import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { localeOf } from '@/src/features/groups/time';
import { ProShell, proStyles as s } from '@/src/features/partners/ProShell';
import { usePartner } from '@/src/features/partners/usePartner';
import { useI18n } from '@/src/i18n';
import { fmtDate, wall } from '@/src/lib/tz';
import { colors } from '@/src/theme/tokens';

export default function StatsScreen() {
  const { t, lang } = useI18n();
  const { partner, offers, groups, reload } = usePartner();
  const locale = localeOf(lang);
  const past = groups.filter((g) => new Date(g.starts_at).getTime() <= Date.now());
  const people = past.reduce((n, g) => n + g.capacity, 0);
  const revenue = offers.filter((o) => o.booked && o.price_mad && new Date(o.starts_at).getTime() <= Date.now()).reduce((n, o) => n + (o.price_mad ?? 0) * o.capacity, 0);

  // groupes par jour de la semaine (lundi en premier)
  const days = Array.from({ length: 7 }, () => 0);
  groups.forEach((g) => {
    const w = wall(g.starts_at);
    days[(new Date(Date.UTC(w.y, w.m - 1, w.d)).getUTCDay() + 6) % 7] += 1;
  });
  const max = Math.max(1, ...days);
  const labels = Array.from({ length: 7 }, (_, i) => fmtDate(new Date(Date.UTC(2024, 0, 1 + i, 12)), locale, { weekday: 'short' }));
  const top = [...offers.filter((o) => o.booked)].reduce<Record<string, number>>((m, o) => ({ ...m, [o.title]: (m[o.title] ?? 0) + 1 }), {});
  const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <ProShell partner={partner} title={t('pro.stats')} onApplied={reload}>
      {() => (
        <>
          <AppText variant="label" color={colors.sub}>{t('pro.last30')}</AppText>
          <View style={s.kpis}>
            {[
              ['people', String(groups.length), t('pro.groupsCount'), colors.coral],
              ['person', String(people), t('pro.peopleCount'), '#3DA9FC'],
              ['cash', revenue ? `${revenue.toLocaleString(locale)} DH` : '—', t('pro.revenue'), '#12B76A'],
              ['trending-up', `${offers.length ? Math.round((offers.filter((o) => o.booked).length / offers.length) * 100) : 0} %`, t('pro.fill'), '#9D74F7'],
            ].map(([icon, value, label, color]) => (
              <View key={label} style={s.kpi}>
                <Ionicons name={icon as 'people'} size={18} color={color} />
                <AppText variant="display" style={s.kpiValue}>{value}</AppText>
                <AppText variant="small" color={colors.sub}>{label}</AppText>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <AppText variant="heading">{t('pro.byDay')}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {days.map((n, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <AppText variant="small" color={colors.sub}>{n || ''}</AppText>
                  <View style={{ width: '100%', height: Math.max(6, (n / max) * 100), borderRadius: 8, backgroundColor: n === max && n ? colors.coral : colors.sand }} />
                  <AppText variant="tag" color={colors.sub} style={{ textTransform: 'capitalize', letterSpacing: 0 }}>{labels[i].replace('.', '')}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={s.card}>
            <AppText variant="heading">{t('pro.topSlots')}</AppText>
            {topList.length ? topList.map(([title, n], i) => (
              <View key={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppText variant="heading" color={colors.coral}>{i + 1}</AppText>
                <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{title}</AppText>
                <AppText variant="small" color={colors.sub}>× {n}</AppText>
              </View>
            )) : <AppText color={colors.sub}>{t('pro.noStats')}</AppText>}
          </View>
        </>
      )}
    </ProShell>
  );
}
