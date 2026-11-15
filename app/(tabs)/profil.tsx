import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, VerifiedBadge } from '@/src/components/ui';
import { LANGS, useI18n } from '@/src/i18n';
import { ageFrom } from '@/src/lib/dates';
import { signedUrls } from '@/src/lib/storage';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

export default function ProfilScreen() {
  const { t, lang, setLang } = useI18n();
  const { profile, signOut } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      supabase
        .from('profile_photos')
        .select('path, position')
        .eq('user_id', profile.id)
        .order('position')
        .then(async ({ data }) => {
          const paths = (data ?? []).map((p) => p.path);
          const urls = await signedUrls('photos', paths);
          setPhotos(paths.map((p) => urls[p]).filter(Boolean));
        });
    }, [profile]),
  );

  if (!profile) return null;

  const status = {
    verified: { label: t('common.verified'), bg: colors.successSoft },
    pending: { label: 'Vérification en cours', bg: colors.sand },
    rejected: { label: 'Selfie à refaire', bg: colors.coralSoft },
    none: { label: 'Non vérifié', bg: colors.sand },
  }[profile.verification_status];

  const confirmDelete = () =>
    Alert.alert(
      'Supprimer mon compte',
      'Ton profil, tes photos et tes messages seront supprimés définitivement. Cette action est irréversible.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_my_account');
            if (error) return Alert.alert(readableError(error, t('common.error')));
            await signOut();
          },
        },
      ],
    );

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {photos[0] ? <Image source={{ uri: photos[0] }} style={styles.cover} contentFit="cover" /> : <View style={styles.cover} />}
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="title">{profile.first_name}</AppText>
              {profile.verification_status === 'verified' ? <VerifiedBadge size={20} /> : null}
            </View>
            <AppText color={colors.ink}>
              {profile.city}
              {profile.show_age ? ` · ${ageFrom(profile.birth_date)} ans` : ''}
            </AppText>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <AppText variant="label">{status.label}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          {[
            [profile.rating_count ? Number(profile.rating_avg).toFixed(1) + ' ★' : '—', 'Note'],
            [String(profile.outings_count), 'Sorties'],
            [`${Math.round(Number(profile.attendance_rate))} %`, 'Présence'],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <AppText variant="heading">{value}</AppText>
              <AppText variant="small" color={colors.sub}>{label}</AppText>
            </View>
          ))}
        </View>

        <AppText variant="heading">Mes photos</AppText>
        <View style={styles.grid}>
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
          ))}
        </View>

        <AppText variant="heading" style={{ marginTop: 8 }}>Langue</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {LANGS.map((l) => (
            <Button key={l.id} small kind={lang === l.id ? 'dark' : 'outline'} label={l.native} onPress={() => setLang(l.id)} />
          ))}
        </View>

        <View style={{ gap: 10, marginTop: 16 }}>
          <Button kind="outline" label="Se déconnecter" onPress={signOut} />
          <Button kind="ghost" label="Supprimer mon compte" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  hero: { flexDirection: 'row', gap: 16, alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.xl, padding: 18 },
  cover: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.coralSoft, transform: [{ rotate: '-4deg' }] },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: '31%', aspectRatio: 0.8, borderRadius: radius.md, backgroundColor: colors.card },
});
