import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Activite = {
  id: string;
  titre: string;
  description: string;
  ville: string;
  categorie: string;
  date: string;
  max_participants: number;
  participants_count: number;
  createur_prenom: string;
};

const CATEGORIES: Record<string, { couleur1: string; couleur2: string; emoji: string }> = {
  Sport: { couleur1: '#E8000D', couleur2: '#B50009', emoji: '⚡' },
  Resto: { couleur1: '#FF6A00', couleur2: '#EE4B2B', emoji: '🍕' },
  Ciné: { couleur1: '#CC0000', couleur2: '#8B0000', emoji: '🎬' },
  Soirée: { couleur1: '#7B2FBE', couleur2: '#4A0E8F', emoji: '🎉' },
  Gaming: { couleur1: '#0070F3', couleur2: '#003B9E', emoji: '🎮' },
  Voyage: { couleur1: '#00B4D8', couleur2: '#0077B6', emoji: '✈️' },
  Musique: { couleur1: '#1DB954', couleur2: '#158A3E', emoji: '🎵' },
  'Bien-être': { couleur1: '#00897B', couleur2: '#00695C', emoji: '🏃' },
  Social: { couleur1: '#FF4B7D', couleur2: '#C2185B', emoji: '👥' },
  Art: { couleur1: '#FFD600', couleur2: '#F9A825', emoji: '🎨' },
};

const getCat = (categorie: string) =>
  CATEGORIES[categorie] || { couleur1: '#1A1A1A', couleur2: '#3A3A3A', emoji: '✦' };

export default function MesActivitesScreen() {
  const router = useRouter();
  const [activitesCrees, setActivitesCrees] = useState<Activite[]>([]);
  const [activitesRejointes, setActivitesRejointes] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onglet, setOnglet] = useState<'crees' | 'rejointes'>('crees');

  useEffect(() => {
    chargerActivites();
  }, []);

  const chargerActivites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Plans créés
      const { data: crees } = await supabase
        .from('activites')
        .select('*')
        .eq('createur_id', user.id)
        .order('created_at', { ascending: false });

      if (crees) setActivitesCrees(crees);

      // Plans rejoints
      const { data: participations } = await supabase
        .from('participations')
        .select('activite_id')
        .eq('user_id', user.id);

      if (participations && participations.length > 0) {
        const ids = participations.map((p) => p.activite_id);
        const { data: rejointes } = await supabase
          .from('activites')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false });

        if (rejointes) setActivitesRejointes(rejointes);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    chargerActivites();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activitesActuelles = onglet === 'crees' ? activitesCrees : activitesRejointes;

  const ActiviteCard = ({ activite }: { activite: Activite }) => {
    const cat = getCat(activite.categorie);
    const placesRestantes = (activite.max_participants || 0) - (activite.participants_count || 0);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cat.couleur1 }]}
        onPress={() => router.push(`/activite/${activite.id}` as any)}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconWrapper, { backgroundColor: cat.couleur2 }]}>
            <Text style={styles.cardIcon}>{cat.emoji}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitre} numberOfLines={1}>{activite.titre}</Text>
            <Text style={styles.cardVille}>📍 {activite.ville}</Text>
          </View>
          <View style={[styles.cardTag, { backgroundColor: cat.couleur2 }]}>
            <Text style={styles.cardTagTexte}>{activite.categorie}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>{activite.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaTexte}>🗓 {formatDate(activite.date)}</Text>
            <Text style={styles.cardMetaTexte}>
              👥 {activite.participants_count || 0}/{activite.max_participants || '∞'}
            </Text>
          </View>
          {onglet === 'crees' && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => router.push(`/chat/${activite.id}` as any)}>
                <Text style={styles.chatBtnTexte}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noterBtn}
                onPress={() => router.push(`/noter/${activite.id}` as any)}>
                <Text style={styles.noterBtnTexte}>⭐</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Mes plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{activitesCrees.length}</Text>
          <Text style={styles.statLabel}>Créés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{activitesRejointes.length}</Text>
          <Text style={styles.statLabel}>Rejoints</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{activitesCrees.length + activitesRejointes.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* ONGLETS */}
      <View style={styles.onglets}>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'crees' && styles.ongletActive]}
          onPress={() => setOnglet('crees')}>
          <Text style={[styles.ongletTexte, onglet === 'crees' && styles.ongletTexteActive]}>
            ✦ Plans créés ({activitesCrees.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'rejointes' && styles.ongletActive]}
          onPress={() => setOnglet('rejointes')}>
          <Text style={[styles.ongletTexte, onglet === 'rejointes' && styles.ongletTexteActive]}>
            👥 Plans rejoints ({activitesRejointes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
        </View>
      ) : (
        <ScrollView
          style={styles.liste}
          contentContainerStyle={styles.listeContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8000D" />
          }>
          {activitesActuelles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{onglet === 'crees' ? '📋' : '🎯'}</Text>
              <Text style={styles.emptyTexte}>
                {onglet === 'crees' ? 'Aucun plan créé' : 'Aucun plan rejoint'}
              </Text>
              <Text style={styles.emptySub}>
                {onglet === 'crees'
                  ? 'Crée ton premier plan depuis Explorer !'
                  : 'Rejoins un plan depuis Explorer !'}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/explore' as any)}>
                <Text style={styles.emptyBtnTexte}>Explorer les plans →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activitesActuelles.map((a) => <ActiviteCard key={a.id} activite={a} />)
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerTitre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  statNombre: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#AAA', marginTop: 4, fontWeight: '600' },

  onglets: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#EEE8DE', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#DDD4C4' },
  onglet: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  ongletActive: { backgroundColor: '#1A1A1A' },
  ongletTexte: { fontSize: 12, fontWeight: '700', color: '#AAA' },
  ongletTexteActive: { color: '#fff' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  liste: { flex: 1 },
  listeContent: { paddingHorizontal: 20, gap: 12 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTexte: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#AAA', textAlign: 'center' },
  emptyBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },

  card: { borderRadius: 20, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconWrapper: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 22 },
  cardHeaderInfo: { flex: 1 },
  cardTitre: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardVille: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  cardTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardTagTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { gap: 3 },
  cardMetaTexte: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chatBtnTexte: { fontSize: 16 },
  noterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  noterBtnTexte: { fontSize: 16 },
});