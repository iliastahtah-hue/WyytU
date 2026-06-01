import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  latitude?: number;
  longitude?: number;
};

const CATEGORIES = [
  { label: 'Tout', emoji: '✦', couleur1: '#1A1A1A', couleur2: '#3A3A3A' },
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

const calculerDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number) => km < 1 ? `${Math.round(km * 1000)}m` : `${Math.round(km)}km`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24 && hours > 0) return `Dans ${hours}h`;
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function ExploreScreen() {
  const router = useRouter();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [categorieActive, setCategorieActive] = useState('Tout');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [villeUser, setVilleUser] = useState('');
  const [triProximite, setTriProximite] = useState(false);

  useEffect(() => { chargerActivites(); demanderLocalisation(); }, []);

  const demanderLocalisation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (adresse) setVilleUser(adresse.city || adresse.subregion || adresse.region || '');
    } catch (err) { console.log(err); }
  };

  const chargerActivites = async () => {
    try {
      const { data, error } = await supabase.from('activites').select('*').order('created_at', { ascending: false });
      if (!error && data) setActivites(data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const getDistance = (a: Activite) => {
    if (!userLocation || !a.latitude || !a.longitude) return null;
    return calculerDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
  };

  const activitesFiltrees = activites
    .filter((a) => {
      const matchCat = categorieActive === 'Tout' || a.categorie === categorieActive;
      const matchSearch = a.titre?.toLowerCase().includes(recherche.toLowerCase()) || a.ville?.toLowerCase().includes(recherche.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (!triProximite || !userLocation) return 0;
      return (getDistance(a) ?? 99999) - (getDistance(b) ?? 99999);
    });

  const featured = activitesFiltrees.slice(0, 4);
  const reste = activitesFiltrees.slice(4);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.titre}>Explorer</Text>
          <Text style={styles.sousTitre}>
            {villeUser ? `📍 ${villeUser}` : '📍 Ta ville'} · {activitesFiltrees.length} plans
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* BOUTON CARTE */}
          <TouchableOpacity style={styles.carteBtn} onPress={() => router.push('/carte' as any)}>
            <Text style={styles.carteIcon}>🗺️</Text>
          </TouchableOpacity>
          {/* BOUTON MATCHING */}
          <TouchableOpacity style={styles.matchingBtn} onPress={() => router.push('/matching' as any)}>
            <Text style={styles.matchingIcon}>🎯</Text>
          </TouchableOpacity>
          {userLocation && (
            <TouchableOpacity style={[styles.iconBtn, triProximite && styles.iconBtnActive]} onPress={() => setTriProximite(!triProximite)}>
              <Text style={styles.iconBtnEmoji}>📍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnEmoji}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Recherche un plan, une ville..."
          placeholderTextColor="#BBB"
          value={recherche}
          onChangeText={setRecherche}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll} contentContainerStyle={styles.catsContent}>
        {CATEGORIES.map((cat) => {
          const active = categorieActive === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.catBtn, active && { backgroundColor: cat.couleur1 }]}
              onPress={() => setCategorieActive(cat.label)}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: active ? '#fff' : '#666' }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
          <Text style={styles.loadingTexte}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerActivites(); }} tintColor="#E8000D" />}>

          {activitesFiltrees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🌍</Text>
              <Text style={styles.emptyTexte}>Aucun plan trouvé</Text>
              <Text style={styles.emptySub}>Sois le premier à proposer !</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/creer-activite' as any)}>
                <Text style={styles.emptyBtnTexte}>Créer un plan →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {featured.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitre}>🔥 Plans chauds</Text>
                    <Text style={styles.sectionSub}>Populaires près de toi</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredContent}>
                    {featured.map((a) => {
                      const { c1, c2, emoji } = getCouleurs(a.categorie);
                      const dist = getDistance(a);
                      const placesRestantes = (a.max_participants || 0) - (a.participants_count || 0);
                      return (
                        <TouchableOpacity key={a.id} style={[styles.featuredCard, { backgroundColor: c1 }]} onPress={() => router.push(`/activite/${a.id}` as any)}>
                          <Text style={styles.featuredBgEmoji}>{emoji}</Text>
                          <View style={styles.featuredTop}>
                            <View style={[styles.featuredBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                              <Text style={styles.featuredBadgeTexte}>{a.categorie?.toUpperCase()}</Text>
                            </View>
                            {dist && (
                              <View style={[styles.featuredBadge, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                <Text style={styles.featuredBadgeTexte}>📍 {formatDistance(dist)}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.featuredBottom}>
                            <Text style={styles.featuredTitre} numberOfLines={2}>{a.titre}</Text>
                            <View style={styles.featuredMeta}>
                              <Text style={styles.featuredDate}>{formatDate(a.date)}</Text>
                              <View style={[styles.featuredPlaces, { backgroundColor: c2 }]}>
                                <Text style={styles.featuredPlacesTexte}>{placesRestantes} places</Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {reste.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitre}>{triProximite ? '📍 Près de toi' : '✦ Tous les plans'}</Text>
                    <Text style={styles.sectionSub}>{reste.length} disponibles</Text>
                  </View>
                  <View style={styles.cardsContainer}>
                    {reste.map((a) => {
                      const { c1, c2, emoji } = getCouleurs(a.categorie);
                      const dist = getDistance(a);
                      const placesRestantes = (a.max_participants || 0) - (a.participants_count || 0);
                      return (
                        <TouchableOpacity key={a.id} style={styles.card} onPress={() => router.push(`/activite/${a.id}` as any)}>
                          <View style={[styles.cardBar, { backgroundColor: c1 }]} />
                          <View style={[styles.cardIcon, { backgroundColor: c1 + '15' }]}>
                            <Text style={styles.cardIconTexte}>{emoji}</Text>
                          </View>
                          <View style={styles.cardContent}>
                            <View style={styles.cardTop}>
                              <Text style={styles.cardTitre} numberOfLines={1}>{a.titre}</Text>
                              <View style={[styles.cardBadge, { backgroundColor: c1 }]}>
                                <Text style={styles.cardBadgeTexte}>{a.categorie}</Text>
                              </View>
                            </View>
                            <Text style={styles.cardDesc} numberOfLines={1}>{a.description}</Text>
                            <View style={styles.cardFooter}>
                              <Text style={styles.cardMeta}>🗓 {formatDate(a.date)}</Text>
                              <Text style={styles.cardMeta}>📍 {a.ville}{dist ? ` · ${formatDistance(dist)}` : ''}</Text>
                              <Text style={[styles.cardPlaces, { color: placesRestantes > 0 ? c1 : '#AAA' }]}>
                                {placesRestantes > 0 ? `${placesRestantes} places` : 'Complet'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}

          <TouchableOpacity style={styles.fab} onPress={() => router.push('/creer-activite' as any)}>
            <View style={styles.fabLeft}>
              <Text style={styles.fabIcon}>✦</Text>
              <View>
                <Text style={styles.fabTexte}>Propose un plan</Text>
                <Text style={styles.fabSub}>Crée ton activité en 30 sec</Text>
              </View>
            </View>
            <Text style={styles.fabArr}>→</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  greeting: { fontSize: 13, color: '#AAA', fontWeight: '600', marginBottom: 2 },
  titre: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1 },
  sousTitre: { fontSize: 13, color: '#AAA', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, marginTop: 8 },
  carteBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0070F3', alignItems: 'center', justifyContent: 'center', shadowColor: '#0070F3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  carteIcon: { fontSize: 18 },
  matchingBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  matchingIcon: { fontSize: 18 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#DDD4C4' },
  iconBtnActive: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  iconBtnEmoji: { fontSize: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#EEE8DE', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: '#1A1A1A', fontSize: 14, fontWeight: '500' },
  searchClear: { color: '#AAA', fontSize: 16, paddingLeft: 8 },
  catsScroll: { maxHeight: 52 },
  catsContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE8DE' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingTexte: { color: '#AAA', fontSize: 14 },
  feed: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitre: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#AAA', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 60 },
  emptyTexte: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#AAA' },
  emptyBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },
  featuredContent: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  featuredCard: { width: 230, height: 150, borderRadius: 24, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  featuredBgEmoji: { position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.15 },
  featuredTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', gap: 6 },
  featuredBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredBadgeTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  featuredBottom: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  featuredTitre: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredDate: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  featuredPlaces: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredPlacesTexte: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardsContainer: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  cardBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cardIconTexte: { fontSize: 26 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitre: { color: '#1A1A1A', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
  cardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  cardBadgeTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  cardDesc: { color: '#AAA', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  cardMeta: { color: '#BBB', fontSize: 11, fontWeight: '500' },
  cardPlaces: { fontSize: 11, fontWeight: '700' },
  fab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', borderRadius: 22, padding: 18, marginHorizontal: 20, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  fabLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fabIcon: { fontSize: 24, color: '#fff' },
  fabTexte: { color: '#fff', fontSize: 15, fontWeight: '800' },
  fabSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  fabArr: { color: 'rgba(255,255,255,0.6)', fontSize: 22 },
});