import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, Chip, Screen, TextField, TopBar } from '@/src/components/ui';
import { localeOf } from '@/src/features/groups/time';
import { fetchMyPartner, fetchPartnerAgenda } from '@/src/features/partners/api';
import { useI18n } from '@/src/i18n';
import type { Group, Partner, PartnerOffer, Universe } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { atTime, fmtDate, fmtDateTime, startOfDayPlus } from '@/src/lib/tz';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius, TOUCH, UNIVERSES, universeColors } from '@/src/theme/tokens';

/* ---------- Devenir partenaire ---------- */
function Candidature({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [universe, setUniverse] = useState<Universe>('sport');
  const [discount, setDiscount] = useState(10);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session) return;
    setLoading(true);
    let coords: { lat: number | null; lng: number | null } = { lat: null, lng: null };
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {
      // la position est facultative : l'équipe peut la corriger
    }
    const { error } = await supabase.from('partners').insert({
      owner_id: session.user.id,
      name: name.trim(),
      address: address.trim() || null,
      universe,
      discount_pct: discount,
      ...coords,
    });
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    Alert.alert(t('partner.sentTitle'), t('partner.sentBody'));
    onDone();
  };

  return (
    <View style={{ gap: 16 }}>
      <AppText variant="title">{t('partner.become')}</AppText>
      <AppText color={colors.sub}>
        {t('partner.pitch')}
      </AppText>
      <TextField label={t('partner.name')} value={name} onChangeText={setName} placeholder={t('partner.namePh')} maxLength={80} />
      <TextField label={t('partner.address')} value={address} onChangeText={setAddress} placeholder={t('partner.addressPh')} maxLength={120} />
      <AppText variant="label" color={colors.sub}>{t('partner.activity')}</AppText>
      <View style={styles.wrap}>
        {UNIVERSES.map((u) => (
          <Chip key={u.id} label={`${u.emoji} ${t(`universes.${u.id}`)}`} selected={universe === u.id} color={universeColors[u.id].bg} soft={universeColors[u.id].soft} onPress={() => setUniverse(u.id)} />
        ))}
      </View>
      <AppText variant="label" color={colors.sub}>{t('partner.discount')}</AppText>
      <View style={styles.wrap}>
        {[5, 10, 15, 20].map((d) => <Chip key={d} label={`−${d} %`} selected={discount === d} onPress={() => setDiscount(d)} />)}
      </View>
      <AppText variant="small" color={colors.sub}>{t('partner.locationHint')}</AppText>
      <Button label={t('partner.apply')} onPress={submit} loading={loading} disabled={name.trim().length < 2} />
    </View>
  );
}

/* ---------- Ajouter un créneau ---------- */
function NewOffer({ partner, onDone }: { partner: Partner; onDone: () => void }) {
  const { t, lang } = useI18n();
  const [title, setTitle] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(90);
  const [capacity, setCapacity] = useState(4);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => startOfDayPlus(i)), []);

  const submit = async () => {
    const start = atTime(days[dayIndex], hour, minute);
    if (start.getTime() < Date.now()) return Alert.alert(t('partner.futureSlot'));
    setLoading(true);
    const { error } = await supabase.from('partner_offers').insert({
      partner_id: partner.id,
      title: title.trim(),
      starts_at: start.toISOString(),
      duration_min: duration,
      capacity,
      price_mad: price ? Number(price.replace(/\D/g, '')) : null,
    });
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    setTitle('');
    onDone();
  };

  const step = (d: number) => {
    let total = hour * 60 + minute + d;
    total = Math.max(6 * 60, Math.min(23 * 60 + 30, total));
    setHour(Math.floor(total / 60));
    setMinute(total % 60);
  };

  return (
    <View style={styles.card}>
      <AppText variant="heading">{t('partner.newSlot')}</AppText>
      <TextField label={t('partner.slotTitle')} value={title} onChangeText={setTitle} placeholder={t('partner.slotTitlePh')} maxLength={80} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d, i) => (
          <Chip key={i} label={i === 0 ? t('partner.today') : fmtDate(d, localeOf(lang), { weekday: 'short', day: 'numeric' })} selected={dayIndex === i} onPress={() => setDayIndex(i)} />
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="−30 min" onPress={() => step(-30)} style={styles.stepBtn}><AppText variant="heading">−</AppText></Pressable>
        <AppText variant="title" style={{ flex: 1 }} center>{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="+30 min" onPress={() => step(30)} style={styles.stepBtn}><AppText variant="heading">+</AppText></Pressable>
      </View>
      <View style={styles.wrap}>
        {[60, 90, 120].map((d) => <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />)}
        {[2, 4, 6, 10].map((c) => <Chip key={`c${c}`} label={t('partner.people', { n: c })} selected={capacity === c} onPress={() => setCapacity(c)} />)}
      </View>
      <TextField label={t('partner.price')} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder={t('partner.pricePh')} maxLength={5} />
      <Button label={t('partner.publish')} onPress={submit} loading={loading} disabled={title.trim().length < 2} />
    </View>
  );
}

