import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Screen, StepHeader, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';
import { colors, fonts, radius, TOUCH } from '@/src/theme/tokens';

/** Supabase envoie 8 chiffres par e-mail, 6 par SMS */
const lengthFor = (mode?: string) => (mode === 'email' ? 8 : 6);
const RESEND_DELAY = 30;

export default function CodeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { mode, target } = useLocalSearchParams<{ mode: 'phone' | 'email'; target: string }>();
  const LENGTH = lengthFor(mode);
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(RESEND_DELAY);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const verify = async (token = code) => {
    if (token.length !== LENGTH || !target) return;
    setLoading(true);
    setError(null);
    const { error: err } =
      mode === 'email'
        ? await supabase.auth.verifyOtp({ email: target, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: target, token, type: 'sms' });
    setLoading(false);
    if (err) {
      setError(t('auth.invalidCode'));
      setCode('');
      return;
    }
    router.replace('/');
  };

  const resend = async () => {
    if (!target) return;
    setWait(RESEND_DELAY);
    if (mode === 'email') await supabase.auth.signInWithOtp({ email: target });
    else await supabase.auth.signInWithOtp({ phone: target });
  };

  return (
    <Screen
      footer={<Button label={t('auth.verify')} onPress={() => verify()} loading={loading} disabled={code.length !== LENGTH} />}
    >
      <TopBar />
      <StepHeader step={2} total={5} />
      <View style={styles.head}>
        <AppText variant="title">{t('auth.codeTitle')}</AppText>
        <View style={styles.row}>
          <AppText color={colors.sub}>{t('auth.codeSubtitle', { target: target ?? '' })}</AppText>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.link}>
            <AppText variant="label" color={colors.coralDark}>{t('auth.change')}</AppText>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes} accessibilityLabel={t('auth.codeTitle')}>
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = i === code.length;
          return (
            <View key={i} style={[styles.box, active && styles.boxActive, error ? styles.boxError : null]}>
              <AppText style={styles.digit} center>{code[i] ?? ''}</AppText>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(v) => {
          const clean = v.replace(/\D/g, '').slice(0, LENGTH);
          setCode(clean);
          if (clean.length === LENGTH) verify(clean);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        maxLength={LENGTH}
        style={styles.hidden}
        accessibilityLabel={t('auth.codeTitle')}
      />

      {error ? (
        <AppText variant="small" color={colors.danger} style={{ marginTop: 12 }} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <Pressable accessibilityRole="button" disabled={wait > 0} onPress={resend} style={styles.link}>
        <AppText variant="label" color={wait > 0 ? colors.muted : colors.coralDark}>
          {wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend')}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, marginBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  link: { minHeight: TOUCH, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 8 },
  boxes: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  box: {
    flex: 1, aspectRatio: 0.85, maxWidth: 56, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  boxActive: { borderColor: colors.ink, borderWidth: 2 },
  boxError: { borderColor: colors.danger },
  digit: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
