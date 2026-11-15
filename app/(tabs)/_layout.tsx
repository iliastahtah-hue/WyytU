import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/src/components/TabBar';
import { isFullyOnboarded } from '@/src/features/onboarding/nextRoute';
import { useAppState } from '@/src/features/onboarding/useAppState';
import { colors } from '@/src/theme/tokens';

export default function TabsLayout() {
  const { ready, state } = useAppState();
  if (ready && !isFullyOnboarded(state)) return <Redirect href="/" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="explorer" />
      <Tabs.Screen name="sorties" />
      <Tabs.Screen name="creer" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
