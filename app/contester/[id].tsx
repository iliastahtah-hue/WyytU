import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, fonts, radius } from '@/src/theme/tokens';

export default function ContesterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('contest_no_show', { p_group: id as string, p_message: message });
    setLoading(false);
    if (error) return Alert.alert(readableError(error, 'Impossible d’envoyer la contestation.'));
    Alert.alert('Contestation envoyée', 'Notre équipe vérifie et te répond sous 48 h. Si elle est acceptée, ta fiabilité est rétablie.');
    router.back();
  };

  return (
    <Screen scroll footer={<Button label="Envoyer ma contestation" onPress={send} loading={loading} disabled={message.trim().length < 5} />}>
      <TopBar title="Contester une absence" />
      <AppText variant="title">Tu étais là ?</AppText>
      <AppText color={colors.sub} style={{ marginBottom: 16 }}>
        Explique ce qui s’est passé (retard, malentendu, preuve de présence…). Tu as 72 h après la sortie pour contester.
      </AppText>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Ex. : j’étais au terrain 2, Karim peut confirmer."
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
        style={styles.input}
        accessibilityLabel="Ton explication"
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
