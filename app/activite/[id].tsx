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
  return cat
    ? { c1: cat.couleur1, c2: cat.couleur2, emoji: cat.emoji }
    : { c1: '#1A1A1A', c2: '#3A3A3A', emoji: '✦' };
};

export default function ActiviteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activite, setActivite] = useState<Activite | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejoindreLoading, setRejoindreLoading] = useState(false);
  const [dejaRejoint, setDejaRejoint] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    chargerActivite();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const chargerActivite = async () => {
    try {
      const { data, error } = await supabase
        .from('activites')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) setActivite(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const rejoindre = async () => {
    if (!userId) {
      Alert.alert('Erreur', 'Tu dois être connecté !');
      return;
    }
    if (dejaRejoint) {
      Alert.alert('Info', 'Tu as déjà rejoint ce plan !');
      return;
    }

    setRejoindreLoading(true);
    try {
      const { error } = await supabase
        .from('participations')
        .insert({ activite_id: id, user_id: userId });

      if (!error) {
        await supabase
          .from('activites')
          .update({ participants_count: (activite?.participants_count || 0) + 1 })
          .eq('id', id);

        setDejaRejoint(true);
        setActivite((prev) =>
          prev ? { ...prev, participants_count: (prev.participants_count || 0) + 1 } : prev
        );
        Alert.alert('🎉 Bravo !', 'Tu as rejoint le plan !');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setRejoindreLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8000D" />
      </View>
    );
  }

  if (!activite) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTexte}>Plan introuvable 😔</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { c1, c2, emoji } = getCouleurs(activite.categorie);
  const placesRestantes = (activite.max_participants || 0) - (activite.participants_count || 0);
  const estCreateur = userId === activite.createur_id;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HERO */}
      <View style={[styles.hero, { backgroundColor: c1 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>{emoji}</Text>
        <View style={[styles.heroTag, { backgroundColor: c2 }]}>
          <Text style={styles.heroTagTexte}>{activite.categorie}</Text>
        </View>
        <Text style={styles.heroTitre}>{activite.titre}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaTexte}>📍 {activite.ville}</Text>
          <Text style={styles.heroMetaTexte}>🗓 {formatDate(activite.date)}</Text>
        </View>
      </View>

      <View style={styles.contenu}>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: c1 }]}>
            <Text style={[styles.statNombre, { color: c1 }]}>
              {activite.participants_count || 0}
            </Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={[styles.statCard, { borderColor: c1 }]}>
            <Text style={[styles.statNombre, { color: c1 }]}>
              {activite.max_participants || '∞'}
            </Text>
            <Text style={styles.statLabel}>Places max</Text>
          </View>
          <View style={[styles.statCard, { borderColor: c1 }]}>
            <Text style={[styles.statNombre, { color: c1 }]}>
              {placesRestantes > 0 ? placesRestantes : '0'}
            </Text>
            <Text style={styles.statLabel}>Restantes</Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>À propos</Text>
          <Text style={styles.description}>{activite.description}</Text>
        </View>

        {/* ORGANISATEUR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Organisateur</Text>
          <View style={styles.createurCard}>
            <View style={[styles.createurAvatar, { backgroundColor: c1 }]}>
              <Text style={styles.createurAvatarTexte}>
                {activite.createur_prenom?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.createurNom}>{activite.createur_prenom}</Text>
              <Text style={styles.createurSub}>Organisateur du plan</Text>
            </View>
          </View>
        </View>

        {/* BOUTON REJOINDRE */}
        {!estCreateur && (
          <TouchableOpacity
            style={[
              styles.boutonRejoindre,
              { backgroundColor: dejaRejoint ? '#888' : c1 },
            ]}
            onPress={rejoindre}
            disabled={rejoindreLoading || dejaRejoint}>
            <Text style={styles.boutonTexte}>
              {rejoindreLoading
                ? 'En cours...'
                : dejaRejoint
                ? '✅ Plan rejoint !'
                : `${emoji} Rejoindre ce plan`}
            </Text>
          </TouchableOpacity>
        )}

        {estCreateur && (
          <View style={[styles.createurBadge, { backgroundColor: c1 + '22' }]}>
            <Text style={[styles.createurBadgeTexte, { color: c1 }]}>
              ✦ Tu es l'organisateur de ce plan
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2' },
  errorTexte: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  retourTexte: { fontSize: 16, color: '#E8000D', fontWeight: '700' },
  hero: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  backIcon: { fontSize: 20, color: '#fff' },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  heroTagTexte: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  heroTitre: { color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 32, marginBottom: 16 },
  heroMeta: { gap: 6 },
  heroMetaTexte: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  contenu: { paddingHorizontal: 20, paddingTop: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2 },
  statNombre: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#AAA', marginTop: 4, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  description: { fontSize: 15, color: '#555', lineHeight: 24 },
  createurCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16 },
  createurAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  createurAvatarTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  createurNom: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  createurSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  boutonRejoindre: { borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 16 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
  createurBadge: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  createurBadgeTexte: { fontSize: 14, fontWeight: '700' },
});