import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
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

// ─── PALETTE WyytU ────────────────────────────────────────────────────────────
const C = {
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDark: '#A07830',
  goldPale: '#FDF8EE',
  beige: '#FAF7F2',
  beigeDeep: '#EEE8DE',
  beigeCard: '#F5F0E8',
  brown: '#1A1209',
  brownMid: '#5C4A2A',
  white: '#FFFFFF',
  grayLight: '#F0EDE8',
  grayMid: '#C8C0B4',
  grayText: '#8A7F72',
  green: '#2ECC71',
  red: '#E74C3C',
};

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
  { label: 'Tout', emoji: '✦' },
  { label: 'Sport', emoji: '⚡' },
  { label: 'Resto', emoji: '🍕' },
  { label: 'Ciné', emoji: '🎬' },
  { label: 'Soirée', emoji: '🎉' },
  { label: 'Gaming', emoji: '🎮' },
  { label: 'Voyage', emoji: '✈️' },
  { label: 'Musique', emoji: '🎵' },
  { label: 'Bien-être', emoji: '🏃' },
  { label: 'Social', emoji: '👥' },
  { label: 'Art', emoji: '🎨' },
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

const CAT_COLORS: Record<string, string> = {
  Sport: '#E74C3C', Resto: '#E67E22', Ciné: '#8E44AD',
  Soirée: '#2C3E50', Gaming: '#2980B9', Voyage: '#16A085',
  Musique: '#27AE60', 'Bien-être': '#1ABC9C', Social: '#C0392B',
  Art: '#F39C12', Tout: C.brown,
};

const getCouleur = (cat: string) => CAT_COLORS[cat] || C.brown;
const getEmoji = (cat: string) => CATEGORIES.find(c => c.label === cat)?.emoji || '✦';

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

