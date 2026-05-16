import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'Tout', value: null, color: '#1A1A1A' },
  { label: 'Sport', value: 'Sport', color: '#E8000D' },
  { label: 'Resto', value: 'Resto', color: '#FF6A00' },
  { label: 'Ciné', value: 'Ciné', color: '#CC0000' },
  { label: 'Soirée', value: 'Soirée', color: '#7B2FBE' },
  { label: 'Gaming', value: 'Gaming', color: '#0070F3' },
  { label: 'Voyage', value: 'Voyage', color: '#00B4D8' },
  { label: 'Musique', value: 'Musique', color: '#1DB954' },
  { label: 'Bien-être', value: 'Bien-être', color: '#00897B' },
  { label: 'Social', value: 'Social', color: '#FF4B7D' },
  { label: 'Art', value: 'Art', color: '#FFD600' },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
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

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    chargerActivites();
  }, [categorieActive]);

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
    let query = supabase
      .from('activites')
      .select('*')
      .order('date', { ascending: true });
    if (categorieActive) query = query.eq('categorie', categorieActive);
    const { data } = await query;
    setActivites(data || []);
    setIndex(0);
    setLoading(false);
  }

  async function rejoindre(activite: any) {
    if (!userId) return;
    const { error } = await supabase.from('participations').insert({
      activite_id: activite.id,
      user_id: userId,
    });
    if (error && error.code !== '23505') {
      Alert.alert('Erreur', 'Impossible de rejoindre.');
    } else {
      Alert.alert('✅ Rejoint !', `Tu as rejoint "${activite.titre}"`, [
        { text: 'Voir le chat', onPress: () => router.push(`/chat/${activite.id}`) },
        { text: 'Continuer', onPress: () => passer() },
      ]);
    }
  }

  function passer() {
    setIndex((prev) => prev + 1);
  }

  const activite = activites[index];
  const couleurCat = CATEGORIES.find((c) => c.value === activite?.categorie)?.color || '#1A1A1A';
  const distance =
    userLocation && activite?.latitude && activite?.longitude
      ? getDistance(userLocation.latitude, userLocation.longitude, activite.latitude, activite.longitude).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Matching 🎯</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtresScroll}
        contentContainerStyle={styles.filtresContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[
              styles.filtreBtn,
              categorieActive === cat.value && { backgroundColor: cat.color, borderColor: cat.color },
            ]}
            onPress={() => setCategorieActive(cat.value)}
          >
            <Text style={[styles.filtreText, categorieActive === cat.value && { color: '#fff' }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 60 }} />
      ) : !activite ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitre}>Plus d'activités !</Text>
          <Text style={styles.emptyText}>Reviens plus tard ou change de catégorie.</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setCategorieActive(null); setIndex(0); }}>
            <Text style={styles.resetText}>Tout voir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { borderTopColor: couleurCat }]}>
            <View style={[styles.badge, { backgroundColor: couleurCat }]}>
              <Text style={styles.badgeText}>{activite.categorie}</Text>
            </View>
            <Text style={styles.cardTitre}>{activite.titre}</Text>
            <Text style={styles.cardDesc}>{activite.description}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>📅 {new Date(activite.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>👥 {activite.participants_count ?? 0} / {activite.max_participants} participants</Text>
            </View>
            {distance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>📍 À {distance} km de toi</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>🏙️ {activite.ville}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>👤 Créé par {activite.createur_prenom}</Text>
            </View>
            <Text style={styles.compteur}>{index + 1} / {activites.length}</Text>
          </View>

          <View style={styles.boutons}>
            <TouchableOpacity style={styles.btnPasser} onPress={passer}>
              <Text style={styles.btnPasserText}>✕ Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnRejoindre, { backgroundColor: couleurCat }]} onPress={() => rejoindre(activite)}>
              <Text style={styles.btnRejoindreText}>✓ Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#FAF7F2',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, color: '#1A1A1A' },
  titre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  filtresScroll: { maxHeight: 52 },
  filtresContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filtreBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#DDD4C4', backgroundColor: '#EEE8DE',
  },
  filtreText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  cardWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    borderTopWidth: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4, flex: 1,
  },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, marginBottom: 16,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardTitre: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  cardDesc: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#444' },
  compteur: { marginTop: 'auto', textAlign: 'center', color: '#AAA', fontSize: 13, paddingTop: 16 },
  boutons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnPasser: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#EEE8DE', alignItems: 'center',
  },
  btnPasserText: { fontWeight: '700', fontSize: 16, color: '#1A1A1A' },
  btnRejoindre: {
    flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  btnRejoindreText: { fontWeight: '700', fontSize: 16, color: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#AAA', textAlign: 'center', marginBottom: 24 },
  resetBtn: {
    backgroundColor: '#1A1A1A', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 14,
  },
  resetText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});