import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TabBar from '../../components/TabBar';
import { supabase } from '../../lib/supabase';

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
  createur_id: string;
  latitude?: number;
  longitude?: number;
};

const CATEGORIES = [
  { label: 'Sport', emoji: '⚡', couleur1: '#E8000D', couleur2: '#B50009' },
  { label: 'Resto', emoji: '🍕', couleur1: '#FF6A00', couleur2: '#EE4B2B' },
  { label: 'Ciné', emoji: '🎬', couleur1: '#CC0000', couleur2: '#8B0000' },
  { label: 'Soirée', emoji: '🎉', couleur1: '#7B2FBE', couleur2: '#4A0E8F' },
  { label: 'Gaming', emoji: '🎮', couleur1: '#0070F3', couleur2: '#003B9E' },
  { label: 'Voyage', emoji: '✈️', couleur1: '#00B4D8', couleur2: '#0077B6' },
  { label: 'Musique', emoji: '🎵', couleur1: '#1DB954', couleur2: '#158A3E' },
  { label: 'Bien-être', emoji: '🏃', couleur1: '#00897B', couleur2: '#00695C' },
  { label: 'Social', emoji: '👥', couleur1: '#FF4B7D', couleur2: '#C2185B' },
  { label: 'Art', emoji: '🎨', couleur1: '#FFD600', couleur2: '#F9A825' },
];

const getCouleurs = (categorie: string) => {
  const cat = CATEGORIES.find((c) => c.label === categorie);
  return cat ? { c1: cat.couleur1, c2: cat.couleur2, emoji: cat.emoji } : { c1: '#1A1A1A', c2: '#3A3A3A', emoji: '✦' };
};

