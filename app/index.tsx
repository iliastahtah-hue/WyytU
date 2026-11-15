import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppText, Button } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { useAuth } from '@/src/providers/AuthProvider';
import { nextRoute } from '@/src/features/onboarding/nextRoute';
import { useAppState } from '@/src/features/onboarding/useAppState';
import { colors } from '@/src/theme/tokens';

/** Point d'entrée : envoie vers la bonne étape. */
export default function Index() {
  const { ready, state } = useAppState();
  const { profileError, refreshProfile } = useAuth();
  const { t } = useI18n();
  if (profileError && state.session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.bg }}>
        <AppText variant="heading" center>{t('offline.title')}</AppText>
        <AppText color={colors.sub} center>{t('offline.body')}</AppText>
        <Button label={t('common.retry')} onPress={refreshProfile} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }
  return <Redirect href={nextRoute(state)} />;
}
