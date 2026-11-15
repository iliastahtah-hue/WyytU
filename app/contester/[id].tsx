import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, fonts, radius } from '@/src/theme/tokens';

export default function ContesterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('contest_no_show', { p_group: id as string, p_message: message });
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('dispute.sendError')));
    Alert.alert(t('dispute.sentTitle'), t('dispute.sentBody'));
    router.back();
  };

  return (
    <Screen scroll footer={<Button label={t('dispute.send')} onPress={send} loading={loading} disabled={message.trim().length < 5} />}>
      <TopBar title={t('dispute.title')} />
      <AppText variant="title">{t('dispute.question')}</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        {t('dispute.intro')}
      </AppText>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={t('dispute.placeholder')}
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
        style={styles.input}
        accessibilityLabel={t('dispute.a11y')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 160, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
});
