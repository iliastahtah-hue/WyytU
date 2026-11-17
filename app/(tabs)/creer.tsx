import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip, TextField } from '@/src/components/ui';
import { countMyGroupsThisWeek } from '@/src/features/create/api';
import { placeStore, usePickedPlace } from '@/src/features/create/draft';
import { useI18n } from '@/src/i18n';
import type { Level, Universe } from '@/src/lib/database.types';
import { DateTimePicker } from '@/src/components/DateTimePicker';
import { usePremiumGate } from '@/src/lib/premium';
import { readableError, supabase } from '@/src/lib/supabase';
import { fromWall, wall } from '@/src/lib/tz';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, LEVELS, radius, SPORTS, TOUCH, UNIVERSES, universeColors } from '@/src/theme/tokens';

const BUDGETS = ['< 50 DH', '50–100 DH', '100–200 DH', '200 DH +'];

/** Heure ronde dans 2 h, heure de Tanger (ex. il est 17:20 → 19:00) */
function defaultStart() {
  const w = wall(new Date());
  return fromWall(w.y, w.m, w.d, w.h + 2, 0);
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.stepper} accessibilityLabel={`${label} : ${value}`}>
      <Pressable accessibilityRole="button" accessibilityLabel="Moins" disabled={value <= min} onPress={() => onChange(value - 1)} style={[styles.stepBtn, value <= min && { opacity: 0.35 }]}>
        <AppText variant="heading">−</AppText>
      </Pressable>
      <AppText variant="title" style={{ minWidth: 48 }} center>{value}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Plus" disabled={value >= max} onPress={() => onChange(value + 1)} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]}>
        <AppText variant="heading">+</AppText>
      </Pressable>
    </View>
  );
}

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading">{title}</AppText>
      {hint ? <AppText variant="small" color={colors.sub}>{hint}</AppText> : null}
      {children}
    </View>
  );
}

