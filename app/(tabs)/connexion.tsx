import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ConnexionScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const connecter = async () => {
    if (!email || !motDePasse) { setErreur('Remplis tous les champs !'); return; }
    setLoading(true); setErreur(''); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      if (error) { setErreur('Email ou mot de passe incorrect !'); }
      else { setMessage('🎉 Connexion réussie !'); setTimeout(() => router.push('/'), 1500); }
    } catch { setErreur('Une erreur est survenue !'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* BG DÉCO */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoTexte}>W</Text>
          </View>
          <Text style={styles.logo}>WyytU</Text>
          <Text style={styles.tagline}>Trouve ton prochain plan 🎯</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Content de te revoir 👋</Text>
          <Text style={styles.cardSub}>Connecte-toi pour continuer</Text>

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

          {/* EMAIL */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              placeholderTextColor="#BBB"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => { setEmail(t); setErreur(''); }}
              autoCapitalize="none"
            />
          </View>

          {/* MOT DE PASSE */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#BBB"
              secureTextEntry={!showPassword}
              value={motDePasse}
              onChangeText={(t) => { setMotDePasse(t); setErreur(''); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* MOT DE PASSE OUBLIÉ */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotTexte}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* BOUTON CONNEXION */}
          <TouchableOpacity
            style={[styles.bouton, loading && styles.boutonLoading]}
            onPress={connecter}
            disabled={loading}>
            <Text style={styles.boutonTexte}>
              {loading ? '⏳ Connexion...' : 'Se connecter →'}
            </Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTexte}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SOCIAL BUTTONS */}
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialIcon}>🌐</Text>
            <Text style={styles.socialTexte}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, styles.socialBtnApple]}>
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={[styles.socialTexte, { color: '#fff' }]}>Continuer avec Apple</Text>
          </TouchableOpacity>

          {/* INSCRIPTION */}
          <TouchableOpacity onPress={() => router.push('/inscription' as any)} style={styles.inscriptionBtn}>
            <Text style={styles.inscriptionTexte}>
              Pas encore de compte ?{'  '}
              <Text style={styles.inscriptionLien}>Inscris-toi gratuitement</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // BG DÉCO
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#E8000D', opacity: 0.06, top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FF6A00', opacity: 0.05, top: 100, left: -60 },

  // HERO
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 32 },
  logoWrapper: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: '#E8000D',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  logoTexte: { color: '#fff', fontSize: 40, fontWeight: '900' },
  logo: { fontSize: 36, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 15, color: '#AAA', fontWeight: '500' },

  // CARD
  card: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 28,
    padding: 24, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  cardTitre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#AAA', marginBottom: 24 },

  // ALERTS
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#E8000D' },
  erreurTexte: { color: '#E8000D', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  successBox: { backgroundColor: '#EEF7EE', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#1DB954' },
  successTexte: { color: '#1DB954', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // INPUTS
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F6F2', borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#EEE8DE',
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 16 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  // FORGOT
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotTexte: { color: '#E8000D', fontSize: 13, fontWeight: '700' },

  // BOUTON
  bouton: {
    backgroundColor: '#E8000D', borderRadius: 18, padding: 18,
    alignItems: 'center', shadowColor: '#E8000D',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  boutonLoading: { backgroundColor: '#AAA', shadowOpacity: 0 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // DIVIDER
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE8DE' },
  dividerTexte: { color: '#AAA', fontSize: 13, fontWeight: '600', marginHorizontal: 12 },

  // SOCIAL
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#EEE8DE', backgroundColor: '#fff',
  },
  socialBtnApple: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  socialIcon: { fontSize: 20 },
  socialTexte: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  // INSCRIPTION
  inscriptionBtn: { marginTop: 8, alignItems: 'center' },
  inscriptionTexte: { color: '#AAA', fontSize: 14, textAlign: 'center' },
  inscriptionLien: { color: '#E8000D', fontWeight: '800' },
});