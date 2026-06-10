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

const C = {
  bg: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textMid: '#4A4A6A',
  textLight: '#9090A0',
  border: '#EEEEEE',
  green: '#00C853',
  purple: '#7C4DFF',
};

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

const CAT_GRADIENT: Record<string, [string, string]> = {
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
};

const CAT_COLOR: Record<string, string> = {
  Sport: '#FF416C', Resto: '#F7971E', Ciné: '#8E2DE2',
  Soirée: '#FC466B', Gaming: '#0072FF', Voyage: '#00B4DB',
  Musique: '#11998E', 'Bien-être': '#56AB2F', Social: '#FF4081', Art: '#F7971E',
};

const CAT_EMOJI: Record<string, string> = {
  Sport: '⚡', Resto: '🍕', Ciné: '🎬', Soirée: '🎉',
  Gaming: '🎮', Voyage: '✈️', Musique: '🎵', 'Bien-être': '🏃',
  Social: '👥', Art: '🎨',
};

const FILTRES = [
  { label: 'Tout', value: null },
  { label: '⚡ Sport', value: 'Sport' },
  { label: '🍕 Resto', value: 'Resto' },
  { label: '🎉 Soirée', value: 'Soirée' },
  { label: '🎮 Gaming', value: 'Gaming' },
  { label: '🎵 Musique', value: 'Musique' },
  { label: '✈️ Voyage', value: 'Voyage' },
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
    ? activites.filter(a => a.categorie === categorieActive)
    : activites;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date à confirmer';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const centerLat = userLocation?.latitude ?? 35.7595;
  const centerLng = userLocation?.longitude ?? -5.8340;

  const marqueurs = activitesFiltrees
    .filter(a => a.latitude && a.longitude)
    .map(a => {
      const color = CAT_COLOR[a.categorie] || '#667EEA';
      const emoji = CAT_EMOJI[a.categorie] || '📍';
      return `
        var icon_${a.id.replace(/-/g, '_')} = L.divIcon({
          html: '<div style="background:${color};width:40px;height:40px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25)">${emoji}</div>',
          className: '', iconSize: [40, 40], iconAnchor: [20, 20]
        });
        L.marker([${a.latitude}, ${a.longitude}], {icon: icon_${a.id.replace(/-/g, '_')}})
          .addTo(map)
          .bindPopup('<div style="font-family:sans-serif;padding:6px;min-width:140px"><b style="font-size:14px;color:#1A1A2E">${a.titre.replace(/'/g, "\\'")}</b><br><span style="color:#9090A0;font-size:12px">📍 ${a.ville.replace(/'/g, "\\'")}</span></div>');
      `;
    }).join('\n');

  const mapHtml = `
    <!DOCTYPE html><html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin:0; padding:0; }
        #map { width:100vw; height:100vh; }
        .leaflet-popup-content-wrapper { border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.12); border:1px solid #eee; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl:false}).setView([${centerLat}, ${centerLng}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {attribution: '© CartoDB'}).addTo(map);
        L.control.zoom({position:'bottomright'}).addTo(map);
        ${userLocation ? `
        var userIcon = L.divIcon({
          html: '<div style="width:18px;height:18px;background:#667EEA;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(102,126,234,0.25)"></div>',
          className:'', iconSize:[18,18], iconAnchor:[9,9]
        });
        L.marker([${centerLat}, ${centerLng}], {icon:userIcon}).addTo(map).bindPopup('📍 Vous êtes ici');
        ` : ''}
        ${marqueurs}
      </script>
    </body></html>
  `;

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={s.loadingTxt}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#667EEA', '#764BA2']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.headerCircle} />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtresContent}>
          {FILTRES.map(f => {
            const active = categorieActive === f.value;
            const color = f.value ? CAT_COLOR[f.value] : '#667EEA';
            return (
              <TouchableOpacity key={f.label} onPress={() => setCategorieActive(f.value)} activeOpacity={0.8}>
                <View style={[s.filtre, active && { backgroundColor: color, borderColor: color }]}>
                  <Text style={[s.filtreTxt, active && { color: C.white }]}>{f.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <View style={s.mapWrap}>
        <WebView source={{ html: mapHtml }} style={s.webview} scrollEnabled={false} javaScriptEnabled originWhitelist={['*']} />
        <View style={s.mapBadge}>
          <View style={s.mapBadgeDot} />
          <Text style={s.mapBadgeTxt}>{activitesFiltrees.filter(a => a.latitude && a.longitude).length} sur la carte</Text>
        </View>
      </View>

      <View style={s.liste}>
        <View style={s.listeHeader}>
          <Text style={s.listeTitre}>Plans disponibles</Text>
          <Text style={s.listeCount}>{activitesFiltrees.length} résultats</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.listeContent}>
          {activitesFiltrees.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 36 }}>🗺️</Text>
              <Text style={s.emptyTxt}>Aucun plan</Text>
            </View>
          ) : (
            activitesFiltrees.map(a => {
              const gradient = CAT_GRADIENT[a.categorie] || ['#667EEA', '#764BA2'] as [string,string];
              const emoji = CAT_EMOJI[a.categorie] || '✨';
              const color = CAT_COLOR[a.categorie] || '#667EEA';
              const dispo = (a.max_participants || 0) - (a.participants_count || 0);
              return (
                <TouchableOpacity key={a.id} style={s.card} onPress={() => router.push(`/activite/${a.id}` as any)} activeOpacity={0.85}>
                  <LinearGradient colors={gradient as [string,string]} style={s.cardHeader}>
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                    <View style={s.cardHeaderBadge}><Text style={s.cardHeaderBadgeTxt}>{a.categorie}</Text></View>
                  </LinearGradient>
                  <View style={s.cardBody}>
                    <Text style={s.cardTitre} numberOfLines={1}>{a.titre}</Text>
                    <Text style={s.cardVille} numberOfLines={1}>📍 {a.ville}</Text>
                    <Text style={s.cardDate}>🗓 {formatDate(a.date)}</Text>
                    <View style={s.cardFooter}>
                      <View style={[s.cardDispo, { backgroundColor: dispo > 0 ? '#00C85315' : '#FF3B3015' }]}>
                        <Text style={[s.cardDispoTxt, { color: dispo > 0 ? C.green : '#FF3B30' }]}>
                          {dispo > 0 ? `${dispo} places` : 'Complet'}
                        </Text>
                      </View>
                      <TouchableOpacity style={[s.cardBtn, { backgroundColor: color }]}>
                        <Text style={s.cardBtnTxt}>Voir →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  loadingTxt: { color: C.textLight, fontSize: 14, fontWeight: '600' },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 32, paddingBottom: 12, overflow: 'hidden' },
  headerCircle: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.07)', top: -100, right: -60 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 14 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.8 },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerBadgeNum: { fontSize: 20, fontWeight: '900', color: C.white },
  headerBadgeLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  filtresContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4, alignItems: 'center' },
  filtre: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  filtreTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  mapWrap: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  mapBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(26,26,46,0.85)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  mapBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  mapBadgeTxt: { color: C.white, fontSize: 12, fontWeight: '700' },
  liste: { backgroundColor: C.white, paddingTop: 14, paddingBottom: 8, borderTopWidth: 1, borderTopColor: C.border },
  listeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  listeTitre: { fontSize: 15, fontWeight: '800', color: C.text },
  listeCount: { fontSize: 12, fontWeight: '700', color: C.textLight },
  listeContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', width: 160, padding: 24, gap: 8 },
  emptyTxt: { fontSize: 13, color: C.textLight, fontWeight: '600' },
  card: { width: 165, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  cardHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  cardHeaderBadgeTxt: { color: C.white, fontSize: 10, fontWeight: '800' },
  cardBody: { padding: 12, gap: 4 },
  cardTitre: { fontSize: 13, fontWeight: '800', color: C.text },
  cardVille: { fontSize: 11, color: C.textLight },
  cardDate: { fontSize: 10, color: C.textLight },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardDispo: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardDispoTxt: { fontSize: 10, fontWeight: '700' },
  cardBtn: { borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10 },
  cardBtnTxt: { color: C.white, fontSize: 11, fontWeight: '800' },
});