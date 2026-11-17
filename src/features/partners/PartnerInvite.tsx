import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius } from '@/src/theme/tokens';

/** Petite carte « Tu as un club, un resto ? » qui mène au mode Partenaire. */
export function PartnerInvite() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/aujourdhui')} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.icon}><Ionicons name="storefront" size={22} color={colors.ink} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{t('pro.inviteTitle')}</AppText>
        <AppText variant="small" color={colors.sub}>{t('pro.inviteBody')}</AppText>
        <AppText variant="label" color={colors.coralDark} style={{ marginTop: 4 }}>{t('pro.inviteCta')} →</AppText>
      </View>
    </Pressable>
  );
}

/** Interrupteur vers le mode Partenaire, pour un établissement déjà inscrit. */
export function PartnerSwitch({ name }: { name: string }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.replace('/aujourdhui')} style={({ pressed }) => [styles.switch, pressed && { opacity: 0.9 }]}>
      <View style={[styles.icon, { backgroundColor: colors.lime }]}><Ionicons name="swap-horizontal" size={22} color={colors.ink} /></View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={colors.white}>{t('pro.switchTo')}</AppText>
        <AppText variant="small" color="rgba(255,255,255,0.7)" numberOfLines={1}>{name} · {t('pro.switchHint')}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink, borderRadius: radius.lg, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
});
