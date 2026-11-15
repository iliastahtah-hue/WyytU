import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, StepHeader, TextField } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, TOUCH } from '@/src/theme/tokens';

/** Numéro marocain : 9 chiffres commençant par 5, 6 ou 7 (sans le 0). */
export function toMoroccanE164(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('212')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[567]\d{8}$/.test(digits) ? `+212${digits}` : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function InscriptionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    let target: string | null;
    if (mode === 'phone') {
      target = toMoroccanE164(value);
      if (!target) return setError(t('auth.invalidPhone'));
    } else {
      target = value.trim().toLowerCase();
      if (!EMAIL_RE.test(target)) return setError(t('auth.invalidEmail'));
    }

    setLoading(true);
    const { error: err } =
      mode === 'phone'
        ? await supabase.auth.signInWithOtp({ phone: target })
        : await supabase.auth.signInWithOtp({ email: target, options: { shouldCreateUser: true } });
    setLoading(false);

    if (err) return setError(readableError(err, t('common.error')));
    router.push({ pathname: '/code', params: { mode, target } });
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={t('auth.sendCode')} onPress={submit} loading={loading} disabled={!value.trim()} />
          <AppText variant="small" color={colors.sub} center>
            {t('auth.legal')}
          </AppText>
        </>
      }
    >
      <StepHeader step={1} total={5} />
      <View style={styles.head}>
        <AppText variant="title">{mode === 'phone' ? t('auth.title') : t('auth.emailTitle')}</AppText>
        <AppText color={colors.sub}>{mode === 'phone' ? t('auth.subtitle') : t('auth.emailSubtitle')}</AppText>
      </View>

      {mode === 'phone' ? (
        <TextField
          key="phone"
          label={t('auth.phoneLabel')}
          prefix="🇲🇦 +212"
          placeholder={t('auth.phonePlaceholder')}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          value={value}
          onChangeText={setValue}
          error={error}
          autoFocus
          onSubmitEditing={submit}
        />
      ) : (
        <TextField
          key="email"
          label={t('auth.emailLabel')}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={setValue}
          error={error}
          autoFocus
          onSubmitEditing={submit}
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMode(mode === 'phone' ? 'email' : 'phone');
          setValue('');
          setError(null);
        }}
        style={styles.switch}
      >
        <AppText variant="label" color={colors.coralDark}>
          {mode === 'phone' ? t('auth.useEmail') : t('auth.usePhone')}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, marginBottom: 28 },
  switch: { minHeight: TOUCH, justifyContent: 'center', marginTop: 8, alignSelf: 'flex-start' },
});
