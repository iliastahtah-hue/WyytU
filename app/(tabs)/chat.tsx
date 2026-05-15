import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatScreen() {

  const groupe = {
    nom: '🏋️ Sport ce soir',
    membres: ['Ilias', 'Sarah', 'Karim', 'Léa'],
    activite: 'Sport',
    heure: '18h00',
    lieu: 'Salle Basic-Fit Bruxelles',
  };

  const messages = [
    { auteur: 'Sarah', texte: 'Salut tout le monde ! Hâte de faire la séance 💪', heure: '14:32', moi: false },
    { auteur: 'Karim', texte: 'Pareil ! Je serai là à 17h45 pour s\'échauffer', heure: '14:35', moi: false },
    { auteur: 'Moi', texte: 'Super ! On se retrouve à l\'entrée ?', heure: '14:38', moi: true },
    { auteur: 'Léa', texte: 'Oui parfait 😊 Je viens aussi un peu en avance', heure: '14:40', moi: false },
    { auteur: 'Sarah', texte: 'Quelqu\'un a besoin de matériel ? J\'ai des élastiques en plus', heure: '14:45', moi: false },
    { auteur: 'Karim', texte: 'Non merci Sarah ! À tout à l\'heure 🔥', heure: '14:50', moi: false },
    { auteur: 'Moi', texte: 'On est une super équipe ! À ce soir 💪🔥', heure: '14:52', moi: true },
  ];

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.logo}>WyytU</Text>
          <Text style={styles.groupeNom}>{groupe.nom}</Text>
          <Text style={styles.groupeMembres}>
            {groupe.membres.join(' • ')}
          </Text>
        </View>

        <View style={styles.appelsRow}>
          <TouchableOpacity style={styles.boutonAppel}>
            <Text style={styles.boutonAppelIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boutonVideo}>
            <Text style={styles.boutonVideoIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoGroupe}>
        <Text style={styles.infoTexte}>
          📍 {groupe.lieu}
        </Text>
        <Text style={styles.infoTexte}>
          🕐 {groupe.heure}
        </Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              message.moi ? styles.messageWrapperMoi : styles.messageWrapperAutre
            ]}>

            {!message.moi && (
              <View style={styles.avatarPetit}>
                <Text style={styles.avatarPetitTexte}>
                  {message.auteur[0]}
                </Text>
              </View>
            )}

            <View style={[
              styles.messageBulle,
              message.moi ? styles.messageBulleMoi : styles.messageBulleAutre
            ]}>
              {!message.moi && (
                <Text style={styles.messageAuteur}>{message.auteur}</Text>
              )}
              <Text style={styles.messageTexte}>{message.texte}</Text>
              <Text style={styles.messageHeure}>{message.heure}</Text>
            </View>

          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écris un message..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity style={styles.boutonEnvoyer}>
          <Text style={styles.boutonEnvoyerTexte}>🚀</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2E5A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#243660',
    borderBottomWidth: 1,
    borderBottomColor: '#2B4C9B',
  },
  headerInfo: {
    flex: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B2B',
    letterSpacing: 2,
  },
  groupeNom: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  groupeMembres: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 2,
  },
  appelsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boutonAppel: {
    backgroundColor: '#27AE60',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonAppelIcon: {
    fontSize: 20,
  },
  boutonVideo: {
    backgroundColor: '#3498DB',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonVideoIcon: {
    fontSize: 20,
  },
  infoGroupe: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E3A6E',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2B4C9B',
  },
  infoTexte: {
    color: '#FF6B2B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageWrapperMoi: {
    justifyContent: 'flex-end',
  },
  messageWrapperAutre: {
    justifyContent: 'flex-start',
  },
  avatarPetit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarPetitTexte: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBulle: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
  },
  messageBulleMoi: {
    backgroundColor: '#FF6B2B',
    borderBottomRightRadius: 4,
  },
  messageBulleAutre: {
    backgroundColor: '#243660',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  messageAuteur: {
    color: '#FF6B2B',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageTexte: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageHeure: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#243660',
    borderTopWidth: 1,
    borderTopColor: '#2B4C9B',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A2E5A',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2B4C9B',
    maxHeight: 100,
  },
  boutonEnvoyer: {
    backgroundColor: '#FF6B2B',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonEnvoyerTexte: {
    fontSize: 20,
  },
});