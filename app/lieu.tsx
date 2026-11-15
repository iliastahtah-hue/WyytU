import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, TextField, TopBar } from '@/src/components/ui';
import { fetchPartners } from '@/src/features/create/api';
import { placeStore, usePickedPlace } from '@/src/features/create/draft';
import { PlaceMap } from '@/src/features/create/PlaceMap';
import { useI18n } from '@/src/i18n';
import type { Partner, Universe } from '@/src/lib/database.types';
import { colors, radius, universeColors } from '@/src/theme/tokens';

export default function LieuScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { universe } = useLocalSearchParams<{ universe?: Universe }>();
  const current = usePickedPlace();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [custom, setCustom] = useState(current && !current.partnerId ? current.name : '');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchPartners(universe ?? null)
      .then((list) => {
        setPartners(list);
        if (current?.partnerId) setSelected(list.find((p) => p.id === current.partnerId) ?? null);
      })
      .catch(() => setPartners([]));
    // on ne recharge que si l'univers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? partners.filter((p) => `${p.name} ${p.address ?? ''}`.toLowerCase().includes(q)) : partners;
  }, [partners, query]);

  const canConfirm = !!selected || custom.trim().length >= 2;
  const accent = universe ? universeColors[universe].bg : colors.coral;

  const confirm = () => {
    if (selected) {
      placeStore.set({
        name: selected.name,
        partnerId: selected.id,
        discountPct: selected.discount_pct,
        lat: selected.lat,
        lng: selected.lng,
      });
    } else {
      placeStore.set({ name: custom.trim(), partnerId: null, discountPct: null, lat: null, lng: null });
    }
    router.back();
  };

  return (
    <Screen footer={<Button label={t('place.confirm')} onPress={confirm} disabled={!canConfirm} />} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <TopBar title={t('place.title')} />
      </View>

      <View style={styles.map}>
        <PlaceMap
          partners={visible}
          selectedId={selected?.id ?? null}
          onSelect={(p) => {
            setSelected(p);
            setCustom('');
          }}
        />
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12, flex: 1 }}>
        <AppText variant="heading">{t('place.partners')}</AppText>
        {partners.length ? (
          <FlatList
            horizontal
            data={visible}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
            style={{ flexGrow: 0, marginRight: -20 }}
            renderItem={({ item }) => {
              const on = selected?.id === item.id;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    setSelected(on ? null : item);
                    setCustom('');
                  }}
                  style={[styles.partner, on && { borderColor: colors.ink }]}
                >
                  <View style={[styles.logo, { backgroundColor: accent }]}>
                    <AppText variant="heading">{item.name.charAt(0)}</AppText>
                  </View>
                  <AppText variant="label" numberOfLines={1}>{item.name}</AppText>
                  {item.discount_pct ? (
                    <View style={styles.promo}><AppText variant="tag">{t('place.discount', { n: item.discount_pct })}</AppText></View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        ) : (
          <AppText variant="small" color={colors.sub}>{t('place.noPartners')}</AppText>
        )}

        {partners.length > 4 ? (
          <TextField label={t('place.search')} placeholder={t('place.search')} value={query} onChangeText={setQuery} />
        ) : null}

        <TextField
          label={t('place.custom')}
          placeholder={t('place.customPlaceholder')}
          value={custom}
          maxLength={80}
          onChangeText={(v) => {
            setCustom(v);
            if (v) setSelected(null);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { height: 260, marginHorizontal: 20, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 16 },
  partner: {
    width: 140, padding: 12, gap: 8, borderRadius: radius.lg, backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.card,
  },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  promo: { alignSelf: 'flex-start', backgroundColor: colors.lime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
