import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
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

const TEMOIGNAGES = [
  { prenom: 'Youssef', ville: 'Tanger', texte: 'J\'ai trouvé mon crew en 10 min !', emoji: '⚽' },
  { prenom: 'Léa', ville: 'Bruxelles', texte: 'Nouvelle en ville, sortie dès le soir 🔥', emoji: '🎉' },
  { prenom: 'Mehdi', ville: 'Casablanca', texte: 'Le concept est génial, simple et efficace !', emoji: '🎮' },
];

export default function ConnexionScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [focusField, setFocusField] = useState('');
  const [temoIndex, setTemoIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const nextTemo = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setTemoIndex((prev) => (prev + 1) % TEMOIGNAGES.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const seConnecter = async () => {
    if (!email || !motDePasse) { setErreur('Remplis tous les champs'); return; }
    setLoading(true);
    setErreur('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) {
      setErreur('Email ou mot de passe incorrect');
      setLoading(false);
    } else {
      router.replace('/(tabs)/explore' as any);
    }
  };

  const temo = TEMOIGNAGES[temoIndex];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoW}>W</Text>
          </View>
          <Text style={styles.logoTexte}>WyytU</Text>
          <Text style={styles.tagline}>Content de te revoir 👋</Text>
        </View>

        {/* TÉMOIGNAGE */}
        <TouchableOpacity onPress={nextTemo} activeOpacity={0.9}>
          <Animated.View style={[styles.temoCard, { opacity: fadeAnim }]}>
            <View style={styles.temoLeft}>
              <View style={styles.temoAvatar}>
                <Text style={styles.temoAvatarTexte}>{temo.prenom[0]}</Text>
              </View>
              <View>
                <Text style={styles.temoPrenom}>{temo.prenom}</Text>
                <Text style={styles.temoVille}>📍 {temo.ville}</Text>
              </View>
            </View>
            <Text style={styles.temoEmoji}>{temo.emoji}</Text>
            <Text style={styles.temoTexte}>"{temo.texte}"</Text>
            <View style={styles.temoDots}>
              {TEMOIGNAGES.map((_, i) => (
                <View key={i} style={[styles.temoDot, i === temoIndex && styles.temoDotActive]} />
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* CARD CONNEXION */}
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Connexion</Text>
          <Text style={styles.cardSub}>Retrouve ta communauté</Text>

          {erreur ? (
            <View style={styles.erreurBox}>
              <Text style={styles.erreurTexte}>⚠️ {erreur}</Text>
            </View>
          ) : null}

          {/* EMAIL */}
          <View style={[styles.fieldWrapper, focusField === 'email' && styles.fieldFocus]}>
            <View style={styles.fieldIconBox}>
              <Text style={styles.fieldIcon}>✉️</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="ton@email.com"
              placeholderTextColor="#BBB"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField('')}
            />
            {email.includes('@') && (
              <View style={styles.fieldCheck}><Text style={styles.fieldCheckTexte}>✓</Text></View>
            )}
          </View>

          {/* MOT DE PASSE */}
          <View style={[styles.fieldWrapper, focusField === 'mdp' && styles.fieldFocus]}>
            <View style={styles.fieldIconBox}>
              <Text style={styles.fieldIcon}>🔒</Text>
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="Mot de passe"
              placeholderTextColor="#BBB"
              secureTextEntry={!showPassword}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onFocus={() => setFocusField('mdp')}
              onBlur={() => setFocusField('')}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* MOT DE PASSE OUBLIÉ */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/mot-de-passe-oublie' as any)}>
            <Text style={styles.forgotTexte}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* BOUTON */}
          <TouchableOpacity
            style={[styles.btnConnecter, loading && { opacity: 0.6 }]}
            onPress={seConnecter}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.btnConnecterTexte}>
              {loading ? '⏳ Connexion...' : 'Se connecter →'}
            </Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTexte}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNombre}>2,400+</Text>
              <Text style={styles.statLabel}>Membres</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statNombre}>890+</Text>
              <Text style={styles.statLabel}>Plans/jour</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statNombre}>12+</Text>
              <Text style={styles.statLabel}>Villes</Text>
            </View>
          </View>
        </View>

        {/* INSCRIPTION */}
        <View style={styles.inscriptionRow}>
          <Text style={styles.inscriptionTexte}>Pas encore membre ?</Text>
          <TouchableOpacity onPress={() => router.push('/inscription' as any)}>
            <Text style={styles.inscriptionLien}> Rejoins-nous 🚀</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { paddingBottom: 40 },
  bgCircle1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: '#E8000D', opacity: 0.05, top: -60, right: -80 },
  bgCircle2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#7B2FBE', opacity: 0.04, top: 200, left: -80 },
  bgCircle3: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#0070F3', opacity: 0.04, top: 500, right: -40 },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 24 },
  logoWrapper: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  logoW: { color: '#fff', fontSize: 36, fontWeight: '900' },
  logoTexte: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 16, color: '#AAA', fontWeight: '500' },
  temoCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F0EDE8' },
  temoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  temoAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  temoAvatarTexte: { color: '#fff', fontSize: 18, fontWeight: '800' },
  temoPrenom: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  temoVille: { fontSize: 12, color: '#AAA', marginTop: 1 },
  temoEmoji: { fontSize: 28, marginBottom: 8 },
  temoTexte: { fontSize: 14, color: '#555', lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
  temoDots: { flexDirection: 'row', gap: 6 },
  temoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EEE8DE' },
  temoDotActive: { width: 18, backgroundColor: '#E8000D' },
  card: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6, gap: 14 },
  cardTitre: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  cardSub: { fontSize: 14, color: '#AAA', marginTop: -8 },
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#E8000D30' },
  erreurTexte: { color: '#E8000D', fontSize: 13, fontWeight: '700' },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F2', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: '#F0EDE8' },
  fieldFocus: { borderColor: '#E8000D', backgroundColor: '#FFF8F8' },
  fieldIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldIcon: { fontSize: 18 },
  fieldInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  fieldCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fieldCheckTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotTexte: { fontSize: 13, color: '#E8000D', fontWeight: '700' },
  btnConnecter: { backgroundColor: '#E8000D', borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnConnecterTexte: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0EDE8' },
  dividerTexte: { color: '#BBB', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNombre: { fontSize: 18, fontWeight: '900', color: '#E8000D' },
  statLabel: { fontSize: 11, color: '#AAA', fontWeight: '600' },
  statSep: { width: 1, height: 36, backgroundColor: '#F0EDE8' },
  inscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  inscriptionTexte: { color: '#AAA', fontSize: 14 },
  inscriptionLien: { color: '#E8000D', fontSize: 14, fontWeight: '800' },
});