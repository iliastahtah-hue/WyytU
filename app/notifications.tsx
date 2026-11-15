import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Screen, TopBar } from '@/src/components/ui';
import { fetchMiniProfiles } from '@/src/features/groups/api';
import { localeOf } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import type { AppNotification } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';
import { fmtDateTime } from '@/src/lib/tz';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

const ICONS: Record<string, string> = {
  join_request: '🙋',
  join_accepted: '🎉',
  join_declined: '😕',
  now_co_organizer: '👑',
  no_show: '⚠️',
  confirm_reminder: '⏰',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const [items, setItems] = useState<(AppNotification & { text: string })[]>([]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(60);
      const list = data ?? [];
      const groupIds = [...new Set(list.map((n) => n.payload.group_id as string).filter(Boolean))];
      const userIds = [...new Set(list.map((n) => n.payload.user_id as string).filter(Boolean))];
      const [{ data: groups }, people] = await Promise.all([
        groupIds.length ? supabase.from('groups').select('id, title').in('id', groupIds) : Promise.resolve({ data: [] }),
        fetchMiniProfiles(userIds),
      ]);
      const titleOf = Object.fromEntries((groups ?? []).map((g: { id: string; title: string }) => [g.id, g.title]));
      setItems(
        list.map((n) => ({
          ...n,
          text: t(`notif.${n.type}`, {
            group: titleOf[n.payload.group_id as string] ?? '…',
            name: people[n.payload.user_id as string]?.first_name ?? '…',
          }),
        })),
      );
      // tout marquer comme lu à l'ouverture
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', session.user.id).is('read_at', null);
    })();
  }, [session, t]);

  const open = (n: AppNotification) => {
    const groupId = n.payload.group_id as string | undefined;
    if (n.type === 'no_show' && groupId) router.push({ pathname: '/contester/[id]', params: { id: groupId } });
    else if (groupId) router.push({ pathname: '/groupe/[id]', params: { id: groupId } });
  };

  return (
    <Screen>
      <TopBar title={t('notif.title')} />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<AppText color={colors.sub} center style={{ marginTop: 40 }}>{t('notif.empty')}</AppText>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => open(item)} style={[styles.row, !item.read_at && styles.unread]}>
            <AppText style={{ fontSize: 24 }}>{ICONS[item.type] ?? '🔔'}</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant={item.read_at ? 'body' : 'bodyStrong'}>{item.text}</AppText>
              <AppText variant="small" color={colors.muted}>
                {fmtDateTime(item.created_at, localeOf(lang), { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.coral },
});
