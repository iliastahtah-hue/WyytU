import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors } from '@/src/theme/tokens';

const ICONS: Record<string, string> = {
  explorer: '🧭',
  sorties: '📅',
  creer: '+',
  messages: '💬',
  profil: '👤',
};
const LABELS: Record<string, string> = {
  explorer: 'tabs.explore',
  sorties: 'tabs.outings',
  creer: 'tabs.create',
  messages: 'tabs.messages',
  profil: 'tabs.profile',
};

/** Barre du bas beige sable, avec le bouton « + » corail au centre. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isCreate = route.name === 'creer';
          const label = t(LABELS[route.name] ?? route.name);
          const onPress = () => {
            Haptics.selectionAsync().catch(() => undefined);
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCreate) {
            return (
              <Pressable key={route.key} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.item}>
                <View style={styles.plus}>
                  <AppText style={styles.plusText} color={colors.white} center>+</AppText>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.item}
            >
              <AppText style={{ fontSize: 20, lineHeight: 24, opacity: focused ? 1 : 0.55 }} center>
                {ICONS[route.name]}
              </AppText>
              <AppText variant="tag" color={focused ? colors.ink : colors.sub} center numberOfLines={1} style={{ letterSpacing: 0 }}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: 'transparent', position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.sand, borderRadius: 30,
    paddingVertical: 8, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  plus: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.coral, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  plusText: { fontSize: 32, lineHeight: 36, fontWeight: '600' },
});