export default function CreerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const place = usePickedPlace();
  // Pré-remplissage quand on vient d'un plan partenaire
  const params = useLocalSearchParams<{ offerId?: string; startsAt?: string; universe?: Universe; subcategory?: string; capacity?: string; title?: string }>();
  const [offerId, setOfferId] = useState<string | null>(null);

  const [universe, setUniverse] = useState<Universe>('sport');
  const [sport, setSport] = useState<string | null>('padel');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(defaultStart);
  const [capacity, setCapacity] = useState(4);
  const [level, setLevel] = useState<Level | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [womenOnly, setWomenOnly] = useState(false);
  const [description, setDescription] = useState('');
  const [weekCount, setWeekCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.offerId) return;
    setOfferId(params.offerId);
    if (params.universe) setUniverse(params.universe);
    if (params.subcategory) setSport(params.subcategory);
    if (params.startsAt) setStart(new Date(params.startsAt));
    if (params.capacity) setCapacity(Math.min(Math.max(Number(params.capacity) || 4, 2), 20));
    if (params.title) setTitle(params.title);
  }, [params.offerId, params.universe, params.subcategory, params.startsAt, params.capacity, params.title]);

  const isWoman = profile?.gender === 'femme';
  const premium = !!profile?.is_premium;
  const quotaReached = !premium && weekCount >= 2;
  const gate = usePremiumGate();
  const u = universeColors[universe];

  useFocusEffect(
    useCallback(() => {
      if (session) countMyGroupsThisWeek(session.user.id).then(setWeekCount).catch(() => undefined);
    }, [session]),
  );

  const locked = !!offerId; // créneau partenaire : jour, heure et lieu imposés

  const suggestedTitle =
    universe === 'sport' && sport
      ? `${t(`sports.${sport}`)}${level ? ` niveau ${level}` : ''}`
      : t(`universes.${universe}`);

  const publish = async () => {
    setError(null);
    const finalTitle = (title.trim() || suggestedTitle).trim();
    if (finalTitle.length < 3) return setError(t('create.errTitle'));
    if (!place) return setError(t('create.errPlace'));
    if (start.getTime() < Date.now() + 5 * 60000) return setError(t('create.errTime'));
    if (!session) return;
    if (quotaReached && !gate('unlimited')) return;

    setLoading(true);
    const { data, error: err } = await supabase
      .from('groups')
      .insert({
        organizer_id: session.user.id,
        universe,
        subcategory: universe === 'sport' ? sport : null,
        title: finalTitle,
        description: description.trim() || null,
        starts_at: start.toISOString(),
        place_name: place.name,
        partner_id: place.partnerId,
        offer_id: offerId && place.partnerId ? offerId : null,
        lat: place.lat,
        lng: place.lng,
        capacity,
        level: universe === 'sport' ? level : null,
        women_only: isWoman && womenOnly,
        budget: universe === 'resto' ? budget : null,
      })
      .select('id')
      .single();
    setLoading(false);

    if (err?.message?.includes('WEEKLY_LIMIT')) return void gate('unlimited');
    if (err || !data) return setError(readableError(err, t('common.error')));

    // on remet le formulaire à zéro pour la prochaine fois
    placeStore.set(null);
    setOfferId(null);
    router.setParams({ offerId: undefined, startsAt: undefined, universe: undefined, subcategory: undefined, capacity: undefined, title: undefined });
    setTitle('');
    setDescription('');
    setStart(defaultStart());
    router.push({ pathname: '/groupe/[id]', params: { id: data.id } });
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="display">{t('create.title')}</AppText>
        <Pressable
          accessibilityRole="button"
          disabled={premium}
          onPress={() => gate('unlimited')}
          style={[styles.quota, quotaReached && { backgroundColor: colors.coralSoft }]}
        >
          <AppText variant="label">
            {premium ? `⭐ ${t('create.quotaPremium')}` : quotaReached ? `${t('create.quotaReached')} · ⭐ Premium →` : `🎟️ ${t('create.quota', { n: weekCount + 1 })}`}
          </AppText>
        </Pressable>

        <Section title={t('create.what')}>
          <View style={styles.wrap}>
            {UNIVERSES.map((x) => (
              <Chip
                key={x.id}
                label={`${x.emoji} ${t(`universes.${x.id}`)}`}
                selected={universe === x.id}
                color={universeColors[x.id].bg}
                soft={universeColors[x.id].soft}
                onPress={() => {
                  if (locked) return;
                  setUniverse(x.id);
                  if (x.id !== 'sport') setLevel(null);
                  if (place?.partnerId) placeStore.set(null); // le partenaire dépend de l'univers
                  setOfferId(null);
                }}
              />
            ))}
          </View>
          {universe === 'sport' ? (
            <>
              <AppText variant="label" color={colors.sub} style={{ marginTop: 6 }}>{t('create.whichSport')}</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {SPORTS.map((s) => (
                  <Chip key={s} label={t(`sports.${s}`)} selected={sport === s} onPress={() => setSport(s)} />
                ))}
              </ScrollView>
            </>
          ) : null}
        </Section>

        <Section title={t('create.name')}>
          <TextField label={t('create.name')} placeholder={suggestedTitle || t('create.namePlaceholder')} value={title} onChangeText={setTitle} maxLength={60} />
        </Section>

        <Section title={t('create.when')}>
          <DateTimePicker value={start} onChange={setStart} locked={locked} accent={u.bg} soft={u.soft} />
        </Section>

        <Section title={t('create.where')}>
          {locked ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Retirer le créneau partenaire pour choisir librement"
              onPress={() => {
                setOfferId(null);
                router.setParams({ offerId: undefined });
              }}
              style={styles.lockedChip}
            >
              <AppText variant="small">{t('createLock.partnerSlot')}</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={locked}
            onPress={() => router.push({ pathname: '/lieu', params: { universe } })}
            style={[styles.place, place && { borderColor: colors.ink }]}
          >
            <AppText style={{ fontSize: 22 }}>📍</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{place?.name ?? t('create.wherePick')}</AppText>
              {place?.discountPct ? (
                <AppText variant="small" color={colors.success}>Partenaire WyytU · −{place.discountPct} % pour le groupe</AppText>
              ) : null}
            </View>
            <AppText variant="heading" color={colors.sub}>›</AppText>
          </Pressable>
        </Section>

        <Section title={t('create.people')} hint={t('create.peopleHint')}>
          <Stepper value={capacity} min={2} max={20} onChange={setCapacity} label={t('create.people')} />
        </Section>

        {universe === 'sport' ? (
          <Section title={t('create.level')}>
            <View style={styles.wrap}>
              <Chip label={t('create.levelAny')} selected={!level} onPress={() => setLevel(null)} />
              {LEVELS.map((l) => (
                <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
              ))}
            </View>
          </Section>
        ) : null}

        {universe === 'resto' ? (
          <Section title={t('create.budget')}>
            <View style={styles.wrap}>
              {BUDGETS.map((b) => (
                <Chip key={b} label={b} selected={budget === b} onPress={() => setBudget(budget === b ? null : b)} />
              ))}
            </View>
          </Section>
        ) : null}

        <View style={[styles.switchRow, !isWoman && { opacity: 0.5 }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">♀ {t('create.womenOnly')}</AppText>
            {!isWoman ? <AppText variant="small" color={colors.sub}>{t('create.womenOnlyHint')}</AppText> : null}
          </View>
          <Switch
            value={isWoman && womenOnly}
            onValueChange={setWomenOnly}
            disabled={!isWoman}
            trackColor={{ true: colors.coral, false: colors.line }}
            accessibilityLabel={t('create.womenOnly')}
          />
        </View>

        <Section title={t('create.description')}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('create.descriptionPlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={styles.textarea}
            accessibilityLabel={t('create.description')}
          />
        </Section>

        {error ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">{error}</AppText>
        ) : null}

        <Button label={`🚀 ${t('create.publish')}`} onPress={publish} loading={loading} disabled={quotaReached} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 150, gap: 18 },
  lockedChip: { backgroundColor: colors.limeSoft, borderRadius: radius.md, padding: 10 },
  quota: { alignSelf: 'flex-start', backgroundColor: colors.limeSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  section: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, alignSelf: 'flex-start', backgroundColor: colors.card, borderRadius: radius.pill, padding: 6 },
  stepBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBox: { flex: 1, minHeight: 64, borderRadius: radius.lg, justifyContent: 'center' },
  time: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  place: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16,
    borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  textarea: {
    minHeight: 96, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
});
