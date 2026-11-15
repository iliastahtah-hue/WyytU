import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import type { Report } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius } from '@/src/theme/tokens';

const REASONS: { id: Report['reason']; label: string }[] = [
  { id: 'comportement', label: 'Comportement déplacé' },
  { id: 'harcelement', label: 'Harcèlement ou menaces' },
  { id: 'faux_profil', label: 'Faux profil ou arnaque' },
  { id: 'absence', label: 'Absent sans prévenir' },
  { id: 'contenu', label: 'Message ou photo inapproprié' },
  { id: 'autre', label: 'Autre' },
];

export default function SignalerScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { userId, groupId, messageId } = useLocalSearchParams<{ userId?: string; groupId?: string; messageId?: string }>();
  const [reason, setReason] = useState<Report['reason'] | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (alsoBlock: boolean) => {
    if (!session || !reason) return;
    setLoading(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      reported_user_id: userId ?? null,
      group_id: groupId ?? null,
      message_id: messageId ?? null,
      reason,
      details: details.trim() || null,
    });
    if (!error && alsoBlock && userId) {
      await supabase.from('blocks').insert({ blocker_id: session.user.id, blocked_id: userId });
    }
    setLoading(false);
    if (error) return Alert.alert(readableError(error, 'Impossible d’envoyer le signalement.'));
    Alert.alert('Signalement envoyé', 'Merci. Notre équipe le traite sous 24 h. La personne ne sait pas que c’est toi.');
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="Envoyer le signalement" onPress={() => send(false)} loading={loading} disabled={!reason} />
          {userId ? <Button kind="outline" label="Signaler et bloquer" onPress={() => send(true)} disabled={!reason || loading} /> : null}
        </>
      }
    >
      <TopBar title="Signaler" />
      <AppText variant="title">Que se passe-t-il ?</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        Ton signalement est confidentiel. En cas de danger immédiat, appelle le 19 (police) ou le 15 (urgences).
      </AppText>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {REASONS.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === r.id }}
            onPress={() => setReason(r.id)}
            style={[styles.option, reason === r.id && { borderColor: colors.ink }]}
          >
            <View style={[styles.radio, reason === r.id && styles.radioOn]} />
            <AppText variant="bodyStrong">{r.label}</AppText>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="Donne-nous plus de détails (facultatif)"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
        style={styles.input}
        accessibilityLabel="Détails du signalement"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16,
    borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.card,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line },
  radioOn: { borderColor: colors.ink, borderWidth: 7 },
  input: {
    marginTop: 16, minHeight: 110, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
});
