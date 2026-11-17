import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import type { Partner } from '@/src/lib/database.types';
import { colors, radius } from '@/src/theme/tokens';
import { Candidature } from './Candidature';

/**
 * Cadre commun des écrans du mode Partenaire : en-tête (établissement + retour au mode client),
 * candidature si l'utilisateur n'a pas encore d'établissement, attente si elle est en cours.
 */
export function ProShell({ partner, title, onApplied, children }: { partner: Partner | null | undefined; title: string; onApplied: () => void; children: (p: Partner) => ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <AppText variant="tag" color={colors.coralDark}>{t('pro.mode').toUpperCase()}</AppText>
            <AppText variant="display" style={{ fontSize: 30, lineHeight: 34 }}>{title}</AppText>
            {partner ? <AppText variant="small" color={colors.sub} numberOfLines={1}>{partner.name}</AppText> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('pro.backClient')} onPress={() => router.replace('/explorer')} style={styles.back}>
            <Ionicons name="swap-horizontal" size={18} color={colors.ink} />
            <AppText variant="label">Client</AppText>
          </Pressable>
        </View>
        {partner === undefined ? (
          <ActivityIndicator color={colors.coral} style={{ marginTop: 40 }} />
        ) : !partner ? (
          <View style={styles.card}><Candidature onDone={onApplied} /></View>
        ) : partner.status !== 'approved' ? (
          <View style={styles.card}>
            <Ionicons name="hourglass-outline" size={28} color={colors.coral} />
            <AppText variant="heading">{t('pro.pendingTitle')}</AppText>
            <AppText color={colors.sub}>{partner.status === 'pending' ? t('partner.pending') : t('partner.suspended')}</AppText>
          </View>
        ) : (
          children(partner)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export const proStyles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 12 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 4 },
  kpiValue: { fontSize: 28, lineHeight: 32 },
  section: { marginTop: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 10 },
});
