import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { label: 'Sport', emoji: '⚡', couleur: '#E8000D' },
  { label: 'Resto', emoji: '🍕', couleur: '#FF6A00' },
  { label: 'Ciné', emoji: '🎬', couleur: '#7B2FBE' },
  { label: 'Soirée', emoji: '🎉', couleur: '#1A1A3A' },
  { label: 'Gaming', emoji: '🎮', couleur: '#0070F3' },
  { label: 'Voyage', emoji: '✈️', couleur: '#00B4D8' },
  { label: 'Musique', emoji: '🎵', couleur: '#1DB954' },
  { label: 'Bien-être', emoji: '🏃', couleur: '#00897B' },
  { label: 'Social', emoji: '👥', couleur: '#FF4B7D' },
  { label: 'Art', emoji: '🎨', couleur: '#FFD600' },
];

const MOIS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const HEURES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

type Suggestion = { display_name: string; lat: string; lon: string };

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedHeure, setSelectedHeure] = useState('19');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [dateAffichee, setDateAffichee] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [focusField, setFocusField] = useState('');
  const searchTimeout = useRef<any>(null);

  const cat = CATEGORIES.find(c => c.label === categorieActive);
  const couleur = cat?.couleur || '#C9A84C';

  const confirmerDate = () => {
    setDateAffichee(`${selectedDay} ${MOIS_LONG[selectedMonth]} ${selectedYear} à ${selectedHeure}h${selectedMinute}`);
    setShowDatePicker(false);
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

  const rechercherAdresse = async (texte: string) => {
    setVille(texte);
    if (texte.length < 3) { setSuggestions([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texte)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'WyytU/1.0' } }
        );
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 400);
  };

  const selectionnerAdresse = (s: Suggestion) => {
    setVille(s.display_name.split(',').slice(0, 3).join(','));
    setCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]);
  };

  const detecterVille = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const [adresse] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (adresse) setVille(`${adresse.district || adresse.street || ''}, ${adresse.city || adresse.region || ''}`.replace(/^, /, ''));
    } catch { Alert.alert('Erreur', 'Impossible de détecter ta position.'); }
    finally { setLocLoading(false); }
  };

  const creerActivite = async () => {
    if (!titre || !description || !ville || !categorieActive) {
      Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires !'); return;
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
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('🎉 Plan publié !', 'Ton activité est en ligne !', [
        { text: 'Voir l\'Explorer', onPress: () => router.push('/(tabs)/explore' as any) }
      ]);
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const years = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 80 }}>

        {/* HEADER */}
        <LinearGradient colors={['#1A1209', '#2C1F0A']} style={s.header}>
          <View style={s.headerCircle1} />
          <View style={s.headerCircle2} />
          <View style={s.headerTop}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/explore' as any)}>
              <Text style={s.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerSub}>Crée ton plan</Text>
              <Text style={s.headerTitle}>Nouveau plan 🔥</Text>
            </View>
            <View style={[s.headerEmoji, { backgroundColor: couleur }]}>
              <Text style={{ fontSize: 22 }}>{cat?.emoji || '✦'}</Text>
            </View>
          </View>

          {/* Progress catégorie sélectionnée */}
          {categorieActive ? (
            <View style={s.catSelected}>
              <View style={[s.catSelectedDot, { backgroundColor: couleur }]} />
              <Text style={s.catSelectedTxt}>{categorieActive} sélectionné</Text>
            </View>
          ) : (
            <View style={s.catSelected}>
              <View style={[s.catSelectedDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <Text style={[s.catSelectedTxt, { color: 'rgba(255,255,255,0.4)' }]}>Aucune catégorie</Text>
            </View>
          )}
        </LinearGradient>

        <View style={s.form}>

          {/* CATÉGORIE — en premier pour que la couleur change tout */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Catégorie</Text>
              <Text style={s.required}>*</Text>
            </View>
            <View style={s.catsGrid}>
              {CATEGORIES.map(c => {
                const active = categorieActive === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    style={[s.catChip, active && { backgroundColor: c.couleur, borderColor: c.couleur }]}
                    onPress={() => setCategorieActive(c.label)}
                    activeOpacity={0.8}>
                    <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                    <Text style={[s.catChipTxt, active && { color: '#fff' }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* TITRE */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Titre du plan</Text>
              <Text style={s.required}>*</Text>
            </View>
            <View style={[s.inputWrap, focusField === 'titre' && { borderColor: couleur }]}>
              <View style={s.inputIcon}><Text style={{ fontSize: 18 }}>✏️</Text></View>
              <TextInput
                style={s.input}
                placeholder="Ex: Foot à 5, Brunch Medina..."
                placeholderTextColor="#C8C0B4"
                value={titre}
                onChangeText={setTitre}
                onFocus={() => setFocusField('titre')}
                onBlur={() => setFocusField('')}
              />
              {titre.length > 0 && (
                <View style={s.checkIcon}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text></View>
              )}
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.required}>*</Text>
            </View>
            <View style={[s.inputWrap, s.inputWrapMulti, focusField === 'desc' && { borderColor: couleur }]}>
              <View style={[s.inputIcon, { alignSelf: 'flex-start', marginTop: 4 }]}><Text style={{ fontSize: 18 }}>💬</Text></View>
              <TextInput
                style={[s.input, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Décris ton plan, ce que tu cherches..."
                placeholderTextColor="#C8C0B4"
                multiline
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocusField('desc')}
                onBlur={() => setFocusField('')}
              />
            </View>
          </View>

          {/* ADRESSE */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Adresse / Lieu</Text>
              <Text style={s.required}>*</Text>
            </View>
            <View style={s.adresseRow}>
              <View style={{ flex: 1 }}>
                <View style={[s.inputWrap, focusField === 'ville' && { borderColor: couleur }]}>
                  <View style={s.inputIcon}><Text style={{ fontSize: 18 }}>📍</Text></View>
                  <TextInput
                    style={s.input}
                    placeholder="Café Hafa, McDonald's Tanger..."
                    placeholderTextColor="#C8C0B4"
                    value={ville}
                    onChangeText={rechercherAdresse}
                    onFocus={() => setFocusField('ville')}
                    onBlur={() => setFocusField('')}
                  />
                </View>
                {searchLoading && <Text style={s.searchHint}>🔍 Recherche...</Text>}
                {suggestions.length > 0 && (
                  <View style={s.suggestions}>
                    {suggestions.map((sg, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[s.suggestion, i < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }]}
                        onPress={() => selectionnerAdresse(sg)}>
                        <Text style={{ fontSize: 14 }}>📍</Text>
                        <Text style={s.suggestionTxt} numberOfLines={2}>{sg.display_name.split(',').slice(0, 3).join(',')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity style={[s.locBtn, { backgroundColor: couleur }]} onPress={detecterVille} disabled={locLoading}>
                <Text style={{ fontSize: 22 }}>{locLoading ? '⏳' : '🎯'}</Text>
              </TouchableOpacity>
            </View>
            {coords && (
              <View style={s.gpsBadge}>
                <Text style={s.gpsTxt}>✅ Position GPS enregistrée</Text>
              </View>
            )}
          </View>

          {/* DATE */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Date et heure</Text>
            <TouchableOpacity style={[s.dateBtn, { borderColor: dateAffichee ? couleur : '#EEE8DE' }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <View style={[s.dateBtnIcon, { backgroundColor: couleur + '20' }]}>
                <Text style={{ fontSize: 18 }}>📅</Text>
              </View>
              <Text style={[s.dateBtnTxt, !dateAffichee && { color: '#C8C0B4' }]}>
                {dateAffichee || 'Choisir une date et heure'}
              </Text>
              <Text style={{ fontSize: 22, color: '#C8C0B4' }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* PARTICIPANTS */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Participants max</Text>
            <View style={s.participantsRow}>
              {['2', '5', '10', '20', '50'].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.participantChip, maxParticipants === n && { backgroundColor: couleur }]}
                  onPress={() => setMaxParticipants(n)}>
                  <Text style={[s.participantChipTxt, maxParticipants === n && { color: '#fff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
              <View style={[s.inputWrap, { flex: 1, paddingVertical: 0 }]}>
                <TextInput
                  style={[s.input, { paddingVertical: 10 }]}
                  placeholder="Autre"
                  placeholderTextColor="#C8C0B4"
                  keyboardType="numeric"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                />
              </View>
            </View>
          </View>

          {/* APERÇU */}
          {(titre || categorieActive) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Aperçu</Text>
              <View style={[s.preview, { backgroundColor: couleur }]}>
                <Text style={s.previewBgEmoji}>{cat?.emoji || '✦'}</Text>
                <View style={s.previewTag}>
                  <Text style={s.previewTagTxt}>{categorieActive?.toUpperCase() || 'CATÉGORIE'}</Text>
                </View>
                <Text style={s.previewTitre}>{titre || 'Titre du plan'}</Text>
                <Text style={s.previewDesc} numberOfLines={2}>{description || 'Description...'}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  {ville ? <Text style={s.previewMeta}>📍 {ville.split(',')[0]}</Text> : null}
                  {dateAffichee ? <Text style={s.previewMeta}>📅 {dateAffichee.split(' à ')[0]}</Text> : null}
                </View>
              </View>
            </View>
          )}

          {/* BOUTON PUBLIER */}
          <TouchableOpacity
            style={[s.publishBtn, { backgroundColor: couleur }, loading && { opacity: 0.6 }]}
            onPress={creerActivite}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={s.publishTxt}>
              {loading ? '⏳ Publication...' : '🚀 Publier le plan'}
            </Text>
          </TouchableOpacity>
          <Text style={s.publishNote}>Visible immédiatement par la communauté</Text>

        </View>
      </ScrollView>

      {/* MODAL DATE */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={s.modalHeaderRow}>
              <Text style={s.modalTitle}>📅 Date et heure</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: '#AAA', fontSize: 14, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.modalLabel}>Jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pickerRow}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <TouchableOpacity key={d} style={[s.pickerItem, selectedDay === d && { backgroundColor: couleur }]} onPress={() => setSelectedDay(d)}>
                  <Text style={[s.pickerTxt, selectedDay === d && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.modalLabel}>Mois</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pickerRow}>
              {MOIS.map((m, i) => (
                <TouchableOpacity key={m} style={[s.pickerItem, s.pickerWide, selectedMonth === i && { backgroundColor: couleur }]} onPress={() => setSelectedMonth(i)}>
                  <Text style={[s.pickerTxt, selectedMonth === i && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.modalLabel}>Année</Text>
            <View style={s.pickerRow}>
              {years.map(y => (
                <TouchableOpacity key={y} style={[s.pickerItem, s.pickerWide, selectedYear === y && { backgroundColor: couleur }]} onPress={() => setSelectedYear(y)}>
                  <Text style={[s.pickerTxt, selectedYear === y && { color: '#fff' }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.modalLabel}>Heure</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pickerRow} style={{ flex: 1 }}>
                {HEURES.map(h => (
                  <TouchableOpacity key={h} style={[s.pickerItem, selectedHeure === h && { backgroundColor: couleur }]} onPress={() => setSelectedHeure(h)}>
                    <Text style={[s.pickerTxt, selectedHeure === h && { color: '#fff' }]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={[s.pickerItem, selectedMinute === m && { backgroundColor: couleur }]} onPress={() => setSelectedMinute(m)}>
                    <Text style={[s.pickerTxt, selectedMinute === m && { color: '#fff' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[s.datePreview, { backgroundColor: couleur + '15', borderColor: couleur + '40' }]}>
              <Text style={[s.datePreviewTxt, { color: couleur }]}>
                📅 {selectedDay} {MOIS_LONG[selectedMonth]} {selectedYear} à {selectedHeure}h{selectedMinute}
              </Text>
            </View>

            <TouchableOpacity style={[s.confirmerBtn, { backgroundColor: couleur }]} onPress={confirmerDate}>
              <Text style={s.confirmerTxt}>✓ Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF7F2' },

  // HEADER
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 32, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
  headerCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#fff', opacity: 0.04, top: -100, right: -60 },
  headerCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#C9A84C', opacity: 0.06, bottom: -60, left: -40 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerEmoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catSelectedDot: { width: 8, height: 8, borderRadius: 4 },
  catSelectedTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // FORM
  form: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1209', marginBottom: 10 },
  required: { color: '#E8000D', fontSize: 15, fontWeight: '900', marginBottom: 10 },

  // INPUT
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: '#EEE8DE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  inputWrapMulti: { alignItems: 'flex-start', paddingTop: 10 },
  inputIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  input: { flex: 1, color: '#1A1209', fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  checkIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center', marginRight: 4 },

  // CATS
  catsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE8DE', borderWidth: 2, borderColor: 'transparent' },
  catChipTxt: { fontSize: 13, fontWeight: '700', color: '#5C4A2A' },

  // ADRESSE
  adresseRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  locBtn: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchHint: { color: '#AAA', fontSize: 13, padding: 8 },
  suggestions: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEE8DE', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suggestionTxt: { flex: 1, fontSize: 13, color: '#1A1209', fontWeight: '500' },
  gpsBadge: { backgroundColor: '#EEF7EE', borderRadius: 12, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#1DB954' },
  gpsTxt: { color: '#1DB954', fontSize: 12, fontWeight: '700' },

  // DATE
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 2, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  dateBtnIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateBtnTxt: { flex: 1, fontSize: 15, color: '#1A1209', fontWeight: '500' },

  // PARTICIPANTS
  participantsRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  participantChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE8DE' },
  participantChipTxt: { fontSize: 14, fontWeight: '800', color: '#5C4A2A' },

  // APERÇU
  preview: { borderRadius: 24, padding: 20, overflow: 'hidden', position: 'relative' },
  previewBgEmoji: { position: 'absolute', right: -10, bottom: -10, fontSize: 100, opacity: 0.12 },
  previewTag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  previewTagTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  previewTitre: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
  previewDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  previewMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },

  // PUBLIER
  publishBtn: { borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  publishTxt: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  publishNote: { color: '#AAA', fontSize: 12, textAlign: 'center', marginTop: 12 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FAF7F2', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD4C4', alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A1209' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#AAA', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEE8DE', minWidth: 44, alignItems: 'center' },
  pickerWide: { minWidth: 70 },
  pickerTxt: { fontSize: 14, fontWeight: '700', color: '#1A1209' },
  datePreview: { borderRadius: 16, padding: 14, marginTop: 16, alignItems: 'center', borderWidth: 1 },
  datePreviewTxt: { fontSize: 15, fontWeight: '700' },
  confirmerBtn: { borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 },
  confirmerTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});