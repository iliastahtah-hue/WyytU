import { router, Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}>

      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.itemWrapper}>
              <View style={[styles.bulle, focused && styles.bulleActive]}>
                <Text style={{ fontSize: 20 }}>🏠</Text>
              </View>
              <Text style={[styles.label, { color: focused ? '#fff' : 'rgba(255,255,255,0.35)' }]}>Explorer</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="groupe"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.itemWrapper}>
              <View style={[styles.bulle, focused && styles.bulleActive]}>
                <Text style={{ fontSize: 20 }}>🗺️</Text>
              </View>
              <Text style={[styles.label, { color: focused ? '#fff' : 'rgba(255,255,255,0.35)' }]}>Carte</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="creer"
        options={{
          title: '',
          tabBarIcon: () => (
            <TouchableOpacity
              style={styles.plusWrapper}
              onPress={() => router.push('/creer-activite' as any)}>
              <View style={styles.plusBtn}>
                <Text style={styles.plusIcon}>+</Text>
              </View>
            </TouchableOpacity>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.itemWrapper}>
              <View style={[styles.bulle, focused && styles.bulleActive]}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <Text style={[styles.label, { color: focused ? '#fff' : 'rgba(255,255,255,0.35)' }]}>Chat</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.itemWrapper}>
              <View style={[styles.bulle, focused && styles.bulleActive]}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <Text style={[styles.label, { color: focused ? '#fff' : 'rgba(255,255,255,0.35)' }]}>Profil</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      {/* PAGES CACHÉES */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="connexion" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 0,
    height: 88,
    paddingBottom: 12,
    paddingTop: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  tabItem: { paddingTop: 4 },
  itemWrapper: { alignItems: 'center', gap: 4 },
  bulle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#FAF7F2', alignItems: 'center',
    justifyContent: 'center', borderWidth: 1.5, borderColor: '#EEE8DE',
  },
  bulleActive: {
    backgroundColor: '#E8000D', borderColor: '#FF4444',
    shadowColor: '#E8000D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  plusWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  plusBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E8000D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12,
    borderWidth: 3, borderColor: '#FF6666',
  },
  plusIcon: { fontSize: 34, color: '#fff', fontWeight: '200', lineHeight: 38 },
});