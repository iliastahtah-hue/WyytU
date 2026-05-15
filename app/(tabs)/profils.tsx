import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfilsScreen() {

  const profils = [
    {
      prenom: 'Sarah',
      age: 26,
      ville: 'Bruxelles',
      note: 4.8,
      activites: ['🏋️ Sport', '🎬 Cinéma', '🌿 Nature'],
      badges: ['⭐ Top ponctualité', '❤️ Bienveillant'],
      verifie: true,
    },
    {
      prenom: 'Karim',
      age: 31,
      ville: 'Tanger',
      note: 4.5,
      activites: ['⚽ Football', '🍽️ Restaurant', '🎵 Festival'],
      badges: ['🟢 Jamais annulé', '🔥 En feu'],
      verifie: true,
    },
    {
      prenom: 'Léa',
      age: 24,
      ville: 'Paris',
      note: 4.9,
      activites: ['🧘 Yoga', '🎨 Culture', '☕ Café'],
      badges: ['👑 Organisatrice', '💎 Premium'],
      verifie: true,
    },
    {
      prenom: 'Ahmed',
      age: 28,
      ville: 'Bruxelles',
      note: 4.3,
      activites: ['🏃 Running', '🎮 Loisirs', '✈️ Voyage'],
      badges: ['🌍 Explorateur'],
      verifie: true,
    },
  ];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Partenaires disponibles 👥</Text>
        <Text style={styles.sousTitre}>
          4 personnes veulent rejoindre ton groupe
        </Text>
      </View>

      <View style={styles.activiteChoisie}>
        <Text style={styles.activiteTexte}>
          🏋️ Sport • 3 personnes • Aujourd'hui
        </Text>
      </View>

      {profils.map((profil, index) => (
        <View key={index} style={styles.profilCard}>

          <View style={styles.profilHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexte}>
                {profil.prenom[0]}
              </Text>
            </View>

            <View style={styles.profilInfo}>
              <View style={styles.profilNomRow}>
                <Text style={styles.profilNom}>{profil.prenom}, {profil.age}</Text>
                {profil.verifie && (
                  <Text style={styles.verifie}>✅ Vérifié</Text>
                )}
              </View>
              <Text style={styles.profilVille}>📍 {profil.ville}</Text>
              <Text style={styles.profilNote}>⭐ {profil.note} / 5</Text>
            </View>
          </View>

          <View style={styles.activitesRow}>
            {profil.activites.map((activite, i) => (
              <View key={i} style={styles.activiteTag}>
                <Text style={styles.activiteTagTexte}>{activite}</Text>
              </View>
            ))}
          </View>

          <View style={styles.badgesRow}>
            {profil.badges.map((badge, i) => (
              <View key={i} style={styles.badgeTag}>
                <Text style={styles.badgeTagTexte}>{badge}</Text>
              </View>
            ))}
          </View>

          <View style={styles.boutonsRow}>
            <TouchableOpacity style={styles.boutonRefuser}>
              <Text style={styles.boutonRefuserTexte}>✕ Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.boutonAccepter}>
              <Text style={styles.boutonAccepterTexte}>✓ Accepter</Text>
            </TouchableOpacity>
          </View>

        </View>
      ))}

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
    paddingBottom: 16,
  },
  logo: {
    fontSize: 32,
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
  },
  activiteChoisie: {
    backgroundColor: '#243660',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B2B',
  },
  activiteTexte: {
    color: '#FF6B2B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profilCard: {
    backgroundColor: '#243660',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  profilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexte: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profilInfo: {
    flex: 1,
  },
  profilNomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profilNom: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifie: {
    fontSize: 12,
    color: '#27AE60',
  },
  profilVille: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  profilNote: {
    color: '#F39C12',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  activitesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  activiteTag: {
    backgroundColor: '#1A2E5A',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  activiteTagTexte: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  badgeTag: {
    backgroundColor: '#1A3A2A',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  badgeTagTexte: {
    color: '#27AE60',
    fontSize: 11,
    fontWeight: 'bold',
  },
  boutonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boutonRefuser: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  boutonRefuserTexte: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  boutonAccepter: {
    flex: 1,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  boutonAccepterTexte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});