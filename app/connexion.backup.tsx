import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const C = {
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldPale: '#FDF8EE',
  beige: '#FAF7F2',
  beigeDeep: '#EEE8DE',
  brown: '#1A1209',
  brownMid: '#5C4A2A',
  white: '#FFFFFF',
  grayLight: '#F0EDE8',
  grayMid: '#C8C0B4',
  grayText: '#8A7F72',
  red: '#E74C3C',
};

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

  const seConnecter = async () => { require('expo-router').router.replace('/(tabs)/explore'); return; router.replace('/(tabs)/explore' as any); return;
    if (!email || !motDePasse) { setErreur('Remplis tous les champs'); return; }
    setLoading(true);
    setErreur('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) {
      setErreur('Email ou mot de passe incorrect');
      setLoading(false);
    } else {
      router.push('/(tabs)/explore' as any);
    }
  };

  const temo = TEMOIGNAGES[temoIndex];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* HERO */}
        <View style={s.hero}>
          <LinearGradient colors={[C.goldLight, C.gold]} style={s.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.logoW}>W</Text>
          </LinearGradient>
          <Text style={s.appName}>WyytU</Text>
          <Text style={s.tagline}>Content de te revoir 👋</Text>
        </View>

        {/* TÉMOIGNAGE */}
        <TouchableOpacity onPress={nextTemo} activeOpacity={0.9}>
          <Animated.View style={[s.temoCard, { opacity: fadeAnim }]}>
            <View style={s.temoLeft}>
              <LinearGradient colors={[C.goldLight, C.gold]} style={s.temoAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.temoLetter}>{temo.prenom[0]}</Text>
              </LinearGradient>
              <View>
                <Text style={s.temoPrenom}>{temo.prenom}</Text>
                <Text style={s.temoVille}>📍 {temo.ville}</Text>
              </View>
            </View>
            <Text style={s.temoEmoji}>{temo.emoji}</Text>
            <Text style={s.temoTexte}>"{temo.texte}"</Text>
            <View style={s.temoDots}>
              {TEMOIGNAGES.map((_, i) => (
                <View key={i} style={[s.temoDot, i === temoIndex && s.temoDotActive]} />
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* CARD CONNEXION */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Connexion</Text>
          <Text style={s.cardSub}>Retrouve ta communauté</Text>

          {erreur ? (
            <View style={s.erreurBox}>
              <Text style={s.erreurTxt}>⚠️ {erreur}</Text>
            </View>
          ) : null}

          {/* EMAIL */}
          <View style={[s.field, focusField === 'email' && s.fieldFocus]}>
            <View style={s.fieldIcon}><Text style={s.fieldIconTxt}>✉️</Text></View>
            <TextInput
              style={s.fieldInput}
              placeholder="ton@email.com"
              placeholderTextColor={C.grayMid}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField('')}
            />
            {email.includes('@') && (
              <View style={s.fieldCheck}><Text style={s.fieldCheckTxt}>✓</Text></View>
            )}
          </View>

          {/* MOT DE PASSE */}
          <View style={[s.field, focusField === 'mdp' && s.fieldFocus]}>
            <View style={s.fieldIcon}><Text style={s.fieldIconTxt}>🔒</Text></View>
            <TextInput
              style={s.fieldInput}
              placeholder="Mot de passe"
              placeholderTextColor={C.grayMid}
              secureTextEntry={!showPassword}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onFocus={() => setFocusField('mdp')}
              onBlur={() => setFocusField('')}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* MOT DE PASSE OUBLIÉ */}
          <TouchableOpacity style={s.forgotBtn}>
            <Text style={s.forgotTxt}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* BOUTON CONNEXION */}
          <TouchableOpacity
            style={[s.btnConnecter, loading && { opacity: 0.6 }]}
            onPress={seConnecter}
            disabled={loading}
            activeOpacity={0.85}>
            <LinearGradient colors={[C.goldLight, C.gold]} style={s.btnConnecterGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.btnConnecterTxt}>
                {loading ? '⏳ Connexion...' : 'Se connecter →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* BOUTON DEMO */}
          <TouchableOpacity
            style={s.btnDemo}
            onPress={() => router.replace('/(tabs)/explore' as any)}
            activeOpacity={0.85}>
            <Text style={s.btnDemoTxt}>⚡ Mode démo — accès direct</Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>ou</Text>
            <View style={s.dividerLine} />
          </View>

          {/* STATS */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNb}>2,400+</Text>
              <Text style={s.statLabel}>Membres</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statItem}>
              <Text style={s.statNb}>890+</Text>
              <Text style={s.statLabel}>Plans/jour</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statItem}>
              <Text style={s.statNb}>12+</Text>
              <Text style={s.statLabel}>Villes</Text>
            </View>
          </View>
        </View>

        {/* INSCRIPTION */}
        <View style={s.inscriptionRow}>
          <Text style={s.inscriptionTxt}>Pas encore membre ? </Text>
          <TouchableOpacity onPress={() => router.push("/inscription" as any)}>
            <Text style={s.inscriptionLien}>Rejoins-nous 🚀</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.beige },
  scroll: { paddingBottom: 40 },

  // HERO
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 24 },
  logoBox: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: C.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  logoW: { color: C.white, fontSize: 36, fontWeight: '900' },
  appName: { fontSize: 32, fontWeight: '900', color: C.brown, letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 16, color: C.grayText, fontWeight: '500' },

  // TÉMO
  temoCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.white, borderRadius: 24, padding: 18, shadowColor: C.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: C.beigeDeep },
  temoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  temoAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  temoLetter: { color: C.white, fontSize: 18, fontWeight: '800' },
  temoPrenom: { fontSize: 14, fontWeight: '800', color: C.brown },
  temoVille: { fontSize: 12, color: C.grayText, marginTop: 1 },
  temoEmoji: { fontSize: 28, marginBottom: 8 },
  temoTexte: { fontSize: 14, color: C.brownMid, lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
  temoDots: { flexDirection: 'row', gap: 6 },
  temoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.beigeDeep },
  temoDotActive: { width: 18, backgroundColor: C.gold },

  // CARD
  card: { marginHorizontal: 20, backgroundColor: C.white, borderRadius: 28, padding: 24, shadowColor: C.brown, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6, gap: 14 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: C.brown, letterSpacing: -0.5 },
  cardSub: { fontSize: 14, color: C.grayText, marginTop: -8 },

  // ERREUR
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: C.red + '40' },
  erreurTxt: { color: C.red, fontSize: 13, fontWeight: '700' },

  // FIELDS
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.grayLight, borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: C.beigeDeep },
  fieldFocus: { borderColor: C.gold, backgroundColor: C.goldPale },
  fieldIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldIconTxt: { fontSize: 18 },
  fieldInput: { flex: 1, color: C.brown, fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  fieldCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2ECC71', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fieldCheckTxt: { color: C.white, fontSize: 13, fontWeight: '800' },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },

  // FORGOT
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotTxt: { fontSize: 13, color: C.gold, fontWeight: '700' },

  // BTN CONNECTER
  btnConnecter: { borderRadius: 18, overflow: 'hidden', shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnConnecterGrad: { padding: 18, alignItems: 'center' },
  btnConnecterTxt: { color: C.brown, fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },

  // BTN DEMO
  btnDemo: { backgroundColor: C.goldPale, borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.gold },
  btnDemoTxt: { color: C.gold, fontWeight: '800', fontSize: 14 },

  // DIVIDER
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.beigeDeep },
  dividerTxt: { color: C.grayMid, fontSize: 13, fontWeight: '600' },

  // STATS
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNb: { fontSize: 18, fontWeight: '900', color: C.gold },
  statLabel: { fontSize: 11, color: C.grayText, fontWeight: '600' },
  statSep: { width: 1, height: 36, backgroundColor: C.beigeDeep },

  // INSCRIPTION
  inscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  inscriptionTxt: { color: C.grayText, fontSize: 14 },
  inscriptionLien: { color: C.gold, fontSize: 14, fontWeight: '800' },
});
