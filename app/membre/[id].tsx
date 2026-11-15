import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText, Button, Screen, TopBar, VerifiedBadge } from '@/src/components/ui';
import { fetchMiniProfiles, type MiniProfile } from '@/src/features/groups/api';
import type { Profile, ProfilePrivate, Rating } from '@/src/lib/database.types';

import { signedUrls } from '@/src/lib/storage';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

type PublicProfile = Omit<Profile, 'birth_date' | 'selfie_path' | 'selfie_consent_at'>;
const PUBLIC_FIELDS =
  'id, first_name, show_age, gender, city, bio, studies, job, lifestyle, interests, app_language, verification_status, is_premium, rating_avg, rating_count, outings_count, attendance_rate, created_at, updated_at';

const RELATION: Record<string, string> = {
  celibataire: 'Célibataire',
  en_couple: 'En couple',
  marie: 'Marié·e',
  non_precise: 'Non précisé',
};

export function InfoTile({ emoji, label, value, locked }: { emoji: string; label: string; value: string; locked?: boolean }) {
  return (
    <View style={styles.tile}>
      <AppText style={{ fontSize: 22 }}>{emoji}</AppText>
      <AppText variant="tag" color={colors.sub}>{label.toUpperCase()}{locked ? ' 🔒' : ''}</AppText>
      <AppText variant="bodyStrong" numberOfLines={2}>{value}</AppText>
    </View>
  );
}

export default function ProfilPublicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [priv, setPriv] = useState<ProfilePrivate | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviews, setReviews] = useState<(Rating & { author?: MiniProfile })[]>([]);
  const [blocked, setBlocked] = useState(false);
  const isMe = session?.user.id === id;

  const load = useCallback(async () => {
    if (!id || !session) return;
    const [{ data: p }, { data: a }, { data: pr }, { data: ph }, { data: rv }, { data: bl }] = await Promise.all([
      supabase.from('profiles').select(PUBLIC_FIELDS).eq('id', id).maybeSingle<PublicProfile>(),
      supabase.rpc('public_age', { p_user: id }),
      supabase.from('profile_private').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('profile_photos').select('path, position').eq('user_id', id).order('position'),
      supabase.from('ratings').select('*').eq('rated_id', id).eq('moderation_status', 'approved').not('comment', 'is', null).order('created_at', { ascending: false }).limit(10),
      supabase.from('blocks').select('blocked_id').eq('blocker_id', session.user.id).eq('blocked_id', id),
    ]);
    setProfile(p ?? null);
    setAge(typeof a === 'number' ? a : null);
    setPriv(pr ?? null);
    setBlocked(!!bl?.length);
    const urls = await signedUrls('photos', (ph ?? []).map((x) => x.path));
    setPhotos((ph ?? []).map((x) => urls[x.path]).filter(Boolean));
    const authors = await fetchMiniProfiles((rv ?? []).map((r) => r.rater_id));
    setReviews((rv ?? []).map((r) => ({ ...r, author: authors[r.rater_id] })));
  }, [id, session]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = () => {
    if (!session || !id) return;
    if (blocked) {
      supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', id).then(() => setBlocked(false));
      return;
    }
    Alert.alert(
      `Bloquer ${profile?.first_name ?? ''} ?`,
      'Vous ne verrez plus vos profils ni vos groupes respectifs. La personne n’est pas prévenue.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('blocks').insert({ blocker_id: session.user.id, blocked_id: id });
            setBlocked(true);
            router.back();
          },
        },
      ],
    );
  };

  if (!profile) {
    return (
      <Screen>
        <TopBar />
        <AppText color={colors.sub} center style={{ marginTop: 40 }}>Profil indisponible.</AppText>
      </Screen>
    );
  }

  const tiles = [
    profile.studies ? { emoji: '🎓', label: 'Études', value: profile.studies } : null,
    profile.job ? { emoji: '💼', label: 'Travail', value: profile.job } : null,
    priv?.residence ? { emoji: '🏠', label: 'Quartier', value: priv.residence, locked: true } : null,
    priv?.height_cm ? { emoji: '📏', label: 'Taille', value: `${priv.height_cm} cm`, locked: true } : null,
    priv?.relationship_status ? { emoji: '💬', label: 'Situation', value: RELATION[priv.relationship_status], locked: true } : null,
    profile.lifestyle.length ? { emoji: '🌱', label: 'Mode de vie', value: profile.lifestyle.join(' · ') } : null,
  ].filter(Boolean) as { emoji: string; label: string; value: string; locked?: boolean }[];

  const photoW = width - 40;

  return (
    <Screen scroll>
      <TopBar />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.xl }}>
        {(photos.length ? photos : [null]).map((uri, i) =>
          uri ? (
            <Image key={uri} source={{ uri }} style={{ width: photoW, height: photoW * 1.15, borderRadius: radius.xl }} contentFit="cover" accessibilityLabel={`Photo ${i + 1}`} />
          ) : (
            <View key="none" style={{ width: photoW, height: photoW * 0.6, borderRadius: radius.xl, backgroundColor: colors.sand }} />
          ),
        )}
      </ScrollView>

      <View style={styles.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="title">{profile.first_name}{age != null ? `, ${age}` : ''}</AppText>
          {profile.verification_status === 'verified' ? <VerifiedBadge withLabel size={18} /> : null}
        </View>
        <AppText color={colors.sub}>📍 {profile.city}</AppText>
      </View>

      <View style={styles.stats}>
        {[
          [profile.rating_count ? `${Number(profile.rating_avg).toFixed(1)} ★` : '—', `${profile.rating_count} avis`],
          [String(profile.outings_count), 'Sorties'],
          [`${Math.round(Number(profile.attendance_rate))} %`, 'Présence'],
        ].map(([v, l]) => (
          <View key={l} style={styles.stat}>
            <AppText variant="heading">{v}</AppText>
            <AppText variant="small" color={colors.sub}>{l}</AppText>
          </View>
        ))}
      </View>

      {profile.bio ? <AppText style={{ marginBottom: 12 }}>{profile.bio}</AppText> : null}

      {tiles.length ? (
        <View style={styles.grid}>
          {tiles.map((x) => <InfoTile key={x.label} {...x} />)}
        </View>
      ) : null}

      {profile.interests.length ? (
        <View style={styles.chips}>
          {profile.interests.map((i) => (
            <View key={i} style={styles.chip}><AppText variant="label">{i}</AppText></View>
          ))}
        </View>
      ) : null}

      <AppText variant="heading" style={{ marginTop: 16, marginBottom: 8 }}>Avis</AppText>
      {reviews.length ? (
        reviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <AppText variant="label">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)} · {r.author?.first_name ?? 'Membre'}</AppText>
            <AppText>{r.comment}</AppText>
          </View>
        ))
      ) : (
        <AppText color={colors.sub}>Pas encore d’avis publié.</AppText>
      )}

      {!isMe ? (
        <View style={{ gap: 8, marginTop: 20 }}>
          <Button kind="outline" label="Signaler" onPress={() => router.push({ pathname: '/signaler', params: { userId: profile.id } })} />
          <Button kind="ghost" label={blocked ? 'Débloquer' : 'Bloquer'} onPress={toggleBlock} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 4, marginTop: 16, marginBottom: 12 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { backgroundColor: colors.limeSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  review: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 4, marginBottom: 8 },
});
