import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import type { Partner } from '@/src/lib/database.types';
import { colors, radius } from '@/src/theme/tokens';

export const TANGER = { latitude: 35.7595, longitude: -5.834, latitudeDelta: 0.08, longitudeDelta: 0.08 };

type Props = { partners: Partner[]; selectedId: string | null; onSelect: (p: Partner) => void };

/** Carte des lieux partenaires : pastille logo + étiquette promo. */
export function PlaceMap({ partners, selectedId, onSelect }: Props) {
  return (
    <MapView style={StyleSheet.absoluteFill} initialRegion={TANGER} showsUserLocation showsPointsOfInterest={false}>
      {partners
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => {
          const on = p.id === selectedId;
          return (
            <Marker key={p.id} coordinate={{ latitude: p.lat as number, longitude: p.lng as number }} onPress={() => onSelect(p)}>
              <View style={styles.pinWrap}>
                {p.discount_pct ? (
                  <View style={styles.promo}>
                    <AppText variant="tag">−{p.discount_pct} %</AppText>
                  </View>
                ) : null}
                <View style={[styles.pin, on && styles.pinOn]}>
                  <AppText variant="label" color={on ? colors.white : colors.ink}>
                    {p.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
              </View>
            </Marker>
          );
        })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pinWrap: { alignItems: 'center' },
  promo: { backgroundColor: colors.lime, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3 },
  pin: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  pinOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
