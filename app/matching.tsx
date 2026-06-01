import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated,
    Dimensions, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import TabBar from '../components/TabBar';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

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
  const [actionAnim] = useState(new Animated.Value(0));
  const [actionType, setActionType] = useState<'pass' | 'join' | null>(null);

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

  function animerAction(type: 'pass' | 'join', callback: () => void) {
    setActionType(type);
    Animated.sequence([
      Animated.timing(actionAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(actionAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => { setActionType(null); callback(); });
  }

  async function rejoindre(activite: any) {
    if (!userId) return;
    animerAction('join', async () => {
      const { error } = await supabase.from('participations').insert({ activite_id: activite.id, user_id: userId });
      if (error && error.code !== '23505') {
        Alert.alert('Erreur', 'Impossible de rejoindre.');
      } else {
        Alert.alert('✅ Rejoint !', `Tu as rejoint "${activite.titre}"`, [
          { text: 'Voir le chat', onPress: () => router.push(`/chat/${activite.id}`) },
          { text: 'Continuer', onPress: passer },
        ]);
      }
    });
  }

  function passer() {
    animerAction('pass', () => setIndex((prev) => prev + 1));
  }

  const activite = activites[index];
  const cat = CATEGORIES.find((c) => c.value === activite?.categorie);
  const couleurCat = cat?.color || '#1A1A1A';
  const emojiCat = cat?.emoji || '✦';
  const distance = userLocation && activite?.latitude && activite?.longitude
    ? getDistance(userLocation.latitude, userLocation.longitude, activite.latitude, activite.longitude).toFixed(1)
    : null;

  const placesRestantes = (activite?.max_participants || 0) - (activite?.participants_count || 0);

  const cardScale = actionAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const cardOpacity = actionAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.titre}>Matching</Text>
          <Text style={styles.sousTitre}>{activites.length} plans disponibles</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeTexte}>🎯</Text>
          </View>
        </View>
      </View>

      {/* FILTRES */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtresScroll} contentContainerStyle={styles.filtresContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.filtreBtn, categorieActive === cat.value && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => setCategorieActive(cat.value)}>
            <Text style={styles.filtreEmoji}>{cat.emoji}</Text>
            <Text style={[styles.filtreText, categorieActive === cat.value && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTENU */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
          <Text style={styles.loadingTexte}>Recherche des plans...</Text>
        </View>
      ) : !activite ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitre}>Tu as tout vu !</Text>
          <Text style={styles.emptyText}>Reviens plus tard ou change de catégorie.</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setCategorieActive(null); setIndex(0); }}>
            <Text style={styles.resetText}>↺ Recommencer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.creerBtn} onPress={() => router.push('/creer-activite' as any)}>
            <Text style={styles.creerBtnTexte}>+ Créer un plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardWrapper}>

          {/* CARD SUIVANTE (fond) */}
          {activites[index + 1] && (
            <View style={[styles.cardBg, { backgroundColor: CATEGORIES.find(c => c.value === activites[index + 1]?.categorie)?.color || '#1A1A1A' }]}>
              <Text style={styles.cardBgEmoji}>{CATEGORIES.find(c => c.value === activites[index + 1]?.categorie)?.emoji}</Text>
            </View>
          )}

          {/* CARD PRINCIPALE */}
          <Animated.View style={[styles.card, { backgroundColor: couleurCat, transform: [{ scale: cardScale }], opacity: cardOpacity }]}>

            {/* BG DÉCO */}
            <Text style={styles.cardBgEmojiMain}>{emojiCat}</Text>

            {/* TOP */}
            <View style={styles.cardTop}>
              <View style={styles.cardBadgeRow}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeTexte}>{activite.categorie?.toUpperCase()}</Text>
                </View>
                {distance && (
                  <View style={styles.cardDistanceBadge}>
                    <Text style={styles.cardDistanceTexte}>📍 {distance} km</Text>
                  </View>
                )}
              </View>

              {/* COMPTEUR */}
              <View style={styles.compteurBadge}>
                <Text style={styles.compteurTexte}>{index + 1}/{activites.length}</Text>
              </View>
            </View>

            {/* CONTENU */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitre} numberOfLines={2}>{activite.titre}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>{activite.description}</Text>

              {/* INFOS PILLS */}
              <View style={styles.pillsRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillTexte}>🏙️ {activite.ville}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillTexte}>
                    👥 {activite.participants_count ?? 0}/{activite.max_participants}
                  </Text>
                </View>
                {activite.date && (
                  <View style={styles.pill}>
                    <Text style={styles.pillTexte}>
                      📅 {new Date(activite.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                )}
              </View>

              {/* PLACES */}
              {placesRestantes <= 3 && placesRestantes > 0 && (
                <View style={styles.urgenceBadge}>
                  <Text style={styles.urgenceTexte}>🔥 Plus que {placesRestantes} place{placesRestantes > 1 ? 's' : ''} !</Text>
                </View>
              )}

              {/* CRÉATEUR */}
              <View style={styles.createurRow}>
                <View style={styles.createurAvatar}>
                  <Text style={styles.createurAvatarTexte}>{activite.createur_prenom?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.createurTexte}>Organisé par <Text style={styles.createurNom}>{activite.createur_prenom}</Text></Text>
              </View>
            </View>

            {/* ACTION OVERLAY */}
            {actionType && (
              <View style={[styles.actionOverlay, { backgroundColor: actionType === 'join' ? '#1DB954' : '#E8000D' }]}>
                <Text style={styles.actionOverlayTexte}>{actionType === 'join' ? '✓ Rejoint !' : '✕ Passé'}</Text>
              </View>
            )}
          </Animated.View>

          {/* BOUTONS */}
          <View style={styles.boutons}>
            <TouchableOpacity style={styles.btnPasser} onPress={passer} activeOpacity={0.8}>
              <Text style={styles.btnPasserIcon}>✕</Text>
              <Text style={styles.btnPasserText}>Passer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDetail}
              onPress={() => router.push(`/activite/${activite.id}` as any)}
              activeOpacity={0.8}>
              <Text style={styles.btnDetailIcon}>👁</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnRejoindre, { backgroundColor: couleurCat }]}
              onPress={() => rejoindre(activite)}
              activeOpacity={0.8}>
              <Text style={styles.btnRejoindreIcon}>✓</Text>
              <Text style={styles.btnRejoindreText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>

          {/* HINT */}
          <Text style={styles.hint}>Appuie sur 👁 pour voir les détails</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#1A1A1A' },
  titre: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  sousTitre: { fontSize: 12, color: '#AAA', fontWeight: '600', marginTop: 2 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  headerBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerBadgeTexte: { fontSize: 20 },

  // FILTRES
  filtresScroll: { maxHeight: 52 },
  filtresContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filtreBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD4C4', backgroundColor: '#EEE8DE' },
  filtreEmoji: { fontSize: 14 },
  filtreText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },

  // LOADING
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTexte: { color: '#AAA', fontSize: 14, fontWeight: '600' },

  // CARD WRAPPER
  cardWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, alignItems: 'center' },

  // CARD BG (suivante)
  cardBg: { position: 'absolute', top: 24, left: 28, right: 28, bottom: 108, borderRadius: 28, opacity: 0.4, alignItems: 'center', justifyContent: 'center' },
  cardBgEmoji: { fontSize: 80, opacity: 0.3 },

  // CARD PRINCIPALE
  card: { width: '100%', flex: 1, borderRadius: 28, padding: 24, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  cardBgEmojiMain: { position: 'absolute', right: -20, bottom: -20, fontSize: 140, opacity: 0.12 },

  // CARD TOP
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cardBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  cardBadgeTexte: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardDistanceBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  cardDistanceTexte: { color: '#fff', fontSize: 10, fontWeight: '700' },
  compteurBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  compteurTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // CARD CONTENT
  cardContent: { flex: 1, justifyContent: 'flex-end' },
  cardTitre: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 34, marginBottom: 10, letterSpacing: -0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, marginBottom: 16 },

  // PILLS
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillTexte: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // URGENCE
  urgenceBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: 10, marginBottom: 12, alignItems: 'center' },
  urgenceTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // CRÉATEUR
  createurRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  createurAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  createurAvatarTexte: { color: '#fff', fontSize: 14, fontWeight: '800' },
  createurTexte: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  createurNom: { color: '#fff', fontWeight: '800' },

  // ACTION OVERLAY
  actionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionOverlayTexte: { color: '#fff', fontSize: 32, fontWeight: '900' },

  // BOUTONS
  boutons: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  btnPasser: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  btnPasserIcon: { fontSize: 18, color: '#E8000D' },
  btnPasserText: { fontWeight: '800', fontSize: 15, color: '#1A1A1A' },
  btnDetail: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnDetailIcon: { fontSize: 22 },
  btnRejoindre: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnRejoindreIcon: { fontSize: 18, color: '#fff' },
  btnRejoindreText: { fontWeight: '800', fontSize: 15, color: '#fff' },

  // HINT
  hint: { color: '#AAA', fontSize: 12, fontWeight: '600', marginTop: 8 },

  // EMPTY
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 70 },
  emptyTitre: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  emptyText: { fontSize: 15, color: '#AAA', textAlign: 'center' },
  resetBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20, marginTop: 8 },
  resetText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  creerBtn: { backgroundColor: '#EEE8DE', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD4C4' },
  creerBtnTexte: { color: '#1A1A1A', fontWeight: '800', fontSize: 15 },
});