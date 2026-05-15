import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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

export default function CreerActiviteScreen() {
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('');
  const [date, setDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [categorieActive, setCategorieActive] = useState('');
  const [loading, setLoading] = useState(false);

  const getCouleur = () => {
    const cat = CATEGORIES.find((c) => c.label === categorieActive);
    return cat ? cat.couleur1 : '#1A1A1A';
  };

  const creerActivite = async () => {
    if (!titre || !description || !ville || !categorieActive) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires !');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Tu dois être connecté !');
        return;
      }

      const { data: profil } = await supabase
        .from('utilisateurs')
        .select('prenom')
        .eq('email', user.email)
        .single();

      const { error } = await supabase.from('activites').insert({
        titre,
        description,
        ville,
        categorie: categorieActive,
        date: date || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        participants_count: 0,
        createur_id: user.id,
        createur_prenom: profil?.prenom || user.email?.split('@')[0],
      });

      if (error) {
        Alert.alert('Erreur', error.message);
      } else {
        Alert.alert('🎉 Plan créé !', 'Ton activité est en ligne !', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
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

        {/* CATEGORIE */}
        <Text style={styles.label}>Catégorie *</Text>
        <View style={styles.catsGrid}>
          {CATEGORIES.map((cat) => {
            const active = categorieActive === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.catBtn,
                  { backgroundColor: active ? cat.couleur1 : '#EEE8DE' },
                ]}
                onPress={() => setCategorieActive(cat.label)}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catLabel, { color: active ? '#fff' : '#888' }]}>
                  {cat.label}
                </Text>
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

        {/* VILLE */}
        <Text style={styles.label}>Ville / Quartier *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Casablanca, Hay Hassani, Maarif..."
          placeholderTextColor="#BBB"
          value={ville}
          onChangeText={setVille}
        />

        {/* DATE */}
        <Text style={styles.label}>Date et heure</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2024-12-25 19:00"
          placeholderTextColor="#BBB"
          value={date}
          onChangeText={setDate}
        />

        {/* MAX PARTICIPANTS */}
        <Text style={styles.label}>Nombre max de participants</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5, 10, 20..."
          placeholderTextColor="#BBB"
          keyboardType="numeric"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
        />

        {/* PREVIEW */}
        {titre || categorieActive ? (
          <View style={styles.previewSection}>
            <Text style={styles.label}>Aperçu</Text>
            <View style={[styles.previewCard, { backgroundColor: getCouleur() }]}>
              <Text style={styles.previewTitre}>{titre || 'Titre du plan'}</Text>
              <Text style={styles.previewDesc} numberOfLines={2}>
                {description || 'Description...'}
              </Text>
              <View style={styles.previewFooter}>
                <Text style={styles.previewMeta}>📍 {ville || 'Ville'}</Text>
                <View style={styles.previewTag}>
                  <Text style={styles.previewTagTexte}>{categorieActive || 'Catégorie'}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* BOUTON */}
        <TouchableOpacity
          style={[
            styles.boutonCreer,
            { backgroundColor: getCouleur() },
            loading && styles.boutonLoading,
          ]}
          onPress={creerActivite}
          disabled={loading}>
          <Text style={styles.boutonTexte}>
            {loading ? 'Création en cours...' : '✦ Publier le plan'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE8DE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD4C4',
  },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerTitre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  formulaire: { paddingHorizontal: 20 },
  label: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#EEE8DE',
    borderRadius: 14,
    padding: 14,
    color: '#1A1A1A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD4C4',
  },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  catsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: '700' },
  previewSection: { marginTop: 20 },
  previewCard: {
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  previewTitre: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  previewDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  previewTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  previewTagTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },
  boutonCreer: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  boutonLoading: { opacity: 0.6 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
});