import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { nextRoute } from '@/src/features/onboarding/nextRoute';
import { useAppState } from '@/src/features/onboarding/useAppState';
import { colors } from '@/src/theme/tokens';

/** Point d'entrée : envoie vers la bonne étape. */
export default function Index() {
  const { ready, state } = useAppState();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }
  return <Redirect href={nextRoute(state)} />;
}
