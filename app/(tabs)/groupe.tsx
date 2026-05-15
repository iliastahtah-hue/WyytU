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
    { icon: '🏋️', nom: 'Sport', couleur: '#FF4444' },
    { icon: '🎬', nom: 'Cinéma', couleur: '#9B59B6' },
    { icon: '🍽️', nom: 'Restaurant', couleur: '#F39C12' },
    { icon: '🌿', nom: 'Nature', couleur: '#27AE60' },
    { icon: '🎮', nom: 'Loisirs', couleur: '#3498DB' },
    { icon: '🎵', nom: 'Festival', couleur: '#E91E63' },
    { icon: '🌙', nom: 'Soirée', couleur: '#673AB7' },
    { icon: '✈️', nom: 'Voyage', couleur: '#00BCD4' },
    { icon: '🌿', nom: 'Pique-nique', couleur: '#8BC34A' },
    { icon: '🎭', nom: 'Culture', couleur: '#FF5722' },
  ];

  const personnes = [2, 3, 4, 5, 6];
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

      const { data: utilisateur } = await supabase
        .from('utilisateurs')
        .select('id')
        .eq('email', user.email)
        .single();

      const { data, error } = await supabase
        .from('groupes')
        .insert({
          activite: activiteChoisie,
          categorie: activiteChoisie,
          nombre_places: nombrePersonnes,
          date_activite: new Date().toISOString(),
          statut: 'ouvert',
          description: `Groupe ${activiteChoisie} - ${quandChoisi}`,
        })
        .select()
        .single();

      if (error) {
        setMessage('❌ Erreur lors de la création du groupe !');
      } else {
        setMessage(`✅ Groupe "${activiteChoisie}" créé ! Recherche de partenaires en cours... 🔥`);
        setTimeout(() => router.push('/profils'), 2000);
      }
    } catch (err) {
      setMessage('❌ Une erreur est survenue !');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Crée ton groupe 🔥</Text>
        <Text style={styles.sousTitre}>
          Choisis une activité et trouve tes partenaires
        </Text>
      </View>

      {message ? (
        <View style={[styles.messageBox, {
          borderColor: message.includes('❌') ? '#FF4444' : '#27AE60',
          backgroundColor: message.includes('❌') ? '#3A1A1A' : '#1A3A2A',
        }]}>
          <Text style={[styles.messageTexte, {
            color: message.includes('❌') ? '#FF4444' : '#27AE60'
          }]}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Quelle activité ?</Text>
        <View style={styles.activitesGrid}>
          {activites.map((activite, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.activiteCard,
                { borderColor: activite.couleur },
                activiteChoisie === activite.nom && { backgroundColor: activite.couleur }
              ]}
              onPress={() => setActiviteChoisie(activite.nom)}>
              <Text style={styles.activiteIcon}>{activite.icon}</Text>
              <Text style={styles.activiteNom}>{activite.nom}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Combien de personnes ?</Text>
        <View style={styles.personnesRow}>
          {personnes.map((p, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.personneCard,
                nombrePersonnes === p && styles.personneCardActive
              ]}
              onPress={() => setNombrePersonnes(p)}>
              <Text style={styles.personneNombre}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Quand ?</Text>
        <View style={styles.quandRow}>
          {quand.map((q, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quandCard,
                quandChoisi === q && styles.quandCardActive
              ]}
              onPress={() => setQuandChoisi(q)}>
              <Text style={[styles.quandTexte,
                quandChoisi === q && styles.quandTexteActive
              ]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.boutonLancer, loading && styles.boutonLoading]}
        onPress={lancerRecherche}
        disabled={loading}>
        <Text style={styles.boutonLancerTexte}>
          {loading ? 'Création en cours...' : '🚀 Lancer la recherche'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2E5A',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  sousTitre: {
    fontSize: 14,
    color: '#FF6B2B',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  messageBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  messageTexte: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitre: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  activitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activiteCard: {
    backgroundColor: '#243660',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '18%',
    borderWidth: 2,
  },
  activiteIcon: {
    fontSize: 24,
  },
  activiteNom: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  personnesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  personneCard: {
    backgroundColor: '#243660',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2B4C9B',
    flex: 1,
  },
  personneCardActive: {
    backgroundColor: '#FF6B2B',
    borderColor: '#FF6B2B',
  },
  personneNombre: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  quandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quandCard: {
    backgroundColor: '#243660',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2B4C9B',
  },
  quandCardActive: {
    backgroundColor: '#FF6B2B',
    borderColor: '#FF6B2B',
  },
  quandTexte: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quandTexteActive: {
    color: '#FFFFFF',
  },
  boutonLancer: {
    backgroundColor: '#FF6B2B',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    margin: 24,
    marginTop: 30,
  },
  boutonLoading: {
    backgroundColor: '#AA4400',
  },
  boutonLancerTexte: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});