import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

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
  latitude?: number;
  longitude?: number;
};

type UserDispo = {
  id: string;
  prenom: string;
  dispo_activite: string;
  dispo_jusqu_a: string;
};

const CATEGORIES = [
  { label: 'Tout', emoji: '✦', couleur1: '#1A1A1A' },
  { label: 'Sport', emoji: '⚡', couleur1: '#E8000D' },
  { label: 'Resto', emoji: '🍕', couleur1: '#FF6A00' },
  { label: 'Ciné', emoji: '🎬', couleur1: '#CC0000' },
  { label: 'Soirée', emoji: '🎉', couleur1: '#7B2FBE' },
  { label: 'Gaming', emoji: '🎮', couleur1: '#0070F3' },
  { label: 'Voyage', emoji: '✈️', couleur1: '#00B4D8' },
  { label: 'Musique', emoji: '🎵', couleur1: '#1DB954' },
  { label: 'Bien-être', emoji: '🏃', couleur1: '#00897B' },
  { label: 'Social', emoji: '👥', couleur1: '#FF4B7D' },
  { label: 'Art', emoji: '🎨', couleur1: '#FFD600' },
];

const ACTIVITES_RAPIDES = [
  { emoji: '☕', label: 'Café' },
  { emoji: '⚽', label: 'Foot' },
  { emoji: '🏃', label: 'Running' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🍕', label: 'Resto' },
  { emoji: '🎬', label: 'Ciné' },
  { emoji: '🚶', label: 'Balade' },
  { emoji: '🎵', label: 'Concert' },
];

const getCouleur = (categorie: string) => CATEGORIES.find(c => c.label === categorie)?.couleur1 || '#1A1A1A';
const getEmoji = (categorie: string) => CATEGORIES.find(c => c.label === categorie)?.emoji || '✦';

const calculerDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'À confirmer';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours > 0 && hours < 24) return `Dans ${hours}h`;
  if (hours < 0 && hours > -24) return "Aujourd'hui";
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

const COULEURS_AVATAR = ['#E8000D', '#7B2FBE', '#0070F3', '#1DB954', '#FF6A00', '#00B4D8'];

