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

const C = {
  bg: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textMid: '#4A4A6A',
  textLight: '#9090A0',
  border: '#EEEEEE',
  green: '#00C853',
  red: '#FF3B30',
  purple: '#7C4DFF',
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
  { label: 'Tout', emoji: '✨', gradient: ['#667EEA', '#764BA2'] as [string,string] },
  { label: 'Sport', emoji: '⚡', gradient: ['#FF416C', '#FF4B2B'] as [string,string] },
  { label: 'Resto', emoji: '🍕', gradient: ['#F7971E', '#FFD200'] as [string,string] },
  { label: 'Ciné', emoji: '🎬', gradient: ['#8E2DE2', '#4A00E0'] as [string,string] },
  { label: 'Soirée', emoji: '🎉', gradient: ['#FC466B', '#3F5EFB'] as [string,string] },
  { label: 'Gaming', emoji: '🎮', gradient: ['#0072FF', '#00C6FF'] as [string,string] },
  { label: 'Voyage', emoji: '✈️', gradient: ['#00B4DB', '#0083B0'] as [string,string] },
  { label: 'Musique', emoji: '🎵', gradient: ['#11998E', '#38EF7D'] as [string,string] },
  { label: 'Bien-être', emoji: '🏃', gradient: ['#56AB2F', '#A8E063'] as [string,string] },
  { label: 'Social', emoji: '👥', gradient: ['#FF416C', '#FF4B2B'] as [string,string] },
  { label: 'Art', emoji: '🎨', gradient: ['#F7971E', '#FFD200'] as [string,string] },
];

const ACTIVITES_RAPIDES = [
  { emoji: '☕', label: 'Café', color: '#FF6B35' },
  { emoji: '⚽', label: 'Foot', color: '#FF3B30' },
  { emoji: '🏃', label: 'Running', color: '#00C853' },
  { emoji: '🎮', label: 'Gaming', color: '#2196F3' },
  { emoji: '🍕', label: 'Resto', color: '#FF9800' },
  { emoji: '🎬', label: 'Ciné', color: '#9C27B0' },
  { emoji: '🚶', label: 'Balade', color: '#4CAF50' },
  { emoji: '🎵', label: 'Concert', color: '#E91E63' },
];

const CAT_GRADIENT: Record<string, [string,string]> = {
  Sport: ['#FF416C', '#FF4B2B'],
  Resto: ['#F7971E', '#FFD200'],
  Ciné: ['#8E2DE2', '#4A00E0'],
  Soirée: ['#FC466B', '#3F5EFB'],
  Gaming: ['#0072FF', '#00C6FF'],
  Voyage: ['#00B4DB', '#0083B0'],
  Musique: ['#11998E', '#38EF7D'],
  'Bien-être': ['#56AB2F', '#A8E063'],
  Social: ['#FF416C', '#FF4B2B'],
  Art: ['#F7971E', '#FFD200'],
  Tout: ['#667EEA', '#764BA2'],
};

const CAT_COLOR: Record<string, string> = {
  Sport: '#FF416C', Resto: '#F7971E', Ciné: '#8E2DE2',
  Soirée: '#FC466B', Gaming: '#0072FF', Voyage: '#00B4DB',
  Musique: '#11998E', 'Bien-être': '#56AB2F', Social: '#FF4081',
  Art: '#F7971E', Tout: '#667EEA',
};