/* ---------- Écran ---------- */
export default function PartenaireScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const locale = localeOf(lang);

  const load = useCallback(async () => {
    if (!session) return;
    const p = await fetchMyPartner(session.user.id);
    setPartner(p);
    if (p) {
      const agenda = await fetchPartnerAgenda(p.id);
      setOffers(agenda.offers);
      setGroups(agenda.groups);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleBoost = async (o: PartnerOffer) => {
    await supabase.from('partner_offers').update({ boosted: !o.boosted }).eq('id', o.id);
    load();
  };

  const remove = (o: PartnerOffer) =>
    Alert.alert(t('partner.deleteSlot'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: async () => { await supabase.from('partner_offers').delete().eq('id', o.id); load(); } },
    ]);

  return (
    <Screen scroll>
      <TopBar title={t('profile.partner')} />
      {partner === undefined ? null : !partner ? (
        <Candidature onDone={load} />
      ) : partner.status !== 'approved' ? (
        <View style={styles.card}>
          <AppText variant="title">{partner.name}</AppText>
          <AppText color={colors.sub}>
            {partner.status === 'pending'
              ? t('partner.pending')
              : t('partner.suspended')}
          </AppText>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.ink }]}>
            <AppText variant="tag" color={colors.lime}>{t('partner.verifiedTag', { n: partner.discount_pct })}</AppText>
            <AppText variant="title" color={colors.white}>{partner.name}</AppText>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={colors.lime}>{groups.length}</AppText>
                <AppText variant="small" color="#BDBAC4">{t('partner.upcomingGroups')}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={colors.white}>{offers.filter((o) => !o.booked).length}</AppText>
                <AppText variant="small" color="#BDBAC4">{t('partner.freeSlots')}</AppText>
              </View>
            </View>
            <Button kind="lime" label={t('partner.scan')} onPress={() => router.push('/partenaire/scanner')} />
          </View>

          <AppText variant="heading">{t('partner.expected')}</AppText>
          {groups.length ? groups.map((g) => (
            <View key={g.id} style={styles.line}>
              <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{g.title}</AppText>
              <AppText variant="small" color={colors.sub}>
                {fmtDateTime(g.starts_at, locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
          )) : <AppText color={colors.sub}>{t('partner.noGroups')}</AppText>}

          <AppText variant="heading">{t('partner.mySlots')}</AppText>
          {offers.map((o) => (
            <View key={o.id} style={[styles.line, o.booked && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{o.title}</AppText>
                <AppText variant="small" color={colors.sub}>
                  {fmtDateTime(o.starts_at, locale, { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {o.booked ? ` · ${t('partner.booked')}` : ''}
                </AppText>
              </View>
              {!o.booked ? (
                <>
                  <Button small kind={o.boosted ? 'lime' : 'outline'} label={o.boosted ? t('partner.boosted') : t('partner.boost')} onPress={() => toggleBoost(o)} />
                  <Pressable accessibilityRole="button" accessibilityLabel={t('settings.deleteConfirm')} onPress={() => remove(o)} style={styles.del}>
                    <AppText variant="heading" color={colors.sub}>×</AppText>
                  </Pressable>
                </>
              ) : null}
            </View>
          ))}

          <NewOffer partner={partner} onDone={load} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 18, gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  del: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
