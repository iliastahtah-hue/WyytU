import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = [
    { label: 'Explorer', emoji: '🗺️', route: '/explore' },
    { label: 'Chat', emoji: '💬', route: '/chat' },
    { label: '', emoji: '+', route: '/creer-activite', isPlus: true },
    { label: 'Profil', emoji: '👤', route: '/profil' },
    { label: 'SOS', emoji: '🛡️', route: '/sos' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const focused = pathname.includes(tab.route.replace('/', ''));
        if (tab.isPlus) {
          return (
            <TouchableOpacity key={tab.route} style={styles.plusWrapper} onPress={() => router.push('/creer-activite' as any)}>
              <View style={styles.plusBtn}><Text style={styles.plusIcon}>+</Text></View>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={tab.route} style={styles.tabItem} onPress={() => router.push(tab.route as any)}>
            <View style={[styles.bulle, focused && styles.bulleActive]}>
              <Text style={{ fontSize: 20 }}>{tab.emoji}</Text>
            </View>
            <Text style={[styles.label, { color: focused ? '#fff' : 'rgba(255,255,255,0.35)' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 88, paddingBottom: 12, paddingTop: 6, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 20 },
  tabItem: { alignItems: 'center', gap: 4 },
  bulle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#EEE8DE' },
  bulleActive: { backgroundColor: '#E8000D', borderColor: '#FF4444', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  plusWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  plusBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, borderWidth: 3, borderColor: '#FF6666' },
  plusIcon: { fontSize: 34, color: '#fff', fontWeight: '200', lineHeight: 38 },
});
