import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip } from '@/src/components/ui';
import { fetchUpcomingGroups, type GroupCardData } from '@/src/features/groups/api';
import { unreadCount } from '@/src/features/outings/api';
import { GroupCard } from '@/src/features/groups/GroupCard';
import { PremiumBanner } from '@/src/components/PremiumBanner';
import { PartnerInvite } from '@/src/features/partners/PartnerInvite';
import { useI18n } from '@/src/i18n';
import type { Universe } from '@/src/lib/database.types';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { coverFor, iconFor, img3d } from '@/src/theme/images';
import { colors, fonts, radius, SPORTS, TOUCH, UNIVERSES, universeColors } from '@/src/theme/tokens';

export default function ExplorerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [sport, setSport] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<GroupCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    unreadCount(session.user.id).then(setUnread).catch(() => undefined);
    try {
      setGroups(await fetchUpcomingGroups(session.user.id, { universe, subcategory: universe === 'sport' ? sport : null }));
    } catch (e) {
      setError(readableError(e, t('common.error')));
    } finally {
      setLoading(false);
    }
  }, [session, universe, sport, t]);

  // Recharge à chaque retour sur l'onglet (ex. après une demande envoyée)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      [g.title, g.place_name, g.subcategory ?? '', t(`universes.${g.universe}`)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [groups, search, t]);

  const header = (
    <View style={{ gap: 16 }}>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="label" color={colors.sub}>{t('explore.hello', { name: profile?.first_name ?? '' })}</AppText>
          <AppText variant="display">{t('explore.title1')}</AppText>
          <View style={styles.highlight}>
            <AppText variant="display">{t('explore.title2')}</AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Notifications${unread ? `, ${unread} non lues` : ''}`}
          onPress={() => router.push('/notifications')}
          style={styles.bell}
        >
          <AppText style={{ fontSize: 20 }}>🔔</AppText>
          {unread ? (
            <View style={styles.dot}><AppText variant="tag" color={colors.white} style={{ fontSize: 10 }}>{unread > 9 ? '9+' : unread}</AppText></View>
          ) : null}
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/swipe')} style={styles.swipe}>
        <Image source={img3d.die} style={{ width: 26, height: 26 }} />
        <AppText variant="label" color={colors.white}>{t('explore.swipe')}</AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={[styles.swipe, { backgroundColor: colors.lime }]}>
        <AppText variant="label">🔥 Plans</AppText>
      </Pressable>
      </View>

      <View style={styles.search}>
        <AppText color={colors.sub}>🔍</AppText>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('explore.search')}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          accessibilityLabel={t('explore.search')}
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !universe }}
          onPress={() => { setUniverse(null); setSport(null); }}
          style={[styles.tile, styles.tileAll, !universe && styles.tileOn]}
        >
          <AppText variant="heading" color={colors.white} style={{ fontSize: 18 }}>{t('universes.all')}</AppText>
        </Pressable>
        {UNIVERSES.map((u) => {
          const on = universe === u.id;
          return (
            <Pressable
              key={u.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(`universes.${u.id}`)}
              onPress={() => { setUniverse(u.id); setSport(null); }}
              style={[styles.tile, on && styles.tileOn]}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: universeColors[u.id].bg }]} />
              <Image source={coverFor(u.id)} style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} contentFit="cover" />
              <Image source={iconFor(u.id)} style={styles.tileIcon} contentFit="contain" />
              <AppText variant="label" color={colors.ink} numberOfLines={2} style={{ fontSize: 13, lineHeight: 16, width: '100%' }}>{t(`universes.${u.id}`)}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {universe === 'sport' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('sports.all')} selected={!sport} onPress={() => setSport(null)} />
          {SPORTS.map((s) => (
            <Chip key={s} label={t(`sports.${s}`)} selected={sport === s} onPress={() => setSport(s)} />
          ))}
        </ScrollView>
      ) : null}

      <AppText variant="heading" style={{ marginTop: 4 }}>{t('explore.upcoming')}</AppText>
      {error ? (
        <View style={styles.error}>
          <AppText variant="small" color={colors.danger} style={{ flex: 1 }}>{error}</AppText>
          <Button small kind="outline" label={t('common.retry')} onPress={load} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <FlatList
        data={visible}
        keyExtractor={(g) => g.id}
        renderItem={({ item, index }) => (
          <>
            <GroupCard group={item} />
            {index === 1 ? <View style={{ marginTop: 14 }}><PremiumBanner compact /></View> : null}
          </>
        )}
        ListHeaderComponent={header}
        ListFooterComponent={visible.length ? <View style={{ marginTop: 14 }}><PartnerInvite /></View> : null}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.coral} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Image source={img3d.party} style={{ width: 88, height: 88 }} />
              <AppText variant="bodyStrong" center>{t('explore.empty')}</AppText>
              <Button label={t('explore.createOne')} onPress={() => router.push('/creer')} style={{ alignSelf: 'stretch' }} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 130, gap: 0 },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  highlight: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: 10, paddingHorizontal: 6, marginLeft: -6 },
  bell: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center',
  },
  swipe: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: TOUCH,
    paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.ink,
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 18,
    borderRadius: radius.pill, backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  chips: { gap: 8, paddingRight: 20 },
  tile: {
    width: 108, height: 132, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end',
    padding: 10, backgroundColor: colors.sand, borderWidth: 3, borderColor: 'transparent',
  },
  tileAll: { backgroundColor: colors.coral, justifyContent: 'center', alignItems: 'center' },
  tileOn: { borderColor: colors.ink },
  tileIcon: { position: 'absolute', width: 64, height: 64, top: 10, right: 6, transform: [{ rotate: '10deg' }] },
  empty: { alignItems: 'center', gap: 14, padding: 24, backgroundColor: colors.card, borderRadius: radius.xl },
  error: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.coralSoft },
});
