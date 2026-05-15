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
      const { error } = await supabase.auth.signInWithPassword({
        email,
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

      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoTexte}>W</Text>
        </View>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Content de te revoir ! 👋</Text>
        <Text style={styles.sousTitre}>Connecte-toi pour continuer</Text>
      </View>

      {/* FORMULAIRE */}
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
          placeholderTextColor="#BBB"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Ton mot de passe"
          placeholderTextColor="#BBB"
          secureTextEntry={true}
          value={motDePasse}
          onChangeText={setMotDePasse}
        />

        <TouchableOpacity
          style={[styles.bouton, loading && styles.boutonLoading]}
          onPress={connecter}
          disabled={loading}>
          <Text style={styles.boutonTexte}>
            {loading ? 'Connexion...' : 'Se connecter 🚀'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/inscription')}>
          <Text style={styles.lienTexte}>
            Pas encore de compte ?{' '}
            <Text style={styles.lien}>Inscris-toi</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingBottom: 36, paddingHorizontal: 24 },
  logoWrapper: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  logoTexte: { color: '#fff', fontSize: 36, fontWeight: '800' },
  logo: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 8 },
  titre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sousTitre: { fontSize: 14, color: '#AAA', fontStyle: 'italic' },

  formulaire: { paddingHorizontal: 24 },

  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: '#E8000D' },
  erreurTexte: { color: '#E8000D', fontSize: 14, fontWeight: '700', textAlign: 'center' },

  successBox: { backgroundColor: '#EEF7EE', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: '#1DB954' },
  successTexte: { color: '#1DB954', fontSize: 14, fontWeight: '700', textAlign: 'center' },

  label: { color: '#1A1A1A', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 18 },

  input: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 16, color: '#1A1A1A', fontSize: 15, borderWidth: 1, borderColor: '#DDD4C4' },

  bouton: { backgroundColor: '#E8000D', borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 28, shadowColor: '#E8000D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  boutonLoading: { backgroundColor: '#AAA' },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },

  lienTexte: { color: '#AAA', textAlign: 'center', marginTop: 20, fontSize: 14 },
  lien: { color: '#E8000D', fontWeight: '800' },
});