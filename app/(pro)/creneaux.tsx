import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { DateTimePicker } from '@/src/components/DateTimePicker';
import { AppText, Button, Chip, TextField } from '@/src/components/ui';
import { localeOf } from '@/src/features/groups/time';
import { ProShell, proStyles as s } from '@/src/features/partners/ProShell';
import { usePartner } from '@/src/features/partners/usePartner';
import { useI18n } from '@/src/i18n';
import type { Partner, PartnerOffer } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { dayKey, fmtDate, fmtTime, fromWall, wall } from '@/src/lib/tz';
import { colors, universeColors } from '@/src/theme/tokens';

const nextRound = () => {
  const w = wall(new Date());
  return fromWall(w.y, w.m, w.d, w.h + 2, 0);
};

function NewSlot({ partner, onDone }: { partner: Partner; onDone: () => void }) {
  const { t } = useI18n();
  const u = universeColors[partner.universe];
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(nextRound);
  const [duration, setDuration] = useState(90);
  const [capacity, setCapacity] = useState(4);
  const [price, setPrice] = useState('');
  const [weeks, setWeeks] = useState(1);
  const [discount, setDiscount] = useState<number | null>(null);
  const [boost, setBoost] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (start.getTime() < Date.now()) return Alert.alert(t('partner.futureSlot'));
    setLoading(true);
    // un créneau par semaine répétée, au même jour et à la même heure
    const rows = Array.from({ length: weeks }, (_, i) => ({
      partner_id: partner.id,
      title: title.trim(),
      starts_at: new Date(start.getTime() + i * 7 * 86400_000).toISOString(),
      duration_min: duration,
      capacity,
      price_mad: price ? Number(price.replace(/\D/g, '')) : null,
      discount_pct: discount,
      boosted: boost,
    }));
    const { error } = await supabase.from('partner_offers').insert(rows);
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    Alert.alert(t('pro.published', { n: rows.length }));
    setTitle('');
    onDone();
  };

  return (
    <View style={s.card}>
      <AppText variant="heading">{t('pro.publishSlot')}</AppText>
      <TextField label={t('partner.slotTitle')} value={title} onChangeText={setTitle} placeholder={t('partner.slotTitlePh')} maxLength={80} />
      <DateTimePicker value={start} onChange={setStart} accent={u.bg} soft={u.soft} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[60, 90, 120].map((d) => <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />)}
        {[2, 4, 6, 10].map((c) => <Chip key={`c${c}`} label={t('partner.people', { n: c })} selected={capacity === c} onPress={() => setCapacity(c)} />)}
      </View>
      <TextField label={t('partner.price')} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder={t('partner.pricePh')} maxLength={5} />

      <AppText variant="label" color={colors.sub}>{t('pro.repeat')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[1, 4, 8, 12].map((w) => <Chip key={w} label={w === 1 ? t('pro.once') : t('pro.weeks', { n: w })} selected={weeks === w} onPress={() => setWeeks(w)} />)}
      </View>

      <AppText variant="label" color={colors.sub}>{t('pro.offPeak')}</AppText>
      <AppText variant="small" color={colors.muted}>{t('pro.offPeakHint')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={`−${partner.discount_pct} %`} selected={discount === null} onPress={() => setDiscount(null)} />
        {[15, 20, 30].filter((d) => d > partner.discount_pct).map((d) => <Chip key={d} label={`−${d} %`} selected={discount === d} onPress={() => setDiscount(d)} />)}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="rocket-outline" size={22} color={colors.coral} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{t('pro.boost')}</AppText>
          <AppText variant="small" color={colors.sub}>{t('pro.boostHint')}</AppText>
        </View>
        <Switch value={boost} onValueChange={setBoost} trackColor={{ true: colors.coral }} />
      </View>
      <Button label={t('pro.publishSlot')} onPress={submit} loading={loading} disabled={title.trim().length < 2} />
    </View>
  );
}

export default function CreneauxScreen() {
  const { t, lang } = useI18n();
  const { partner, offers, reload } = usePartner();
  const locale = localeOf(lang);
  const upcoming = useMemo(() => offers.filter((o) => new Date(o.starts_at).getTime() > Date.now() - 3600_000), [offers]);
  const byDay = useMemo(() => {
    const m = new Map<string, PartnerOffer[]>();
    upcoming.forEach((o) => m.set(dayKey(o.starts_at), [...(m.get(dayKey(o.starts_at)) ?? []), o]));
    return [...m.entries()];
  }, [upcoming]);

  const toggleBoost = async (o: PartnerOffer) => {
    await supabase.from('partner_offers').update({ boosted: !o.boosted }).eq('id', o.id);
    reload();
  };
  const remove = (o: PartnerOffer) =>
    Alert.alert(t('partner.deleteSlot'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: async () => { await supabase.from('partner_offers').delete().eq('id', o.id); reload(); } },
    ]);

  return (
    <ProShell partner={partner} title={t('pro.slots')} onApplied={reload}>
      {(p) => (
        <>
          {byDay.map(([day, list]) => (
            <View key={day} style={{ gap: 8 }}>
              <AppText variant="label" color={colors.sub} style={{ textTransform: 'capitalize' }}>
                {fmtDate(list[0].starts_at, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </AppText>
              {list.map((o) => (
                <View key={o.id} style={[s.line, o.booked && { opacity: 0.65 }]}>
                  <AppText variant="heading" style={{ width: 56 }}>{fmtTime(o.starts_at, locale)}</AppText>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{o.title}</AppText>
                    <AppText variant="small" color={colors.sub}>
                      {o.duration_min} min · {t('partner.people', { n: o.capacity })}{o.price_mad ? ` · ${o.price_mad} DH` : ''}
                      {o.discount_pct ? ` · −${o.discount_pct} %` : ''}{o.booked ? ` · ${t('partner.booked')}` : ''}
                    </AppText>
                  </View>
                  {!o.booked ? (
                    <>
                      <Pressable accessibilityRole="button" accessibilityLabel={t('pro.boost')} onPress={() => toggleBoost(o)} style={{ padding: 6 }}>
                        <Ionicons name={o.boosted ? 'rocket' : 'rocket-outline'} size={20} color={o.boosted ? colors.coral : colors.muted} />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={t('settings.deleteConfirm')} onPress={() => remove(o)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={20} color={colors.muted} />
                      </Pressable>
                    </>
                  ) : <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
                </View>
              ))}
            </View>
          ))}
          <NewSlot partner={p} onDone={reload} />
        </>
      )}
    </ProShell>
  );
}
