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
  { label: 'Ciné', emoji: '🎬', couleur: '#CC0000' },
  { label: 'Soirée', emoji: '🎉', couleur: '#7B2FBE' },
  { label: 'Gaming', emoji: '🎮', couleur: '#0070F3' },
  { label: 'Voyage', emoji: '✈️', couleur: '#00B4D8' },
  { label: 'Musique', emoji: '🎵', couleur: '#1DB954' },
  { label: 'Bien-être', emoji: '🏃', couleur: '#00897B' },
  { label: 'Social', emoji: '👥', couleur: '#FF4B7D' },
  { label: 'Art', emoji: '🎨', couleur: '#FFD600' },
];

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const HEURES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

type Suggestion = { display_name: string; lat: string; lon: string; };

const ETAPES = ['Infos', 'Lieu', 'Date', 'Détails'];

export default function CreerActiviteScreen() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
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
  const searchTimeout = useRef<any>(null);
  const [focusField, setFocusField] = useState('');

  const getCouleur = () => CATEGORIES.find(c => c.label === categorieActive)?.couleur || '#E8000D';

  const confirmerDate = () => {
    setDateAffichee(`${selectedDay} ${MOIS_LONG[selectedMonth]} ${selectedYear} à ${selectedHeure}h${selectedMinute}`);
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
      else {
        Alert.alert('🎉 Plan publié !', 'Ton activité est en ligne !', [
          { text: 'Voir l\'Explorer', onPress: () => router.push('/(tabs)/explore' as any) }
        ]);
      }
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const years = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);
  const couleur = getCouleur();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>

        {/* BG DÉCO */}
        <View style={[styles.bgTop, { backgroundColor: couleur }]} />
        <View style={styles.bgCircle} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/explore' as any)}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitre}>Nouveau plan</Text>
            <Text style={styles.headerSub}>Partage ton activité 🔥</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: couleur }]}>
            <Text style={styles.headerBadgeEmoji}>{CATEGORIES.find(c => c.label === categorieActive)?.emoji || '✦'}</Text>
          </View>
        </View>

        <View style={styles.form}>

          {/* TITRE */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Titre du plan</Text>
              <Text style={styles.fieldRequired}>*</Text>
            </View>
            <View style={[styles.fieldWrapper, focusField === 'titre' && styles.fieldFocus]}>
              <View style={styles.fieldIconBox}><Text style={styles.fieldIcon}>✏️</Text></View>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: Foot à 5, Brunch Medina..."
                placeholderTextColor="#BBB"
                value={titre}
                onChangeText={setTitre}
                onFocus={() => setFocusField('titre')}
                onBlur={() => setFocusField('')}
              />
              {titre.length > 0 && <View style={styles.fieldCheck}><Text style={styles.fieldCheckTexte}>✓</Text></View>}
            </View>
          </View>

          {/* CATÉGORIE */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <Text style={styles.fieldRequired}>*</Text>
            </View>
            <View style={styles.catsGrid}>
              {CATEGORIES.map((cat) => {
                const active = categorieActive === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.catChip, active && { backgroundColor: cat.couleur }]}
                    onPress={() => setCategorieActive(cat.label)}
                    activeOpacity={0.8}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, active && { color: '#fff' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldRequired}>*</Text>
            </View>
            <View style={[styles.fieldWrapper, styles.fieldWrapperMulti, focusField === 'desc' && styles.fieldFocus]}>
              <View style={[styles.fieldIconBox, { alignSelf: 'flex-start', marginTop: 4 }]}><Text style={styles.fieldIcon}>💬</Text></View>
              <TextInput
                style={[styles.fieldInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Décris ton plan, ce que tu cherches..."
                placeholderTextColor="#BBB"
                multiline
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocusField('desc')}
                onBlur={() => setFocusField('')}
              />
            </View>
          </View>

          {/* ADRESSE */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Adresse / Lieu</Text>
              <Text style={styles.fieldRequired}>*</Text>
            </View>
            <View style={styles.adresseRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.fieldWrapper, focusField === 'ville' && styles.fieldFocus]}>
                  <View style={styles.fieldIconBox}><Text style={styles.fieldIcon}>📍</Text></View>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Café Hafa, McDonald's Tanger..."
                    placeholderTextColor="#BBB"
                    value={ville}
                    onChangeText={rechercherAdresse}
                    onFocus={() => setFocusField('ville')}
                    onBlur={() => setFocusField('')}
                  />
                </View>
                {searchLoading && (
                  <View style={styles.searchLoading}>
                    <Text style={styles.searchLoadingTexte}>🔍 Recherche...</Text>
                  </View>
                )}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {suggestions.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.suggestionItem, i < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F0EDE8' }]}
                        onPress={() => selectionnerAdresse(s)}>
                        <Text style={styles.suggestionIcon}>📍</Text>
                        <Text style={styles.suggestionTexte} numberOfLines={2}>{s.display_name.split(',').slice(0, 3).join(',')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity style={[styles.locBtn, { backgroundColor: couleur }]} onPress={detecterVille} disabled={locLoading}>
                <Text style={styles.locBtnIcon}>{locLoading ? '⏳' : '🎯'}</Text>
              </TouchableOpacity>
            </View>
            {coords && (
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeTexte}>✅ Position GPS enregistrée</Text>
              </View>
            )}
          </View>

          {/* DATE */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Date et heure</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <View style={[styles.dateBtnIcon, { backgroundColor: couleur + '20' }]}>
                <Text style={styles.dateBtnIconTexte}>📅</Text>
              </View>
              <Text style={[styles.dateBtnTexte, !dateAffichee && { color: '#BBB' }]}>
                {dateAffichee || 'Choisir une date et heure'}
              </Text>
              <Text style={styles.dateBtnArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* PARTICIPANTS */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Nombre max de participants</Text>
            <View style={styles.participantsRow}>
              {['2', '5', '10', '20', '50'].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.participantChip, maxParticipants === n && { backgroundColor: couleur }]}
                  onPress={() => setMaxParticipants(n)}>
                  <Text style={[styles.participantChipTexte, maxParticipants === n && { color: '#fff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
              <View style={[styles.fieldWrapper, { flex: 1, paddingVertical: 0 }]}>
                <TextInput
                  style={[styles.fieldInput, { paddingVertical: 10 }]}
                  placeholder="Autre"
                  placeholderTextColor="#BBB"
                  keyboardType="numeric"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                />
              </View>
            </View>
          </View>

          {/* APERÇU */}
          {(titre || categorieActive) && (
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Aperçu de ton plan</Text>
              <View style={[styles.previewCard, { backgroundColor: couleur }]}>
                <Text style={styles.previewBgEmoji}>{CATEGORIES.find(c => c.label === categorieActive)?.emoji || '✦'}</Text>
                <View style={styles.previewTag}>
                  <Text style={styles.previewTagTexte}>{categorieActive?.toUpperCase() || 'CATÉGORIE'}</Text>
                </View>
                <Text style={styles.previewTitre}>{titre || 'Titre du plan'}</Text>
                <Text style={styles.previewDesc} numberOfLines={2}>{description || 'Description de ton plan...'}</Text>
                <View style={styles.previewFooter}>
                  <Text style={styles.previewMeta}>📍 {ville || 'Adresse'}</Text>
                  {dateAffichee && <Text style={styles.previewMeta}>📅 {dateAffichee.split(' à ')[0]}</Text>}
                </View>
              </View>
            </View>
          )}

          {/* BOUTON PUBLIER */}
          <TouchableOpacity
            style={[styles.publishBtn, { backgroundColor: couleur }, loading && { opacity: 0.6 }]}
            onPress={creerActivite}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.publishBtnTexte}>
              {loading ? '⏳ Publication...' : '🚀 Publier le plan'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.publishNote}>Ton plan sera visible immédiatement par la communauté</Text>

        </View>
      </ScrollView>

      {/* MODAL DATE */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitre}>📅 Date et heure</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCloseTexte}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity key={d} style={[styles.pickerItem, selectedDay === d && { backgroundColor: couleur }]} onPress={() => setSelectedDay(d)}>
                  <Text style={[styles.pickerTexte, selectedDay === d && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Mois</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {MOIS.map((m, i) => (
                <TouchableOpacity key={m} style={[styles.pickerItem, styles.pickerItemWide, selectedMonth === i && { backgroundColor: couleur }]} onPress={() => setSelectedMonth(i)}>
                  <Text style={[styles.pickerTexte, selectedMonth === i && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Année</Text>
            <View style={styles.pickerRow}>
              {years.map((y) => (
                <TouchableOpacity key={y} style={[styles.pickerItem, styles.pickerItemWide, selectedYear === y && { backgroundColor: couleur }]} onPress={() => setSelectedYear(y)}>
                  <Text style={[styles.pickerTexte, selectedYear === y && { color: '#fff' }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Heure</Text>
            <View style={styles.heureSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow} style={{ flex: 1 }}>
                {HEURES.map((h) => (
                  <TouchableOpacity key={h} style={[styles.pickerItem, selectedHeure === h && { backgroundColor: couleur }]} onPress={() => setSelectedHeure(h)}>
                    <Text style={[styles.pickerTexte, selectedHeure === h && { color: '#fff' }]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.minutesSection}>
                {MINUTES.map((m) => (
                  <TouchableOpacity key={m} style={[styles.pickerItem, selectedMinute === m && { backgroundColor: couleur }]} onPress={() => setSelectedMinute(m)}>
                    <Text style={[styles.pickerTexte, selectedMinute === m && { color: '#fff' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.datePreview, { backgroundColor: couleur + '15', borderColor: couleur + '30' }]}>
              <Text style={[styles.datePreviewTexte, { color: couleur }]}>
                📅 {selectedDay} {MOIS_LONG[selectedMonth]} {selectedYear} à {selectedHeure}h{selectedMinute}
              </Text>
            </View>

            <TouchableOpacity style={[styles.confirmerBtn, { backgroundColor: couleur }]} onPress={confirmerDate}>
              <Text style={styles.confirmerTexte}>✓ Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, opacity: 0.08 },
  bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#fff', opacity: 0.5, top: -100, right: -100 },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#1A1A1A', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#AAA', marginTop: 2 },
  headerBadge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerBadgeEmoji: { fontSize: 22 },

  // FORM
  form: { paddingHorizontal: 20 },
  fieldSection: { marginBottom: 20 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  fieldLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  fieldRequired: { color: '#E8000D', fontSize: 15, fontWeight: '900' },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: '#EEE8DE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  fieldWrapperMulti: { alignItems: 'flex-start', paddingTop: 10 },
  fieldFocus: { borderColor: '#E8000D' },
  fieldIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldIcon: { fontSize: 18 },
  fieldInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  fieldCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fieldCheckTexte: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // CATÉGORIES
  catsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE8DE' },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: '700', color: '#666' },

  // ADRESSE
  adresseRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  locBtn: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  locBtnIcon: { fontSize: 22 },
  searchLoading: { padding: 10, alignItems: 'center' },
  searchLoadingTexte: { color: '#AAA', fontSize: 13 },
  suggestionsBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEE8DE', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suggestionIcon: { fontSize: 14 },
  suggestionTexte: { flex: 1, fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  gpsBadge: { backgroundColor: '#EEF7EE', borderRadius: 12, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#1DB954' },
  gpsBadgeTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },

  // DATE
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 2, borderColor: '#EEE8DE', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  dateBtnIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateBtnIconTexte: { fontSize: 18 },
  dateBtnTexte: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  dateBtnArrow: { fontSize: 22, color: '#AAA' },

  // PARTICIPANTS
  participantsRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  participantChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE8DE' },
  participantChipTexte: { fontSize: 14, fontWeight: '800', color: '#666' },

  // APERÇU
  previewCard: { borderRadius: 24, padding: 20, overflow: 'hidden', position: 'relative' },
  previewBgEmoji: { position: 'absolute', right: -10, bottom: -10, fontSize: 100, opacity: 0.12 },
  previewTag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  previewTagTexte: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  previewTitre: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8, letterSpacing: -0.3 },
  previewDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', gap: 12 },
  previewMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },

  // PUBLIER
  publishBtn: { borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  publishBtnTexte: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  publishNote: { color: '#AAA', fontSize: 12, textAlign: 'center', marginTop: 12 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FAF7F2', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD4C4', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitre: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  modalCloseTexte: { color: '#AAA', fontSize: 14, fontWeight: '700' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#AAA', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEE8DE', minWidth: 44, alignItems: 'center' },
  pickerItemWide: { minWidth: 70 },
  pickerTexte: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  heureSection: { flexDirection: 'row', gap: 8 },
  minutesSection: { flexDirection: 'row', gap: 8 },
  datePreview: { borderRadius: 16, padding: 14, marginTop: 16, alignItems: 'center', borderWidth: 1 },
  datePreviewTexte: { fontSize: 15, fontWeight: '700' },
  confirmerBtn: { borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 },
  confirmerTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
});