import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppText, Button } from '@/src/components/ui';
import { useAuth } from '@/src/providers/AuthProvider';
import { nextRoute } from '@/src/features/onboarding/nextRoute';
import { useAppState } from '@/src/features/onboarding/useAppState';
import { colors } from '@/src/theme/tokens';

/** Point d'entrée : envoie vers la bonne étape. */
export default function Index() {
  const { ready, state } = useAppState();
  const { profileError, refreshProfile } = useAuth();
  if (profileError && state.session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.bg }}>
        <AppText variant="heading" center>Connexion impossible</AppText>
        <AppText color={colors.sub} center>Vérifie ta connexion internet puis réessaie.</AppText>
        <Button label="Réessayer" onPress={refreshProfile} style={{ alignSelf: 'stretch' }} />
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
