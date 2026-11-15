import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Stars } from '@/src/components/Stars';
import { AppText, Avatar, Button, Screen, TopBar } from '@/src/components/ui';
import { fetchGroupDetail, type GroupDetail } from '@/src/features/groups/api';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius } from '@/src/theme/tokens';

type Draft = { stars: number; comment: string; reason: string };

export default function NoterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && session) fetchGroupDetail(id, session.user.id).then(setDetail);
  }, [id, session]);

  const others = (detail?.members ?? []).filter((m) => m.user_id !== session?.user.id);
  const set = (uid: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [uid]: { ...(d[uid] ?? { stars: 0, comment: '', reason: '' }), ...patch } }));

  const missingReason = others.some((m) => {
    const d = drafts[m.user_id];
    return d && d.stars > 0 && d.stars <= 2 && d.reason.trim().length < 3;
  });
  const rated = others.filter((m) => (drafts[m.user_id]?.stars ?? 0) > 0);

  const submit = async () => {
    if (!session || !id) return;
    setLoading(true);
    const rows = rated.map((m) => {
      const d = drafts[m.user_id];
      return {
        group_id: id,
        rater_id: session.user.id,
        rated_id: m.user_id,
        stars: d.stars,
        comment: d.comment.trim() || null,
        reason: d.stars <= 2 ? d.reason.trim() : null,
      };
    });
    const { error } = await supabase.from('ratings').insert(rows);
    setLoading(false);
    if (error) return Alert.alert(readableError(error, 'Impossible d’envoyer tes notes.'));
    Alert.alert('Merci ! 🙌', 'Tes notes sont prises en compte. Les avis écrits sont relus par l’équipe avant d’être publiés.');
    router.back();
  };

  return (
    <Screen
      scroll
      footer={<Button label={`Envoyer ${rated.length ? `(${rated.length})` : ''}`} onPress={submit} loading={loading} disabled={!rated.length || missingReason} />}
    >
      <TopBar title="Noter la sortie" />
      <AppText variant="title">{detail?.group.title ?? ''}</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        Note les membres présents. Ta note reste anonyme ; un avis écrit est relu avant publication.
      </AppText>
      <View style={{ gap: 12 }}>
        {others.map((m) => {
          const d = drafts[m.user_id] ?? { stars: 0, comment: '', reason: '' };
          return (
            <View key={m.user_id} style={styles.card}>
              <View style={styles.row}>
                <Avatar name={m.profile?.first_name ?? '?'} uri={m.profile?.photo} seed={m.user_id} size={44} />
                <AppText variant="heading" style={{ flex: 1 }}>{m.profile?.first_name}</AppText>
              </View>
              <Stars value={d.stars} onChange={(v) => set(m.user_id, { stars: v })} label={`Note pour ${m.profile?.first_name ?? ''}`} />
              {d.stars > 0 && d.stars <= 2 ? (
                <TextInput
                  value={d.reason}
                  onChangeText={(v) => set(m.user_id, { reason: v })}
                  placeholder="Que s’est-il passé ? (obligatoire)"
                  placeholderTextColor={colors.muted}
                  maxLength={200}
                  style={[styles.input, { borderColor: colors.coral }]}
                  accessibilityLabel="Motif de la note"
                />
              ) : null}
              {d.stars > 0 ? (
                <TextInput
                  value={d.comment}
                  onChangeText={(v) => set(m.user_id, { comment: v })}
                  placeholder="Un petit avis (facultatif)"
                  placeholderTextColor={colors.muted}
                  maxLength={400}
                  multiline
                  style={styles.input}
                  accessibilityLabel="Avis écrit"
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    minHeight: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, padding: 12,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
});
