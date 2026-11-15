import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AppText, Avatar, Button, Screen, TopBar, VerifiedBadge } from '@/src/components/ui';
import { fetchUpcomingGroups, requestJoin, type GroupCardData } from '@/src/features/groups/api';
import { relativeStart } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius, TOUCH, universeColors } from '@/src/theme/tokens';

function SwipeCard({ group, onDone }: { group: GroupCardData; onDone: (liked: boolean) => void }) {
  const { width } = useWindowDimensions();
  const { t, lang } = useI18n();
  const x = useSharedValue(0);
  const threshold = width * 0.28;
  const u = universeColors[group.universe];

  const fling = (liked: boolean) => {
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
          <View style={[styles.band, { backgroundColor: u.bg }]}>
            <AppText variant="tag">
              {`${t(`universes.${group.universe}`)}${group.subcategory ? ` · ${t(`sports.${group.subcategory}`)}` : ''}`.toUpperCase()}
            </AppText>
            <AppText variant="display">{group.title}</AppText>
            <AppText variant="bodyStrong">⏱ {relativeStart(group.starts_at, t, lang)}</AppText>
          </View>
          <View style={{ padding: 18, gap: 12, flex: 1 }}>
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
          <Animated.View style={[styles.stamp, styles.stampYes, yes]}><AppText variant="heading" color={colors.success}>JE VEUX ✓</AppText></Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNo, no]}><AppText variant="heading" color={colors.danger}>PASSER ✕</AppText></Animated.View>
        </Animated.View>
      </GestureDetector>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" accessibilityLabel="Passer" onPress={() => fling(false)} style={[styles.round, { borderColor: colors.danger }]}>
          <AppText variant="title" color={colors.danger}>✕</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('group.join')} onPress={() => fling(true)} style={[styles.round, { backgroundColor: colors.coral, borderColor: colors.coral }]}>
          <AppText variant="title" color={colors.white}>✓</AppText>
        </Pressable>
      </View>
    </>
  );
}

export default function SwipeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuth();
  const [deck, setDeck] = useState<GroupCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchUpcomingGroups(session.user.id)
      .then((list) => setDeck(list.filter((g) => g.status === 'open' && !g.myStatus && g.organizer_id !== session.user.id)))
      .finally(() => setLoading(false));
  }, [session]);

  const onDone = async (liked: boolean) => {
    const [current, ...rest] = deck;
    setDeck(rest);
    if (!liked || !current) return;
    try {
      await requestJoin(current.id);
      setToast(`⏳ Demande envoyée à ${current.organizer?.first_name ?? 'l’organisateur'}`);
    } catch (e) {
      setToast(readableError(e, t('common.error')));
    }
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <Screen>
      <TopBar title="Je sais pas quoi faire" />
      <View style={{ flex: 1 }}>
        {deck[0] ? (
          <SwipeCard key={deck[0].id} group={deck[0]} onDone={onDone} />
        ) : loading ? null : (
          <View style={styles.empty}>
            <Image source={img3d.die} style={{ width: 96, height: 96 }} />
            <AppText variant="heading" center>Tu as tout vu pour l’instant !</AppText>
            <AppText color={colors.sub} center>Reviens plus tard ou lance ta propre sortie.</AppText>
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
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden', marginTop: 4 },
  band: { padding: 20, gap: 8 },
  org: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stamp: { position: 'absolute', top: 28, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
  stampYes: { left: 20, borderColor: colors.success, transform: [{ rotate: '-12deg' }] },
  stampNo: { right: 20, borderColor: colors.danger, transform: [{ rotate: '12deg' }] },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingVertical: 16 },
  round: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, minWidth: TOUCH },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  toast: { position: 'absolute', bottom: 110, left: 20, right: 20, backgroundColor: colors.ink, borderRadius: radius.pill, padding: 14 },
});