export default function ActiviteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activite, setActivite] = useState<Activite | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejoindreLoading, setRejoindreLoading] = useState(false);
  const [dejaRejoint, setDejaRejoint] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { chargerActivite(); checkUser(); }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const chargerActivite = async () => {
    try {
      const { data, error } = await supabase.from('activites').select('*').eq('id', id).single();
      if (!error && data) setActivite(data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const rejoindre = async () => {
    if (!userId) { Alert.alert('Erreur', 'Tu dois être connecté !'); return; }
    if (dejaRejoint) { Alert.alert('Info', 'Tu as déjà rejoint ce plan !'); return; }
    setRejoindreLoading(true);
    try {
      const { error } = await supabase.from('participations').insert({ activite_id: id, user_id: userId });
      if (!error) {
        await supabase.from('activites').update({ participants_count: (activite?.participants_count || 0) + 1 }).eq('id', id);
        setDejaRejoint(true);
        setActivite((prev) => prev ? { ...prev, participants_count: (prev.participants_count || 0) + 1 } : prev);
        Alert.alert('🎉 Bravo !', 'Tu as rejoint le plan !');
      }
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
    finally { setRejoindreLoading(false); }
  };

  const ouvrirMaps = () => {
    if (!activite?.latitude || !activite?.longitude) return;
    const url = `https://www.openstreetmap.org/?mlat=${activite.latitude}&mlon=${activite.longitude}#map=15/${activite.latitude}/${activite.longitude}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(`maps://app?daddr=${activite.latitude},${activite.longitude}`).catch(() => {
        Linking.openURL(url);
      });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateCourt = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours > 0 && hours < 24) return `Dans ${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E8000D" /></View>;
  }

  if (!activite) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorTexte}>Plan introuvable</Text>
        <TouchableOpacity style={styles.retourBtn} onPress={() => router.back()}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { c1, c2, emoji } = getCouleurs(activite.categorie);
  const placesRestantes = (activite.max_participants || 0) - (activite.participants_count || 0);
  const estCreateur = userId === activite.createur_id;
  const tauxRemplissage = activite.max_participants ? (activite.participants_count / activite.max_participants) * 100 : 0;
  const hasLocation = activite.latitude && activite.longitude;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* HERO */}
        <View style={[styles.hero, { backgroundColor: c1 }]}>
          <View style={[styles.heroBgCircle1, { backgroundColor: c2 }]} />
          <View style={[styles.heroBgCircle2, { backgroundColor: c2 }]} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.heroTop}>
            <Text style={styles.heroEmoji}>{emoji}</Text>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagTexte}>{activite.categorie}</Text>
            </View>
          </View>
          <Text style={styles.heroTitre}>{activite.titre}</Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}><Text style={styles.heroPillTexte}>📍 {activite.ville}</Text></View>
            <View style={styles.heroPill}><Text style={styles.heroPillTexte}>🗓 {formatDateCourt(activite.date)}</Text></View>
            <View style={styles.heroPill}><Text style={styles.heroPillTexte}>👥 {activite.participants_count}/{activite.max_participants}</Text></View>
          </View>
        </View>

        <View style={styles.contenu}>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: c1 + '12', borderColor: c1 + '30' }]}>
              <Text style={[styles.statNombre, { color: c1 }]}>{activite.participants_count || 0}</Text>
              <Text style={styles.statLabel}>Inscrits</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: c1 + '12', borderColor: c1 + '30' }]}>
              <Text style={[styles.statNombre, { color: c1 }]}>{activite.max_participants || '∞'}</Text>
              <Text style={styles.statLabel}>Places</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: placesRestantes > 0 ? '#1DB95412' : '#E8000D12', borderColor: placesRestantes > 0 ? '#1DB95430' : '#E8000D30' }]}>
              <Text style={[styles.statNombre, { color: placesRestantes > 0 ? '#1DB954' : '#E8000D' }]}>
                {placesRestantes > 0 ? placesRestantes : '0'}
              </Text>
              <Text style={styles.statLabel}>Restantes</Text>
            </View>
          </View>

          {/* PROGRESS */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Taux de remplissage</Text>
              <Text style={[styles.progressPct, { color: c1 }]}>{Math.round(tauxRemplissage)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${Math.min(tauxRemplissage, 100)}%` as any, backgroundColor: c1 }]} />
            </View>
            {placesRestantes <= 3 && placesRestantes > 0 && (
              <Text style={styles.urgenceTexte}>🔥 Plus que {placesRestantes} place{placesRestantes > 1 ? 's' : ''} !</Text>
            )}
          </View>

          {/* DATE */}
          <View style={styles.dateCard}>
            <View style={[styles.dateIconWrapper, { backgroundColor: c1 }]}>
              <Text style={styles.dateIcon}>📅</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Date & heure</Text>
              <Text style={styles.dateValeur}>{formatDate(activite.date)}</Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>À propos du plan</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{activite.description}</Text>
            </View>
          </View>

          {/* LOCALISATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>📍 Localisation</Text>
            {hasLocation ? (
              <TouchableOpacity style={styles.mapCard} onPress={ouvrirMaps}>
                <View style={[styles.mapIllustration, { backgroundColor: c1 + '15' }]}>
                  <Text style={styles.mapIllustrationEmoji}>🗺️</Text>
                  <View style={styles.mapIllustrationContent}>
                    <Text style={styles.mapIllustrationTitre}>{activite.ville}</Text>
                    <Text style={styles.mapIllustrationSub}>
                      {activite.latitude?.toFixed(4)}, {activite.longitude?.toFixed(4)}
                    </Text>
                  </View>
                  <View style={[styles.mapIllustrationBtn, { backgroundColor: c1 }]}>
                    <Text style={styles.mapIllustrationBtnTexte}>Ouvrir →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noMapCard}>
                <Text style={styles.noMapEmoji}>🗺️</Text>
                <Text style={styles.noMapTexte}>Localisation non renseignée</Text>
                <Text style={styles.noMapSub}>{activite.ville}</Text>
              </View>
            )}
          </View>

          {/* ORGANISATEUR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>Organisateur</Text>
            <View style={styles.createurCard}>
              <View style={[styles.createurAvatar, { backgroundColor: c1 }]}>
                <Text style={styles.createurAvatarTexte}>{activite.createur_prenom?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.createurInfo}>
                <Text style={styles.createurNom}>{activite.createur_prenom}</Text>
                <Text style={styles.createurSub}>Organisateur · ✅ Vérifié</Text>
              </View>
              <View style={[styles.createurBadge, { backgroundColor: c1 + '15' }]}>
                <Text style={styles.createurBadgeTexte}>👑</Text>
              </View>
            </View>
          </View>

          {estCreateur && (
            <View style={[styles.organisateurBanner, { backgroundColor: c1 + '15', borderColor: c1 + '40' }]}>
              <Text style={styles.organisateurEmoji}>✦</Text>
              <Text style={[styles.organisateurTexte, { color: c1 }]}>Tu es l'organisateur de ce plan</Text>
            </View>
          )}

          {/* BOUTONS */}
          {!estCreateur && (
            <TouchableOpacity
              style={[styles.boutonRejoindre, { backgroundColor: dejaRejoint ? '#1DB954' : c1 }]}
              onPress={rejoindre}
              disabled={rejoindreLoading || dejaRejoint}>
              <Text style={styles.boutonRejoindreTexte}>
                {rejoindreLoading ? '⏳ En cours...' : dejaRejoint ? '✅ Plan rejoint !' : `${emoji} Rejoindre ce plan`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.boutonsSecondaires}>
            <TouchableOpacity style={[styles.boutonSecondaire, { borderColor: c1 }]} onPress={() => router.push(`/chat/${id}` as any)}>
              <Text style={styles.boutonSecondaireIcon}>💬</Text>
              <Text style={[styles.boutonSecondaireTexte, { color: c1 }]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.boutonSecondaire, { borderColor: '#FF9500' }]} onPress={() => router.push(`/noter/${id}` as any)}>
              <Text style={styles.boutonSecondaireIcon}>⭐</Text>
              <Text style={[styles.boutonSecondaireTexte, { color: '#FF9500' }]}>Noter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.boutonSecondaire, { borderColor: '#AAA' }]}>
              <Text style={styles.boutonSecondaireIcon}>📤</Text>
              <Text style={[styles.boutonSecondaireTexte, { color: '#AAA' }]}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2', gap: 12 },
  errorEmoji: { fontSize: 52 },
  errorTexte: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  retourBtn: { backgroundColor: '#EEE8DE', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  retourTexte: { fontSize: 15, color: '#E8000D', fontWeight: '700' },
  hero: { paddingTop: 60, paddingBottom: 36, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroBgCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.3, right: -60, top: -60 },
  heroBgCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, opacity: 0.2, left: -20, bottom: -20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  backIcon: { fontSize: 20, color: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroEmoji: { fontSize: 48 },
  heroTag: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  heroTagTexte: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  heroTitre: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 34, marginBottom: 20, letterSpacing: -0.5 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroPillTexte: { color: '#fff', fontSize: 12, fontWeight: '600' },
  contenu: { paddingHorizontal: 20, paddingTop: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5 },
  statNombre: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#AAA', marginTop: 4, fontWeight: '600' },
  progressCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13, color: '#AAA', fontWeight: '600' },
  progressPct: { fontSize: 13, fontWeight: '800' },
  progressBg: { height: 8, backgroundColor: '#EEE8DE', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: 8, borderRadius: 4 },
  urgenceTexte: { fontSize: 12, fontWeight: '700', color: '#FF9500', marginTop: 8 },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  dateIconWrapper: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateIcon: { fontSize: 22 },
  dateLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', marginBottom: 2 },
  dateValeur: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 12, letterSpacing: -0.3 },
  descriptionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  description: { fontSize: 15, color: '#555', lineHeight: 24 },
  mapCard: { borderRadius: 20, overflow: 'hidden' },
  mapIllustration: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#EEE8DE' },
  mapIllustrationEmoji: { fontSize: 40 },
  mapIllustrationContent: { flex: 1 },
  mapIllustrationTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  mapIllustrationSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  mapIllustrationBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  mapIllustrationBtnTexte: { color: '#fff', fontWeight: '700', fontSize: 13 },
  noMapCard: { backgroundColor: '#EEE8DE', borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 },
  noMapEmoji: { fontSize: 40 },
  noMapTexte: { fontSize: 15, fontWeight: '700', color: '#AAA' },
  noMapSub: { fontSize: 13, color: '#BBB' },
  createurCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  createurAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  createurAvatarTexte: { color: '#fff', fontSize: 22, fontWeight: '900' },
  createurInfo: { flex: 1 },
  createurNom: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  createurSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  createurBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  createurBadgeTexte: { fontSize: 18 },
  organisateurBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1 },
  organisateurEmoji: { fontSize: 18, color: '#1A1A1A' },
  organisateurTexte: { fontSize: 14, fontWeight: '700' },
  boutonRejoindre: { borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  boutonRejoindreTexte: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  boutonsSecondaires: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  boutonSecondaire: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, padding: 14, borderWidth: 2, backgroundColor: '#fff' },
  boutonSecondaireIcon: { fontSize: 18 },
  boutonSecondaireTexte: { fontSize: 13, fontWeight: '800' },
});