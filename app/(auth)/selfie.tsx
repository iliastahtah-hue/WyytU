import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, StepHeader } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { uploadImage } from '@/src/lib/storage';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius, TOUCH } from '@/src/theme/tokens';

export default function SelfieScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, refreshProfile } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [shot, setShot] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = async () => {
    if (!consent) {
      setConsentError(true);
      return;
    }
    const pic = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
    if (pic?.base64) setShot({ uri: pic.uri, base64: pic.base64 });
  };

  const send = async () => {
    const userId = session?.user.id;
    if (!shot || !userId) return;
    setLoading(true);
    setError(null);
    try {
      // un nouveau fichier à chaque essai : un selfie refusé peut être refait
      const path = await uploadImage('selfies', userId, shot.base64);
      const { error: err } = await supabase
        .from('profiles')
        .update({ selfie_path: path, selfie_consent_at: new Date().toISOString() })
        .eq('id', userId);
      if (err) throw err;
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setError(readableError(e, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const footer = shot ? (
    <View style={styles.actions}>
      <Button label={t('selfie.retake')} kind="outline" onPress={() => setShot(null)} style={{ flex: 1 }} />
      <Button label={t('selfie.send')} onPress={send} loading={loading} style={{ flex: 1 }} />
    </View>
  ) : permission?.granted ? (
    <Button label={t('selfie.take')} onPress={take} disabled={!consent} icon="📸" />
  ) : (
    <Button label={t('selfie.allow')} onPress={requestPermission} disabled={!consent} />
  );

  return (
    <Screen scroll footer={footer}>
      <StepHeader step={4} total={5} />
      <View style={styles.head}>
        <AppText variant="title">{t('selfie.title')}</AppText>
        <AppText color={colors.sub}>{t('selfie.subtitle')}</AppText>
      </View>

      {/* Le consentement passe AVANT la caméra et n'est jamais pré-coché */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => {
          setConsent((c) => !c);
          setConsentError(false);
        }}
        style={[styles.consent, consentError && { borderColor: colors.danger }]}
      >
        <View style={[styles.box, consent && styles.boxOn]}>
          {consent ? <AppText variant="label" color={colors.white}>✓</AppText> : null}
        </View>
        <AppText variant="small" style={{ flex: 1 }}>{t('selfie.consent')}</AppText>
      </Pressable>
      {consentError ? <AppText variant="small" color={colors.danger}>{t('selfie.consentRequired')}</AppText> : null}

      <View style={styles.frame}>
        {shot ? (
          <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : permission?.granted && consent ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mirror />
        ) : (
          <View style={styles.placeholder}>
            <Image source={img3d.camera} style={{ width: 96, height: 96 }} />
            {!permission?.granted ? (
              <AppText variant="small" color={colors.sub} center>{t('selfie.permission')}</AppText>
            ) : null}
          </View>
        )}
        <View style={styles.oval} pointerEvents="none" />
      </View>

      {error ? <AppText variant="small" color={colors.danger} style={{ marginTop: 8 }}>{error}</AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, marginBottom: 20 },
  consent: {
    flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, minHeight: TOUCH,
    borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.card, marginBottom: 6,
  },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  frame: { marginTop: 16, aspectRatio: 0.82, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.ink },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.sand },
  oval: {
    position: 'absolute', left: '16%', right: '16%', top: '12%', bottom: '14%',
    borderRadius: 999, borderWidth: 3, borderColor: colors.lime,
  },
  actions: { flexDirection: 'row', gap: 10 },
});