const getGradient = (cat: string): [string,string] => CAT_GRADIENT[cat] || ['#667EEA', '#764BA2'];
const getColor = (cat: string) => CAT_COLOR[cat] || '#667EEA';
const getEmoji = (cat: string) => CATEGORIES.find(c => c.label === cat)?.emoji || '✨';

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
  const diff = date.getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours > 0 && hours < 24) return `Dans ${hours}h`;
  if (hours < 0 && hours > -24) return "Aujourd'hui";
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getMissions = (ville: string) => {
  const h = new Date().getHours();
  const v = ville || 'ta ville';
  return [
    { emoji: '☕', gradient: ['#FF6B35', '#F7971E'] as [string,string], temps: 'Dans 30 min', titre: `Café à ${v}`, desc: 'Bonne conversation', participants: 2 },
    { emoji: '⚽', gradient: ['#FF416C', '#FF4B2B'] as [string,string], temps: 'Dans 1h', titre: `Foot 5v5 — ${v}`, desc: 'Il manque 2 joueurs', participants: 5 },
    { emoji: '🏃', gradient: ['#11998E', '#38EF7D'] as [string,string], temps: 'Dans 45 min', titre: 'Running 5km', desc: 'Tous niveaux bienvenus', participants: 3 },
    { emoji: h >= 18 ? '🎉' : '🎬', gradient: (h >= 18 ? ['#FC466B', '#3F5EFB'] : ['#8E2DE2', '#4A00E0']) as [string,string], temps: h >= 18 ? 'Ce soir' : 'Cet après-midi', titre: h >= 18 ? `Soirée à ${v}` : `Ciné — ${v}`, desc: h >= 18 ? 'Ambiance garantie 🔥' : 'Film au choix', participants: 4 },
  ];
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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    init();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('utilisateurs').select('prenom, dispo_jusqu_a, dispo_activite').eq('email', user.email).single();
      if (data?.prenom) setPrenom(data.prenom);
      if (data?.dispo_jusqu_a && new Date(data.dispo_jusqu_a) > new Date()) {
        setIsDispo(true); setDispoActivite(data.dispo_activite || '');
        const mins = Math.floor((new Date(data.dispo_jusqu_a).getTime() - Date.now()) / 60000);
        setDispoTempsRestant(mins > 60 ? `${Math.floor(mins / 60)}h${mins % 60}min` : `${mins}min`);
      }
    }
    demanderLocalisation(); chargerActivites(); chargerUsersDispos();
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
    setLoading(false); setRefreshing(false);
  };

  const chargerUsersDispos = async () => {
    const { data } = await supabase.from('utilisateurs').select('id, prenom, dispo_activite, dispo_jusqu_a').gt('dispo_jusqu_a', new Date().toISOString()).not('dispo_activite', 'is', null);
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

  const h = new Date().getHours();
  const salutation = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  const missions = getMissions(villeUser);

  return (
    <View style={s.root}>

      {/* ── HEADER VIOLET ── */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.headerCircle1} />
          <View style={s.headerCircle2} />
          <View style={s.headerTop}>
            <View>
              <Text style={s.greeting}>{salutation}{prenom ? `, ${prenom}` : ''} 👋</Text>
              <Text style={s.headerTitle}>Explorer</Text>
              <View style={s.locationRow}>
                <View style={s.locationDot} />
                <Text style={s.locationTxt}>{villeUser || 'Localisation...'} · {activitesFiltrees.length} plans</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/matching' as any)}>
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.headerBtnWhite}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.searchBox}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Plans, villes, activités..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={recherche}
              onChangeText={setRecherche}
            />
            {recherche.length > 0 && (
              <TouchableOpacity onPress={() => setRecherche('')}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── CATEGORIES ── */}
      <View style={s.catsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsContent}>
          {CATEGORIES.map(cat => {
            const active = categorieActive === cat.label;
            return (
              <TouchableOpacity key={cat.label} onPress={() => setCategorieActive(cat.label)} activeOpacity={0.8}>
                {active ? (
                  <LinearGradient colors={cat.gradient} style={s.catActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                    <Text style={s.catActiveTxt}>{cat.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={s.cat}>
                    <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                    <Text style={s.catTxt}>{cat.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── FEED ── */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.purple} />
          <Text style={s.loadingTxt}>Chargement des plans...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerActivites(); chargerUsersDispos(); }} tintColor={C.purple} />}>

          {/* DISPO */}
          {!isDispo ? (
            <TouchableOpacity onPress={() => setShowDispoModal(true)} activeOpacity={0.9} style={s.dispoWrap}>
              <LinearGradient colors={['#FF416C', '#FC466B', '#3F5EFB']} style={s.dispoCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={s.dispoLeft}>
                  <Animated.View style={[s.dispoPulse, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={s.dispoDot} />
                  </Animated.View>
                  <View>
                    <Text style={s.dispoTitle}>Je suis dispo maintenant 🟢</Text>
                    <Text style={s.dispoSub}>Visible 2h · rayon 5km · gratuit</Text>
                  </View>
                </View>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.dispoActif} onPress={desactiverDispo} activeOpacity={0.9}>
              <Animated.View style={[s.dispoPulse, { transform: [{ scale: pulseAnim }] }]}>
                <View style={[s.dispoDot, { backgroundColor: C.green }]} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={s.dispoActifTitle}>🟢 Dispo — {dispoActivite}</Text>
                <Text style={s.dispoActifSub}>Encore {dispoTempsRestant} · Touche pour désactiver</Text>
              </View>
              <Text style={{ color: C.red, fontSize: 18, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}

          {/* USERS DISPOS */}
          {usersDispos.length > 0 && (
            <View style={s.disposSection}>
              <View style={s.disposHeader}>
                <View style={[s.disposDot, { backgroundColor: C.green }]} />
                <Text style={s.disposTitre}>{usersDispos.length} personne{usersDispos.length > 1 ? 's' : ''} dispo maintenant</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                {usersDispos.map((u, i) => {
                  const colors = ['#FF416C', '#7C4DFF', '#2196F3', '#00C853', '#FF9800'];
                  return (
                    <View key={u.id} style={s.disposAvatar}>
                      <View style={[s.disposImg, { backgroundColor: colors[i % colors.length] }]}>
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

          {/* MISSIONS */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>⚡ Missions instantanées</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE</Text>
            </View>
          </View>
          <Text style={s.sectionSub}>Plans disponibles maintenant près de toi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.missionsScroll}>
            {missions.map((m, i) => (
              <TouchableOpacity key={i} style={s.missionCard} onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.88}>
                <LinearGradient colors={m.gradient} style={s.missionGrad}>
                  <Text style={s.missionBgEmoji}>{m.emoji}</Text>
                  <View style={s.missionTop}>
                    <View style={s.missionBadge}>
                      <View style={s.missionBadgeDot} />
                      <Text style={s.missionBadgeTxt}>DISPO</Text>
                    </View>
                    <Text style={s.missionTemps}>{m.temps}</Text>
                  </View>
                  <Text style={s.missionTitre}>{m.titre}</Text>
                  <Text style={s.missionDesc}>{m.desc}</Text>
                  <View style={s.missionFooter}>
                    <Text style={s.missionPart}>👥 {m.participants} partants</Text>
                    <View style={s.missionBtn}>
                      <Text style={s.missionBtnTxt}>Rejoindre →</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activitesFiltrees.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 64 }}>🌍</Text>
              <Text style={s.emptyTitle}>Aucun plan trouvé</Text>
              <Text style={s.emptySub}>Sois le premier à proposer !</Text>
              <TouchableOpacity onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.85}>
                <LinearGradient colors={['#667EEA', '#764BA2']} style={s.emptyBtn}>
                  <Text style={s.emptyBtnTxt}>+ Créer un plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>🔥 Plans chauds</Text>
                <TouchableOpacity><Text style={s.sectionLink}>Tout voir →</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredScroll}>
                {activitesFiltrees.slice(0, 5).map(a => {
                  const gradient = getGradient(a.categorie);
                  const color = getColor(a.categorie);
                  const emoji = getEmoji(a.categorie);
                  const dist = getDistance(a);
                  const places = (a.max_participants || 0) - (a.participants_count || 0);
                  return (
                    <TouchableOpacity key={a.id} style={s.featuredCard} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.88}>
                      <LinearGradient colors={gradient} style={s.featuredInner}>
                        <Text style={s.featuredBgEmoji}>{emoji}</Text>
                        <View style={s.featuredTags}>
                          <View style={s.featuredTag}><Text style={s.featuredTagTxt}>{a.categorie?.toUpperCase()}</Text></View>
                          {dist && <View style={s.featuredTag}><Text style={s.featuredTagTxt}>📍 {formatDistance(dist)}</Text></View>}
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
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {activitesFiltrees.length > 5 && (
                <>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>✨ Tous les plans</Text>
                    <Text style={s.sectionCount}>{activitesFiltrees.length - 5} de plus</Text>
                  </View>
                  <View style={s.listeContainer}>
                    {activitesFiltrees.slice(5).map(a => {
                      const color = getColor(a.categorie);
                      const emoji = getEmoji(a.categorie);
                      const dist = getDistance(a);
                      const places = (a.max_participants || 0) - (a.participants_count || 0);
                      return (
                        <TouchableOpacity key={a.id} style={s.listeCard} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.8}>
                          <View style={[s.listeAccent, { backgroundColor: color }]} />
                          <View style={[s.listeIcon, { backgroundColor: color + '18' }]}>
                            <Text style={{ fontSize: 24 }}>{emoji}</Text>
                          </View>
                          <View style={s.listeInfo}>
                            <View style={s.listeTop}>
                              <Text style={s.listeTitre} numberOfLines={1}>{a.titre}</Text>
                              <View style={[s.listeTag, { backgroundColor: color }]}>
                                <Text style={s.listeTagTxt}>{a.categorie}</Text>
                              </View>
                            </View>
                            <Text style={s.listeDesc} numberOfLines={1}>{a.description}</Text>
                            <View style={s.listeFooter}>
                              <Text style={s.listeMeta}>📍 {a.ville}{dist ? ` · ${formatDistance(dist)}` : ''}</Text>
                              <Text style={s.listeMeta}>🗓 {formatDate(a.date)}</Text>
                              <Text style={[s.listePlaces, { color: places > 0 ? color : C.textLight }]}>
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

          <TouchableOpacity onPress={() => router.push('/creer-activite' as any)} activeOpacity={0.88} style={s.fabWrap}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={s.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.fabLeft}>
                <View style={s.fabIcon}><Text style={{ fontSize: 24 }}>✨</Text></View>
                <View>
                  <Text style={s.fabTitle}>Propose un plan</Text>
                  <Text style={s.fabSub}>30 secondes · gratuit</Text>
                </View>
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* MODAL DISPO */}
      <Modal visible={showDispoModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <LinearGradient colors={['#FF416C', '#3F5EFB']} style={s.modalHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.modalTitle}>🟢 Je suis dispo !</Text>
              <Text style={s.modalSub}>Choisis ce que tu veux faire</Text>
            </LinearGradient>
            <View style={s.activitesGrid}>
              {ACTIVITES_RAPIDES.map(a => (
                <TouchableOpacity key={a.label} style={[s.activiteBtn, { borderColor: a.color + '40' }]} onPress={() => activerDispo(`${a.emoji} ${a.label}`)} activeOpacity={0.8}>
                  <Text style={s.activiteBtnEmoji}>{a.emoji}</Text>
                  <Text style={[s.activiteBtnLabel, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalInfo}>
              <Text style={s.modalInfoTxt}>✅ Visible 2h · rayon 5km · désactivable à tout moment</Text>
            </View>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowDispoModal(false)}>
              <Text style={s.modalCloseTxt}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 32, paddingBottom: 18, paddingHorizontal: 20, overflow: 'hidden' },
  headerCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.08)', top: -120, right: -60 },
  headerCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -60, left: -40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 3 },
  headerTitle: { fontSize: 34, fontWeight: '900', color: C.white, letterSpacing: -1, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  locationTxt: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerBtnWhite: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchInput: { flex: 1, color: C.white, fontSize: 14, fontWeight: '500' },
  catsWrap: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  catsContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  catTxt: { fontSize: 12, fontWeight: '700', color: C.textMid },
  catActive: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catActiveTxt: { fontSize: 12, fontWeight: '800', color: C.white },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingTxt: { color: C.textLight, fontSize: 14, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 14, color: C.textLight },
  emptyBtn: { borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  emptyBtnTxt: { color: C.white, fontWeight: '800', fontSize: 14 },
  dispoWrap: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden', shadowColor: '#FF416C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  dispoCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  dispoPulse: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  dispoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.white },
  dispoTitle: { color: C.white, fontSize: 14, fontWeight: '800', marginBottom: 2 },
  dispoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  dispoActif: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E8FFF0', borderWidth: 2, borderColor: C.green },
  dispoActifTitle: { color: '#1A4A2E', fontSize: 14, fontWeight: '800' },
  dispoActifSub: { color: '#4A7A5E', fontSize: 11, marginTop: 2 },
  disposSection: { marginHorizontal: 16, marginBottom: 8, backgroundColor: C.white, borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: C.border },
  disposHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  disposDot: { width: 8, height: 8, borderRadius: 4 },
  disposTitre: { fontSize: 13, fontWeight: '700', color: C.text },
  disposAvatar: { alignItems: 'center', width: 58 },
  disposImg: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  disposLetter: { color: C.white, fontSize: 18, fontWeight: '800' },
  disposOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green, borderWidth: 2, borderColor: C.white },
  disposNom: { fontSize: 11, fontWeight: '700', color: C.text, textAlign: 'center' },
  disposAct: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: C.text, letterSpacing: -0.4 },
  sectionLink: { fontSize: 13, color: C.purple, fontWeight: '700' },
  sectionSub: { fontSize: 13, color: C.textLight, paddingHorizontal: 16, marginBottom: 12 },
  sectionCount: { fontSize: 12, color: C.textLight, fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF416C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  liveTxt: { color: C.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  missionsScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4, paddingTop: 4 },
  missionCard: { width: width * 0.72, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 8 },
  missionGrad: { padding: 18, gap: 8, position: 'relative' },
  missionBgEmoji: { position: 'absolute', right: -8, bottom: -8, fontSize: 80, opacity: 0.12 },
  missionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  missionBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  missionBadgeTxt: { color: C.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  missionTemps: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  missionTitre: { color: C.white, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  missionDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18 },
  missionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  missionPart: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  missionBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  missionBtnTxt: { color: C.white, fontSize: 12, fontWeight: '800' },
  featuredScroll: { paddingHorizontal: 16, gap: 14, paddingBottom: 4, paddingTop: 4 },
  featuredCard: { width: width * 0.65, height: 200, borderRadius: 26, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  featuredInner: { flex: 1, position: 'relative' },
  featuredBgEmoji: { position: 'absolute', right: -15, bottom: -10, fontSize: 100, opacity: 0.12 },
  featuredTags: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 6 },
  featuredTag: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featuredTagTxt: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  featuredContent: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  featuredTitle: { color: C.white, fontSize: 17, fontWeight: '900', lineHeight: 23, marginBottom: 8, letterSpacing: -0.3 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  featuredDate: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  placesBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  placesTxt: { color: C.white, fontSize: 10, fontWeight: '700' },
  createurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createurAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  createurLetter: { color: C.white, fontSize: 10, fontWeight: '800' },
  createurNom: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  listeContainer: { paddingHorizontal: 16, gap: 10 },
  listeCard: { backgroundColor: C.white, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  listeAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  listeIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  listeInfo: { flex: 1 },
  listeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  listeTitre: { color: C.text, fontSize: 14, fontWeight: '800', flex: 1, marginRight: 8 },
  listeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  listeTagTxt: { color: C.white, fontSize: 9, fontWeight: '800' },
  listeDesc: { color: C.textLight, fontSize: 12, marginBottom: 6 },
  listeFooter: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  listeMeta: { color: C.textLight, fontSize: 11, fontWeight: '500' },
  listePlaces: { fontSize: 11, fontWeight: '700' },
  fabWrap: { marginHorizontal: 16, marginTop: 24, borderRadius: 24, overflow: 'hidden', shadowColor: '#667EEA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  fab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  fabLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fabIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fabTitle: { color: C.white, fontSize: 15, fontWeight: '800' },
  fabSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12 },
  modalHeader: { padding: 24, paddingTop: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: C.white, marginBottom: 4 },
  modalSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 20 },
  activiteBtn: { backgroundColor: C.bg, borderRadius: 18, padding: 16, alignItems: 'center', width: '22%', borderWidth: 2 },
  activiteBtnEmoji: { fontSize: 28, marginBottom: 6 },
  activiteBtnLabel: { fontSize: 11, fontWeight: '800' },
  modalInfo: { backgroundColor: '#F0FFF4', borderRadius: 16, padding: 14, marginHorizontal: 20, borderWidth: 1, borderColor: '#00C85340' },
  modalInfoTxt: { color: '#1A4A2E', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  modalCloseBtn: { margin: 20, marginTop: 12, padding: 16, backgroundColor: C.bg, borderRadius: 16, alignItems: 'center' },
  modalCloseTxt: { color: C.textMid, fontSize: 15, fontWeight: '700' },
});