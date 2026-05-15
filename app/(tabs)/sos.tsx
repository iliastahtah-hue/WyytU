import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SOSScreen() {

  const contactsConfiance = [
    { prenom: 'Maman', telephone: '+212 6XX XXX XXX', relation: '👨‍👩‍👧 Famille' },
    { prenom: 'Ahmed', telephone: '+32 4XX XXX XXX', relation: '👫 Ami proche' },
    { prenom: 'Sara', telephone: '+212 6XX XXX XXX', relation: '👫 Amie proche' },
  ];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Sécurité 🛡️</Text>
        <Text style={styles.sousTitre}>
          Ta sécurité est notre priorité absolue
        </Text>
      </View>

      <View style={styles.sosContainer}>
        <Text style={styles.sosTexte}>
          En cas de danger appuie sur le bouton SOS
        </Text>
        <Text style={styles.sosDescription}>
          Ta position GPS sera envoyée instantanément à tes contacts de confiance
        </Text>
        <TouchableOpacity style={styles.boutonSOS}>
          <Text style={styles.boutonSOSIcon}>🆘</Text>
          <Text style={styles.boutonSOSTexte}>BOUTON SOS</Text>
          <Text style={styles.boutonSOSSubTexte}>
            Appui long pour activer
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>
          📍 Ta position actuelle
        </Text>
        <View style={styles.positionCard}>
          <Text style={styles.positionTexte}>
            🗺️ Tanger, Maroc
          </Text>
          <Text style={styles.positionDetail}>
            Dernière mise à jour : maintenant
          </Text>
          <View style={styles.positionStatus}>
            <View style={styles.positionDot} />
            <Text style={styles.positionStatusTexte}>
              Position active et partagée
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>
          👥 Contacts de confiance
        </Text>
        <Text style={styles.sectionSousTitre}>
          Ces personnes recevront ta position en cas d'urgence
        </Text>

        {contactsConfiance.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarTexte}>
                {contact.prenom[0]}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactPrenom}>{contact.prenom}</Text>
              <Text style={styles.contactTelephone}>{contact.telephone}</Text>
              <Text style={styles.contactRelation}>{contact.relation}</Text>
            </View>
            <TouchableOpacity style={styles.boutonAppeler}>
              <Text style={styles.boutonAppelerTexte}>📞</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.boutonAjouter}>
          <Text style={styles.boutonAjouterTexte}>
            ➕ Ajouter un contact de confiance
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>
          🛡️ Règles de sécurité WyytU
        </Text>
        {[
          '✅ Tous les membres sont vérifiés par carte d\'identité',
          '✅ Chaque activité est enregistrée — qui, où, quand',
          '✅ Les signalements sont traités sous 24h',
          '✅ Les cas graves sont transmis aux autorités',
          '✅ Ton numéro de téléphone reste privé jusqu\'à l\'activité',
          '✅ Tu peux bloquer n\'importe quel membre en un clic',
        ].map((regle, index) => (
          <View key={index} style={styles.regleCard}>
            <Text style={styles.regleTexte}>{regle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>🚨 Signaler un problème</Text>
        <TouchableOpacity style={styles.boutonSignaler}>
          <Text style={styles.boutonSignalerTexte}>
            🚨 Signaler un utilisateur
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boutonUrgence}>
          <Text style={styles.boutonUrgenceTexte}>
            🚔 Contacter les autorités
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.espaceBottom} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2E5A' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginTop: 8 },
  sousTitre: { fontSize: 14, color: '#FF6B2B', marginTop: 6, fontStyle: 'italic', textAlign: 'center' },
  sosContainer: { backgroundColor: '#3A1A1A', marginHorizontal: 20, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#FF4444', marginBottom: 10 },
  sosTexte: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sosDescription: { color: '#AAAAAA', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  boutonSOS: { backgroundColor: '#FF4444', width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FF0000', shadowColor: '#FF0000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20 },
  boutonSOSIcon: { fontSize: 48 },
  boutonSOSTexte: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  boutonSOSSubTexte: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitre: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  sectionSousTitre: { color: '#AAAAAA', fontSize: 13, marginBottom: 12 },
  positionCard: { backgroundColor: '#243660', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#27AE60' },
  positionTexte: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  positionDetail: { color: '#AAAAAA', fontSize: 12, marginTop: 4 },
  positionStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  positionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27AE60' },
  positionStatusTexte: { color: '#27AE60', fontSize: 13, fontWeight: 'bold' },
  contactCard: { backgroundColor: '#243660', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2B4C9B' },
  contactAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactAvatarTexte: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  contactInfo: { flex: 1 },
  contactPrenom: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  contactTelephone: { color: '#AAAAAA', fontSize: 13, marginTop: 2 },
  contactRelation: { color: '#FF6B2B', fontSize: 12, marginTop: 2 },
  boutonAppeler: { backgroundColor: '#27AE60', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  boutonAppelerTexte: { fontSize: 18 },
  boutonAjouter: { backgroundColor: 'transparent', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#FF6B2B', marginTop: 6 },
  boutonAjouterTexte: { color: '#FF6B2B', fontWeight: 'bold', fontSize: 15 },
  regleCard: { backgroundColor: '#243660', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27AE60' },
  regleTexte: { color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
  boutonSignaler: { backgroundColor: '#FF4444', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  boutonSignalerTexte: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  boutonUrgence: { backgroundColor: '#243660', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#FF4444' },
  boutonUrgenceTexte: { color: '#FF4444', fontWeight: 'bold', fontSize: 16 },
  espaceBottom: { height: 40 },
});