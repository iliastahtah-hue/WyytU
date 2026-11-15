import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Screen, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { fetchGroupDetail, type GroupDetail } from '@/src/features/groups/api';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

export default function PresencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { t } = useI18n();
  const [detail, setDetail] = useState<GroupDetail | null>(null);

  const load = useCallback(() => {
    if (id && session) fetchGroupDetail(id, session.user.id).then(setDetail);
  }, [id, session]);
  useEffect(load, [load]);

  const mark = async (userId: string, present: boolean) => {
    const { error } = await supabase.rpc('mark_attendance', { p_group: id as string, p_user: userId, p_present: present });
    if (error) return Alert.alert(readableError(error, t('attendance.saveError')));
    load();
  };

  const others = (detail?.members ?? []).filter((m) => m.user_id !== session?.user.id);

  return (
    <Screen scroll>
      <TopBar title={t('attendance.title')} />
      <AppText variant="title">{detail?.group.title ?? ''}</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        {t('attendance.intro')}
      </AppText>
      <View style={{ gap: 10 }}>
        {others.map((m) => (
          <View key={m.user_id} style={styles.row}>
            <Avatar name={m.profile?.first_name ?? '?'} uri={m.profile?.photo} seed={m.user_id} size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{m.profile?.first_name}</AppText>
              <AppText variant="small" color={m.no_show ? colors.danger : m.checked_in ? colors.success : colors.sub}>
                {m.no_show ? t('attendance.absent') : m.checked_in ? t('attendance.presentCheck') : t('attendance.notYet')}
              </AppText>
            </View>
            <Button small kind={m.no_show ? 'dark' : 'outline'} label={t('attendance.absent')} onPress={() => mark(m.user_id, false)} />
            <Button small kind={m.checked_in ? 'lime' : 'outline'} label={t('attendance.present')} onPress={() => mark(m.user_id, true)} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12 },
});
