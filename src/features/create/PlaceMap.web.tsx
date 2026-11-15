import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import type { Partner } from '@/src/lib/database.types';
import { colors } from '@/src/theme/tokens';

export const TANGER = { latitude: 35.7595, longitude: -5.834, latitudeDelta: 0.08, longitudeDelta: 0.08 };

type Props = { partners: Partner[]; selectedId: string | null; onSelect: (p: Partner) => void };

/** Sur le web (aperçu), pas de carte native : simple encart. */
export function PlaceMap(_props: Props) {
  const { t } = useI18n();
  return (
    <View style={[StyleSheet.absoluteFill, styles.box]}>
      <AppText variant="label" color={colors.sub} center>🗺️ {t('place.mapUnavailable')}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ box: { backgroundColor: '#E8EFE3', alignItems: 'center', justifyContent: 'center' } });
