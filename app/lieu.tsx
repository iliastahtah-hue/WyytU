import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Screen, TextField, TopBar } from '@/src/components/ui';
import { fetchPartners } from '@/src/features/create/api';
import { placeStore, usePickedPlace } from '@/src/features/create/draft';
import { PlaceMap, type MapItem } from '@/src/features/create/PlaceMap';
import { KIND_EMOJI, searchPlaces, type CityPlace } from '@/src/features/create/places';
import { useI18n } from '@/src/i18n';
import type { Partner, Universe } from '@/src/lib/database.types';
import { colors, fonts, radius, TOUCH, UNIVERSES, universeColors } from '@/src/theme/tokens';

type Pick = { type: 'partner'; item: Partner } | { type: 'place'; item: CityPlace };
const keyOf = (p: Pick) => (p.type === 'partner' ? `p:${p.item.id}` : `o:${p.item.id}`);

export default function LieuScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ universe?: Universe }>();
  const current = usePickedPlace();
  const [filter, setFilter] = useState<Universe | null>(params.universe ?? null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [places, setPlaces] = useState<CityPlace[]>([]);
  const [picked, setPicked] = useState<Pick | null>(null);
  const [custom, setCustom] = useState(current && !current.partnerId && current.lat == null ? current.name : '');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchPartners(filter)
      .then((list) => {
        setPartners(list);
        if (current?.partnerId) {
          const p = list.find((x) => x.id === current.partnerId);
          if (p) setPicked({ type: 'partner', item: p });
        }
      })
      .catch(() => setPartners([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // recherche dans tous les lieux de la ville, avec un petit délai pendant la frappe
  useEffect(() => {
    const id = setTimeout(() => {
      searchPlaces(query, filter).then(setPlaces).catch(() => setPlaces([]));
    }, 250);
    return () => clearTimeout(id);
  }, [query, filter]);

  const shownPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? partners.filter((p) => `${p.name} ${p.address ?? ''}`.toLowerCase().includes(q)) : partners;
  }, [partners, query]);

  const mapItems: MapItem[] = useMemo(() => [
    ...shownPartners.filter((p) => p.lat != null && p.lng != null).map((p) => ({
      key: `p:${p.id}`, name: p.name, lat: p.lat as number, lng: p.lng as number, emoji: '⭐', discount: p.discount_pct,
    })),
    ...places.map((p) => ({ key: `o:${p.id}`, name: p.name, lat: p.lat, lng: p.lng, emoji: KIND_EMOJI[p.kind] ?? '📍' })),
  ], [shownPartners, places]);

  const selectKey = (key: string) => {
    const [type, id] = key.split(':');
    if (type === 'p') {
      const item = partners.find((p) => p.id === id);
      if (item) setPicked({ type: 'partner', item });
    } else {
      const item = places.find((p) => String(p.id) === id);
      if (item) setPicked({ type: 'place', item });
    }
    setCustom('');
  };

  const canConfirm = !!picked || custom.trim().length >= 2;
  const accent = filter ? universeColors[filter].bg : colors.coral;

  const confirm = () => {
    if (picked?.type === 'partner') {
      const p = picked.item;
      placeStore.set({ name: p.name, partnerId: p.id, discountPct: p.discount_pct, lat: p.lat, lng: p.lng });
    } else if (picked?.type === 'place') {
      const p = picked.item;
      placeStore.set({ name: p.name, partnerId: null, discountPct: null, lat: p.lat, lng: p.lng });
    } else {
      placeStore.set({ name: custom.trim(), partnerId: null, discountPct: null, lat: null, lng: null });
    }
    router.back();
  };

  const header = (
    <View style={{ gap: 14 }}>
      <View style={styles.search}>
        <AppText style={{ fontSize: 18 }}>🔍</AppText>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('place.searchAll')}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel={t('place.searchAll')}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Pressable onPress={() => setFilter(null)} style={[styles.chip, !filter && styles.chipOn]}>
          <AppText variant="label" color={!filter ? colors.white : colors.ink}>{t('universes.all')}</AppText>
        </Pressable>
        {UNIVERSES.map((u) => {
          const on = filter === u.id;
          return (
            <Pressable key={u.id} onPress={() => setFilter(u.id)} style={[styles.chip, on && { backgroundColor: universeColors[u.id].bg, borderColor: universeColors[u.id].bg }]}>
              <AppText variant="label">{u.emoji} {t(`universes.${u.id}`)}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.map}>
        <PlaceMap items={mapItems} selectedKey={picked ? keyOf(picked) : null} onSelect={selectKey} />
      </View>
      <AppText variant="small" color={colors.muted} style={{ marginTop: -8 }}>{t('place.osm')}</AppText>

      {picked ? (
        <View style={[styles.pickedBox, { borderColor: accent }]}>
          <AppText style={{ fontSize: 26 }}>{picked.type === 'partner' ? '⭐' : KIND_EMOJI[picked.item.kind] ?? '📍'}</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{picked.item.name}</AppText>
            <AppText variant="small" color={colors.sub} numberOfLines={1}>{picked.item.address ?? t('place.selected')}</AppText>
          </View>
          <Pressable onPress={() => setPicked(null)} accessibilityLabel={t('common.cancel')} style={{ padding: 8 }}>
            <AppText variant="heading" color={colors.muted}>×</AppText>
          </Pressable>
        </View>
      ) : null}

      {shownPartners.length ? (
        <>
          <AppText variant="heading">{t('place.partners')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {shownPartners.map((item) => {
              const on = picked?.type === 'partner' && picked.item.id === item.id;
              return (
                <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  onPress={() => { setPicked(on ? null : { type: 'partner', item }); setCustom(''); }}
                  style={[styles.partner, on && { borderColor: colors.ink }]}>
                  <View style={[styles.logo, { backgroundColor: universeColors[item.universe].bg }]}>
                    <AppText variant="heading">{item.name.charAt(0)}</AppText>
                  </View>
                  <AppText variant="label" numberOfLines={1}>{item.name}</AppText>
                  {item.discount_pct ? (
                    <View style={styles.promo}><AppText variant="tag">{t('place.discount', { n: item.discount_pct })}</AppText></View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <AppText variant="heading">{t('place.cityPlaces', { n: places.length })}</AppText>
    </View>
  );

  return (
    <Screen footer={<Button label={t('place.confirm')} onPress={confirm} disabled={!canConfirm} />} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <TopBar title={t('place.title')} />
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => String(p.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<AppText variant="small" color={colors.sub}>{t('place.noResult')}</AppText>}
        renderItem={({ item }) => {
          const on = picked?.type === 'place' && picked.item.id === item.id;
          return (
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }}
              onPress={() => { setPicked(on ? null : { type: 'place', item }); setCustom(''); }}
              style={[styles.row, on && { borderColor: colors.ink, backgroundColor: colors.coralSoft }]}>
              <View style={[styles.rowIcon, { backgroundColor: item.universe ? universeColors[item.universe].soft : colors.sand }]}>
                <AppText style={{ fontSize: 20 }}>{KIND_EMOJI[item.kind] ?? '📍'}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{item.name}</AppText>
                <AppText variant="small" color={colors.sub} numberOfLines={1}>
                  {[item.detail?.replace(/_/g, ' ').replace(/;/g, ', '), item.address].filter(Boolean).join(' · ') || (item.universe ? t(`universes.${item.universe}`) : '')}
                </AppText>
              </View>
              {on ? <AppText variant="heading" color={colors.coralDark}>✓</AppText> : null}
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            <TextField label={t('place.custom')} placeholder={t('place.customPlaceholder')} value={custom} maxLength={80}
              onChangeText={(v) => { setCustom(v); if (v) setPicked(null); }} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 16, minHeight: 52 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, minHeight: TOUCH },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  map: { height: 280, borderRadius: radius.xl, overflow: 'hidden' },
  pickedBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, borderWidth: 2 },
  partner: { width: 140, padding: 12, gap: 8, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.card },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  promo: { alignSelf: 'flex-start', backgroundColor: colors.lime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, borderWidth: 2, borderColor: colors.card },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
