import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Avatar, Button, Screen, TopBar, VerifiedBadge } from '@/src/components/ui';
import { fetchGroupDetail, leaveGroup, requestJoin, respondJoin, type GroupDetail } from '@/src/features/groups/api';
import { localeOf, relativeStart } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import { formatDay } from '@/src/lib/dates';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius, universeColors } from '@/src/theme/tokens';

export default function GroupeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session, profile } = useAuth();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !session) return;
    try {
      setDetail(await fetchGroupDetail(id, session.user.id));
    } catch (e) {
      setError(readableError(e, t('common.error')));
    } finally {
      setLoading(false);
    }
  }, [id, session, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(readableError(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <TopBar />
        <ActivityIndicator color={colors.coral} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <TopBar />
        <AppText center style={{ marginTop: 40 }}>{t('group.notFound')}</AppText>
      </Screen>
    );
  }

  const { group, organizer, members, pending, mine, isOrganizer } = detail;
  const u = universeColors[group.universe];
  const freeSlots = Math.max(group.capacity - members.length, 0);
  const locale = localeOf(lang);
  const blockedForGender = group.women_only && profile?.gender !== 'femme';

  let footer: React.ReactNode;
  if (isOrganizer) {
    footer = <Button kind="dark" label={`💬 ${t('outings.chat')} · 👑 ${t('group.youOrganize')}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: group.id } })} />;
  } else if (mine?.status === 'accepted') {
    footer = (
      <>
        <Button kind="dark" label={`💬 ${t('outings.chat')}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: group.id } })} />
        <Button
          kind="ghost"
          label={t('group.leave')}
          onPress={() =>
            Alert.alert(t('group.leave'), '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('group.leave'), style: 'destructive', onPress: () => run(() => leaveGroup(group.id)) },
            ])
          }
        />
      </>
    );
  } else if (mine?.status === 'pending') {
    footer = (
      <>
        <Button kind="outline" label={t('group.pending')} disabled />
        <Button kind="ghost" label={t('group.cancelRequest')} loading={busy} onPress={() => run(() => leaveGroup(group.id))} />
      </>
    );
  } else if (group.status !== 'open' || freeSlots === 0) {
    footer = <Button kind="outline" label={t('group.full')} disabled />;
  } else {
    footer = (
      <Button
        label={blockedForGender ? t('explore.womenOnly') : t('group.join')}
        disabled={blockedForGender}
        loading={busy}
        onPress={() => run(() => requestJoin(group.id, note))}
      />
    );
  }

  return (
    <Screen scroll footer={footer}>
      <TopBar />

      <View style={[styles.hero, { backgroundColor: u.bg }]}>
        <AppText variant="tag" color={u.fg}>
          {`${t(`universes.${group.universe}`)}${group.subcategory ? ` · ${t(`sports.${group.subcategory}`)}` : ''}`.toUpperCase()}
        </AppText>
        <AppText variant="title" color={u.fg}>{group.title}</AppText>
        <View style={styles.pills}>
          <View style={styles.pill}><AppText variant="label">🕗 {relativeStart(group.starts_at, t, lang)}</AppText></View>
          <View style={styles.pill}><AppText variant="label" numberOfLines={1}>📍 {group.place_name}</AppText></View>
          {group.level ? (
            <View style={[styles.pill, { backgroundColor: colors.lime }]}>
              <AppText variant="label">{t('explore.level', { level: group.level })}</AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <AppText variant="heading">{t('group.members')}</AppText>
          <AppText variant="heading">{members.length}/{group.capacity}</AppText>
        </View>
        <View style={styles.members}>
          {members.map((m) => (
            <Pressable
              key={m.user_id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/membre/[id]', params: { id: m.user_id } })}
              style={styles.member}
            >
              <Avatar name={m.profile?.first_name ?? '?'} uri={m.profile?.photo} seed={m.user_id} size={54} />
              <AppText variant="small" center numberOfLines={1}>
                {m.profile?.first_name ?? ''}{m.role !== 'member' ? ' 👑' : ''}
              </AppText>
            </Pressable>
          ))}
          {Array.from({ length: Math.min(freeSlots, 6) }, (_, i) => (
            <View key={`free-${i}`} style={styles.member}>
              <View style={styles.freeSlot}><AppText variant="heading" color={colors.muted}>?</AppText></View>
              <AppText variant="small" color={colors.muted} center>{t('group.free')}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <AppText variant="label" color={colors.sub}>{t('group.when')}</AppText>
        <AppText variant="bodyStrong">
          {formatDay(group.starts_at, locale)} · {new Date(group.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </AppText>
        <AppText variant="label" color={colors.sub} style={{ marginTop: 10 }}>{t('group.where')}</AppText>
        <AppText variant="bodyStrong">{group.place_name}</AppText>
        {group.women_only ? (
          <AppText variant="tag" color={colors.coralDark} style={{ marginTop: 10 }}>♀ {t('explore.womenOnly').toUpperCase()}</AppText>
        ) : null}
      </View>

      {organizer ? (
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/membre/[id]', params: { id: organizer.id } })}
            style={styles.organizer}
          >
            <Avatar name={organizer.first_name} uri={organizer.photo} seed={organizer.id} size={48} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppText variant="bodyStrong">{organizer.first_name}</AppText>
                {organizer.verification_status === 'verified' ? <VerifiedBadge withLabel size={14} /> : null}
              </View>
              <AppText variant="small" color={colors.sub}>
                {organizer.rating_count ? `${Number(organizer.rating_avg).toFixed(1)} ★ · ` : ''}
                {organizer.outings_count} sorties · {Math.round(Number(organizer.attendance_rate))} % présence
              </AppText>
            </View>
            <AppText variant="heading" color={colors.sub}>›</AppText>
          </Pressable>
          {group.description ? (
            <>
              <AppText variant="label" color={colors.sub} style={{ marginTop: 12 }}>{t('group.about')}</AppText>
              <AppText>{group.description}</AppText>
            </>
          ) : null}
        </View>
      ) : null}

      {/* Salle d'attente : visible seulement par l'organisateur */}
      {isOrganizer && pending.length ? (
        <View style={styles.card}>
          <AppText variant="heading">Salle d’attente · {pending.length}</AppText>
          {pending.map((p) => (
            <View key={p.user_id} style={styles.request}>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/membre/[id]', params: { id: p.user_id } })}>
                <Avatar name={p.profile?.first_name ?? '?'} uri={p.profile?.photo} seed={p.user_id} size={44} />
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">
                  {p.profile?.first_name}
                  {p.profile?.rating_count ? `  ${Number(p.profile.rating_avg).toFixed(1)} ★` : ''}
                </AppText>
                {p.note ? <AppText variant="small" color={colors.sub}>💬 {p.note}</AppText> : null}
              </View>
              <Button small kind="outline" label="✕" accessibilityHint="Refuser" onPress={() => run(() => respondJoin(group.id, p.user_id, false))} />
              <Button small kind="dark" label="✓" accessibilityHint="Accepter" onPress={() => run(() => respondJoin(group.id, p.user_id, true))} />
            </View>
          ))}
        </View>
      ) : null}

      {!mine || mine.status === 'left' || mine.status === 'declined' ? (
        group.status === 'open' && freeSlots > 0 && !blockedForGender ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            <AppText variant="label" color={colors.sub}>{t('group.noteLabel')}</AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('group.notePlaceholder')}
              placeholderTextColor={colors.muted}
              maxLength={200}
              multiline
              style={styles.note}
              accessibilityLabel={t('group.noteLabel')}
            />
          </View>
        ) : null
      ) : null}

      {error ? <AppText variant="small" color={colors.danger} style={{ marginTop: 10 }}>{error}</AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: 20, gap: 10, marginBottom: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, maxWidth: '100%' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 6, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  member: { width: 62, alignItems: 'center', gap: 4 },
  freeSlot: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  organizer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  request: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 },
  note: {
    minHeight: 80, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top',
  },
});
