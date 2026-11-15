import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Chip, Screen, TopBar } from '@/src/components/ui';
import { placeStore } from '@/src/features/create/draft';
import { localeOf } from '@/src/features/groups/time';
import { fetchOpenOffers, type OfferWithPartner } from '@/src/features/partners/api';
import { useI18n } from '@/src/i18n';
import type { Universe } from '@/src/lib/database.types';
import { fmtDateTime } from '@/src/lib/tz';
import { colors, radius, UNIVERSES, universeColors } from '@/src/theme/tokens';

export default function PlansScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [offers, setOffers] = useState<OfferWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = localeOf(lang);

  const load = useCallback(() => {
    fetchOpenOffers(universe)
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [universe]);
  useEffect(load, [load]);

  const startFromOffer = (o: OfferWithPartner) => {
    placeStore.set({ name: o.partner.name, partnerId: o.partner.id, discountPct: o.partner.discount_pct, lat: o.partner.lat, lng: o.partner.lng });
    router.push({
      pathname: '/creer',
      params: { offerId: o.id, startsAt: o.starts_at, universe: o.partner.universe, subcategory: o.subcategory ?? '', capacity: String(o.capacity), title: o.title },
    });
  };

  return (
    <Screen>
      <TopBar title="🔥 Plans" />
      <AppText color={colors.sub} style={{ marginBottom: 12 }}>
        Créneaux et séances proposés par nos partenaires, avec une réduction pour les groupes WyytU. Choisis-en un et crée ton groupe autour.
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }} style={{ flexGrow: 0 }}>
        <Chip label={t('universes.all')} selected={!universe} onPress={() => setUniverse(null)} />
        {UNIVERSES.map((u) => (
          <Chip key={u.id} label={`${u.emoji} ${t(`universes.${u.id}`)}`} selected={universe === u.id} color={universeColors[u.id].bg} soft={universeColors[u.id].soft} onPress={() => setUniverse(u.id)} />
        ))}
      </ScrollView>
      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.coral} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <AppText color={colors.sub} center>Pas encore de plan ici. Les premiers partenaires arrivent bientôt !</AppText>
            </View>
          )
        }
        renderItem={({ item }) => {
          const u = universeColors[item.partner.universe];
          return (
            <Pressable accessibilityRole="button" onPress={() => startFromOffer(item)} style={styles.card}>
              <View style={[styles.logo, { backgroundColor: u.bg }]}><AppText variant="heading">{item.partner.name.charAt(0)}</AppText></View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <AppText variant="tag" color={colors.sub} style={{ flex: 1 }} numberOfLines={1}>{item.partner.name.toUpperCase()}</AppText>
                  {item.boosted ? <AppText variant="tag" color={colors.coralDark}>🚀 EN AVANT</AppText> : null}
                </View>
                <AppText variant="bodyStrong" numberOfLines={1}>{item.title}</AppText>
                <AppText variant="small" color={colors.sub}>
                  {fmtDateTime(item.starts_at, locale, { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{item.duration_min} min · {item.capacity} pers.
                  {item.price_mad != null ? ` · ${item.price_mad} DH` : ''}
                </AppText>
              </View>
              {item.partner.discount_pct ? (
                <View style={styles.promo}><AppText variant="tag">−{item.partner.discount_pct} %</AppText></View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  logo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  promo: { backgroundColor: colors.lime, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  empty: { padding: 28, backgroundColor: colors.card, borderRadius: radius.xl },
});
