import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.slogan}>
          Tu n'es plus jamais seul 🔥
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => router.push('/inscription')}>
          <Text style={styles.buttonPrimaryText}>
            Créer un compte
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.push('/connexion')}>
          <Text style={styles.buttonSecondaryText}>
            J'ai déjà un compte
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2E5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 18,
    color: '#FF6B2B',
    marginTop: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '80%',
    gap: 16,
  },
  buttonPrimary: {
    backgroundColor: '#FF6B2B',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B2B',
  },
  buttonSecondaryText: {
    color: '#FF6B2B',
    fontSize: 18,
    fontWeight: 'bold',
  },
});