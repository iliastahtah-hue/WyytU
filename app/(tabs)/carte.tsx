import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';

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
  Ciné: { couleur: '#7B2FBE', emoji: '🎬' },
  Soirée: { couleur: '#1A1A3A', emoji: '🎉' },
  Gaming: { couleur: '#0070F3', emoji: '🎮' },
  Voyage: { couleur: '#00B4D8', emoji: '✈️' },
  Musique: { couleur: '#1DB954', emoji: '🎵' },
  'Bien-être': { couleur: '#00897B', emoji: '🏃' },
  Social: { couleur: '#FF4B7D', emoji: '👥' },
  Art: { couleur: '#FFD600', emoji: '🎨' },
};

const FILTRES = [
  { label: 'Tout', value: null, couleur: '#1A1209' },
  { label: '⚡ Sport', value: 'Sport', couleur: '#E8000D' },
  { label: '🍕 Resto', value: 'Resto', couleur: '#FF6A00' },
  { label: '🎉 Soirée', value: 'Soirée', couleur: '#7B2FBE' },
  { label: '🎮 Gaming', value: 'Gaming', couleur: '#0070F3' },
  { label: '🎵 Musique', value: 'Musique', couleur: '#1DB954' },
  { label: '✈️ Voyage', value: 'Voyage', couleur: '#00B4D8' },
];

