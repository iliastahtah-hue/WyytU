import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type Demandeur = {
  participationId: string;
  userId: string;
  prenom: string;
  ville: string;
  note_moyenne: number;
  nb_sorties: number;
};

export default function DemandesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [demandeurs, setDemandeurs] = useState<Demandeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { chargerDemandes(); }, []);

  const chargerDemandes = async () => {
    try {
      const { data: participations, error } = await supabase
        .from('participations')
        .select('id, user_id')
        .eq('activite_id', id)
        .eq('statut', 'en_attente');

      if (error || !participations) { setLoading(false); return; }

      const userIds = participations.map((p) => p.user_id);
      if (userIds.length === 0) { setDemandeurs([]); setLoading(false); return; }

      const { data: utilisateurs } = await supabase
        .from('utilisateurs')
        .select('id, prenom, ville, note_moyenne, nb_sorties')
        .in('id', userIds);

      const combined = participations.map((p) => {
        const u = utilisateurs?.find((u) => u.id === p.user_id);
        return {
          participationId: p.id,
          userId: p.user_id,
          prenom: u?.prenom || 'Utilisateur',
          ville: u?.ville || '',
          note_moyenne: u?.note_moyenne || 0,
          nb_sorties: u?.nb_sorties || 0,
        };
      });
      setDemandeurs(combined);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const traiterDemande = async (participationId: string, accepter: boolean) => {
    setActionLoading(participationId);
    try {
      const { error } = await supabase
        .from('participations')
        .update({ statut: accepter ? 'accepte' : 'refuse' })
        .eq('id', participationId);

      if (error) { Alert.alert('Erreur', error.message); return; }

      if (accepter) {
        const { data: activite } = await supabase
          .from('activites')
          .select('participants_count')
          .eq('id', id)
          .single();
        await supabase
          .from('activites')
          .update({ participants_count: (activite?.participants_count || 0) + 1 })
          .eq('id', id);
      }

      setDemandeurs((prev) => prev.filter((d) => d.participationId !== participationId));
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
    finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerSub}>Choisir les participants</Text>
          <Text style={s.headerTitle}>Demandes en attente</Text>
        </View>
      </View>

      <View style={s.infoBanner}>
        <Text style={{ fontSize: 16 }}>🛡️</Text>
        <Text style={s.infoBannerTxt}>Vérifie les profils avant d'accepter</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {demandeurs.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={s.emptyTxt}>Aucune demande en attente</Text>
          </View>
        ) : (
          demandeurs.map((d) => (
            <View key={d.participationId} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{d.prenom[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nomRow}>
                    <Text style={s.nom}>{d.prenom}</Text>
                    <Text style={s.note}>★ {d.note_moyenne > 0 ? d.note_moyenne.toFixed(1) : 'Nouveau'}</Text>
                  </View>
                  <Text style={s.sousTitre}>
                    {d.nb_sorties} sortie{d.nb_sorties > 1 ? 's' : ''}{d.ville ? ` · ${d.ville}` : ''}
                  </Text>
                  <View style={s.badgeVerifie}>
                    <Text style={s.badgeVerifieTxt}>✅ Conducteur Platine</Text>
                  </View>
                </View>
              </View>

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={s.refuserBtn}
                  onPress={() => traiterDemande(d.participationId, false)}
                  disabled={actionLoading === d.participationId}>
                  <Text style={s.refuserTxt}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.accepterBtn}
                  onPress={() => traiterDemande(d.participationId, true)}
                  disabled={actionLoading === d.participationId}>
                  <Text style={s.accepterTxt}>
                    {actionLoading === d.participationId ? '⏳' : 'Accepter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1209' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1209' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(201,168,76,0.12)', marginHorizontal: 20, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  infoBannerTxt: { color: '#E8C96A', fontSize: 13, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTop: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#1A1209', fontSize: 22, fontWeight: '900' },
  nomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  nom: { fontSize: 17, fontWeight: '800', color: '#fff' },
  note: { fontSize: 14, color: '#E8C96A', fontWeight: '700' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  badgeVerifie: { alignSelf: 'flex-start' },
  badgeVerifieTxt: { fontSize: 12, color: '#8B9DFF', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  refuserBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  refuserTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  accepterBtn: { flex: 1.4, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1DB954', alignItems: 'center' },
  accepterTxt: { color: '#0A2E17', fontSize: 15, fontWeight: '800' },
});