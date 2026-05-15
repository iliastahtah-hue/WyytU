import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ConnexionScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const connecter = async () => {
    if (!email || !motDePasse) {
      setErreur('Remplis tous les champs !');
      return;
    }
    setLoading(true);
    setErreur('');
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: motDePasse,
      });
      if (error) {
        setErreur('Email ou mot de passe incorrect !');
      } else {
        setMessage('🎉 Connexion réussie ! Bienvenue sur WyytU !');
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (err) {
      setErreur('Une erreur est survenue !');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Content de te revoir ! 👋</Text>
        <Text style={styles.sousTitre}>Connecte-toi pour continuer</Text>
      </View>

      <View style={styles.formulaire}>

        {erreur ? (
          <View style={styles.erreurBox}>
            <Text style={styles.erreurTexte}>❌ {erreur}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successTexte}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="ton@email.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Ton mot de passe"
          placeholderTextColor="#888"
          secureTextEntry={true}
          value={motDePasse}
          onChangeText={setMotDePasse}
        />

        <TouchableOpacity
          style={[styles.boutonConnexion, loading && styles.boutonLoading]}
          onPress={connecter}
          disabled={loading}>
          <Text style={styles.boutonConnexionTexte}>
            {loading ? 'Connexion...' : 'Se connecter 🚀'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/inscription')}>
          <Text style={styles.inscriptionTexte}>
            Pas encore de compte ?{' '}
            <Text style={styles.inscriptionLien}>Inscris-toi</Text>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  sousTitre: {
    fontSize: 14,
    color: '#FF6B2B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  formulaire: {
    paddingHorizontal: 24,
  },
  erreurBox: {
    backgroundColor: '#3A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  erreurTexte: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#1A3A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  successTexte: {
    color: '#27AE60',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#243660',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  boutonConnexion: {
    backgroundColor: '#FF6B2B',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  boutonLoading: {
    backgroundColor: '#AA4400',
  },
  boutonConnexionTexte: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inscriptionTexte: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  inscriptionLien: {
    color: '#FF6B2B',
    fontWeight: 'bold',
  },
});