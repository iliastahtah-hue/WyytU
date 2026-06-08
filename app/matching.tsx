import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TabBar from '../components/TabBar';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const CATEGORIES = [
  { label: 'Tout', value: null, color: '#1A1A1A', emoji: '✦' },
  { label: 'Sport', value: 'Sport', color: '#E8000D', emoji: '⚡' },
  { label: 'Resto', value: 'Resto', color: '#FF6A00', emoji: '🍕' },
  { label: 'Ciné', value: 'Ciné', color: '#CC0000', emoji: '🎬' },
  { label: 'Soirée', value: 'Soirée', color: '#7B2FBE', emoji: '🎉' },
  { label: 'Gaming', value: 'Gaming', color: '#0070F3', emoji: '🎮' },
  { label: 'Voyage', value: 'Voyage', color: '#00B4D8', emoji: '✈️' },
  { label: 'Musique', value: 'Musique', color: '#1DB954', emoji: '🎵' },
  { label: 'Bien-être', value: 'Bien-être', color: '#00897B', emoji: '🏃' },
  { label: 'Social', value: 'Social', color: '#FF4B7D', emoji: '👥' },
  { label: 'Art', value: 'Art', color: '#FFD600', emoji: '🎨' },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MatchingScreen() {
  const router = useRouter();
  const [activites, setActivites] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-15deg', '0deg', '15deg'] });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1] });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0] });
  const nextCardScale = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0.92, 1] });
  const nextCardOpacity = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0.6, 1] });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      if (gesture.dx > 50) setSwipeDir('right');
      else if (gesture.dx < -50) setSwipeDir('left');
      else setSwipeDir(null);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 5 }).start();
        setSwipeDir(null);
      }
    },
  });

  const swipeRight = () => {
    Animated.timing(position, { toValue: { x: width * 1.5, y: 0 }, duration: 350, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setSwipeDir(null);
      rejoindre(activites[index]);
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, { toValue: { x: -width * 1.5, y: 0 }, duration: 350, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setSwipeDir(null);
      setIndex(prev => prev + 1);
    });
  };

  useEffect(() => { init(); }, []);
  useEffect(() => { chargerActivites(); }, [categorieActive]);

  async function init() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    }
    await chargerActivites();
  }

  async function chargerActivites() {
    setLoading(true);
    let query = supabase.from('activites').select('*').order('date', { ascending: true });
    if (categorieActive) query = query.eq('categorie', categorieActive);
    const { data } = await query;
    setActivites(data || []);
    setIndex(0);
    setLoading(false);
  }

  async function rejoindre(activite: any) {
    if (!userId) return;
    const { error } = await supabase.from('participations').insert({ activite_id: activite.id, user_id: userId });
    if (error && error.code !== '23505') {
      Alert.alert('Erreur', 'Impossible de rejoindre.');
    } else {
      setTimeout(() => {
        setIndex(prev => prev + 1);
        Alert.alert('🎉 Rejoint !', `Tu as rejoint "${activite.titre}"`, [
          { text: 'Voir le chat', onPress: () => router.push(`/chat/${activite.id}`) },
          { text: 'Continuer' },
        ]);
      }, 200);
    }
  }

  const activite = activites[index];
  const nextActivite = activites[index + 1];
  const cat = CATEGORIES.find(c => c.value === activite?.categorie);
  const couleur = cat?.color || '#1A1A1A';
  const emoji = cat?.emoji || '✦';
  const nextCat = CATEGORIES.find(c => c.value === nextActivite?.categorie);
  const distance = userLocation && activite?.latitude && activite?.longitude
    ? getDistance(userLocation.latitude, userLocation.longitude, activite.latitude, activite.longitude).toFixed(1)
    : null;
  const places = (activite?.max_participants || 0) - (activite?.participants_count || 0);

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.titre}>Matching</Text>
          <Text style={styles.sousTitre}>{activites.length} plans · swipe pour explorer</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeEmoji}>🎯</Text>
        </View>
      </View>

      {/* FILTRES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresScroll} contentContainerStyle={styles.filtresContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.filtreChip, categorieActive === cat.value && { backgroundColor: cat.color }]}
            onPress={() => setCategorieActive(cat.value)}>
            <Text style={styles.filtreEmoji}>{cat.emoji}</Text>
            <Text style={[styles.filtreLabel, categorieActive === cat.value && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTENU */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E8000D" />
          <Text style={styles.loadingTexte}>Recherche des plans...</Text>
        </View>
      ) : !activite ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitre}>Tu as tout vu !</Text>
          <Text style={styles.emptySub}>Reviens plus tard ou change de catégorie.</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setCategorieActive(null); setIndex(0); }}>
            <Text style={styles.resetTexte}>↺ Recommencer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.creerBtn} onPress={() => router.push('/creer-activite' as any)}>
            <Text style={styles.creerBtnTexte}>+ Créer un plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsZone}>

          {/* CARD SUIVANTE */}
          {nextActivite && (
            <Animated.View style={[styles.cardNext, {
              backgroundColor: nextCat?.color || '#1A1A1A',
              transform: [{ scale: nextCardScale }],
              opacity: nextCardOpacity,
            }]}>
              <Text style={styles.cardNextEmoji}>{nextCat?.emoji || '✦'}</Text>
              <Text style={styles.cardNextTitre} numberOfLines={2}>{nextActivite.titre}</Text>
            </Animated.View>
          )}

          {/* CARD PRINCIPALE — SWIPEABLE */}
          <Animated.View
            style={[styles.card, {
              backgroundColor: couleur,
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            }]}
            {...panResponder.panHandlers}>

            {/* OVERLAY LIKE */}
            <Animated.View style={[styles.overlayLike, { opacity: likeOpacity }]}>
              <Text style={styles.overlayLikeTexte}>REJOINDRE</Text>
            </Animated.View>

            {/* OVERLAY NOPE */}
            <Animated.View style={[styles.overlayNope, { opacity: nopeOpacity }]}>
              <Text style={styles.overlayNopeTexte}>PASSER</Text>
            </Animated.View>

            {/* BG EMOJI */}
            <Text style={styles.cardBgEmoji}>{emoji}</Text>

            {/* HEADER CARD */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTags}>
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagTexte}>{activite.categorie?.toUpperCase()}</Text>
                </View>
                {distance && (
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                    <Text style={styles.cardTagTexte}>📍 {distance}km</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardCompteur}>
                <Text style={styles.cardCompteurTexte}>{index + 1}/{activites.length}</Text>
              </View>
            </View>

            {/* CONTENU CARD */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitre} numberOfLines={2}>{activite.titre}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>{activite.description}</Text>

              <View style={styles.cardPills}>
                <View style={styles.cardPill}><Text style={styles.cardPillTexte}>🏙️ {activite.ville}</Text></View>
                <View style={styles.cardPill}><Text style={styles.cardPillTexte}>👥 {activite.participants_count ?? 0}/{activite.max_participants}</Text></View>
                {activite.date && (
                  <View style={styles.cardPill}>
                    <Text style={styles.cardPillTexte}>📅 {new Date(activite.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                )}
              </View>

              {places <= 3 && places > 0 && (
                <View style={styles.urgence}>
                  <Text style={styles.urgenceTexte}>🔥 Plus que {places} place{places > 1 ? 's' : ''} !</Text>
                </View>
              )}

              <View style={styles.cardCreateur}>
                <View style={styles.cardCreateurAvatar}>
                  <Text style={styles.cardCreateurLettre}>{activite.createur_prenom?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.cardCreateurTexte}>
                  par <Text style={styles.cardCreateurNom}>{activite.createur_prenom}</Text>
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* HINT SWIPE */}
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintTexte}>← Passer · Swipe · Rejoindre →</Text>
          </View>

          {/* BOUTONS */}
          <View style={styles.boutons}>
            <TouchableOpacity style={styles.btnNon} onPress={swipeLeft} activeOpacity={0.8}>
              <Text style={styles.btnNonIcon}>✕</Text>
              <Text style={styles.btnNonTexte}>Passer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnInfo}
              onPress={() => router.push(`/activite/${activite.id}` as any)}
              activeOpacity={0.8}>
              <Text style={styles.btnInfoIcon}>👁</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnOui, { backgroundColor: couleur }]} onPress={swipeRight} activeOpacity={0.8}>
              <Text style={styles.btnOuiIcon}>✓</Text>
              <Text style={styles.btnOuiTexte}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#1A1A1A', fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  titre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  sousTitre: { fontSize: 11, color: '#AAA', fontWeight: '600', marginTop: 2 },
  headerBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerBadgeEmoji: { fontSize: 20 },

  // FILTRES
  filtresScroll: { maxHeight: 50 },
  filtresContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 4, alignItems: 'center' },
  filtreChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE8DE' },
  filtreEmoji: { fontSize: 13 },
  filtreLabel: { fontSize: 12, fontWeight: '700', color: '#555' },

  // LOADING / EMPTY
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTexte: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 14 },
  emptyEmoji: { fontSize: 72 },
  emptyTitre: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  emptySub: { fontSize: 15, color: '#AAA', textAlign: 'center' },
  resetBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20 },
  resetTexte: { color: '#fff', fontWeight: '800', fontSize: 15 },
  creerBtn: { backgroundColor: '#EEE8DE', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD4C4' },
  creerBtnTexte: { color: '#1A1A1A', fontWeight: '800', fontSize: 15 },

  // CARDS ZONE
  cardsZone: { flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  // CARD SUIVANTE
  cardNext: { position: 'absolute', top: 20, left: 28, right: 28, bottom: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'flex-end', padding: 20, overflow: 'hidden' },
  cardNextEmoji: { position: 'absolute', fontSize: 100, opacity: 0.1, right: -20, bottom: -10 },
  cardNextTitre: { color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: '800', textAlign: 'center' },

  // CARD PRINCIPALE
  card: { width: '100%', flex: 1, borderRadius: 28, padding: 22, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 12 },
  cardBgEmoji: { position: 'absolute', right: -20, bottom: -20, fontSize: 150, opacity: 0.1 },

  // OVERLAYS SWIPE
  overlayLike: { position: 'absolute', top: 40, left: 20, zIndex: 10, borderWidth: 4, borderColor: '#1DB954', borderRadius: 12, padding: 8, transform: [{ rotate: '-20deg' }] },
  overlayLikeTexte: { color: '#1DB954', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  overlayNope: { position: 'absolute', top: 40, right: 20, zIndex: 10, borderWidth: 4, borderColor: '#E8000D', borderRadius: 12, padding: 8, transform: [{ rotate: '20deg' }] },
  overlayNopeTexte: { color: '#E8000D', fontSize: 28, fontWeight: '900', letterSpacing: 2 },

  // CARD HEADER
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' },
  cardTags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cardTag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  cardTagTexte: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  cardCompteur: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  cardCompteurTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // CARD BODY
  cardBody: { justifyContent: 'flex-end', flex: 1 },
  cardTitre: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 36, marginBottom: 10, letterSpacing: -0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  cardPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cardPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  cardPillTexte: { color: '#fff', fontSize: 12, fontWeight: '600' },
  urgence: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, padding: 10, marginBottom: 12, alignItems: 'center' },
  urgenceTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },
  cardCreateur: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCreateurAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cardCreateurLettre: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cardCreateurTexte: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  cardCreateurNom: { color: '#fff', fontWeight: '800' },

  // SWIPE HINT
  swipeHint: { marginVertical: 10 },
  swipeHintTexte: { color: '#BBB', fontSize: 12, fontWeight: '500' },

  // BOUTONS
  boutons: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingBottom: 4 },
  btnNon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 22, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  btnNonIcon: { fontSize: 20, color: '#E8000D' },
  btnNonTexte: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  btnInfo: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnInfoIcon: { fontSize: 24 },
  btnOui: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  btnOuiIcon: { fontSize: 20, color: '#fff' },
  btnOuiTexte: { fontSize: 15, fontWeight: '800', color: '#fff' },
});