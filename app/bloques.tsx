import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Screen, TopBar } from '@/src/components/ui';
import { fetchMiniProfiles, type MiniProfile } from '@/src/features/groups/api';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

export default function BloquesScreen() {
  const { session } = useAuth();
  const [people, setPeople] = useState<MiniProfile[]>([]);
  const [ids, setIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', session.user.id);
    const list = (data ?? []).map((b) => b.blocked_id);
    setIds(list);
    // les profils bloqués restent lisibles par celui qui bloque
    const found = await fetchMiniProfiles(list);
    setPeople(list.map((id) => found[id]).filter(Boolean));
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (id: string) => {
    if (!session) return;
    await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', id);
    load();
  };

  return (
    <Screen>
      <TopBar title="Personnes bloquées" />
      <FlatList
        data={people}
        keyExtractor={(p) => p.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<AppText color={colors.sub} center style={{ marginTop: 40 }}>{ids.length ? '' : 'Tu n’as bloqué personne.'}</AppText>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar name={item.first_name} uri={item.photo} seed={item.id} size={44} />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>{item.first_name}</AppText>
            <Button small kind="outline" label="Débloquer" onPress={() => unblock(item.id)} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12 },
});
