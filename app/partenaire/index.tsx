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
    Alert.alert('Candidature envoyée ✅', 'Notre équipe vérifie ton établissement sous 48 h. Tu pourras ensuite publier tes plans.');
    onDone();
  };

  return (
    <View style={{ gap: 16 }}>
      <AppText variant="title">Deviens partenaire WyytU</AppText>
      <AppText color={colors.sub}>
        Remplis tes heures creuses avec des groupes déjà formés. Tu publies tes créneaux, tu offres une réduction aux groupes WyytU, et tu scannes leur QR à l’arrivée.
      </AppText>
      <TextField label="Nom de l’établissement" value={name} onChangeText={setName} placeholder="Ex. : Club de padel Malabata" maxLength={80} />
      <TextField label="Adresse" value={address} onChangeText={setAddress} placeholder="Quartier, rue" maxLength={120} />
      <AppText variant="label" color={colors.sub}>Activité</AppText>
      <View style={styles.wrap}>
        {UNIVERSES.map((u) => (
          <Chip key={u.id} label={`${u.emoji} ${t(`universes.${u.id}`)}`} selected={universe === u.id} color={universeColors[u.id].bg} soft={universeColors[u.id].soft} onPress={() => setUniverse(u.id)} />
        ))}
      </View>
      <AppText variant="label" color={colors.sub}>Réduction pour les groupes WyytU</AppText>
      <View style={styles.wrap}>
        {[5, 10, 15, 20].map((d) => <Chip key={d} label={`−${d} %`} selected={discount === d} onPress={() => setDiscount(d)} />)}
      </View>
      <AppText variant="small" color={colors.sub}>Ta position actuelle sera utilisée pour placer ton établissement sur la carte (tu peux refuser).</AppText>
      <Button label="Envoyer ma candidature" onPress={submit} loading={loading} disabled={name.trim().length < 2} />
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
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  }), []);

  const submit = async () => {
    const start = new Date(days[dayIndex]);
    start.setHours(hour, minute, 0, 0);
    if (start.getTime() < Date.now()) return Alert.alert('Choisis un créneau à venir.');
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
      <AppText variant="heading">+ Nouveau créneau</AppText>
      <TextField label="Intitulé" value={title} onChangeText={setTitle} placeholder="Ex. : Terrain 2 · padel" maxLength={80} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d, i) => (
          <Chip key={i} label={i === 0 ? 'Auj.' : d.toLocaleDateString(localeOf(lang), { weekday: 'short', day: 'numeric' })} selected={dayIndex === i} onPress={() => setDayIndex(i)} />
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="−30 min" onPress={() => step(-30)} style={styles.stepBtn}><AppText variant="heading">−</AppText></Pressable>
        <AppText variant="title" style={{ flex: 1 }} center>{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="+30 min" onPress={() => step(30)} style={styles.stepBtn}><AppText variant="heading">+</AppText></Pressable>
      </View>
      <View style={styles.wrap}>
        {[60, 90, 120].map((d) => <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />)}
        {[2, 4, 6, 10].map((c) => <Chip key={`c${c}`} label={`${c} pers.`} selected={capacity === c} onPress={() => setCapacity(c)} />)}
      </View>
      <TextField label="Prix par personne (DH, facultatif)" value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="Ex. : 80" maxLength={5} />
      <Button label="Publier le créneau" onPress={submit} loading={loading} disabled={title.trim().length < 2} />
    </View>
  );
}

/* ---------- Écran ---------- */
export default function PartenaireScreen() {
  const router = useRouter();
  const { lang } = useI18n();
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
    Alert.alert('Supprimer ce créneau ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await supabase.from('partner_offers').delete().eq('id', o.id); load(); } },
    ]);

  return (
    <Screen scroll>
      <TopBar title="Espace partenaire" />
      {partner === undefined ? null : !partner ? (
        <Candidature onDone={load} />
      ) : partner.status !== 'approved' ? (
        <View style={styles.card}>
          <AppText variant="title">{partner.name}</AppText>
          <AppText color={colors.sub}>
            {partner.status === 'pending'
              ? '⏳ Ta candidature est en cours de vérification (48 h maximum). Tu recevras une notification dès qu’elle est validée.'
              : 'Ton compte partenaire est suspendu. Contacte-nous depuis l’aide.'}
          </AppText>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.ink }]}>
            <AppText variant="tag" color={colors.lime}>PARTENAIRE VÉRIFIÉ · −{partner.discount_pct} % WYYTU</AppText>
            <AppText variant="title" color={colors.white}>{partner.name}</AppText>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={colors.lime}>{groups.length}</AppText>
                <AppText variant="small" color="#BDBAC4">groupes à venir</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={colors.white}>{offers.filter((o) => !o.booked).length}</AppText>
                <AppText variant="small" color="#BDBAC4">créneaux libres</AppText>
              </View>
            </View>
            <Button kind="lime" label="📷 Scanner le QR d’un groupe" onPress={() => router.push('/partenaire/scanner')} />
          </View>

          <AppText variant="heading">Groupes attendus</AppText>
          {groups.length ? groups.map((g) => (
            <View key={g.id} style={styles.line}>
              <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{g.title}</AppText>
              <AppText variant="small" color={colors.sub}>
                {new Date(g.starts_at).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
          )) : <AppText color={colors.sub}>Aucun groupe pour l’instant.</AppText>}

          <AppText variant="heading">Mes créneaux</AppText>
          {offers.map((o) => (
            <View key={o.id} style={[styles.line, o.booked && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{o.title}</AppText>
                <AppText variant="small" color={colors.sub}>
                  {new Date(o.starts_at).toLocaleString(locale, { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {o.booked ? ' · Réservé ✓' : ''}
                </AppText>
              </View>
              {!o.booked ? (
                <>
                  <Button small kind={o.boosted ? 'lime' : 'outline'} label={o.boosted ? '🚀 Boosté' : '🚀 Booster'} onPress={() => toggleBoost(o)} />
                  <Pressable accessibilityRole="button" accessibilityLabel="Supprimer" onPress={() => remove(o)} style={styles.del}>
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
