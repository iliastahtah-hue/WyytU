import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius } from '@/src/theme/tokens';

/** Carte « Passe en Premium », masquée si l'utilisateur l'est déjà */
export function PremiumBanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const { profile } = useAuth();
  if (profile?.is_premium) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/premium')} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}>
      <LinearGradient colors={['#1C1420', '#3A2018', '#7A3415']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, compact && { paddingVertical: 14 }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="tag" color={colors.lime}>WYYTU PREMIUM</AppText>
          <AppText variant="heading" color={colors.white} style={{ fontSize: compact ? 18 : 21 }}>{t('premium.bannerTitle')}</AppText>
          {compact ? null : <AppText variant="small" color="rgba(255,255,255,0.75)">{t('premium.bannerBody')}</AppText>}
          <View style={styles.cta}><AppText variant="label" color={colors.ink}>{t('premium.tryFree')} →</AppText></View>
        </View>
        <Image source={img3d.crown} style={{ width: compact ? 64 : 84, height: compact ? 64 : 84, transform: [{ rotate: '-10deg' }] }} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  cta: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 },
});
