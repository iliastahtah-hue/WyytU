import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import TabBar from '../components/TabBar';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
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

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const HEURES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function CreerActiviteScreen() {
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [categorieActive, setCategorieActive] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // DATE PICKER
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedHeure, setSelectedHeure] = useState('19');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [dateAffichee, setDateAffichee] = useState('');

  // AUTOCOMPLETE ADRESSE
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

  const getCouleur = () => {
    const cat = CATEGORIES.find((c) => c.label === categorieActive);
    return cat ? cat.couleur1 : '#1A1A1A';
  };

  const confirmerDate = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T${selectedHeure}:${selectedMinute}:00`;
    const affichage = `${selectedDay} ${MOIS[selectedMonth]} ${selectedYear} à ${selectedHeure}h${selectedMinute}`;
    setDateAffichee(affichage);
    setShowDatePicker(false);
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

  const rechercherAdresse = async (texte: string) => {
    setVille(texte);
    if (texte.length < 3) { setSuggestions([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texte)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'WyytU/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 400);
  };

  const selectionnerAdresse = (suggestion: Suggestion) => {
    setVille(suggestion.display_name.split(',').slice(0, 3).join(','));
    setCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setSuggestions([]);
  };

  const detecterVille = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée', 'Active la localisation.'); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (adresse) {
        const villeDetectee = adresse.city || adresse.subregion || adresse.region || 'Ville inconnue';
        const quartier = adresse.district || adresse.street || '';
        setVille(quartier ? `${quartier}, ${villeDetectee}` : villeDetectee);
      }
    } catch { Alert.alert('Erreur', 'Impossible de détecter ta position.'); }
    finally { setLocLoading(false); }
  };

  const creerActivite = async () => {
    if (!titre || !description || !ville || !categorieActive) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires !'); return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Erreur', 'Tu dois être connecté !'); return; }
      const { data: profil } = await supabase.from('utilisateurs').select('prenom').eq('email', user.email).single();
      const dateISO = dateAffichee
        ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T${selectedHeure}:${selectedMinute}:00`
        : null;
      const { error } = await supabase.from('activites').insert({
        titre, description, ville,
        categorie: categorieActive,
        date: dateISO,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        participants_count: 0,
        createur_id: user.id,
        createur_prenom: profil?.prenom || user.email?.split('@')[0],
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
      });
      if (error) { Alert.alert('Erreur', error.message); }
      else {
        Alert.alert('🎉 Plan créé !', 'Ton activité est en ligne !', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const years = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitre}>Nouveau plan ✦</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formulaire}>

          {/* TITRE */}
          <Text style={styles.label}>Titre du plan *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Foot à 5 ce soir, Brunch Medina..."
            placeholderTextColor="#BBB"
            value={titre}
            onChangeText={setTitre}
          />

          {/* CATÉGORIES */}
          <Text style={styles.label}>Catégorie *</Text>
          <View style={styles.catsGrid}>
            {CATEGORIES.map((cat) => {
              const active = categorieActive === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.catBtn, { backgroundColor: active ? cat.couleur1 : '#EEE8DE' }]}
                  onPress={() => setCategorieActive(cat.label)}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, { color: active ? '#fff' : '#888' }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Décris ton plan, ce que tu cherches..."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* ADRESSE AVEC AUTOCOMPLETE */}
          <Text style={styles.label}>Adresse / Lieu *</Text>
          <View style={styles.villeRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                placeholder="Ex: McDonald's Tanger, Café Hafa..."
                placeholderTextColor="#BBB"
                value={ville}
                onChangeText={rechercherAdresse}
              />
              {/* SUGGESTIONS */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
                      onPress={() => selectionnerAdresse(s)}>
                      <Text style={styles.suggestionIcon}>📍</Text>
                      <Text style={styles.suggestionTexte} numberOfLines={2}>
                        {s.display_name.split(',').slice(0, 3).join(',')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {searchLoading && (
                <View style={styles.searchLoadingBox}>
                  <Text style={styles.searchLoadingTexte}>🔍 Recherche...</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.locBtn, locLoading && styles.locBtnLoading]}
              onPress={detecterVille}
              disabled={locLoading}>
              <Text style={styles.locIcon}>{locLoading ? '⏳' : '📍'}</Text>
            </TouchableOpacity>
          </View>
          {coords && (
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsTexte}>✅ Position GPS enregistrée · {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</Text>
            </View>
          )}

          {/* DATE PICKER */}
          <Text style={styles.label}>Date et heure</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateBtnIcon}>📅</Text>
            <Text style={[styles.dateBtnTexte, !dateAffichee && { color: '#BBB' }]}>
              {dateAffichee || 'Choisir une date et heure'}
            </Text>
            <Text style={styles.dateBtnArrow}>›</Text>
          </TouchableOpacity>

          {/* PARTICIPANTS */}
          <Text style={styles.label}>Nombre max de participants</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5, 10, 20..."
            placeholderTextColor="#BBB"
            keyboardType="numeric"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
          />

          {/* APERÇU */}
          {(titre || categorieActive) && (
            <View style={styles.previewSection}>
              <Text style={styles.label}>Aperçu</Text>
              <View style={[styles.previewCard, { backgroundColor: getCouleur() }]}>
                <Text style={styles.previewTitre}>{titre || 'Titre du plan'}</Text>
                <Text style={styles.previewDesc} numberOfLines={2}>{description || 'Description...'}</Text>
                <View style={styles.previewFooter}>
                  <Text style={styles.previewMeta}>📍 {ville || 'Adresse'}</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagTexte}>{categorieActive || 'Catégorie'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.boutonCreer, { backgroundColor: getCouleur() }, loading && styles.boutonLoading]}
            onPress={creerActivite}
            disabled={loading}>
            <Text style={styles.boutonTexte}>{loading ? 'Création en cours...' : '✦ Publier le plan'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DATE PICKER */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitre}>📅 Choisir la date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* JOUR */}
            <Text style={styles.modalLabel}>Jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, selectedDay === d && styles.pickerItemActive]}
                  onPress={() => setSelectedDay(d)}>
                  <Text style={[styles.pickerItemTexte, selectedDay === d && styles.pickerItemTexteActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* MOIS */}
            <Text style={styles.modalLabel}>Mois</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {MOIS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerItem, styles.pickerItemLarge, selectedMonth === i && styles.pickerItemActive]}
                  onPress={() => setSelectedMonth(i)}>
                  <Text style={[styles.pickerItemTexte, selectedMonth === i && styles.pickerItemTexteActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ANNÉE */}
            <Text style={styles.modalLabel}>Année</Text>
            <View style={styles.pickerRow}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, styles.pickerItemLarge, selectedYear === y && styles.pickerItemActive]}
                  onPress={() => setSelectedYear(y)}>
                  <Text style={[styles.pickerItemTexte, selectedYear === y && styles.pickerItemTexteActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* HEURE */}
            <Text style={styles.modalLabel}>Heure</Text>
            <View style={styles.heureRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow} style={{ flex: 1 }}>
                {HEURES.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.pickerItem, selectedHeure === h && styles.pickerItemActive]}
                    onPress={() => setSelectedHeure(h)}>
                    <Text style={[styles.pickerItemTexte, selectedHeure === h && styles.pickerItemTexteActive]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.minutesRow}>
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pickerItem, selectedMinute === m && styles.pickerItemActive]}
                    onPress={() => setSelectedMinute(m)}>
                    <Text style={[styles.pickerItemTexte, selectedMinute === m && styles.pickerItemTexteActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PREVIEW DATE */}
            <View style={styles.datePreview}>
              <Text style={styles.datePreviewTexte}>
                📅 {selectedDay} {MOIS[selectedMonth]} {selectedYear} à {selectedHeure}h{selectedMinute}
              </Text>
            </View>

            <TouchableOpacity style={styles.confirmerBtn} onPress={confirmerDate}>
              <Text style={styles.confirmerTexte}>✓ Confirmer la date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerTitre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  formulaire: { paddingHorizontal: 20 },
  label: { color: '#1A1A1A', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, color: '#1A1A1A', fontSize: 15, borderWidth: 1, borderColor: '#DDD4C4' },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  catsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: '700' },

  // ADRESSE
  villeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  locBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  locBtnLoading: { backgroundColor: '#AAA' },
  locIcon: { fontSize: 22 },
  suggestionsBox: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EEE8DE', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, zIndex: 100 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EDE8' },
  suggestionIcon: { fontSize: 16 },
  suggestionTexte: { flex: 1, fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  searchLoadingBox: { padding: 10, alignItems: 'center' },
  searchLoadingTexte: { color: '#AAA', fontSize: 13 },
  coordsBadge: { backgroundColor: '#EEF7EE', borderRadius: 10, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#1DB954' },
  coordsTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },

  // DATE BTN
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#DDD4C4', gap: 10 },
  dateBtnIcon: { fontSize: 20 },
  dateBtnTexte: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  dateBtnArrow: { fontSize: 20, color: '#AAA' },

  // PREVIEW
  previewSection: { marginTop: 20 },
  previewCard: { borderRadius: 20, padding: 18, marginTop: 8 },
  previewTitre: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  previewDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  previewTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  previewTagTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // BOUTON
  boutonCreer: { borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 28, marginBottom: 20 },
  boutonLoading: { opacity: 0.6 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // MODAL DATE PICKER
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FAF7F2', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitre: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  modalClose: { fontSize: 20, color: '#AAA', padding: 4 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#AAA', marginBottom: 8, marginTop: 12 },
  pickerRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEE8DE', minWidth: 44, alignItems: 'center' },
  pickerItemLarge: { minWidth: 80 },
  pickerItemActive: { backgroundColor: '#1A1A1A' },
  pickerItemTexte: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  pickerItemTexteActive: { color: '#fff' },
  heureRow: { flexDirection: 'row', gap: 8 },
  minutesRow: { flexDirection: 'row', gap: 8 },
  datePreview: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14, marginTop: 16, alignItems: 'center' },
  datePreviewTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
  confirmerBtn: { backgroundColor: '#E8000D', borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 },
  confirmerTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
});