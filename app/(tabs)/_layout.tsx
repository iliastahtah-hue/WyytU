import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  brown: '#1A1209',
  brownMid: '#2C1F0A',
  beige: '#FAF7F2',
  beigeDeep: '#EEE8DE',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.3)',
};

const TAB_ICONS = {
  explore: { active: '🏠', inactive: '🏠', label: 'Explorer' },
  groupe: { active: '🗺️', inactive: '🗺️', label: 'Carte' },
  chat: { active: '💬', inactive: '💬', label: 'Chat' },
  profil: { active: '👤', inactive: '👤', label: 'Profil' },
};

function TabIcon({ name, focused }: { name: keyof typeof TAB_ICONS; focused: boolean }) {
  const tab = TAB_ICONS[name];
  return (
    <View style={s.itemWrapper}>
      {focused ? (
        <LinearGradient
          colors={[C.goldLight, C.gold]}
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
      <Text style={[s.label, { color: focused ? C.gold : C.inactive }]}>
        {tab.label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabItem,
      }}>

      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="groupe"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <TabIcon name="groupe" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="creer"
        options={{
          title: '',
          tabBarIcon: () => (
            <TouchableOpacity
              style={s.plusWrapper}
              onPress={() => router.push('/creer-activite' as any)}
              activeOpacity={0.85}>
              <LinearGradient
                colors={[C.goldLight, C.gold, C.gold]}
                style={s.plusBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <Text style={s.plusIcon}>+</Text>
              </LinearGradient>
              <View style={s.plusGlow} />
            </TouchableOpacity>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <TabIcon name="profil" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />

      {/* PAGES CACHÉES */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="connexion" options={{ href: null }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: C.brown,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 90 : 72,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: C.brown,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    // Ligne dorée en haut de la tab bar
    borderTopColor: C.gold,
    borderTopWidth: 0.5,
  },
  tabItem: { paddingTop: 4 },

  itemWrapper: {
    alignItems: 'center',
    gap: 5,
  },

  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  iconBubbleActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },

  iconEmoji: { fontSize: 20 },

  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // BOUTON +
  plusWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 4,
    position: 'relative',
  },

  plusBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
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
    backgroundColor: C.gold,
    opacity: 0.15,
    transform: [{ scale: 1.3 }],
  },

  plusIcon: {
    fontSize: 32,
    color: C.brown,
    fontWeight: '300',
    lineHeight: 36,
  },
});
