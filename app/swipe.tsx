import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Countdown } from '@/src/components/Countdown';
import { Cover } from '@/src/components/Cover';
import { AppText, Avatar, Button, Screen, TopBar, VerifiedBadge } from '@/src/components/ui';
import { fetchUpcomingGroups, requestJoin, type GroupCardData } from '@/src/features/groups/api';
import { localeOf } from '@/src/features/groups/time';
import { fmtDate, fmtTime } from '@/src/lib/tz';
import { useI18n } from '@/src/i18n';
import { usePremiumGate } from '@/src/lib/premium';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius, TOUCH } from '@/src/theme/tokens';

function SwipeCard({ group, onDone, onSave, premium }: { group: GroupCardData; onDone: (liked: boolean) => void; onSave: () => void; premium: boolean }) {
  const { width } = useWindowDimensions();
  const { t, lang } = useI18n();
  const x = useSharedValue(0);
  const threshold = width * 0.28;

  const fling = (liked: boolean) => {
    if (Math.abs(x.value) > 1) return; // déjà en mouvement
    x.value = withTiming(liked ? width * 1.4 : -width * 1.4, { duration: 220 }, () => runOnJS(onDone)(liked));
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd(() => {
      if (Math.abs(x.value) > threshold) {
        const liked = x.value > 0;
        x.value = withTiming(liked ? width * 1.4 : -width * 1.4, { duration: 200 }, () => runOnJS(onDone)(liked));
      } else {
        x.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${interpolate(x.value, [-width, width], [-14, 14])}deg` }],
  }));
  const yes = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, threshold], [0, 1]) }));
  const no = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-threshold, 0], [1, 0]) }));

  return (
    <>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Cover universe={group.universe} subcategory={group.subcategory} height={250} iconSize={150}>
            <View style={styles.tagPill}>
              <AppText variant="tag">
                {`${t(`universes.${group.universe}`)}${group.subcategory ? ` · ${t(`sports.${group.subcategory}`)}` : ''}`.toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }} />
            <AppText variant="display" style={{ maxWidth: '82%' }}>{group.title}</AppText>
            <Countdown startsAt={group.starts_at} style={{ marginTop: 8 }} />
          </Cover>
          <View style={{ padding: 18, gap: 12, flex: 1 }}>
            <AppText variant="bodyStrong">🗓️ {fmtDate(group.starts_at, localeOf(lang), { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtTime(group.starts_at, localeOf(lang))}</AppText>
            <AppText variant="bodyStrong">📍 {group.place_name}</AppText>
            {group.level ? <AppText variant="bodyStrong">🎯 {t('explore.level', { level: group.level })}</AppText> : null}
            {group.budget ? <AppText variant="bodyStrong">💰 {group.budget}</AppText> : null}
            <AppText variant="bodyStrong">👥 {group.members.length}/{group.capacity}</AppText>
            <View style={{ flexDirection: 'row' }}>
              {group.members.slice(0, 6).map((m, i) => (
                <View key={m.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar name={m.first_name} uri={m.photo} seed={m.id} size={40} ring /></View>
              ))}
            </View>
            {group.description ? <AppText color={colors.sub} numberOfLines={3}>{group.description}</AppText> : null}
            <View style={{ flex: 1 }} />
            {group.organizer ? (
              <View style={styles.org}>
                <Avatar name={group.organizer.first_name} uri={group.organizer.photo} seed={group.organizer.id} size={40} />
                <AppText variant="bodyStrong">{group.organizer.first_name}</AppText>
                {group.organizer.verification_status === 'verified' ? <VerifiedBadge size={15} /> : null}
                <AppText variant="small" color={colors.sub}>
                  {group.organizer.rating_count ? `${Number(group.organizer.rating_avg).toFixed(1)} ★` : ''}
                </AppText>
              </View>
            ) : null}
          </View>
          <Animated.View style={[styles.stamp, styles.stampYes, yes]}><AppText variant="heading" color={colors.success}>{t('swipe.yes')}</AppText></Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNo, no]}><AppText variant="heading" color={colors.danger}>{t('swipe.no')}</AppText></Animated.View>
        </Animated.View>
      </GestureDetector>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.skip')} onPress={() => fling(false)} style={[styles.round, { borderColor: colors.danger }]}>
          <AppText variant="title" color={colors.danger}>✕</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('swipe.save')} onPress={onSave} style={[styles.round, styles.saveBtn]}>
          <Image source={img3d.star} style={{ width: 34, height: 34 }} />
          {premium ? null : (
            <View style={styles.lock}><AppText style={{ fontSize: 11 }}>🔒</AppText></View>
          )}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('group.join')} onPress={() => fling(true)} style={[styles.round, { backgroundColor: colors.coral, borderColor: colors.coral }]}>
          <AppText variant="title" color={colors.white}>✓</AppText>
        </Pressable>
      </View>
      <AppText variant="small" color={colors.sub} center style={{ marginTop: -8, marginBottom: 6 }}>⭐ {t('swipe.save')}{premium ? '' : ' · Premium'}</AppText>
    </>
  );
}

export default function SwipeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const gate = usePremiumGate();
  const [deck, setDeck] = useState<GroupCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const deckRef = useRef<GroupCardData[]>([]);
  deckRef.current = deck;
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!session) return;
    fetchUpcomingGroups(session.user.id)
      .then((list) => setDeck(list.filter((g) => g.status === 'open' && !g.myStatus && g.organizer_id !== session.user.id)))
      .finally(() => setLoading(false));
  }, [session]);

  const onDone = async (liked: boolean) => {
    const current = deckRef.current[0];
    // une carte n'est traitée qu'une fois (double appui pendant l'animation)
    if (!current || handled.current.has(current.id)) return;
    handled.current.add(current.id);
    setDeck((d) => d.filter((g) => g.id !== current.id));
    if (!liked) return;
    try {
      await requestJoin(current.id);
      setToast(t('swipe.sent', { name: current.organizer?.first_name ?? t('swipe.organizer') }));
    } catch (e) {
      setToast(readableError(e, t('common.error')));
    }
    setTimeout(() => setToast(null), 2200);
  };

  const onSave = async () => {
    const current = deckRef.current[0];
    if (!current || !session || !gate('save')) return;
    handled.current.add(current.id);
    setDeck((d) => d.filter((g) => g.id !== current.id));
    const { error } = await supabase.from('saved_groups').insert({ user_id: session.user.id, group_id: current.id });
    setToast(error ? readableError(error, t('common.error')) : t('swipe.saved'));
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <Screen>
      <TopBar title={t('swipe.title')} />
      <View style={{ flex: 1 }}>
        {deck[0] ? (
          <SwipeCard key={deck[0].id} group={deck[0]} onDone={onDone} onSave={onSave} premium={!!profile?.is_premium} />
        ) : loading ? null : (
          <View style={styles.empty}>
            <Image source={img3d.die} style={{ width: 96, height: 96 }} />
            <AppText variant="heading" center>{t('swipe.doneTitle')}</AppText>
            <AppText color={colors.sub} center>{t('swipe.doneBody')}</AppText>
            <Button label={t('explore.createOne')} onPress={() => router.replace('/creer')} style={{ alignSelf: 'stretch' }} />
          </View>
        )}
      </View>
      {toast ? (
        <View style={styles.toast} accessibilityLiveRegion="polite"><AppText variant="label" color={colors.white} center>{toast}</AppText></View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden', marginTop: 4, borderWidth: 1, borderColor: colors.line },
  tagPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  saveBtn: { width: 56, height: 56, borderRadius: 28, borderColor: '#F5B800', alignSelf: 'center' },
  lock: { position: 'absolute', right: -4, top: -4, backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 3 },
  org: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stamp: { position: 'absolute', top: 28, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
  stampYes: { left: 20, borderColor: colors.success, transform: [{ rotate: '-12deg' }] },
  stampNo: { right: 20, borderColor: colors.danger, transform: [{ rotate: '12deg' }] },
  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 26, paddingVertical: 16 },
  round: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, minWidth: TOUCH },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  toast: { position: 'absolute', bottom: 110, left: 20, right: 20, backgroundColor: colors.ink, borderRadius: radius.pill, padding: 14 },
});