export default function CarteScreen() {
  const router = useRouter();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    chargerActivites();
    demanderLocalisation();
  }, []);

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
    ? activites.filter(a => a.categorie === categorieActive)
    : activites;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const centerLat = userLocation?.latitude ?? 33.5731;
  const centerLng = userLocation?.longitude ?? -7.5898;

  const marqueurs = activitesFiltrees
    .filter(a => a.latitude && a.longitude)
    .map(a => {
      const cat = CATEGORIES[a.categorie] || { couleur: '#1A1209', emoji: '📍' };
      return `
        var icon_${a.id.replace(/-/g, '_')} = L.divIcon({
          html: '<div style="background:${cat.couleur};width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cat.emoji}</div>',
          className: '', iconSize: [36, 36], iconAnchor: [18, 18]
        });
        L.marker([${a.latitude}, ${a.longitude}], {icon: icon_${a.id.replace(/-/g, '_')}})
          .addTo(map)
          .bindPopup('<div style="font-family:sans-serif;padding:4px"><b style="font-size:14px">${a.titre.replace(/'/g, "\\'")}</b><br><span style="color:#888;font-size:12px">📍 ${a.ville.replace(/'/g, "\\'")}</span></div>');
      `;
    }).join('\n');

  const mapHtml = `
    <!DOCTYPE html><html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#FAF7F2; }
        #map { width:100vw; height:100vh; }
        .leaflet-popup-content-wrapper { border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.15); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl:false}).setView([${centerLat}, ${centerLng}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB'
        }).addTo(map);
        L.control.zoom({position:'bottomright'}).addTo(map);
        ${userLocation ? `
        var pulse = L.divIcon({
          html: '<div style="width:20px;height:20px;background:#E8000D;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(232,0,13,0.25)"></div>',
          className:'', iconSize:[20,20], iconAnchor:[10,10]
        });
        L.marker([${centerLat}, ${centerLng}], {icon:pulse}).addTo(map).bindPopup('📍 Vous êtes ici');
        ` : ''}
        ${marqueurs}
      </script>
    </body></html>
  `;

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text style={s.loadingTxt}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* HEADER */}
      <LinearGradient colors={['#1A1209', '#2C1F0A']} style={s.header}>
        <View style={s.headerContent}>
          <View>
            <Text style={s.headerSub}>Explore autour de toi</Text>
            <Text style={s.headerTitle}>Carte 🗺️</Text>
          </View>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeNum}>{activitesFiltrees.length}</Text>
            <Text style={s.headerBadgeLbl}>plans</Text>
          </View>
        </View>

        {/* FILTRES */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtresContent}>
          {FILTRES.map(f => (
            <TouchableOpacity
              key={f.label}
              onPress={() => setCategorieActive(f.value)}
              activeOpacity={0.8}>
              {categorieActive === f.value ? (
                <LinearGradient
                  colors={[f.couleur + 'DD', f.couleur]}
                  style={s.filtreActive}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.filtreActiveTxt}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <View style={s.filtre}>
                  <Text style={s.filtreTxt}>{f.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* CARTE */}
      <View style={s.mapWrap}>
        <WebView
          source={{ html: mapHtml }}
          style={s.webview}
          scrollEnabled={false}
          javaScriptEnabled
          originWhitelist={['*']}
        />

        {/* Badge compteur sur la carte */}
        <View style={s.mapBadge}>
          <View style={s.mapBadgeDot} />
          <Text style={s.mapBadgeTxt}>{activitesFiltrees.filter(a => a.latitude && a.longitude).length} sur la carte</Text>
        </View>
      </View>

      {/* MINI LISTE */}
      <View style={s.liste}>
        <View style={s.listeHeader}>
          <Text style={s.listeTitre}>Plans disponibles</Text>
          <Text style={s.listeCount}>{activitesFiltrees.length} résultats</Text>
        </View>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.listeContent}>
          {activitesFiltrees.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 36 }}>🗺️</Text>
              <Text style={s.emptyTxt}>Aucun plan</Text>
            </View>
          ) : (
            activitesFiltrees.map(a => {
              const cat = CATEGORIES[a.categorie] || { couleur: '#1A1209', emoji: '✦' };
              const dispo = (a.max_participants || 0) - (a.participants_count || 0);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={s.card}
                  onPress={() => router.push(`/activite/${a.id}` as any)}
                  activeOpacity={0.85}>
                  <LinearGradient
                    colors={[cat.couleur + '22', cat.couleur + '08']}
                    style={s.cardGrad}>
                    <View style={[s.cardIcon, { backgroundColor: cat.couleur }]}>
                      <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    </View>
                    <Text style={s.cardTitre} numberOfLines={1}>{a.titre}</Text>
                    <Text style={s.cardVille} numberOfLines={1}>📍 {a.ville}</Text>
                    <Text style={s.cardDate}>{formatDate(a.date)}</Text>
                    <View style={s.cardBottom}>
                      <View style={[s.cardDispo, { backgroundColor: dispo > 0 ? '#1DB95420' : '#E8000D20' }]}>
                        <Text style={[s.cardDispoTxt, { color: dispo > 0 ? '#1DB954' : '#E8000D' }]}>
                          {dispo > 0 ? `${dispo} places` : 'Complet'}
                        </Text>
                      </View>
                      <View style={[s.cardBtn, { backgroundColor: cat.couleur }]}>
                        <Text style={s.cardBtnTxt}>Voir</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF7F2' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FAF7F2' },
  loadingTxt: { color: '#AAA', fontSize: 14, fontWeight: '600' },

  // HEADER
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 32,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 14,
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.8 },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  headerBadgeNum: { fontSize: 20, fontWeight: '900', color: '#C9A84C' },
  headerBadgeLbl: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },

  // FILTRES
  filtresContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 4, alignItems: 'center' },
  filtre: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  filtreTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  filtreActive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filtreActiveTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // CARTE
  mapWrap: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  mapBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(26,18,9,0.85)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  mapBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1DB954' },
  mapBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // LISTE
  liste: { backgroundColor: '#FAF7F2', paddingTop: 14, paddingBottom: 8 },
  listeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  listeTitre: { fontSize: 15, fontWeight: '800', color: '#1A1209' },
  listeCount: { fontSize: 12, fontWeight: '700', color: '#8A7F72' },
  listeContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },

  emptyCard: { alignItems: 'center', justifyContent: 'center', width: 160, padding: 24, gap: 8 },
  emptyTxt: { fontSize: 13, color: '#AAA', fontWeight: '600' },

  card: { width: 160, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  cardGrad: { padding: 14, gap: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  cardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitre: { fontSize: 13, fontWeight: '800', color: '#1A1209' },
  cardVille: { fontSize: 11, color: '#8A7F72' },
  cardDate: { fontSize: 10, color: '#AAA' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardDispo: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardDispoTxt: { fontSize: 10, fontWeight: '700' },
  cardBtn: { borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10 },
  cardBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
});