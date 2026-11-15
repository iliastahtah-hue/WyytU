import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText, Button, Screen, StepHeader, TextField } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { ageFrom, maskFrDate, parseFrDate, toIsoDate } from '@/src/lib/dates';
import type { Gender } from '@/src/lib/database.types';
import { uploadImage } from '@/src/lib/storage';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

type Picked = { uri: string; base64: string; mime: string };
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;

export default function CreationProfilScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [birth, setBirth] = useState('');
  const [showAge, setShowAge] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });
    const asset = res.assets?.[0];
    if (res.canceled || !asset?.base64) return;
    setPhotos((p) => [...p, { uri: asset.uri, base64: asset.base64 as string, mime: asset.mimeType ?? 'image/jpeg' }].slice(0, MAX_PHOTOS));
  };

  const validate = () => {
    const next: Record<string, string | null> = {};
    if (!firstName.trim()) next.firstName = t('common.error');
    const date = parseFrDate(birth);
    if (!date) next.birth = t('profileSetup.invalidDate');
    else if (ageFrom(date) < 18) next.birth = t('profileSetup.tooYoung');
    if (!gender) next.gender = t('common.error');
    if (photos.length < MIN_PHOTOS) next.photos = t('profileSetup.needPhotos');
    setErrors(next);
    return Object.values(next).every((v) => !v) ? date : null;
  };

  const submit = async () => {
    setFormError(null);
    const date = validate();
    const userId = session?.user.id;
    if (!date || !gender || !userId) return;

    setLoading(true);
    try {
      // 1. Les photos d'abord : si l'envoi échoue, rien n'est créé et on peut réessayer
      const paths = await Promise.all(photos.map((p) => uploadImage('photos', userId, p.base64, { mime: p.mime })));

      // 2. Le profil (ignoré s'il existe déjà après une tentative interrompue)
      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          first_name: firstName.trim(),
          birth_date: toIsoDate(date),
          show_age: showAge,
          gender,
          app_language: lang ?? 'fr',
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      if (error) throw error;

      // 3. Les photos du profil (remplace une tentative précédente)
      const { error: photoError } = await supabase
        .from('profile_photos')
        .upsert(paths.map((path, position) => ({ user_id: userId, path, position })), { onConflict: 'user_id,position' });
      if (photoError) throw photoError;

      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setFormError(readableError(e, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll footer={<Button label={t('common.continue')} onPress={submit} loading={loading} />}>
      <StepHeader step={3} total={5} />
      <View style={styles.head}>
        <AppText variant="title">{t('profileSetup.title')}</AppText>
        <AppText color={colors.sub}>{t('profileSetup.subtitle')}</AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('profileSetup.firstName')}
          placeholder={t('profileSetup.firstNamePlaceholder')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          textContentType="givenName"
          autoComplete="given-name"
          maxLength={40}
          error={errors.firstName}
        />

        <TextField
          label={t('profileSetup.birthDate')}
          placeholder={t('profileSetup.birthDateHint')}
          value={birth}
          onChangeText={(v) => setBirth(maskFrDate(v))}
          keyboardType="number-pad"
          maxLength={10}
          error={errors.birth}
        />

        <View style={styles.switchRow}>
          <AppText variant="label" style={{ flex: 1 }}>{t('profileSetup.showAge')}</AppText>
          <Switch
            value={showAge}
            onValueChange={setShowAge}
            trackColor={{ true: colors.coral, false: colors.line }}
            accessibilityLabel={t('profileSetup.showAge')}
          />
        </View>

        <View style={{ gap: 8 }}>
          <AppText variant="label" color={colors.sub}>{t('profileSetup.gender')}</AppText>
          <View style={styles.genderRow} accessibilityRole="radiogroup">
            {(['femme', 'homme'] as const).map((g) => {
              const on = gender === g;
              return (
                <Pressable
                  key={g}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setGender(g)}
                  style={[styles.genderOpt, on && styles.genderOn]}
                >
                  <AppText variant="bodyStrong" color={on ? colors.white : colors.ink} center>
                    {g === 'femme' ? t('profileSetup.woman') : t('profileSetup.man')}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {errors.gender ? <AppText variant="small" color={colors.danger}>{errors.gender}</AppText> : null}
        </View>

        <View style={{ gap: 8 }}>
          <AppText variant="label" color={colors.sub}>{t('profileSetup.photos')}</AppText>
          <AppText variant="small" color={colors.sub}>{t('profileSetup.photosHint')}</AppText>
          <View style={styles.grid}>
            {Array.from({ length: MAX_PHOTOS }, (_, i) => {
              const p = photos[i];
              if (p) {
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Photo ${i + 1}, retirer`}
                    onPress={() => setPhotos((all) => all.filter((_, k) => k !== i))}
                    style={styles.slot}
                  >
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={styles.remove}><AppText variant="label" color={colors.white}>×</AppText></View>
                  </Pressable>
                );
              }
              const isNext = i === photos.length;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={t('profileSetup.addPhoto')}
                  disabled={!isNext}
                  onPress={pickPhoto}
                  style={[styles.slot, styles.empty, i < MIN_PHOTOS && styles.required]}
                >
                  <AppText variant="title" color={isNext ? colors.ink : colors.line}>+</AppText>
                </Pressable>
              );
            })}
          </View>
          {errors.photos ? <AppText variant="small" color={colors.danger}>{errors.photos}</AppText> : null}
        </View>

        {formError ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">{formError}</AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, marginBottom: 24 },
  form: { gap: 20 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16,
    borderRadius: radius.md, backgroundColor: colors.card,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOpt: {
    flex: 1, minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.line, justifyContent: 'center',
  },
  genderOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '31%', aspectRatio: 0.8, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  empty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' },
  required: { borderColor: colors.coral },
  remove: {
    position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(17,16,20,0.7)', alignItems: 'center', justifyContent: 'center',
  },
});
