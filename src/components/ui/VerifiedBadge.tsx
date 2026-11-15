import { StyleSheet, View } from 'react-native';
import { useI18n } from '@/src/i18n';
import { colors } from '@/src/theme/tokens';
import { AppText } from './AppText';

/** Rosette bleue « Vérifié » à côté du prénom */
export function VerifiedBadge({ withLabel, size = 16 }: { withLabel?: boolean; size?: number }) {
  const { t } = useI18n();
  return (
    <View style={styles.row} accessibilityLabel={t('common.verified')}>
      <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]}>
        <AppText style={{ color: colors.white, fontSize: size * 0.62, lineHeight: size * 0.8 }} center>
          ✓
        </AppText>
      </View>
      {withLabel ? (
        <AppText variant="small" color={colors.verified} style={{ fontWeight: '600' }}>
          {t('common.verified')}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { backgroundColor: colors.verified, alignItems: 'center', justifyContent: 'center' },
});
