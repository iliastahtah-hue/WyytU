import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors } from '@/src/theme/tokens';

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { icon: [IconName, IconName]; label: string }> = {
  aujourdhui: { icon: ['today-outline', 'today'], label: 'pro.today' },
  creneaux: { icon: ['time-outline', 'time'], label: 'pro.slots' },
  stats: { icon: ['stats-chart-outline', 'stats-chart'], label: 'pro.stats' },
  fiche: { icon: ['storefront-outline', 'storefront'], label: 'pro.sheet' },
};

/** Barre du bas du mode Partenaire : sombre, pour qu'on sache toujours dans quel mode on est. */
export function ProTabBar({ state, navigation }: BarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = state.routes.map((route, index) => {
    const tab = TABS[route.name];
    const focused = state.index === index;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab ? t(tab.label) : route.name}
        onPress={() => {
          Haptics.selectionAsync().catch(() => undefined);
          if (!focused) navigation.navigate(route.name);
        }}
        style={styles.item}
      >
        <Ionicons name={tab?.icon[focused ? 1 : 0] ?? 'ellipse'} size={24} color={focused ? colors.lime : 'rgba(255,255,255,0.55)'} />
        <AppText variant="tag" color={focused ? colors.white : 'rgba(255,255,255,0.55)'} style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
          {tab ? t(tab.label) : route.name}
        </AppText>
      </Pressable>
    );
  });
  // bouton Scanner au milieu
  items.splice(2, 0, (
    <Pressable key="scan" accessibilityRole="button" accessibilityLabel={t('pro.scan')} onPress={() => router.push('/partenaire/scanner')} style={styles.item}>
      <View style={styles.scan}><Ionicons name="qr-code" size={26} color={colors.ink} /></View>
    </Pressable>
  ));
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>{items}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 6 },
  bar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, borderRadius: 30, paddingVertical: 8, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  scan: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