const getMissions = (ville: string) => {
  const heure = new Date().getHours();
  const v = ville || 'ta ville';
  return [
    { emoji: '☕', couleur: '#FF6A00', temps: 'Dans 30 min', titre: `Café à ${v}`, desc: 'Bonne conversation recherchée', participants: 2 },
    { emoji: '⚽', couleur: '#E74C3C', temps: 'Dans 1h', titre: `Foot 5v5 — ${v}`, desc: 'Il manque 2 joueurs', participants: 5 },
    { emoji: '🏃', couleur: '#1ABC9C', temps: 'Dans 45 min', titre: 'Running matinal', desc: 'Parcours 5km, tous niveaux', participants: 3 },
    { emoji: heure >= 18 ? '🎉' : '🎬', couleur: heure >= 18 ? '#8E44AD' : '#2980B9', temps: heure >= 18 ? 'Ce soir' : 'Cet après-midi', titre: heure >= 18 ? `Soirée à ${v}` : `Ciné — ${v}`, desc: heure >= 18 ? 'Ambiance garantie 🔥' : 'Film au choix', participants: 4 },
  ].sort(() => Math.random() - 0.5).slice(0, 4);
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
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
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
    <View style={s.root}>

      {/* ── HEADER ── */}
      <Animated.View style={[s.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={s.greeting}>{salutation} {prenom || '👋'}</Text>
          <Text style={s.headerTitle}>Explorer</Text>
          <View style={s.locationRow}>
            <View style={s.locationDot} />
            <Text style={s.locationTxt}>{villeUser || 'Localisation...'} · {activitesFiltrees.length} plans</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/matching' as any)}>
            <Text style={s.headerBtnIcon}>🎯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtnGold}>
            <Text style={s.headerBtnIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── DISPO CARD ── */}
      {!isDispo ? (
        <TouchableOpacity onPress={() => setShowDispoModal(true)} activeOpacity={0.9} style={s.dispoWrap}>
          <LinearGradient colors={[C.brown, '#2C1F0A']} style={s.dispoCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.dispoLeft}>
              <Animated.View style={[s.dispoPulse, { transform: [{ scale: pulseAnim }] }]}>
                <View style={s.dispoDot} />
              </Animated.View>
              <View>
                <Text style={s.dispoTitle}>Je suis dispo maintenant</Text>
                <Text style={s.dispoSub}>Visible 2h · rayon 5km · gratuit</Text>
              </View>
            </View>
            <View style={s.dispoArrow}>
              <Text style={s.dispoArrowTxt}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.dispoActif} onPress={desactiverDispo} activeOpacity={0.9}>
          <Animated.View style={[s.dispoPulseActif, { transform: [{ scale: pulseAnim }] }]}>
            <View style={s.dispoDotActif} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={s.dispoActifTitle}>🟢 Dispo — {dispoActivite}</Text>
            <Text style={s.dispoActifSub}>Encore {dispoTempsRestant} · Touche pour désactiver</Text>
          </View>
          <Text style={s.dispoActifClose}>✕</Text>
        </TouchableOpacity>
      )}

      {/* ── USERS DISPOS ── */}
      {usersDispos.length > 0 && (
        <View style={s.disposSection}>
          <View style={s.disposHeader}>
            <View style={s.disposDot} />
            <Text style={s.disposTitre}>{usersDispos.length} personne{usersDispos.length > 1 ? 's' : ''} dispo maintenant</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.disposScroll}>
            {usersDispos.map((u, i) => {
              const colors = [C.gold, C.brownMid, '#E74C3C', '#2ECC71', '#3498DB'];
              return (
                <View key={u.id} style={s.disposAvatar}>
                  <View style={[s.disposAvatarImg, { backgroundColor: colors[i % colors.length] }]}>
                    <Text style={s.disposLetter}>{u.prenom[0]?.toUpperCase()}</Text>
                    <View style={s.disposOnline} />
                  </View>
                  <Text style={s.disposNom} numberOfLines={1}>{u.prenom}</Text>
                  <Text style={s.disposAct} numberOfLines={1}>{u.dispo_activite?.split(' ')[0]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── SEARCH ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Plans, villes, activités..."
            placeholderTextColor={C.grayMid}
            value={recherche}
            onChangeText={setRecherche}
          />
          {recherche.length > 0 && (
            <TouchableOpacity onPress={() => setRecherche('')}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <LinearGradient colors={[C.goldLight, C.gold]} style={s.filterGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.filterIcon}>⚡</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── CATEGORIES ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsScroll} contentContainerStyle={s.catsContent}>
        {CATEGORIES.map((cat) => {
          const active = categorieActive === cat.label;
          return (
            <TouchableOpacity key={cat.label} onPress={() => setCategorieActive(cat.label)} activeOpacity={0.8}>
              {active ? (
                <LinearGradient colors={[C.goldLight, C.gold]} style={s.catChipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={s.catLabelActive}>{cat.label}</Text>
                </LinearGradient>
              ) : (
                <View style={s.catChip}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={s.catLabel}>{cat.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── FEED ── */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={s.loadingTxt}>Chargement des plans...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerActivites(); chargerUsersDispos(); }} tintColor={C.gold} />}
        >
          {/* MISSIONS */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>⚡ Missions instantanées</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE</Text>
            </View>
          </View>
          <Text style={s.sectionSub}>Plans disponibles maintenant près de toi</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.missionsScroll}>
            {missionsVille.map((m, i) => (
              <TouchableOpacity key={i} style={s.missionCard} onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.88}>
                <LinearGradient colors={[m.couleur || C.brown, (m.couleur || C.brown) + 'CC']} style={s.missionGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.missionBgEmoji}>{m.emoji}</Text>
                  <View style={s.missionTop}>
                    <View style={s.missionBadge}>
                      <View style={s.missionBadgeDot} />
                      <Text style={s.missionBadgeTxt}>DISPO</Text>
                    </View>
                    <Text style={s.missionTemps}>{m.temps}</Text>
                  </View>
                  <Text style={s.missionTitre}>{m.titre}</Text>
                  <Text style={s.missionDesc} numberOfLines={2}>{m.desc}</Text>
                  <View style={s.missionFooter}>
                    <Text style={s.missionParticipants}>👥 {m.participants} partant{m.participants > 1 ? 's' : ''}</Text>
                    <LinearGradient colors={[C.goldLight, C.gold]} style={s.missionJoinBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={s.missionJoinTxt}>Rejoindre →</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activitesFiltrees.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyEmoji}>🌍</Text>
              <Text style={s.emptyTitle}>Aucun plan trouvé</Text>
              <Text style={s.emptySub}>Sois le premier à proposer !</Text>
              <TouchableOpacity onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.85}>
                <LinearGradient colors={[C.goldLight, C.gold]} style={s.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.emptyBtnTxt}>+ Créer un plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* PLANS CHAUDS */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>🔥 Plans chauds</Text>
                <TouchableOpacity><Text style={s.sectionLink}>Tout voir →</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredScroll}>
                {activitesFiltrees.slice(0, 5).map((a) => {
                  const couleur = getCouleur(a.categorie);
                  const emoji = getEmoji(a.categorie);
                  const dist = getDistance(a);
                  const places = (a.max_participants || 0) - (a.participants_count || 0);
                  return (
                    <TouchableOpacity key={a.id} style={s.featuredCard} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.88}>
                      <View style={[s.featuredCardInner, { backgroundColor: couleur }]}>
                        <Text style={s.featuredBgEmoji}>{emoji}</Text>
                        <View style={s.featuredTags}>
                          <View style={s.featuredTag}>
                            <Text style={s.featuredTagTxt}>{a.categorie?.toUpperCase()}</Text>
                          </View>
                          {dist && (
                            <View style={[s.featuredTag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                              <Text style={s.featuredTagTxt}>📍 {formatDistance(dist)}</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.featuredContent}>
                          <Text style={s.featuredTitle} numberOfLines={2}>{a.titre}</Text>
                          <View style={s.featuredMeta}>
                            <Text style={s.featuredDate}>{formatDate(a.date)}</Text>
                            <View style={s.placesBadge}>
                              <Text style={s.placesTxt}>{places > 0 ? `${places} places` : '🔴 Complet'}</Text>
                            </View>
                          </View>
                          <View style={s.createurRow}>
                            <View style={s.createurAvatar}>
                              <Text style={s.createurLetter}>{a.createur_prenom?.[0]?.toUpperCase()}</Text>
                            </View>
                            <Text style={s.createurNom}>{a.createur_prenom}</Text>
                          </View>
                        </View>
                      </View>
                      {/* Bordure dorée sur les cartes */}
                      <View style={s.featuredGoldBorder} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* TOUS LES PLANS */}
              {activitesFiltrees.length > 5 && (
                <>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>✦ Tous les plans</Text>
                    <Text style={s.sectionCount}>{activitesFiltrees.length - 5} de plus</Text>
                  </View>
                  <View style={s.listeContainer}>
                    {activitesFiltrees.slice(5).map((a) => {
                      const couleur = getCouleur(a.categorie);
                      const emoji = getEmoji(a.categorie);
                      const dist = getDistance(a);
                      const places = (a.max_participants || 0) - (a.participants_count || 0);
                      return (
                        <TouchableOpacity key={a.id} style={s.listeCard} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.8}>
                          <View style={[s.listeAccent, { backgroundColor: couleur }]} />
                          <View style={[s.listeIcon, { backgroundColor: couleur + '18' }]}>
                            <Text style={s.listeEmoji}>{emoji}</Text>
                          </View>
                          <View style={s.listeInfo}>
                            <View style={s.listeTop}>
                              <Text style={s.listeTitre} numberOfLines={1}>{a.titre}</Text>
                              <View style={[s.listeTag, { backgroundColor: couleur }]}>
                                <Text style={s.listeTagTxt}>{a.categorie}</Text>
                              </View>
                            </View>
                            <Text style={s.listeDesc} numberOfLines={1}>{a.description}</Text>
                            <View style={s.listeFooter}>
                              <Text style={s.listeMeta}>📍 {a.ville}{dist ? ` · ${formatDistance(dist)}` : ''}</Text>
                              <Text style={s.listeMeta}>🗓 {formatDate(a.date)}</Text>
                              <Text style={[s.listePlaces, { color: places > 0 ? couleur : C.grayMid }]}>
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

          {/* FAB CRÉER */}
          <TouchableOpacity onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.88} style={s.fabWrap}>
            <LinearGradient colors={[C.brown, '#2C1F0A']} style={s.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.fabLeft}>
                <LinearGradient colors={[C.goldLight, C.gold]} style={s.fabIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.fabIconTxt}>✦</Text>
                </LinearGradient>
                <View>
                  <Text style={s.fabTitle}>Propose un plan</Text>
                  <Text style={s.fabSub}>30 secondes · gratuit</Text>
                </View>
              </View>
              <Text style={s.fabArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── MODAL DISPO ── */}
      <Modal visible={showDispoModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>🟢 Je suis dispo !</Text>
                <Text style={s.modalSub}>Choisis ce que tu veux faire maintenant</Text>
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setShowDispoModal(false)}>
                <Text style={s.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.activitesGrid}>
              {ACTIVITES_RAPIDES.map((a) => (
                <TouchableOpacity key={a.label} style={s.activiteBtn} onPress={() => activerDispo(`${a.emoji} ${a.label}`)} activeOpacity={0.8}>
                  <Text style={s.activiteBtnEmoji}>{a.emoji}</Text>
                  <Text style={s.activiteBtnLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalInfo}>
              <Text style={s.modalInfoTxt}>✅ Visible 2h · rayon 5km · désactivable à tout moment</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.beige },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 14 },
  greeting: { fontSize: 13, color: C.grayText, fontWeight: '600', marginBottom: 3 },
  headerTitle: { fontSize: 34, fontWeight: '900', color: C.brown, letterSpacing: -1.5, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold },
  locationTxt: { fontSize: 13, color: C.grayText, fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 8, marginTop: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  headerBtnGold: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldPale, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.gold },
  headerBtnIcon: { fontSize: 20 },

  // DISPO
  dispoWrap: { marginHorizontal: 20, marginBottom: 14, borderRadius: 22, overflow: 'hidden', shadowColor: C.brown, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 6 },
  dispoCard: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  dispoPulse: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.gold },
  dispoTitle: { color: C.white, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  dispoSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  dispoArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoArrowTxt: { color: C.gold, fontSize: 16, fontWeight: '700' },
  dispoActif: { marginHorizontal: 20, marginBottom: 14, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.goldPale, borderWidth: 2, borderColor: C.gold },
  dispoPulseActif: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoDotActif: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.gold },
  dispoActifTitle: { color: C.brownMid, fontSize: 14, fontWeight: '800' },
  dispoActifSub: { color: C.grayText, fontSize: 11, marginTop: 2 },
  dispoActifClose: { color: C.gold, fontSize: 18, fontWeight: '700' },

  // DISPOS USERS
  disposSection: { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.white, borderRadius: 20, padding: 14, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  disposHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  disposDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  disposTitre: { fontSize: 13, fontWeight: '700', color: C.brown },
  disposScroll: { gap: 14 },
  disposAvatar: { alignItems: 'center', width: 58 },
  disposAvatarImg: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 5, position: 'relative' },
  disposLetter: { color: C.white, fontSize: 18, fontWeight: '800' },
  disposOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green, borderWidth: 2, borderColor: C.white },
  disposNom: { fontSize: 11, fontWeight: '700', color: C.brown, textAlign: 'center' },
  disposAct: { fontSize: 10, color: C.grayText, textAlign: 'center', marginTop: 1 },

  // SEARCH
  searchRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: C.beigeDeep, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: C.brown, fontSize: 14, fontWeight: '500' },
  searchClear: { color: C.grayMid, fontSize: 15 },
  filterBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  filterGrad: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 20 },

  // CATEGORIES
  catsScroll: { maxHeight: 50 },
  catsContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: C.beigeDeep },
  catChipActive: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: C.brownMid },
  catLabelActive: { fontSize: 12, fontWeight: '800', color: C.white },

  // LOADING / EMPTY
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingTxt: { color: C.grayText, fontSize: 14, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.brown },
  emptySub: { fontSize: 14, color: C.grayText },
  emptyBtn: { borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  emptyBtnTxt: { color: C.white, fontWeight: '800', fontSize: 14 },

  // SECTION
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: C.brown, letterSpacing: -0.4 },
  sectionLink: { fontSize: 13, color: C.gold, fontWeight: '700' },
  sectionSub: { fontSize: 13, color: C.grayText, paddingHorizontal: 20, marginBottom: 12 },
  sectionCount: { fontSize: 12, color: C.grayText, fontWeight: '600' },

  // LIVE BADGE
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  liveTxt: { color: C.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // MISSIONS
  missionsScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4, paddingTop: 4 },
  missionCard: { width: width * 0.72, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  missionGrad: { padding: 18, gap: 8, position: 'relative' },
  missionBgEmoji: { position: 'absolute', right: -10, bottom: -10, fontSize: 90, opacity: 0.1 },
  missionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(201,168,76,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  missionBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  missionBadgeTxt: { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  missionTemps: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600' },
  missionTitre: { color: C.white, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  missionDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 18 },
  missionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  missionParticipants: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  missionJoinBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  missionJoinTxt: { color: C.brown, fontSize: 12, fontWeight: '800' },

  // FEATURED
  featuredScroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 4, paddingTop: 4 },
  featuredCard: { width: width * 0.65, height: 200, borderRadius: 26, overflow: 'hidden', shadowColor: C.brown, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  featuredCardInner: { flex: 1, position: 'relative' },
  featuredGoldBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.gold, opacity: 0.6 },
  featuredBgEmoji: { position: 'absolute', right: -15, bottom: -10, fontSize: 100, opacity: 0.1 },
  featuredTags: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 6 },
  featuredTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredTagTxt: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  featuredContent: { position: 'absolute', bottom: 14, left: 16, right: 16 },
  featuredTitle: { color: C.white, fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 8, letterSpacing: -0.3 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  featuredDate: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  placesBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  placesTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  createurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createurAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center' },
  createurLetter: { color: C.white, fontSize: 11, fontWeight: '800' },
  createurNom: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  // LISTE
  listeContainer: { paddingHorizontal: 20, gap: 10 },
  listeCard: { backgroundColor: C.white, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  listeAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  listeIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  listeEmoji: { fontSize: 24 },
  listeInfo: { flex: 1 },
  listeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  listeTitre: { color: C.brown, fontSize: 14, fontWeight: '800', flex: 1, marginRight: 8 },
  listeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  listeTagTxt: { color: C.white, fontSize: 9, fontWeight: '800' },
  listeDesc: { color: C.grayText, fontSize: 12, marginBottom: 6 },
  listeFooter: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  listeMeta: { color: C.grayMid, fontSize: 11, fontWeight: '500' },
  listePlaces: { fontSize: 11, fontWeight: '700' },

  // FAB
  fabWrap: { marginHorizontal: 20, marginTop: 24, borderRadius: 24, overflow: 'hidden', shadowColor: C.brown, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  fab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  fabLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fabIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fabIconTxt: { color: C.brown, fontSize: 22, fontWeight: '900' },
  fabTitle: { color: C.white, fontSize: 15, fontWeight: '800' },
  fabSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  fabArrow: { color: C.gold, fontSize: 22, fontWeight: '700' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,18,9,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.beige, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.beigeDeep, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: C.brown, marginBottom: 4 },
  modalSub: { fontSize: 14, color: C.grayText },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.beigeDeep, alignItems: 'center', justifyContent: 'center' },
  modalCloseTxt: { fontSize: 14, color: C.grayText, fontWeight: '700' },
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  activiteBtn: { backgroundColor: C.white, borderRadius: 18, padding: 16, alignItems: 'center', width: '22%', shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  activiteBtnEmoji: { fontSize: 30, marginBottom: 6 },
  activiteBtnLabel: { fontSize: 11, fontWeight: '700', color: C.brown },
  modalInfo: { backgroundColor: C.goldPale, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.gold + '40' },
  modalInfoTxt: { color: C.brownMid, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});
