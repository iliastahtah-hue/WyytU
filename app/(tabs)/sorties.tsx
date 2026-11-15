import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrModal } from '@/src/components/QrModal';
import { AppText, Button } from '@/src/components/ui';
import { leaveGroup } from '@/src/features/groups/api';
import { localeOf, relativeStart } from '@/src/features/groups/time';
import { confirmPresence, fetchMyOutings, type MyOuting } from '@/src/features/outings/api';
import { useI18n } from '@/src/i18n';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius, TOUCH, universeColors } from '@/src/theme/tokens';

const H = 3600 * 1000;

function OutingCard({ o, past, onChanged, onQr }: { o: MyOuting; past: boolean; onChanged: () => void; onQr: (o: MyOuting) => void }) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const u = universeColors[o.universe];
  const start = new Date(o.starts_at).getTime();
  const isOrganizer = o.me.status === 'accepted' && o.me.role !== 'member';
  const accepted = o.me.status === 'accepted';
  const canConfirm = accepted && !past && !o.me.confirmed_at && start - Date.now() < 24 * H;
  const canRate = past && accepted && !o.ratedByMe && Date.now() - start < 7 * 24 * H && o.acceptedCount > 1;
  const canPoint = past && isOrganizer && Date.now() - start < 48 * H;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (e) {
      Alert.alert(readableError(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  const badge = isOrganizer ? t('outings.organizer') : accepted ? t('outings.member') : t('outings.pending');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/groupe/[id]', params: { id: o.id } })}
      style={styles.card}
    >
      <View style={[styles.side, { backgroundColor: u.bg }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.row}>
          <AppText variant="tag" color={colors.sub} style={{ flex: 1 }}>
            {past
              ? new Date(o.starts_at).toLocaleDateString(localeOf(lang), { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
              : relativeStart(o.starts_at, t, lang).toUpperCase()}
          </AppText>
          <View style={[styles.badge, { backgroundColor: accepted ? colors.limeSoft : colors.sand }]}>
            <AppText variant="tag">{badge}</AppText>
          </View>
        </View>
        <AppText variant="heading" numberOfLines={2}>{o.title}</AppText>
        <AppText variant="small" color={colors.sub} numberOfLines={1}>📍 {o.place_name}</AppText>

        {!past && accepted ? (
          <AppText variant="small" color={colors.sub}>
            {t('outings.confirmedCount', { n: o.confirmedCount, total: o.acceptedCount })}
          </AppText>
        ) : null}

        {o.me.no_show ? (
          <View style={styles.row}>
            <AppText variant="label" color={colors.danger} style={{ flex: 1 }}>{t('outings.noShow')}</AppText>
            <Button small kind="outline" label={t('outings.contest')} onPress={() => router.push({ pathname: '/contester/[id]', params: { id: o.id } })} />
          </View>
        ) : null}

        <View style={styles.actions}>
          {canConfirm ? <Button small label={t('outings.confirm')} loading={busy} onPress={() => run(() => confirmPresence(o.id))} /> : null}
          {!past && accepted && o.me.confirmed_at ? <Button small kind="lime" label={t('outings.confirmed')} disabled /> : null}
          {!past && isOrganizer && o.partner_id ? <Button small kind="dark" label={t('outings.showQr')} onPress={() => onQr(o)} /> : null}
          {accepted && !past ? (
            <Button small kind="outline" label={`💬 ${t('outings.chat')}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: o.id } })} />
          ) : null}
          {canRate ? <Button small label={t('outings.rate')} onPress={() => router.push({ pathname: '/noter/[id]', params: { id: o.id } })} /> : null}
          {past && accepted && o.ratedByMe ? <Button small kind="lime" label={t('outings.rated')} disabled /> : null}
          {canPoint ? (
            <Button small kind="dark" label={t('outings.attendance')} onPress={() => router.push({ pathname: '/presences/[id]', params: { id: o.id } })} />
          ) : null}
        </View>

        {!past && accepted && !isOrganizer ? (
          <Pressable
            accessibilityRole="button"
            style={styles.link}
            onPress={() =>
              Alert.alert(t('outings.leave'), 'Préviens le groupe dans le chat si tu peux. Une annulation tardive (moins de 2 h avant) compte dans ta fiabilité.', [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('outings.leave'), style: 'destructive', onPress: () => run(() => leaveGroup(o.id)) },
              ])
            }
          >
            <AppText variant="small" color={colors.coralDark}>{t('outings.leave')}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SortiesScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [items, setItems] = useState<MyOuting[]>([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<MyOuting | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setItems(await fetchMyOutings(session.user.id));
    } catch {
      // on garde l'ancienne liste en cas de coupure réseau
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { upcoming, past } = useMemo(() => {
    const limit = Date.now() - 3 * H; // une sortie reste « à venir » jusqu'à 3 h après son début
    return {
      upcoming: items.filter((o) => new Date(o.starts_at).getTime() >= limit),
      past: items.filter((o) => new Date(o.starts_at).getTime() < limit && o.me.status === 'accepted').reverse(),
    };
  }, [items]);

  const data = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.coral} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            <AppText variant="display">{t('outings.title')}</AppText>
            <View style={styles.segment} accessibilityRole="tablist">
              {(['upcoming', 'past'] as const).map((k) => (
                <Pressable
                  key={k}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === k }}
                  onPress={() => setTab(k)}
                  style={[styles.segBtn, tab === k && styles.segOn]}
                >
                  <AppText variant="label" color={tab === k ? colors.white : colors.ink} center>
                    {k === 'upcoming' ? `${t('outings.upcoming')} · ${upcoming.length}` : `${t('outings.past')} · ${past.length}`}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <OutingCard o={item} past={tab === 'past'} onChanged={load} onQr={setQr} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <AppText color={colors.sub} center>{tab === 'upcoming' ? t('outings.empty') : t('outings.emptyPast')}</AppText>
            </View>
          )
        }
      />
      {qr ? <QrModal visible groupId={qr.id} title={qr.title} onClose={() => setQr(null)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 140 },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4 },
  segBtn: { flex: 1, minHeight: TOUCH, borderRadius: radius.pill, justifyContent: 'center' },
  segOn: { backgroundColor: colors.ink },
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, overflow: 'hidden' },
  side: { width: 6, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  link: { minHeight: TOUCH, justifyContent: 'center', alignSelf: 'flex-start' },
  empty: { padding: 28, backgroundColor: colors.card, borderRadius: radius.xl },
});
