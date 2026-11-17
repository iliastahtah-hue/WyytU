import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, VerifiedBadge } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { ageFrom } from '@/src/lib/dates';
import { signedUrls } from '@/src/lib/storage';
import type { ProfilePrivate } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Row({ icon, label, hint, onPress }: { icon: IconName; label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.ink} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? <AppText variant="small" color={colors.sub}>{hint}</AppText> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfilScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [priv, setPriv] = useState<ProfilePrivate | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      refreshProfile();
      supabase.from('admins').select('user_id').eq('user_id', profile.id).maybeSingle().then(({ data }) => setIsAdmin(!!data));
      supabase.from('profile_private').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => setPriv(data ?? null));
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
    verified: { label: t('profile.verified'), bg: colors.successSoft },
    pending: { label: t('profile.pending'), bg: colors.sand },
    rejected: { label: t('profile.rejected'), bg: colors.coralSoft },
    none: { label: t('profile.none'), bg: colors.sand },
  }[profile.verification_status];

  const filled = [profile.bio, profile.studies, profile.job, profile.lifestyle.length, profile.interests.length, photos.length >= 3].filter(Boolean).length;
  const completion = Math.round((filled / 6) * 100);

  const goEdit = () => router.push('/modifier-profil');
  const chips: { icon: IconName; label: string }[] = [
    { icon: 'location-outline', label: priv?.residence ? `${priv.residence}, ${profile.city}` : profile.city },
    ...(priv?.height_cm ? [{ icon: 'resize-outline' as IconName, label: t('profile.heightCm', { n: priv.height_cm }) }] : []),
    ...(profile.studies ? [{ icon: 'school-outline' as IconName, label: profile.studies }] : []),
    ...(profile.job ? [{ icon: 'briefcase-outline' as IconName, label: profile.job }] : []),
    ...profile.lifestyle.slice(0, 3).map((l) => ({ icon: 'leaf-outline' as IconName, label: l })),
  ];
  const envies: { icon: IconName; title: string; hint: string }[] = [
    { icon: 'film-outline', title: t('profile.films'), hint: t('profile.filmsHint') },
    { icon: 'football-outline', title: t('profile.teams'), hint: t('profile.teamsHint') },
    { icon: 'game-controller-outline', title: t('profile.games'), hint: t('profile.gamesHint') },
    { icon: 'headset-outline', title: t('profile.music'), hint: t('profile.musicHint') },
    { icon: 'restaurant-outline', title: t('profile.food'), hint: t('profile.foodHint') },
    { icon: 'barbell-outline', title: t('profile.sports'), hint: t('profile.sportsHint') },
  ];

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* En-tête : photo, prénom, aperçu public, inviter, réglages */}
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/membre/[id]', params: { id: profile.id } })} style={styles.headLeft}>
            <View style={styles.avatar}>
              {photos[0] ? <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="person" size={28} color={colors.muted} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <AppText variant="title" numberOfLines={1} style={{ flexShrink: 1 }}>{profile.first_name}</AppText>
                {profile.verification_status === 'verified' ? <VerifiedBadge size={20} /> : null}
              </View>
              <AppText variant="small" color={colors.sub}>
                {profile.show_age ? `${t('profile.age', { n: ageFrom(profile.birth_date) })} · ` : ''}{t('profile.preview')} ›
              </AppText>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.invite')} onPress={() => Share.share({ message: t('profile.inviteMsg') })} style={styles.headBtn}>
            <Ionicons name="person-add-outline" size={20} color={colors.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('settings.title')} onPress={() => router.push('/reglages')} style={styles.headBtn}>
            <Ionicons name="settings-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>

        {profile.verification_status !== 'verified' ? (
          <Pressable accessibilityRole="button" disabled={profile.verification_status !== 'rejected' && profile.verification_status !== 'none'}
            onPress={() => router.push('/selfie')} style={[styles.notice, { backgroundColor: status.bg }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.ink} />
            <AppText variant="label" style={{ flex: 1 }}>{status.label}</AppText>
          </Pressable>
        ) : null}

        {completion < 100 ? (
          <Pressable accessibilityRole="button" onPress={goEdit} style={styles.notice}>
            <View style={styles.redDot} />
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="label">{t('profile.complete', { n: completion })}</AppText>
              <View style={styles.track}><View style={[styles.bar, { width: `${completion}%` }]} /></View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ) : null}

        {/* Infos en pastilles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {chips.map((c, i) => (
            <View key={i} style={styles.chip}>
              <Ionicons name={c.icon} size={15} color={colors.sub} />
              <AppText variant="small" numberOfLines={1}>{c.label}</AppText>
            </View>
          ))}
          <Pressable onPress={goEdit} style={[styles.chip, { borderStyle: 'dashed' }]}>
            <Ionicons name="add" size={16} color={colors.sub} />
          </Pressable>
        </ScrollView>

        {/* Chiffres de confiance */}
        <View style={styles.stats}>
          {[
            [profile.rating_count ? `${Number(profile.rating_avg).toFixed(1)}` : '—', t('profile.rating'), 'star'],
            [String(profile.outings_count), t('member.outings'), 'people'],
            [`${Math.round(Number(profile.attendance_rate))} %`, t('member.attendance'), 'checkmark-circle'],
          ].map(([value, label, icon]) => (
            <View key={label} style={styles.stat}>
              <Ionicons name={icon as IconName} size={16} color={colors.coral} />
              <AppText variant="heading">{value}</AppText>
              <AppText variant="small" color={colors.sub}>{label}</AppText>
            </View>
          ))}
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <AppText variant="heading">{t('profile.photosTitle')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {photos.map((uri) => <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />)}
            {photos.length < 6 ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('editProfile.addA11y')} onPress={goEdit} style={[styles.photo, styles.addPhoto]}>
                <Ionicons name="add" size={28} color={colors.sub} />
              </Pressable>
            ) : null}
          </ScrollView>
          <View style={styles.cardFoot}>
            <AppText variant="small" color={colors.sub} style={{ flex: 1 }}>{t('profile.photosHint')}</AppText>
            <Pressable onPress={goEdit} style={styles.smallBtn}><AppText variant="label">{t('profile.editBtn')}</AppText></Pressable>
          </View>
        </View>

        {/* À propos */}
        <Pressable onPress={goEdit} style={styles.card}>
          <View style={styles.cardHead}>
            <AppText variant="heading">{t('profile.aboutTitle')}</AppText>
            <Ionicons name="create-outline" size={18} color={colors.sub} />
          </View>
          <AppText color={profile.bio ? colors.ink : colors.muted}>{profile.bio || t('profile.aboutEmpty')}</AppText>
          {profile.interests.length ? (
            <View style={styles.tags}>
              {profile.interests.map((i) => <View key={i} style={styles.tag}><AppText variant="small">{i}</AppText></View>)}
            </View>
          ) : null}
        </Pressable>

        {/* Mes envies */}
        <AppText variant="heading" style={{ marginTop: 4 }}>{t('profile.envies')}</AppText>
        <View style={styles.grid}>
          {envies.map((e) => (
            <Pressable key={e.title} onPress={goEdit} style={styles.envie}>
              <View style={styles.plusDot}><Ionicons name="add" size={16} color={colors.ink} /></View>
              <Ionicons name={e.icon} size={26} color={colors.ink} />
              <AppText variant="bodyStrong">{e.title}</AppText>
              <AppText variant="small" color={colors.muted}>{e.hint}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Premium */}
        <Pressable accessibilityRole="button" onPress={() => router.push('/premium')}>
          <LinearGradient colors={['#17131A', '#2E1D14', '#5A2A12']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premium}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="tag" color="#F5C451">WYYTU PREMIUM</AppText>
                <AppText variant="heading" color={colors.white}>{t('profile.premiumTitle')}</AppText>
                <AppText variant="small" color="rgba(255,255,255,0.7)">{t('profile.premiumSub')}</AppText>
              </View>
              <View style={styles.arrow}><Ionicons name="arrow-forward" size={20} color={colors.ink} /></View>
            </View>
            <View style={styles.perks}>
              {[
                ['bookmark', t('profile.perkSaved'), profile.is_premium ? '∞' : '0'],
                ['flash', t('profile.perkBoost'), profile.is_premium ? '1' : '0'],
                ['diamond', t('profile.perkSub'), profile.is_premium ? t('profile.active') : t('profile.noneSub')],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.perk}>
                  <Ionicons name={icon as IconName} size={18} color="#F5C451" />
                  <AppText variant="label" color={colors.white}>{value}</AppText>
                  <AppText variant="small" color="rgba(255,255,255,0.6)" numberOfLines={1}>{label}</AppText>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Pressable>

        {/* Plus */}
        <View style={styles.group}>
          <Row icon="shield-checkmark-outline" label={t('profile.safety')} hint={t('profile.safetyHint')} onPress={() => router.push('/reglages')} />
          <Row icon="storefront-outline" label={t('profile.partner')} hint={t('profile.partnerHint')} onPress={() => router.push('/partenaire')} />
          <Row icon="person-add-outline" label={t('profile.invite')} onPress={() => Share.share({ message: t('profile.inviteMsg') })} />
          {isAdmin ? <Row icon="hammer-outline" label="Modération" hint="Selfies, avis, signalements, partenaires" onPress={() => router.push('/moderation')} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.coral },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.bg, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.coral },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, maxWidth: 220 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 84, height: 112, borderRadius: radius.md, backgroundColor: colors.bg },
  addPhoto: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' },
  smallBtn: { paddingHorizontal: 14, height: 36, borderRadius: radius.pill, backgroundColor: colors.bg, justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  envie: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 6, minHeight: 118 },
  plusDot: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  premium: { borderRadius: radius.lg, padding: 18, gap: 16 },
  arrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5C451', alignItems: 'center', justifyContent: 'center' },
  perks: { flexDirection: 'row', gap: 8 },
  perk: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, padding: 10, gap: 2 },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.bg },
});
