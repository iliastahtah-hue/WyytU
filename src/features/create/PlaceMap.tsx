import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { colors, radius } from '@/src/theme/tokens';

export const TANGER = { latitude: 35.7595, longitude: -5.834, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export type MapItem = { key: string; name: string; lat: number; lng: number; emoji: string; discount?: number | null };
type Props = { items: MapItem[]; selectedKey: string | null; onSelect: (key: string) => void };

/** Carte des lieux : partenaires (étiquette promo) et lieux de la ville (émoji). */
export function PlaceMap({ items, selectedKey, onSelect }: Props) {
  const sel = items.find((i) => i.key === selectedKey);
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={TANGER}
      region={sel ? { latitude: sel.lat, longitude: sel.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 } : undefined}
      showsUserLocation
      showsPointsOfInterests={false}
    >
      {items.map((p) => {
        const on = p.key === selectedKey;
        return (
          <Marker key={p.key} coordinate={{ latitude: p.lat, longitude: p.lng }} onPress={() => onSelect(p.key)} tracksViewChanges={false}>
            <View style={styles.pinWrap}>
              {p.discount ? (
                <View style={styles.promo}><AppText variant="tag">−{p.discount} %</AppText></View>
              ) : null}
              <View style={[styles.pin, p.discount ? styles.pinPartner : null, on && styles.pinOn]}>
                <AppText style={{ fontSize: 16 }}>{p.emoji}</AppText>
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
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  pinPartner: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: colors.coral },
  pinOn: { backgroundColor: colors.coral, borderColor: colors.ink, transform: [{ scale: 1.2 }] },
});
