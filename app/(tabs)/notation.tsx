import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotationScreen() {

  const activiteTerminee = {
    nom: '🏋️ Sport ce soir',
    lieu: 'Salle Basic-Fit Bruxelles',
    date: 'Aujourd\'hui à 18h00',
  };

  const membres = [
    { prenom: 'Sarah', age: 26 },
    { prenom: 'Karim', age: 31 },
    { prenom: 'Léa', age: 24 },
  ];

  const criteres = [
    { id: 'ponctualite', icon: '⏰', nom: 'Ponctualité', description: 'Est-il arrivé à l\'heure ?' },
    { id: 'bienveillance', icon: '❤️', nom: 'Bienveillance', description: 'Était-il agréable ?' },
    { id: 'energie', icon: '⚡', nom: 'Énergie', description: 'Bonne humeur dans le groupe ?' },
    { id: 'fiabilite', icon: '✅', nom: 'Fiabilité', description: 'A-t-il tenu ses engagements ?' },
    { id: 'compatibilite', icon: '🔄', nom: 'Compatibilité', description: 'Tu le referais avec lui ?' },
  ];

  const etoiles = [1, 2, 3, 4, 5];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Note tes partenaires ⭐</Text>
        <Text style={styles.sousTitre}>
          L'activité est terminée — donne ton avis !
        </Text>
      </View>

      <View style={styles.activiteBox}>
        <Text style={styles.activiteNom}>{activiteTerminee.nom}</Text>
        <Text style={styles.activiteDetail}>📍 {activiteTerminee.lieu}</Text>
        <Text style={styles.activiteDetail}>🕐 {activiteTerminee.date}</Text>
      </View>

      {membres.map((membre, index) => (
        <View key={index} style={styles.membreCard}>

          <View style={styles.membreHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexte}>{membre.prenom[0]}</Text>
            </View>
            <Text style={styles.membreNom}>{membre.prenom}, {membre.age}</Text>
          </View>

          {criteres.map((critere, i) => (
            <View key={i} style={styles.critereRow}>
              <View style={styles.critereInfo}>
                <Text style={styles.critereIcon}>{critere.icon}</Text>
                <View>
                  <Text style={styles.critereNom}>{critere.nom}</Text>
                  <Text style={styles.critereDescription}>{critere.description}</Text>
                </View>
              </View>
              <View style={styles.etoilesRow}>
                {etoiles.map((etoile) => (
                  <TouchableOpacity key={etoile} style={styles.etoile}>
                    <Text style={styles.etoileTexte}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.recommandeRow}>
            <Text style={styles.recommandeTexte}>
              Tu le referais avec lui ?
            </Text>
            <View style={styles.recommandeBoutons}>
              <TouchableOpacity style={styles.boutonOui}>
                <Text style={styles.boutonOuiTexte}>👍 Oui !</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boutonNon}>
                <Text style={styles.boutonNonTexte}>👎 Non</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      ))}

      <TouchableOpacity style={styles.boutonValider}>
        <Text style={styles.boutonValiderTexte}>
          ✅ Valider mes notes
        </Text>
      </TouchableOpacity>

      <View style={styles.espaceBottom} />

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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titre: {
    fontSize: 22,
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
  },
  activiteBox: {
    backgroundColor: '#243660',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B2B',
    alignItems: 'center',
  },
  activiteNom: {
    color: '#FF6B2B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  activiteDetail: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  membreCard: {
    backgroundColor: '#243660',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  membreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexte: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  membreNom: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  critereRow: {
    marginBottom: 14,
  },
  critereInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  critereIcon: {
    fontSize: 20,
  },
  critereNom: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  critereDescription: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  etoilesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 30,
  },
  etoile: {
    padding: 4,
  },
  etoileTexte: {
    fontSize: 24,
  },
  recommandeRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2B4C9B',
    paddingTop: 14,
  },
  recommandeTexte: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommandeBoutons: {
    flexDirection: 'row',
    gap: 10,
  },
  boutonOui: {
    flex: 1,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  boutonOuiTexte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  boutonNon: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  boutonNonTexte: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  boutonValider: {
    backgroundColor: '#FF6B2B',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  boutonValiderTexte: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  espaceBottom: {
    height: 40,
  },
});