import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function GroupeScreen() {
  const router = useRouter();
  const [activiteChoisie, setActiviteChoisie] = useState('');
  const [nombrePersonnes, setNombrePersonnes] = useState(0);
  const [quandChoisi, setQuandChoisi] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const activites = [
    { icon: '⚡', nom: 'Sport', couleur: '#E8000D' },
    { icon: '🎬', nom: 'Ciné', couleur: '#CC0000' },
    { icon: '🍕', nom: 'Resto', couleur: '#FF6A00' },
    { icon: '🎉', nom: 'Soirée', couleur: '#7B2FBE' },
    { icon: '🎮', nom: 'Gaming', couleur: '#0070F3' },
    { icon: '🎵', nom: 'Musique', couleur: '#1DB954' },
    { icon: '✈️', nom: 'Voyage', couleur: '#00B4D8' },
    { icon: '🏃', nom: 'Bien-être', couleur: '#00897B' },
    { icon: '👥', nom: 'Social', couleur: '#FF4B7D' },
    { icon: '🎨', nom: 'Art', couleur: '#FFD600' },
  ];

  const personnes = [2, 3, 4, 5, 6, 8];
  const quand = ["Aujourd'hui", 'Demain', 'Ce week-end', 'Choisir'];

  const lancerRecherche = async () => {
    if (!activiteChoisie || !nombrePersonnes || !quandChoisi) {
      setMessage('❌ Choisis une activité, le nombre de personnes et quand !');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('❌ Tu dois être connecté !');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('groupes')
        .insert({
          activite: activiteChoisie,
          categorie: activiteChoisie,
          nombre_places: nombrePersonnes,
          date_activite: new Date().toISOString(),
          statut: 'ouvert',
          description: `Groupe ${activiteChoisie} - ${quandChoisi}`,
        });

      if (error) {
        setMessage('❌ Erreur lors de la création du groupe !');
      } else {
        setMessage(`✅ Groupe "${activiteChoisie}" créé ! Recherche en cours... 🔥`);
        setTimeout(() => router.push('/profils'), 2000);
      }
    } catch (err) {
      setMessage('❌ Une erreur est survenue !');
    } finally {
      setLoading(false);
    }
  };

  const activiteInfo = activites.find((a) => a.nom === activiteChoisie);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Crée ton groupe ✦</Text>
        <Text style={styles.sousTitre}>Choisis une activité et trouve tes partenaires</Text>
      </View>

      {/* MESSAGE */}
      {message ? (
        <View style={[styles.messageBox, {
          borderColor: message.includes('❌') ? '#E8000D' : '#1DB954',
          backgroundColor: message.includes('❌') ? '#FFF0F0' : '#EEF7EE',
        }]}>
          <Text style={[styles.messageTexte, {
            color: message.includes('❌') ? '#E8000D' : '#1DB954',
          }]}>{message}</Text>
        </View>
      ) : null}

      {/* ACTIVITES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Quelle activité ?</Text>
        <View style={styles.activitesGrid}>
          {activites.map((activite, index) => {
            const active = activiteChoisie === activite.nom;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.activiteCard,
                  { borderColor: activite.couleur },
                  active && { backgroundColor: activite.couleur },
                ]}
                onPress={() => setActiviteChoisie(activite.nom)}>
                <Text style={styles.activiteIcon}>{activite.icon}</Text>
                <Text style={[styles.activiteNom, { color: active ? '#fff' : '#1A1A1A' }]}>
                  {activite.nom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* NOMBRE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Combien de personnes ?</Text>
        <View style={styles.personnesRow}>
          {personnes.map((p, index) => {
            const active = nombrePersonnes === p;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.personneCard,
                  active && { backgroundColor: activiteInfo?.couleur || '#E8000D', borderColor: activiteInfo?.couleur || '#E8000D' },
                ]}
                onPress={() => setNombrePersonnes(p)}>
                <Text style={[styles.personneNombre, { color: active ? '#fff' : '#1A1A1A' }]}>
                  {p}
                </Text>
                <Text style={[styles.personneLabel, { color: active ? 'rgba(255,255,255,0.7)' : '#AAA' }]}>
                  pers.
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* QUAND */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Quand ?</Text>
        <View style={styles.quandRow}>
          {quand.map((q, index) => {
            const active = quandChoisi === q;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quandCard,
                  active && { backgroundColor: activiteInfo?.couleur || '#E8000D', borderColor: activiteInfo?.couleur || '#E8000D' },
                ]}
                onPress={() => setQuandChoisi(q)}>
                <Text style={[styles.quandTexte, { color: active ? '#fff' : '#1A1A1A' }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* RECAP */}
      {activiteChoisie && nombrePersonnes > 0 && quandChoisi ? (
        <View style={[styles.recapCard, { borderColor: activiteInfo?.couleur || '#E8000D' }]}>
          <Text style={styles.recapTitre}>Récap de ton plan ✦</Text>
          <View style={styles.recapRow}>
            <Text style={styles.recapIcon}>{activiteInfo?.icon}</Text>
            <Text style={styles.recapTexte}>{activiteChoisie} · {nombrePersonnes} personnes · {quandChoisi}</Text>
          </View>
        </View>
      ) : null}

      {/* BOUTON */}
      <TouchableOpacity
        style={[
          styles.bouton,
          { backgroundColor: activiteInfo?.couleur || '#E8000D' },
          loading && styles.boutonLoading,
        ]}
        onPress={lancerRecherche}
        disabled={loading}>
        <Text style={styles.boutonTexte}>
          {loading ? 'Création en cours...' : '🚀 Lancer la recherche'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  logo: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 8 },
  titre: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sousTitre: { fontSize: 14, color: '#AAA', fontStyle: 'italic', textAlign: 'center' },

  messageBox: { marginHorizontal: 20, marginBottom: 16, borderRadius: 14, padding: 14, borderWidth: 1.5 },
  messageTexte: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitre: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },

  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activiteCard: { backgroundColor: '#EEE8DE', borderRadius: 16, padding: 14, alignItems: 'center', width: '18%', borderWidth: 2 },
  activiteIcon: { fontSize: 24 },
  activiteNom: { fontSize: 9, marginTop: 4, textAlign: 'center', fontWeight: '700' },

  personnesRow: { flexDirection: 'row', gap: 8 },
  personneCard: { flex: 1, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#DDD4C4' },
  personneNombre: { fontSize: 20, fontWeight: '800' },
  personneLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },

  quandRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quandCard: { backgroundColor: '#EEE8DE', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 2, borderColor: '#DDD4C4' },
  quandTexte: { fontSize: 13, fontWeight: '700' },

  recapCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, borderWidth: 2 },
  recapTitre: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recapIcon: { fontSize: 24 },
  recapTexte: { fontSize: 14, fontWeight: '700', color: '#555' },

  bouton: { borderRadius: 20, padding: 18, alignItems: 'center', marginHorizontal: 20 },
  boutonLoading: { opacity: 0.6 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
});