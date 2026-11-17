import { Tabs } from 'expo-router';
import { ProTabBar } from '@/src/features/partners/ProTabBar';

export default function ProLayout() {
  return (
    <Tabs tabBar={(props) => <ProTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="aujourdhui" />
      <Tabs.Screen name="creneaux" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="fiche" />
    </Tabs>
  );
}
