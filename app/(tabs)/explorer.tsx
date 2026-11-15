import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip } from '@/src/components/ui';
import { fetchUpcomingGroups, type GroupCardData } from '@/src/features/groups/api';
import { GroupCard } from '@/src/features/groups/GroupCard';
import { useI18n } from '@/src/i18n';
import type { Universe } from '@/src/lib/database.types';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
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

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
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
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/sorties')} style={styles.swipe}>
        <Image source={img3d.die} style={{ width: 26, height: 26 }} />
        <AppText variant="label" color={colors.white}>{t('explore.swipe')}</AppText>
      </Pressable>

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
        <Chip label={t('universes.all')} selected={!universe} onPress={() => { setUniverse(null); setSport(null); }} />
        {UNIVERSES.map((u) => (
          <Chip
            key={u.id}
            label={`${u.emoji} ${t(`universes.${u.id}`)}`}
            selected={universe === u.id}
            color={universeColors[u.id].bg}
            soft={universeColors[u.id].soft}
            onPress={() => { setUniverse(u.id); setSport(null); }}
          />
        ))}
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
        renderItem={({ item }) => <GroupCard group={item} />}
        ListHeaderComponent={header}
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
  empty: { alignItems: 'center', gap: 14, padding: 24, backgroundColor: colors.card, borderRadius: radius.xl },
  error: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.coralSoft },
});
