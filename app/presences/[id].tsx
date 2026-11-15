import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Screen, TopBar } from '@/src/components/ui';
import { fetchGroupDetail, type GroupDetail } from '@/src/features/groups/api';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

export default function PresencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [detail, setDetail] = useState<GroupDetail | null>(null);

  const load = useCallback(() => {
    if (id && session) fetchGroupDetail(id, session.user.id).then(setDetail);
  }, [id, session]);
  useEffect(load, [load]);

  const mark = async (userId: string, present: boolean) => {
    const { error } = await supabase.rpc('mark_attendance', { p_group: id as string, p_user: userId, p_present: present });
    if (error) return Alert.alert(readableError(error, 'Impossible d’enregistrer.'));
    load();
  };

  const others = (detail?.members ?? []).filter((m) => m.user_id !== session?.user.id);

  return (
    <Screen scroll>
      <TopBar title="Présences" />
      <AppText variant="title">{detail?.group.title ?? ''}</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        Indique qui est venu. Une absence sans prévenir baisse la fiabilité du membre ; il peut la contester sous 72 h.
        Si un partenaire a scanné ton QR, tout le groupe est déjà marqué présent.
      </AppText>
      <View style={{ gap: 10 }}>
        {others.map((m) => (
          <View key={m.user_id} style={styles.row}>
            <Avatar name={m.profile?.first_name ?? '?'} uri={m.profile?.photo} seed={m.user_id} size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{m.profile?.first_name}</AppText>
              <AppText variant="small" color={m.no_show ? colors.danger : m.checked_in ? colors.success : colors.sub}>
                {m.no_show ? 'Absent' : m.checked_in ? 'Présent ✓' : 'Pas encore pointé'}
              </AppText>
            </View>
            <Button small kind={m.no_show ? 'dark' : 'outline'} label="Absent" onPress={() => mark(m.user_id, false)} />
            <Button small kind={m.checked_in ? 'lime' : 'outline'} label="Présent" onPress={() => mark(m.user_id, true)} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12 },
});
