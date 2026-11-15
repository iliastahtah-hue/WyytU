import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { AppText, Button, Chip, Screen, TextField, TopBar } from '@/src/components/ui';
import type { ProfilePrivate } from '@/src/lib/database.types';
import { signedUrls, uploadImage } from '@/src/lib/storage';
import { readableError, supabase } from '@/src/lib/supabase';
import { useI18n } from '@/src/i18n';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius } from '@/src/theme/tokens';

const LIFESTYLE = ['🏃 Sportif', '🌙 Couche-tard', '☀️ Lève-tôt', '🚭 Non-fumeur', '🍔 Gourmand', '🎧 Musique', '📚 Lecture', '✈️ Voyageur', '🐾 Animaux'];
const INTERESTS = ['Padel', 'Foot', 'Muscu', 'Pilates', 'Cinéma', 'Brunch', 'Street-food', 'Concerts', 'Jeux de société', 'Randonnée', 'Surf', 'Photo', 'Art', 'Tech'];
const RELATIONS: NonNullable<ProfilePrivate['relationship_status']>[] = ['celibataire', 'en_couple', 'marie', 'non_precise'];

type Photo = { id: string; path: string; position: number; url?: string };

function toggle(list: string[], v: string, max = 8) {
  return list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v];
}

export default function ModifierProfilScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [studies, setStudies] = useState(profile?.studies ?? '');
  const [job, setJob] = useState(profile?.job ?? '');
  const [lifestyle, setLifestyle] = useState<string[]>(profile?.lifestyle ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [showAge, setShowAge] = useState(profile?.show_age ?? false);
  const [residence, setResidence] = useState('');
  const [height, setHeight] = useState('');
  const [relation, setRelation] = useState<ProfilePrivate['relationship_status']>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);

  const loadPhotos = async () => {
    if (!profile) return;
    const { data } = await supabase.from('profile_photos').select('id, path, position').eq('user_id', profile.id).order('position');
    const urls = await signedUrls('photos', (data ?? []).map((p) => p.path));
    setPhotos((data ?? []).map((p) => ({ ...p, url: urls[p.path] })));
  };

  useEffect(() => {
    if (!profile) return;
    loadPhotos();
    supabase.from('profile_private').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setResidence(data.residence ?? '');
      setHeight(data.height_cm ? String(data.height_cm) : '');
      setRelation(data.relationship_status);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const addPhoto = async () => {
    if (!profile || photos.length >= 6) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.7, base64: true });
    const a = res.assets?.[0];
    if (res.canceled || !a?.base64) return;
    try {
      const path = await uploadImage('photos', profile.id, a.base64, { mime: a.mimeType ?? 'image/jpeg' });
      const used = new Set(photos.map((p) => p.position));
      const position = [0, 1, 2, 3, 4, 5].find((n) => !used.has(n)) ?? photos.length;
      const { error } = await supabase.from('profile_photos').insert({ user_id: profile.id, path, position });
      if (error) throw error;
      loadPhotos();
    } catch (e) {
      Alert.alert(readableError(e, t('editProfile.addPhotoError')));
    }
  };

  const removePhoto = (p: Photo) => {
    if (photos.length <= 3) return Alert.alert(t('editProfile.minPhotosTitle'), t('editProfile.minPhotosBody'));
    Alert.alert(t('editProfile.removeTitle'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('editProfile.remove'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('profile_photos').delete().eq('id', p.id);
          await supabase.storage.from('photos').remove([p.path]);
          loadPhotos();
        },
      },
    ]);
  };

  const save = async () => {
    if (!profile) return;
    const h = height ? Number(height) : null;
    if (h !== null && (h < 120 || h > 230)) return Alert.alert(t('editProfile.heightRange'));
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('profiles').update({
        bio: bio.trim() || null,
        studies: studies.trim() || null,
        job: job.trim() || null,
        lifestyle,
        interests,
        show_age: showAge,
      }).eq('id', profile.id),
      supabase.from('profile_private').upsert({
        user_id: profile.id,
        residence: residence.trim() || null,
        height_cm: h,
        relationship_status: relation,
      }),
    ]);
    setSaving(false);
    if (e1 || e2) return Alert.alert(readableError(e1 ?? e2, t('attendance.saveError')));
    await refreshProfile();
    router.back();
  };

  return (
    <Screen scroll footer={<Button label={t('common.save')} onPress={save} loading={saving} />}>
      <TopBar title={t('profile.edit')} />

      <AppText variant="heading">{t('editProfile.photos', { n: photos.length })}</AppText>
      <View style={styles.grid}>
        {photos.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={t('editProfile.removeA11y')} onPress={() => removePhoto(p)} style={styles.slot}>
            {p.url ? <Image source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <View style={styles.remove}><AppText variant="label" color={colors.white}>×</AppText></View>
          </Pressable>
        ))}
        {photos.length < 6 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('editProfile.addA11y')} onPress={addPhoto} style={[styles.slot, styles.add]}>
            <AppText variant="title">+</AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.block}>
        <AppText variant="heading">{t('editProfile.about')}</AppText>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder={t('editProfile.bioPh')}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={300}
          style={styles.textarea}
          accessibilityLabel="Bio"
        />
        <TextField label={`🎓 ${t('member.studies')}`} value={studies} onChangeText={setStudies} placeholder={t('editProfile.studiesPh')} maxLength={80} />
        <TextField label={`💼 ${t('member.job')}`} value={job} onChangeText={setJob} placeholder={t('editProfile.jobPh')} maxLength={80} />
      </View>

      <View style={styles.block}>
        <AppText variant="heading">{t('member.lifestyle')}</AppText>
        <View style={styles.wrap}>
          {LIFESTYLE.map((l) => <Chip key={l} label={l} selected={lifestyle.includes(l)} onPress={() => setLifestyle((x) => toggle(x, l, 5))} />)}
        </View>
        <AppText variant="heading" style={{ marginTop: 8 }}>{t('editProfile.interests')}</AppText>
        <View style={styles.wrap}>
          {INTERESTS.map((l) => <Chip key={l} label={l} selected={interests.includes(l)} onPress={() => setInterests((x) => toggle(x, l))} />)}
        </View>
      </View>

      <View style={styles.block}>
        <AppText variant="heading">{t('editProfile.private')}</AppText>
        <AppText variant="small" color={colors.sub}>{t('editProfile.privateHint')}</AppText>
        <TextField label={`🏠 ${t('member.residence')}`} value={residence} onChangeText={setResidence} placeholder={t('editProfile.residencePh')} maxLength={80} />
        <TextField label={t('editProfile.height')} value={height} onChangeText={(v) => setHeight(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" placeholder={t('editProfile.heightPh')} />
        <AppText variant="label" color={colors.sub}>💬 {t('member.relationship')}</AppText>
        <View style={styles.wrap}>
          {RELATIONS.map((r) => <Chip key={r} label={t(`relationship.${r}`)} selected={relation === r} onPress={() => setRelation(relation === r ? null : r)} />)}
        </View>
        <View style={styles.switchRow}>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>{t('editProfile.showAge')}</AppText>
          <Switch value={showAge} onValueChange={setShowAge} trackColor={{ true: colors.coral, false: colors.line }} accessibilityLabel={t('editProfile.showAge')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 20 },
  slot: { width: '31%', aspectRatio: 0.8, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  add: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line },
  remove: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(17,16,20,0.7)', alignItems: 'center', justifyContent: 'center' },
  block: { gap: 12, marginBottom: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  textarea: {
    minHeight: 100, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.card },
});
