import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const C = {
  purple: COLORS.purple,
  purpleDark: COLORS.purpleDark,
  white: COLORS.white,
  inactive: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.12)',
};

const TAB_ICONS = {
  explore: { active: '🏠', inactive: '🏠', label: 'Explorer' },
  carte: { active: '🗺️', inactive: '🗺️', label: 'Carte' },
  chat: { active: '💬', inactive: '💬', label: 'Chat' },
  profil: { active: '👤', inactive: '👤', label: 'Profil' },
};

function TabIcon({ name, focused }: { name: keyof typeof TAB_ICONS; focused: boolean }) {
  const tab = TAB_ICONS[name];
  return (
    <View style={s.itemWrapper}>
      {focused ? (
        <LinearGradient
          colors={[C.purple, C.purpleDark]}
          style={s.iconBubbleActive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Text style={s.iconEmoji}>{tab.active}</Text>
        </LinearGradient>
      ) : (
        <View style={s.iconBubble}>
          <Text style={s.iconEmoji}>{tab.inactive}</Text>
        </View>
      )}
      <Text
        style={[s.label, { color: focused ? C.purple : C.inactive }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {tab.label}
      </Text>
    </View>
  );
}

function FloatingPlusButton() {
  return (
    <TouchableOpacity
      style={s.plusWrapper}
      onPress={() => router.push('/creer-activite' as any)}
      activeOpacity={0.85}>
      <View style={s.plusGlow} />
      <LinearGradient
        colors={[C.purple, C.purpleDark]}
        style={s.plusBtn}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={s.plusIcon}>+</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: s.tabBar,
          tabBarItemStyle: s.tabItem,
          tabBarBackground: () => (
            <BlurView
              intensity={Platform.OS === 'ios' ? 55 : 90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ),
        }}>
        <Tabs.Screen
          name="explore"
          options={{ title: '', tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />, tabBarLabel: () => null }}
        />

        <Tabs.Screen
          name="carte"
          options={{ title: '', tabBarIcon: ({ focused }) => <TabIcon name="carte" focused={focused} />, tabBarLabel: () => null }}
        />

        {/* ONGLET VIDE — le vrai bouton + flotte par-dessus, voir plus bas */}
        <Tabs.Screen
          name="creer"
          options={{
            title: '',
            tabBarButton: () => <View style={{ flex: 1 }} />,
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{ title: '', tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />, tabBarLabel: () => null }}
        />

        <Tabs.Screen
          name="profil"
          options={{ title: '', tabBarIcon: ({ focused }) => <TabIcon name="profil" focused={focused} />, tabBarLabel: () => null }}
        />

        {/* CACHÉES */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="groupe" options={{ href: null }} />
      </Tabs>

      {/* BOUTON + FLOTTANT, indépendant de la barre */}
      <FloatingPlusButton />
    </View>
  );
}

const s = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 8 : 8,
    height: 90,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: Platform.OS === 'android' ? 'rgba(102,126,234,0.75)' : 'transparent',
    overflow: 'hidden',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  tabItem: {
    paddingTop: 0,
    height: 90,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  itemWrapper: { alignItems: 'center', gap: 4, width: '100%', marginTop: 25 },
  iconBubble: {
    width: 53,
    height: 53,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBubbleActive: {
    width: 53,
    height: 53,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  iconEmoji: { fontSize: 23 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2, width: '100%', textAlign: 'center' },
  plusWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -29,
    bottom: Platform.OS === 'ios' ? 24 : 24,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  plusGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.purple,
    opacity: 0.18,
    transform: [{ scale: 1.35 }],
  },
  plusIcon: { fontSize: 32, color: '#fff', fontWeight: '300', lineHeight: 36 },
});