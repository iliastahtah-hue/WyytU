import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TabBar from '../components/TabBar';
import { supabase } from '../lib/supabase';

type Activite = {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  date: string;
  participants_count: number;
  max_participants: number;
  latitude?: number;
  longitude?: number;
};

const CATEGORIES: Record<string, { couleur: string; emoji: string }> = {
  Sport: { couleur: '#E8000D', emoji: '⚡' },
  Resto: { couleur: '#FF6A00', emoji: '🍕' },
  Ciné: { couleur: '#CC0000', emoji: '🎬' },
  Soirée: { couleur: '#7B2FBE', emoji: '🎉' },
  Gaming: { couleur: '#0070F3', emoji: '🎮' },
  Voyage: { couleur: '#00B4D8', emoji: '✈️' },
  Musique: { couleur: '#1DB954', emoji: '🎵' },
  'Bien-être': { couleur: '#00897B', emoji: '🏃' },
  Social: { couleur: '#FF4B7D', emoji: '👥' },
  Art: { couleur: '#FFD600', emoji: '🎨' },
};

const CATEGORIES_FILTRES = [
  { label: 'Tout', value: null, couleur: '#1A1A1A' },
  { label: 'Sport', value: 'Sport', couleur: '#E8000D' },
  { label: 'Resto', value: 'Resto', couleur: '#FF6A00' },
  { label: 'Soirée', value: 'Soirée', couleur: '#7B2FBE' },
  { label: 'Gaming', value: 'Gaming', couleur: '#0070F3' },
  { label: 'Musique', value: 'Musique', couleur: '#1DB954' },
];

export default function CarteScreen() {
  const router = useRouter();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => { chargerActivites(); demanderLocalisation(); }, []);

  const demanderLocalisation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    }
  };

  const chargerActivites = async () => {
    const { data } = await supabase.from('activites').select('*');
    if (data) setActivites(data);
    setLoading(false);
  };

  const activitesFiltrees = categorieActive
    ? activites.filter((a) => a.categorie === categorieActive)
    : activites;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const ouvrirMaps = (activite: Activite) => {
    if (!activite.latitude || !activite.longitude) return;
    const url = `https://www.openstreetmap.org/?mlat=${activite.latitude}&mlon=${activite.longitude}#map=15/${activite.latitude}/${activite.longitude}`;
    window.open(url, '_blank');
  };

  const centerLat = userLocation?.latitude ?? 33.5731;
  const centerLng = userLocation?.longitude ?? -7.5898;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.15},${centerLat - 0.15},${centerLng + 0.15},${centerLat + 0.15}&layer=mapnik`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8000D" />
        <Text style={styles.loadingTexte}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.titre}>Carte 🗺️</Text>
          <Text style={styles.sousTitre}>{activitesFiltrees.length} plans</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* FILTRES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresScroll} contentContainerStyle={styles.filtresContent}>
        {CATEGORIES_FILTRES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.filtreBtn, categorieActive === cat.value && { backgroundColor: cat.couleur, borderColor: cat.couleur }]}
            onPress={() => setCategorieActive(cat.value)}>
            <Text style={[styles.filtreTexte, categorieActive === cat.value && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CARTE OPENSTREETMAP */}
      <View style={styles.mapContainer}>
        {/* @ts-ignore */}
        <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Carte" />
        <View style={styles.compteurBadge}>
          <Text style={styles.compteurTexte}>{activitesFiltrees.length} plans</Text>
        </View>
      </View>

      {/* LISTE */}
      <View style={styles.listeContainer}>
        <Text style={styles.listeTitre}>Plans disponibles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listeContent}>
          {activitesFiltrees.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTexte}>Aucun plan</Text>
            </View>
          ) : (
            activitesFiltrees.map((activite) => {
              const cat = CATEGORIES[activite.categorie] || { couleur: '#1A1A1A', emoji: '✦' };
              return (
                <TouchableOpacity
                  key={activite.id}
                  style={styles.miniCard}
                  onPress={() => router.push(`/activite/${activite.id}` as any)}>
                  <View style={[styles.miniCardEmoji, { backgroundColor: cat.couleur }]}>
                    <Text style={styles.miniCardEmojiTexte}>{cat.emoji}</Text>
                  </View>
                  <Text style={styles.miniCardTitre} numberOfLines={1}>{activite.titre}</Text>
                  <Text style={styles.miniCardVille}>📍 {activite.ville}</Text>
                  <Text style={styles.miniCardDate}>{formatDate(activite.date)}</Text>
                  {activite.latitude && (
                    <TouchableOpacity style={[styles.miniCardMaps, { backgroundColor: cat.couleur + '20' }]} onPress={() => ouvrirMaps(activite)}>
                      <Text style={[styles.miniCardMapsTexte, { color: cat.couleur }]}>🗺️ Maps</Text>
                    </TouchableOpacity>
                  )}
                  <View style={[styles.miniCardBtn, { backgroundColor: cat.couleur }]}>
                    <Text style={styles.miniCardBtnTexte}>Voir →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FAF7F2' },
  loadingTexte: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  titre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  sousTitre: { fontSize: 13, color: '#AAA', marginTop: 2 },
  filtresScroll: { maxHeight: 50 },
  filtresContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingBottom: 8 },
  filtreBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD4C4', backgroundColor: '#EEE8DE' },
  filtreTexte: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  mapContainer: { flex: 1, position: 'relative' },
  compteurBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  compteurTexte: { color: '#fff', fontSize: 12, fontWeight: '700' },
  listeContainer: { backgroundColor: '#FAF7F2', paddingTop: 14, paddingBottom: 8 },
  listeTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', paddingHorizontal: 20, marginBottom: 10 },
  listeContent: { paddingHorizontal: 20, gap: 12 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', width: 160, padding: 20, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTexte: { fontSize: 13, color: '#AAA', fontWeight: '600' },
  miniCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, width: 155, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 5 },
  miniCardEmoji: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniCardEmojiTexte: { fontSize: 20 },
  miniCardTitre: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  miniCardVille: { fontSize: 11, color: '#AAA' },
  miniCardDate: { fontSize: 11, color: '#BBB' },
  miniCardMaps: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  miniCardMapsTexte: { fontSize: 11, fontWeight: '700' },
  miniCardBtn: { borderRadius: 10, paddingVertical: 6, alignItems: 'center', marginTop: 2 },
  miniCardBtnTexte: { color: '#fff', fontSize: 12, fontWeight: '700' },
});