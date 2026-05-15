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
  { label: 'Tout', emoji: '', couleur1: '#1A1A1A', couleur2: '#3A3A3A' },
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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${Math.round(km)}km`;
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

  useEffect(() => {
    chargerActivites();
    demanderLocalisation();
  }, []);

  const demanderLocalisation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });

      const [adresse] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (adresse) {
        setVilleUser(adresse.city || adresse.subregion || adresse.region || '');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const chargerActivites = async () => {
    try {
      const { data, error } = await supabase
        .from('activites')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setActivites(data);
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

  const getDistance = (a: Activite) => {
    if (!userLocation || !a.latitude || !a.longitude) return null;
    return calculerDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
  };

  const activitesFiltrees = activites
    .filter((a) => {
      const matchCat = categorieActive === 'Tout' || a.categorie === categorieActive;
      const matchSearch =
        a.titre?.toLowerCase().includes(recherche.toLowerCase()) ||
        a.ville?.toLowerCase().includes(recherche.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (!triProximite || !userLocation) return 0;
      const distA = getDistance(a) ?? 99999;
      const distB = getDistance(b) ?? 99999;
      return distA - distB;
    });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const featured = activitesFiltrees.slice(0, 4);
  const reste = activitesFiltrees.slice(4);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>Explorer 🗺️</Text>
          <Text style={styles.sousTitre}>
            {villeUser ? `📍 ${villeUser}` : 'Casablanca'} · {activitesFiltrees.length} plans actifs
          </Text>
        </View>
        <View style={styles.headerRight}>
          {userLocation && (
            <TouchableOpacity
              style={[styles.proxBtn, triProximite && styles.proxBtnActive]}
              onPress={() => setTriProximite(!triProximite)}>
              <Text style={styles.proxIcon}>📍</Text>
            </TouchableOpacity>
          )}
          <View style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </View>
        </View>
      </View>

      {triProximite && userLocation && (
        <View style={styles.proxBadge}>
          <Text style={styles.proxBadgeTexte}>✅ Tri par proximité activé</Text>
        </View>
      )}

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Activités, quartiers, personnes..."
          placeholderTextColor="#BBB"
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catsScroll}
        contentContainerStyle={styles.catsContent}>
        {CATEGORIES.map((cat) => {
          const active = categorieActive === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.catBtn, { backgroundColor: active ? cat.couleur1 : '#EEE8DE' }]}
              onPress={() => setCategorieActive(cat.label)}>
              <Text style={[styles.catBtnTexte, { color: active ? '#fff' : '#888' }]}>
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
          <Text style={styles.loadingTexte}>Chargement des plans...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8000D" />
          }>

          {activitesFiltrees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>😔</Text>
              <Text style={styles.emptyTexte}>Aucun plan trouvé</Text>
              <Text style={styles.emptySub}>Sois le premier à proposer une activité !</Text>
            </View>
          ) : (
            <>
              {featured.length > 0 && (
                <>
                  <Text style={styles.sectionTitre}>🔥 Plans chauds</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredContent}>
                    {featured.map((a) => {
                      const { c1, c2, emoji } = getCouleurs(a.categorie);
                      const dist = getDistance(a);
                      return (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.featuredCard, { backgroundColor: c1 }]}
                          onPress={() => router.push(`/activite/${a.id}` as any)}>
                          <Text style={styles.featuredBgEmoji}>{emoji}</Text>
                          <View style={styles.featuredContent2}>
                            <View style={styles.featuredTag}>
                              <Text style={styles.featuredTagTexte}>
                                {a.categorie?.toUpperCase()} {dist ? `· ${formatDistance(dist)}` : ''}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.featuredTitre} numberOfLines={2}>{a.titre}</Text>
                              <View style={styles.featuredBottom}>
                                <Text style={styles.featuredVille}>📍 {a.ville}</Text>
                                <View style={[styles.featuredJoin, { backgroundColor: c2 }]}>
                                  <Text style={styles.featuredJoinTexte}>
                                    +{(a.max_participants || 0) - (a.participants_count || 0)} places
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <Text style={styles.sectionTitre}>
                {triProximite ? '📍 Près de toi' : '📍 Tous les plans'}
              </Text>
              <View style={styles.cardsContainer}>
                {reste.map((a) => {
                  const { c1, c2, emoji } = getCouleurs(a.categorie);
                  const dist = getDistance(a);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.card, { backgroundColor: c1 }]}
                      onPress={() => router.push(`/activite/${a.id}` as any)}>
                      <View style={[styles.cardIcon, { backgroundColor: c2 }]}>
                        <Text style={styles.cardIconTexte}>{emoji}</Text>
                      </View>
                      <View style={styles.cardRight}>
                        <View style={styles.cardTop}>
                          <Text style={styles.cardTitre} numberOfLines={1}>{a.titre}</Text>
                          <View style={[styles.cardTag, { backgroundColor: c2 }]}>
                            <Text style={styles.cardTagTexte}>{a.categorie}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>
                        <View style={styles.cardBottom}>
                          <View style={styles.cardMeta}>
                            <Text style={styles.cardMetaTexte}>🗓 {formatDate(a.date)}</Text>
                            <Text style={styles.cardMetaTexte}>
                              📍 {a.ville}{dist ? ` · ${formatDistance(dist)}` : ''}
                            </Text>
                          </View>
                          <View style={styles.avatars}>
                            <View style={[styles.av, { backgroundColor: '#FF6A00' }]}>
                              <Text style={styles.avTexte}>{a.createur_prenom?.[0] || '?'}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/creer-activite' as any)}>
            <Text style={styles.fabIcon}>✦</Text>
            <View>
              <Text style={styles.fabTexte}>Propose un plan</Text>
              <Text style={styles.fabSub}>Crée ton activité en 30 sec</Text>
            </View>
            <Text style={styles.fabArr}>→</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  titre: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  sousTitre: { fontSize: 13, color: '#AAA', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  proxBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  proxBtnActive: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  proxIcon: { fontSize: 18 },
  proxBadge: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#EEF7EE', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#1DB954' },
  proxBadgeTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  notifIcon: { fontSize: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEE8DE', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#DDD4C4', marginBottom: 4 },
  searchIcon: { color: '#BBB', fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: '#1A1A1A', fontSize: 14 },
  catsScroll: { maxHeight: 48 },
  catsContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  catBtnTexte: { fontSize: 12, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingTexte: { color: '#AAA', fontSize: 14 },
  feed: { flex: 1 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTexte: { color: '#1A1A1A', fontSize: 18, fontWeight: '800' },
  emptySub: { color: '#AAA', fontSize: 14, textAlign: 'center' },
  sectionTitre: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, letterSpacing: -0.3 },
  featuredContent: { paddingHorizontal: 20, gap: 12 },
  featuredCard: { width: 215, height: 135, borderRadius: 22, overflow: 'hidden', position: 'relative' },
  featuredBgEmoji: { position: 'absolute', right: -8, bottom: -10, fontSize: 68, opacity: 0.2 },
  featuredContent2: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 14, justifyContent: 'space-between' },
  featuredTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  featuredTagTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  featuredTitre: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  featuredVille: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
  featuredJoin: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  featuredJoinTexte: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardsContainer: { paddingHorizontal: 20, gap: 10 },
  card: { borderRadius: 22, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardIconTexte: { fontSize: 24 },
  cardRight: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitre: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 6 },
  cardTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  cardTagTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { gap: 4 },
  cardMetaTexte: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  avatars: { flexDirection: 'row' },
  av: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avTexte: { color: '#fff', fontSize: 9, fontWeight: '700' },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 16, marginHorizontal: 20, marginTop: 20 },
  fabIcon: { fontSize: 22, color: '#fff' },
  fabTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fabSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  fabArr: { marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 20 },
});