const getMissions = (ville: string) => {
  const heure = new Date().getHours();
  const v = ville || 'ta ville';
  const missions = [
    {
      emoji: '☕', couleur: '#FF6A00', temps: 'Dans 30 min',
      titre: `Café sympa à ${v}`,
      desc: 'Quelqu\'un cherche un café et une bonne conversation',
      participants: Math.floor(Math.random() * 3) + 1,
    },
    {
      emoji: '⚽', couleur: '#E8000D', temps: 'Dans 1h',
      titre: `Foot 5v5 — ${v}`,
      desc: 'Il manque 2 joueurs pour compléter l\'équipe',
      participants: Math.floor(Math.random() * 4) + 3,
    },
    {
      emoji: '🏃', couleur: '#00897B', temps: 'Dans 45 min',
      titre: 'Running matinal',
      desc: 'Parcours de 5km, tous niveaux bienvenus',
      participants: Math.floor(Math.random() * 3) + 2,
    },
    {
      emoji: heure >= 18 ? '🎉' : '🎬',
      couleur: heure >= 18 ? '#7B2FBE' : '#CC0000',
      temps: heure >= 18 ? 'Ce soir' : 'Cet après-midi',
      titre: heure >= 18 ? `Soirée à ${v}` : `Ciné — ${v}`,
      desc: heure >= 18 ? 'Ambiance garantie, venez nombreux 🔥' : 'Film au choix du groupe',
      participants: Math.floor(Math.random() * 5) + 2,
    },
    {
      emoji: '🍕', couleur: '#FF4B7D', temps: 'À 12h30',
      titre: 'Déjeuner en groupe',
      desc: `Resto sympa à ${v}, cuisine variée`,
      participants: Math.floor(Math.random() * 3) + 1,
    },
    {
      emoji: '🎮', couleur: '#0070F3', temps: 'Ce soir',
      titre: 'Gaming Night',
      desc: 'Session en ligne ou IRL chez quelqu\'un',
      participants: Math.floor(Math.random() * 4) + 2,
    },
  ];
  return missions.sort(() => Math.random() - 0.5).slice(0, 4);
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
  const [isDispo, setIsDispo] = useState(false);
  const [dispoActivite, setDispoActivite] = useState('');
  const [showDispoModal, setShowDispoModal] = useState(false);
  const [usersDispos, setUsersDispos] = useState<UserDispo[]>([]);
  const [dispoTempsRestant, setDispoTempsRestant] = useState('');
  const [prenom, setPrenom] = useState('');
  const [missions] = useState(() => getMissions(''));

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    init();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('utilisateurs').select('prenom, dispo_jusqu_a, dispo_activite').eq('email', user.email).single();
      if (data?.prenom) setPrenom(data.prenom);
      if (data?.dispo_jusqu_a && new Date(data.dispo_jusqu_a) > new Date()) {
        setIsDispo(true);
        setDispoActivite(data.dispo_activite || '');
        const reste = new Date(data.dispo_jusqu_a).getTime() - Date.now();
        const mins = Math.floor(reste / 60000);
        setDispoTempsRestant(mins > 60 ? `${Math.floor(mins / 60)}h${mins % 60}min` : `${mins}min`);
      }
    }
    demanderLocalisation();
    chargerActivites();
    chargerUsersDispos();
  };

  const demanderLocalisation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (adresse) setVilleUser(adresse.city || adresse.subregion || '');
    } catch {}
  };

  const chargerActivites = async () => {
    const { data } = await supabase.from('activites').select('*').order('created_at', { ascending: false });
    if (data) setActivites(data);
    setLoading(false);
    setRefreshing(false);
  };

  const chargerUsersDispos = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase.from('utilisateurs').select('id, prenom, dispo_activite, dispo_jusqu_a').gt('dispo_jusqu_a', now).not('dispo_activite', 'is', null);
    if (data) setUsersDispos(data);
  };

  const activerDispo = async (activite: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const jusqu_a = new Date(Date.now() + 2 * 3600000).toISOString();
    await supabase.from('utilisateurs').update({ dispo_jusqu_a: jusqu_a, dispo_activite: activite, dispo_latitude: userLocation?.lat, dispo_longitude: userLocation?.lng }).eq('id', user.id);
    setIsDispo(true); setDispoActivite(activite); setDispoTempsRestant('2h00');
    setShowDispoModal(false); chargerUsersDispos();
  };

  const desactiverDispo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('utilisateurs').update({ dispo_jusqu_a: null, dispo_activite: null }).eq('id', user.id);
    setIsDispo(false); setDispoActivite(''); chargerUsersDispos();
  };

  const getDistance = (a: Activite) => {
    if (!userLocation || !a.latitude || !a.longitude) return null;
    return calculerDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
  };

  const activitesFiltrees = activites.filter(a => {
    const matchCat = categorieActive === 'Tout' || a.categorie === categorieActive;
    const matchSearch = a.titre?.toLowerCase().includes(recherche.toLowerCase()) || a.ville?.toLowerCase().includes(recherche.toLowerCase());
    return matchCat && matchSearch;
  });

  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';
  const missionsVille = getMissions(villeUser);

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={styles.greeting}>{salutation} {prenom ? prenom : '👋'}</Text>
          <Text style={styles.titre}>Explorer</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.sousTitre}>{villeUser || 'Localisation...'} · {activitesFiltrees.length} plans</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtnDark} onPress={() => router.push('/matching' as any)}>
            <Text style={styles.headerBtnIcon}>🎯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtnLight}>
            <Text style={styles.headerBtnIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* DISPO */}
      {!isDispo ? (
        <TouchableOpacity style={styles.dispoCard} onPress={() => setShowDispoModal(true)} activeOpacity={0.9}>
          <View style={styles.dispoBg} />
          <View style={styles.dispoBgCircle} />
          <View style={styles.dispoLeft}>
            <Animated.View style={[styles.dispoPulse, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.dispoDotInner} />
            </Animated.View>
            <View>
              <Text style={styles.dispoTitre}>Je suis dispo maintenant</Text>
              <Text style={styles.dispoSub}>Visible 2h · rayon 5km · gratuit</Text>
            </View>
          </View>
          <View style={styles.dispoArrowWrapper}>
            <Text style={styles.dispoArrow}>→</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.dispoActifCard} onPress={desactiverDispo} activeOpacity={0.9}>
          <Animated.View style={[styles.dispoPulseActif, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.dispoDotActif} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dispoActifTitre}>🟢 Dispo — {dispoActivite}</Text>
            <Text style={styles.dispoActifSub}>Encore {dispoTempsRestant} · Touche pour désactiver</Text>
          </View>
          <Text style={styles.dispoActifClose}>✕</Text>
        </TouchableOpacity>
      )}

      {/* USERS DISPOS */}
      {usersDispos.length > 0 && (
        <View style={styles.disposSection}>
          <View style={styles.disposHeader}>
            <View style={styles.disposDot} />
            <Text style={styles.disposTitre}>{usersDispos.length} personne{usersDispos.length > 1 ? 's' : ''} dispo maintenant</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.disposScroll}>
            {usersDispos.map((u, i) => (
              <View key={u.id} style={styles.disposAvatar}>
                <View style={[styles.disposAvatarImg, { backgroundColor: COULEURS_AVATAR[i % COULEURS_AVATAR.length] }]}>
                  <Text style={styles.disposAvatarLettre}>{u.prenom[0]?.toUpperCase()}</Text>
                  <View style={styles.disposOnline} />
                </View>
                <Text style={styles.disposNom} numberOfLines={1}>{u.prenom}</Text>
                <Text style={styles.disposActivite} numberOfLines={1}>{u.dispo_activite?.split(' ')[0]}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Plans, villes, activités..."
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
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll} contentContainerStyle={styles.catsContent}>
        {CATEGORIES.map((cat) => {
          const active = categorieActive === cat.label;
          return (
            <TouchableOpacity key={cat.label} style={[styles.catChip, active && { backgroundColor: cat.couleur1 }]} onPress={() => setCategorieActive(cat.label)}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, active && { color: '#fff' }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FEED */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E8000D" />
          <Text style={styles.loadingTexte}>Chargement des plans...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerActivites(); chargerUsersDispos(); }} tintColor="#E8000D" />}>

          {/* ═══ MISSIONS INSTANTANÉES ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitre}>⚡ Missions instantanées</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTexte}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.missionsSub}>Plans disponibles maintenant près de toi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsScroll}>
            {missionsVille.map((m, i) => (
              <TouchableOpacity key={i} style={[styles.missionCard, { backgroundColor: m.couleur }]} onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.9}>
                <Text style={styles.missionBgEmoji}>{m.emoji}</Text>
                <View style={styles.missionTopRow}>
                  <View style={styles.missionLiveBadge}>
                    <View style={styles.missionLiveDot} />
                    <Text style={styles.missionLiveTexte}>DISPO</Text>
                  </View>
                  <Text style={styles.missionTemps}>{m.temps}</Text>
                </View>
                <Text style={styles.missionTitre}>{m.titre}</Text>
                <Text style={styles.missionDesc} numberOfLines={2}>{m.desc}</Text>
                <View style={styles.missionFooter}>
                  <Text style={styles.missionParticipants}>👥 {m.participants} partant{m.participants > 1 ? 's' : ''}</Text>
                  <View style={styles.missionJoinBtn}>
                    <Text style={styles.missionJoinTexte}>Rejoindre →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activitesFiltrees.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌍</Text>
              <Text style={styles.emptyTitre}>Aucun plan trouvé</Text>
              <Text style={styles.emptySub}>Sois le premier à proposer !</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/creer-activite' as any)}>
                <Text style={styles.emptyBtnTexte}>+ Créer un plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitre}>🔥 Plans chauds</Text>
                <TouchableOpacity><Text style={styles.sectionLien}>Tout voir →</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
                {activitesFiltrees.slice(0, 5).map((a) => {
                  const couleur = getCouleur(a.categorie);
                  const emoji = getEmoji(a.categorie);
                  const dist = getDistance(a);
                  const places = (a.max_participants || 0) - (a.participants_count || 0);
                  return (
                    <TouchableOpacity key={a.id} style={[styles.featuredCard, { backgroundColor: couleur }]} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.9}>
                      <Text style={styles.featuredBgEmoji}>{emoji}</Text>
                      <View style={styles.featuredTags}>
                        <View style={styles.featuredTag}>
                          <Text style={styles.featuredTagTexte}>{a.categorie?.toUpperCase()}</Text>
                        </View>
                        {dist && (
                          <View style={[styles.featuredTag, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                            <Text style={styles.featuredTagTexte}>📍 {formatDistance(dist)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.featuredContent}>
                        <Text style={styles.featuredTitre} numberOfLines={2}>{a.titre}</Text>
                        <View style={styles.featuredMeta}>
                          <Text style={styles.featuredDate}>{formatDate(a.date)}</Text>
                          <View style={styles.featuredPlacesBadge}>
                            <Text style={styles.featuredPlacesTexte}>{places > 0 ? `${places} places` : '🔴 Complet'}</Text>
                          </View>
                        </View>
                        <View style={styles.featuredCreateur}>
                          <View style={styles.featuredCreateurAvatar}>
                            <Text style={styles.featuredCreateurLettre}>{a.createur_prenom?.[0]?.toUpperCase()}</Text>
                          </View>
                          <Text style={styles.featuredCreateurNom}>{a.createur_prenom}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {activitesFiltrees.length > 5 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitre}>✦ Tous les plans</Text>
                    <Text style={styles.sectionSub}>{activitesFiltrees.length - 5} de plus</Text>
                  </View>
                  <View style={styles.listeContainer}>
                    {activitesFiltrees.slice(5).map((a) => {
                      const couleur = getCouleur(a.categorie);
                      const emoji = getEmoji(a.categorie);
                      const dist = getDistance(a);
                      const places = (a.max_participants || 0) - (a.participants_count || 0);
                      return (
                        <TouchableOpacity key={a.id} style={styles.listeCard} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.8}>
                          <View style={[styles.listeCardAccent, { backgroundColor: couleur }]} />
                          <View style={[styles.listeCardIcon, { backgroundColor: couleur + '18' }]}>
                            <Text style={styles.listeCardEmoji}>{emoji}</Text>
                          </View>
                          <View style={styles.listeCardInfo}>
                            <View style={styles.listeCardTop}>
                              <Text style={styles.listeCardTitre} numberOfLines={1}>{a.titre}</Text>
                              <View style={[styles.listeCardTag, { backgroundColor: couleur }]}>
                                <Text style={styles.listeCardTagTexte}>{a.categorie}</Text>
                              </View>
                            </View>
                            <Text style={styles.listeCardDesc} numberOfLines={1}>{a.description}</Text>
                            <View style={styles.listeCardFooter}>
                              <Text style={styles.listeCardMeta}>📍 {a.ville}{dist ? ` · ${formatDistance(dist)}` : ''}</Text>
                              <Text style={styles.listeCardMeta}>🗓 {formatDate(a.date)}</Text>
                              <Text style={[styles.listeCardPlaces, { color: places > 0 ? couleur : '#AAA' }]}>
                                {places > 0 ? `${places} places` : 'Complet'}
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

          <TouchableOpacity style={styles.fabCreer} onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.9}>
            <View style={styles.fabGauche}>
              <View style={styles.fabIconWrapper}>
                <Text style={styles.fabIconTexte}>✦</Text>
              </View>
              <View>
                <Text style={styles.fabTitre}>Propose un plan</Text>
                <Text style={styles.fabSub}>30 secondes · gratuit</Text>
              </View>
            </View>
            <Text style={styles.fabArrow}>→</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* MODAL DISPO */}
      <Modal visible={showDispoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitre}>🟢 Je suis dispo !</Text>
                <Text style={styles.modalSub}>Choisis ce que tu veux faire maintenant</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDispoModal(false)}>
                <Text style={styles.modalCloseTexte}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activitesGrid}>
              {ACTIVITES_RAPIDES.map((a) => (
                <TouchableOpacity key={a.label} style={styles.activiteBtn} onPress={() => activerDispo(`${a.emoji} ${a.label}`)} activeOpacity={0.8}>
                  <Text style={styles.activiteBtnEmoji}>{a.emoji}</Text>
                  <Text style={styles.activiteBtnLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalInfoBox}>
              <Text style={styles.modalInfoTexte}>✅ Visible 2h · rayon 5km · désactivable à tout moment</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14 },
  greeting: { fontSize: 13, color: '#AAA', fontWeight: '600', marginBottom: 3 },
  titre: { fontSize: 34, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1.5, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8000D' },
  sousTitre: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 8, marginTop: 10 },
  headerBtnDark: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerBtnLight: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#DDD4C4' },
  headerBtnIcon: { fontSize: 20 },
  dispoCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 18, position: 'relative' },
  dispoBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1A1A1A' },
  dispoBgCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#1DB954', opacity: 0.08, right: -30, top: -40 },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  dispoPulse: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(29,185,84,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoDotInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1DB954' },
  dispoTitre: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  dispoSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  dispoArrowWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  dispoArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '700' },
  dispoActifCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1DB95412', borderWidth: 2, borderColor: '#1DB954' },
  dispoPulseActif: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(29,185,84,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoDotActif: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1DB954' },
  dispoActifTitre: { color: '#1DB954', fontSize: 14, fontWeight: '800' },
  dispoActifSub: { color: '#1DB95480', fontSize: 11, marginTop: 2 },
  dispoActifClose: { color: '#1DB954', fontSize: 18, fontWeight: '700' },
  disposSection: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  disposHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  disposDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1DB954' },
  disposTitre: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  disposScroll: { gap: 14 },
  disposAvatar: { alignItems: 'center', width: 58 },
  disposAvatarImg: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 5, position: 'relative' },
  disposAvatarLettre: { color: '#fff', fontSize: 18, fontWeight: '800' },
  disposOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#1DB954', borderWidth: 2, borderColor: '#fff' },
  disposNom: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  disposActivite: { fontSize: 10, color: '#AAA', textAlign: 'center', marginTop: 1 },
  searchRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#EEE8DE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: '#1A1A1A', fontSize: 14, fontWeight: '500' },
  searchClear: { color: '#BBB', fontSize: 15 },
  filterBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 20 },
  catsScroll: { maxHeight: 50 },
  catsContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#EEE8DE' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingTexte: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#AAA' },
  emptyBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  emptyBtnTexte: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitre: { fontSize: 19, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.4 },
  sectionLien: { fontSize: 13, color: '#E8000D', fontWeight: '700' },
  sectionSub: { fontSize: 12, color: '#AAA', fontWeight: '600' },

  // LIVE BADGE
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8000D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveTexte: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // MISSIONS
  missionsSub: { fontSize: 13, color: '#AAA', paddingHorizontal: 20, marginBottom: 14 },
  missionsScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  missionCard: { width: width * 0.72, borderRadius: 24, overflow: 'hidden', position: 'relative', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, gap: 8 },
  missionBgEmoji: { position: 'absolute', right: -10, bottom: -10, fontSize: 90, opacity: 0.12 },
  missionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  missionLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  missionLiveTexte: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  missionTemps: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  missionTitre: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  missionDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  missionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  missionParticipants: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  missionJoinBtn: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  missionJoinTexte: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // FEATURED
  featuredScroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  featuredCard: { width: width * 0.65, height: 200, borderRadius: 26, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  featuredBgEmoji: { position: 'absolute', right: -15, bottom: -10, fontSize: 100, opacity: 0.12 },
  featuredTags: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 6 },
  featuredTag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredTagTexte: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  featuredContent: { position: 'absolute', bottom: 14, left: 16, right: 16 },
  featuredTitre: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 8, letterSpacing: -0.3 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  featuredDate: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  featuredPlacesBadge: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredPlacesTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredCreateur: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredCreateurAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  featuredCreateurLettre: { color: '#fff', fontSize: 11, fontWeight: '800' },
  featuredCreateurNom: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  // LISTE
  listeContainer: { paddingHorizontal: 20, gap: 10 },
  listeCard: { backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  listeCardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  listeCardIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  listeCardEmoji: { fontSize: 24 },
  listeCardInfo: { flex: 1 },
  listeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  listeCardTitre: { color: '#1A1A1A', fontSize: 14, fontWeight: '800', flex: 1, marginRight: 8 },
  listeCardTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  listeCardTagTexte: { color: '#fff', fontSize: 9, fontWeight: '800' },
  listeCardDesc: { color: '#AAA', fontSize: 12, marginBottom: 6 },
  listeCardFooter: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  listeCardMeta: { color: '#BBB', fontSize: 11, fontWeight: '500' },
  listeCardPlaces: { fontSize: 11, fontWeight: '700' },

  // FAB
  fabCreer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  fabGauche: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fabIconWrapper: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  fabIconTexte: { color: '#fff', fontSize: 22 },
  fabTitre: { color: '#fff', fontSize: 15, fontWeight: '800' },
  fabSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  fabArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 22 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FAF7F2', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD4C4', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#AAA' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  modalCloseTexte: { fontSize: 14, color: '#AAA', fontWeight: '700' },
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  activiteBtn: { backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', width: '22%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  activiteBtnEmoji: { fontSize: 30, marginBottom: 6 },
  activiteBtnLabel: { fontSize: 11, fontWeight: '700', color: '#1A1A1A' },
  modalInfoBox: { backgroundColor: '#1DB95412', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1DB95430' },
  modalInfoTexte: { color: '#1DB954', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});