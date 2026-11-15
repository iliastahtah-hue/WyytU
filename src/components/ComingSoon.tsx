import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius } from '@/src/theme/tokens';

/** Écran temporaire pour les onglets des prochains blocs. */
export function ComingSoon({ title, icon }: { title: string; icon: ImageSourcePropType }) {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <AppText variant="display" style={{ paddingHorizontal: 20, marginTop: 12 }}>{title}</AppText>
      <View style={styles.card}>
        <Image source={icon} style={{ width: 96, height: 96 }} />
        <AppText variant="heading" center>{t('soon.title')}</AppText>
        <AppText color={colors.sub} center>{t('soon.body')}</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  card: { margin: 20, padding: 28, gap: 12, alignItems: 'center', borderRadius: radius.xl, backgroundColor: colors.card },
});
