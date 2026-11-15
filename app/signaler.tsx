import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import type { Report } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius } from '@/src/theme/tokens';

const REASONS: Report['reason'][] = ['comportement', 'harcelement', 'faux_profil', 'absence', 'contenu', 'autre'];

export default function SignalerScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useI18n();
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
    if (error) return Alert.alert(readableError(error, t('report.sendError')));
    Alert.alert(t('report.sentTitle'), t('report.sentBody'));
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={t('report.send')} onPress={() => send(false)} loading={loading} disabled={!reason} />
          {userId ? <Button kind="outline" label={t('report.sendBlock')} onPress={() => send(true)} disabled={!reason || loading} /> : null}
        </>
      }
    >
      <TopBar title={t('report.title')} />
      <AppText variant="title">{t('report.question')}</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        {t('report.intro')}
      </AppText>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {REASONS.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === r }}
            onPress={() => setReason(r)}
            style={[styles.option, reason === r && { borderColor: colors.ink }]}
          >
            <View style={[styles.radio, reason === r && styles.radioOn]} />
            <AppText variant="bodyStrong">{t(`reportReasons.${r}`)}</AppText>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder={t('report.detailsPh')}
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
        style={styles.input}
        accessibilityLabel={t('report.detailsA11y')}
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
