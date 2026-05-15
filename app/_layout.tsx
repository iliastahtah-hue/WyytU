import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 22 }}>{icon}</Text>;
}

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#243660',
          borderTopColor: '#FF6B2B',
          borderTopWidth: 2,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B2B',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: () => <TabIcon icon="🏠" />,
        }}
      />

      <Tabs.Screen
        name="groupe"
        options={{
          title: 'Créer',
          tabBarIcon: () => <TabIcon icon="➕" />,
        }}
      />

      <Tabs.Screen
        name="profils"
        options={{
          title: 'Découvrir',
          tabBarIcon: () => <TabIcon icon="👥" />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: () => <TabIcon icon="💬" />,
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Mon profil',
          tabBarIcon: () => <TabIcon icon="👤" />,
        }}
      />

      <Tabs.Screen
        name="inscription"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}