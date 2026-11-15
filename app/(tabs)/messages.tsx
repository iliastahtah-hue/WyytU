import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { localeOf } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import type { Group } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';
import { fmtTime } from '@/src/lib/tz';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius, UNIVERSES, universeColors } from '@/src/theme/tokens';

type Last = { group_id: string; body: string; created_at: string };
type Conversation = Group & { last: Last | null };

export default function MessagesScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const { data: mine } = await supabase.from('group_members').select('group_id').eq('user_id', session.user.id).eq('status', 'accepted');
    const ids = (mine ?? []).map((m) => m.group_id);
    if (!ids.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    // dernier message de chaque groupe, calculé par la base
    const [{ data: groups }, { data: msgs }] = await Promise.all([
      supabase.from('groups').select('*').in('id', ids).neq('status', 'cancelled'),
      supabase.rpc('my_conversations'),
    ]);
    const conv = (groups ?? []).map((g) => ({ ...g, last: (msgs ?? []).find((m) => m.group_id === g.id) ?? null }));
    conv.sort((a, b) => (b.last?.created_at ?? b.created_at).localeCompare(a.last?.created_at ?? a.created_at));
    setItems(conv);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.coral} />}
        ListHeaderComponent={<AppText variant="display" style={{ marginBottom: 16 }}>{t('chat.title')}</AppText>}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={loading ? null : <View style={styles.empty}><AppText color={colors.sub} center>{t('chat.noGroups')}</AppText></View>}
        renderItem={({ item }) => {
          const u = universeColors[item.universe];
          const emoji = UNIVERSES.find((x) => x.id === item.universe)?.emoji;
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: u.soft }]}><AppText style={{ fontSize: 24 }}>{emoji}</AppText></View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{item.title}</AppText>
                <AppText variant="small" color={colors.sub} numberOfLines={1}>{item.last?.body ?? t('chat.noMessage')}</AppText>
              </View>
              {item.last ? (
                <AppText variant="small" color={colors.muted}>
                  {fmtTime(item.last.created_at, localeOf(lang))}
                </AppText>
              ) : null}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 140 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, minHeight: 72 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 28, backgroundColor: colors.card, borderRadius: radius.xl },
});
