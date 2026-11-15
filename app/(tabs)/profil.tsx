import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, VerifiedBadge } from '@/src/components/ui';
import { ageFrom } from '@/src/lib/dates';
import { signedUrls } from '@/src/lib/storage';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

function Row({ emoji, label, hint, onPress }: { emoji: string; label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <AppText style={{ fontSize: 22 }}>{emoji}</AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? <AppText variant="small" color={colors.sub}>{hint}</AppText> : null}
      </View>
      <AppText variant="heading" color={colors.sub}>›</AppText>
    </Pressable>
  );
}

export default function ProfilScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      refreshProfile();
      supabase.from('admins').select('user_id').eq('user_id', profile.id).maybeSingle().then(({ data }) => setIsAdmin(!!data));
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]),
  );

  if (!profile) return null;

  const status = {
    verified: { label: '✓ Profil vérifié', bg: colors.successSoft },
    pending: { label: '⏳ Vérification en cours', bg: colors.sand },
    rejected: { label: '⚠️ Selfie à refaire', bg: colors.coralSoft },
    none: { label: 'Non vérifié', bg: colors.sand },
  }[profile.verification_status];

  const filled = [profile.bio, profile.studies, profile.job, profile.lifestyle.length, profile.interests.length, photos.length >= 3].filter(Boolean).length;
  const completion = Math.round((filled / 6) * 100);

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.stack}>
            {photos.slice(0, 3).reverse().map((uri, i, arr) => (
              <Image
                key={uri}
                source={{ uri }}
                style={[styles.cover, { transform: [{ rotate: `${(arr.length - 1 - i) * -6 + 4}deg` }], left: (arr.length - 1 - i) * 6 }]}
                contentFit="cover"
              />
            ))}
            {!photos.length ? <View style={styles.cover} /> : null}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <AppText variant="title">{profile.first_name}</AppText>
              {profile.verification_status === 'verified' ? <VerifiedBadge size={20} /> : null}
              {profile.is_premium ? <AppText variant="tag">⭐ PREMIUM</AppText> : null}
            </View>
            <AppText>
              {profile.city}
              {profile.show_age ? ` · ${ageFrom(profile.birth_date)} ans` : ''}
            </AppText>
            <Pressable
              accessibilityRole={profile.verification_status === 'rejected' ? 'button' : 'text'}
              disabled={profile.verification_status !== 'rejected'}
              onPress={() => router.push('/selfie')}
              style={[styles.badge, { backgroundColor: status.bg }]}
            >
              <AppText variant="label">{status.label}</AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.stats}>
          {[
            [profile.rating_count ? `${Number(profile.rating_avg).toFixed(1)} ★` : '—', 'Note'],
            [String(profile.outings_count), 'Sorties'],
            [`${Math.round(Number(profile.attendance_rate))} %`, 'Présence'],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <AppText variant="heading">{value}</AppText>
              <AppText variant="small" color={colors.sub}>{label}</AppText>
            </View>
          ))}
        </View>

        {completion < 100 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/modifier-profil')} style={styles.complete}>
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="bodyStrong">Complète ton profil · {completion} %</AppText>
              <View style={styles.track}><View style={[styles.bar, { width: `${completion}%` }]} /></View>
              <AppText variant="small" color={colors.sub}>Un profil complet inspire confiance et se fait accepter plus vite.</AppText>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.group}>
          <Row emoji="✏️" label="Modifier mon profil" hint="Photos, à propos, infos privées 🔒" onPress={() => router.push('/modifier-profil')} />
          <Row emoji="👀" label="Voir mon profil public" onPress={() => router.push({ pathname: '/membre/[id]', params: { id: profile.id } })} />
          <Row emoji="⭐" label="WyytU Premium" hint="Groupes illimités, sorties en avant" onPress={() => router.push('/premium')} />
          <Row emoji="🏪" label="Espace partenaire" hint="Tu as un club, un resto, un studio ?" onPress={() => router.push('/partenaire')} />
          <Row emoji="⚙️" label="Réglages" hint="Langue, sécurité, compte" onPress={() => router.push('/reglages')} />
          {isAdmin ? <Row emoji="🛡️" label="Modération" hint="Selfies, avis, signalements, partenaires" onPress={() => router.push('/moderation')} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  hero: { flexDirection: 'row', gap: 18, alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.xl, padding: 18 },
  stack: { width: 110, height: 128 },
  cover: { position: 'absolute', width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.coralSoft, borderWidth: 3, borderColor: colors.white },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 2 },
  complete: { flexDirection: 'row', backgroundColor: colors.limeSoft, borderRadius: radius.lg, padding: 16 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.white, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.ink },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.bg },
});
