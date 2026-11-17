import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { Countdown } from '@/src/components/Countdown';
import { localeOf } from '@/src/features/groups/time';
import { ProShell, proStyles as s } from '@/src/features/partners/ProShell';
import { usePartner } from '@/src/features/partners/usePartner';
import { useI18n } from '@/src/i18n';
import { dayKey, fmtDateTime, fmtTime } from '@/src/lib/tz';
import { iconFor } from '@/src/theme/images';
import { colors, radius, universeColors } from '@/src/theme/tokens';
import { Image } from 'expo-image';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function AujourdhuiScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { partner, offers, groups, reload } = usePartner();
  const locale = localeOf(lang);
  const now = Date.now();
  const today = dayKey(new Date());
  const todays = groups.filter((g) => dayKey(g.starts_at) === today);
  const upcoming = groups.filter((g) => new Date(g.starts_at).getTime() > now && dayKey(g.starts_at) !== today).slice(0, 5);
  const week = offers.filter((o) => new Date(o.starts_at).getTime() > now - 7 * 86400_000 && new Date(o.starts_at).getTime() < now + 7 * 86400_000);
  const fill = week.length ? Math.round((week.filter((o) => o.booked).length / week.length) * 100) : 0;
  const free = offers.filter((o) => !o.booked && new Date(o.starts_at).getTime() > now).length;

  const kpis: { icon: IconName; value: string; label: string; color: string }[] = [
    { icon: 'people', value: String(todays.length), label: t('pro.todayGroups'), color: colors.coral },
    { icon: 'person-add', value: String(todays.reduce((n, g) => n + g.capacity, 0)), label: t('pro.expected'), color: '#3DA9FC' },
    { icon: 'time', value: String(free), label: t('pro.freeSlots'), color: '#12B76A' },
    { icon: 'trending-up', value: `${fill} %`, label: t('pro.fill'), color: '#9D74F7' },
  ];

  return (
    <ProShell partner={partner} title={t('pro.today')} onApplied={reload}>
      {(p) => (
        <>
          <View style={s.kpis}>
            {kpis.map((k) => (
              <View key={k.label} style={s.kpi}>
                <Ionicons name={k.icon} size={18} color={k.color} />
                <AppText variant="display" style={s.kpiValue}>{k.value}</AppText>
                <AppText variant="small" color={colors.sub}>{k.label}</AppText>
              </View>
            ))}
          </View>

          <AppText variant="heading" style={s.section}>{t('pro.timeline')}</AppText>
          {todays.length ? todays.map((g) => (
            <View key={g.id} style={s.line}>
              <View style={{ width: 54, alignItems: 'center' }}>
                <AppText variant="heading">{fmtTime(g.starts_at, locale)}</AppText>
              </View>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: universeColors[g.universe].bg }} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{g.title}</AppText>
                <AppText variant="small" color={colors.sub}>{t('pro.groupOf', { n: g.capacity })}</AppText>
                <Countdown startsAt={g.starts_at} />
              </View>
              <Image source={iconFor(g.universe, g.subcategory)} style={{ width: 40, height: 40 }} />
            </View>
          )) : (
            <Pressable onPress={() => router.push('/creneaux')} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <AppText color={colors.sub} style={{ flex: 1 }}>{t('pro.noToday')}</AppText>
              <Ionicons name="add-circle" size={30} color={colors.coral} />
            </Pressable>
          )}

          {upcoming.length ? (
            <>
              <AppText variant="heading" style={s.section}>{t('pro.upcoming')}</AppText>
              {upcoming.map((g) => (
                <View key={g.id} style={s.line}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{g.title}</AppText>
                    <AppText variant="small" color={colors.sub}>
                      {fmtDateTime(g.starts_at, locale, { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {t('pro.groupOf', { n: g.capacity })}
                    </AppText>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          <View style={[s.card, { backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg }]}>
            <Ionicons name="pricetag" size={24} color={colors.lime} />
            <View style={{ flex: 1 }}>
              <AppText variant="tag" color={colors.lime}>{t('partner.verifiedTag', { n: p.discount_pct })}</AppText>
              <AppText variant="small" color="rgba(255,255,255,0.7)">{t('partner.pitch')}</AppText>
            </View>
          </View>
        </>
      )}
    </ProShell>
  );
}
