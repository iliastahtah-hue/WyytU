import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { fetchMiniProfiles, type MiniProfile } from '@/src/features/groups/api';
import type { AttendanceDispute, Partner, Rating, Report } from '@/src/lib/database.types';
import { signedUrls } from '@/src/lib/storage';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, radius, TOUCH } from '@/src/theme/tokens';

type Tab = 'selfies' | 'avis' | 'signalements' | 'contestations' | 'partenaires';
const TABS: { id: Tab; label: string }[] = [
  { id: 'selfies', label: 'Selfies' },
  { id: 'avis', label: 'Avis' },
  { id: 'signalements', label: 'Signalements' },
  { id: 'contestations', label: 'Contestations' },
  { id: 'partenaires', label: 'Partenaires' },
];

const REASON: Record<Report['reason'], string> = {
  comportement: 'Comportement déplacé',
  harcelement: 'Harcèlement',
  faux_profil: 'Faux profil',
  absence: 'Absence',
  contenu: 'Contenu inapproprié',
  autre: 'Autre',
};

type Selfie = { id: string; first_name: string; selfie_path: string; url?: string; photo?: string | null };

export default function ModerationScreen() {
  const [tab, setTab] = useState<Tab>('selfies');
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [disputes, setDisputes] = useState<AttendanceDispute[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [people, setPeople] = useState<Record<string, MiniProfile>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, r, rep, d, p] = await Promise.all([
      supabase.rpc('admin_pending_selfies'),
      supabase.from('ratings').select('*').eq('moderation_status', 'pending').order('created_at').limit(100),
      supabase.from('reports').select('*').eq('status', 'pending').order('created_at').limit(100),
      supabase.from('attendance_disputes').select('*').eq('status', 'pending').order('created_at').limit(100),
      supabase.from('partners').select('*').eq('status', 'pending').order('created_at').limit(100),
    ]);
    const sel = (s.data ?? []) as Selfie[];
    const ids = [
      ...sel.map((x) => x.id),
      ...(r.data ?? []).flatMap((x) => [x.rater_id, x.rated_id]),
      ...(rep.data ?? []).flatMap((x) => [x.reporter_id, x.reported_user_id ?? '']).filter(Boolean),
      ...(d.data ?? []).map((x) => x.user_id),
    ];
    const [urls, found] = await Promise.all([signedUrls('selfies', sel.map((x) => x.selfie_path)), fetchMiniProfiles(ids)]);
    setPeople(found);
    setSelfies(sel.map((x) => ({ ...x, url: urls[x.selfie_path], photo: found[x.id]?.photo })));
    setRatings(r.data ?? []);
    setReports(rep.data ?? []);
    setDisputes(d.data ?? []);
    setPartners(p.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => PromiseLike<{ error: unknown }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return Alert.alert(readableError(error, 'Action impossible.'));
    load();
  };

  const reviewSelfie = async (s: Selfie, approve: boolean) => {
    setBusy(true);
    const { data: path, error } = await supabase.rpc('admin_review_selfie', { p_user: s.id, p_approve: approve });
    // Promesse faite à l'utilisateur : le selfie est supprimé après vérification
    if (!error && approve && path) await supabase.storage.from('selfies').remove([path]);
    setBusy(false);
    if (error) return Alert.alert(readableError(error, 'Action impossible.'));
    load();
  };

  const name = (id?: string | null) => (id ? people[id]?.first_name ?? 'Membre' : '—');
  const counts: Record<Tab, number> = {
    selfies: selfies.length,
    avis: ratings.length,
    signalements: reports.length,
    contestations: disputes.length,
    partenaires: partners.length,
  };

  const Actions = ({ onYes, onNo, yes = 'Valider', no = 'Refuser' }: { onYes: () => void; onNo: () => void; yes?: string; no?: string }) => (
    <View style={styles.actions}>
      <Button small kind="outline" label={no} onPress={onNo} disabled={busy} style={{ flex: 1 }} />
      <Button small kind="dark" label={yes} onPress={onYes} disabled={busy} style={{ flex: 1 }} />
    </View>
  );

  const empty = <AppText color={colors.sub} center style={{ marginTop: 30 }}>Rien à traiter ici 🎉</AppText>;

  return (
    <Screen scroll>
      <TopBar title="Modération" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {TABS.map((x) => (
          <Pressable
            key={x.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === x.id }}
            onPress={() => setTab(x.id)}
            style={[styles.tab, tab === x.id && styles.tabOn]}
          >
            <AppText variant="label" color={tab === x.id ? colors.white : colors.ink}>
              {x.label}{counts[x.id] ? ` · ${counts[x.id]}` : ''}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {tab === 'selfies' && (selfies.length ? selfies.map((s) => (
          <View key={s.id} style={styles.card}>
            <AppText variant="heading">{s.first_name}</AppText>
            <AppText variant="small" color={colors.sub}>Compare le selfie (gauche) à la photo de profil (droite).</AppText>
            <View style={styles.compare}>
              {s.url ? <Image source={{ uri: s.url }} style={styles.photo} contentFit="cover" /> : <View style={styles.photo} />}
              {s.photo ? <Image source={{ uri: s.photo }} style={styles.photo} contentFit="cover" /> : <View style={styles.photo} />}
            </View>
            <Actions onYes={() => reviewSelfie(s, true)} onNo={() => reviewSelfie(s, false)} />
          </View>
        )) : empty)}

        {tab === 'avis' && (ratings.length ? ratings.map((r) => (
          <View key={r.id} style={styles.card}>
            <AppText variant="label">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)} · {name(r.rater_id)} → {name(r.rated_id)}</AppText>
            {r.reason ? <AppText color={colors.danger}>Motif : {r.reason}</AppText> : null}
            {r.comment ? <AppText>« {r.comment} »</AppText> : <AppText color={colors.sub}>Note sans commentaire</AppText>}
            <Actions
              yes="Publier"
              onYes={() => act(() => supabase.rpc('admin_review_rating', { p_rating: r.id, p_approve: true }))}
              onNo={() => act(() => supabase.rpc('admin_review_rating', { p_rating: r.id, p_approve: false }))}
            />
          </View>
        )) : empty)}

        {tab === 'signalements' && (reports.length ? reports.map((r) => (
          <View key={r.id} style={styles.card}>
            <AppText variant="label" color={colors.danger}>{REASON[r.reason]}</AppText>
            <AppText>{name(r.reporter_id)} signale {name(r.reported_user_id)}</AppText>
            {r.details ? <AppText color={colors.sub}>{r.details}</AppText> : null}
            <AppText variant="small" color={colors.muted}>
              Pour suspendre un compte : Supabase › Authentication › Users › Ban user.
            </AppText>
            <Actions
              yes="Fondé"
              no="Classer"
              onYes={() => act(() => supabase.rpc('admin_resolve_report', { p_report: r.id, p_valid: true }))}
              onNo={() => act(() => supabase.rpc('admin_resolve_report', { p_report: r.id, p_valid: false }))}
            />
          </View>
        )) : empty)}

        {tab === 'contestations' && (disputes.length ? disputes.map((d) => (
          <View key={d.id} style={styles.card}>
            <AppText variant="heading">{name(d.user_id)}</AppText>
            <AppText>« {d.message} »</AppText>
            <Actions
              yes="Accepter"
              onYes={() => act(() => supabase.rpc('admin_resolve_dispute', { p_dispute: d.id, p_accept: true }))}
              onNo={() => act(() => supabase.rpc('admin_resolve_dispute', { p_dispute: d.id, p_accept: false }))}
            />
          </View>
        )) : empty)}

        {tab === 'partenaires' && (partners.length ? partners.map((p) => (
          <View key={p.id} style={styles.card}>
            <AppText variant="heading">{p.name}</AppText>
            <AppText color={colors.sub}>{p.address ?? 'Adresse non renseignée'} · −{p.discount_pct} %</AppText>
            <AppText variant="small" color={colors.muted}>
              {p.lat != null ? `Position : ${p.lat.toFixed(4)}, ${p.lng?.toFixed(4)}` : 'Pas de position sur la carte'}
            </AppText>
            <Actions
              onYes={() => act(() => supabase.rpc('admin_review_partner', { p_partner: p.id, p_approve: true }))}
              onNo={() => act(() => supabase.rpc('admin_review_partner', { p_partner: p.id, p_approve: false }))}
            />
          </View>
        )) : empty)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tab: { minHeight: TOUCH - 4, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, justifyContent: 'center' },
  tabOn: { backgroundColor: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 8 },
  compare: { flexDirection: 'row', gap: 10 },
  photo: { flex: 1, aspectRatio: 0.8, borderRadius: radius.md, backgroundColor: colors.sand },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
