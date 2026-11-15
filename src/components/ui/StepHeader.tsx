import { StyleSheet, View } from 'react-native';
import { useI18n } from '@/src/i18n';
import { colors } from '@/src/theme/tokens';
import { AppText } from './AppText';

/** Barre de progression de l'inscription (étape n sur total) */
export function StepHeader({ step, total }: { step: number; total: number }) {
  const { t } = useI18n();
  return (
    <View style={styles.wrap} accessibilityLabel={t('common.stepOf', { n: step, total })}>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.coral : colors.line }]} />
        ))}
      </View>
      <AppText variant="tag" color={colors.sub}>
        {t('common.stepOf', { n: step, total }).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 8, marginBottom: 20 },
  track: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 5, borderRadius: 3 },
});
