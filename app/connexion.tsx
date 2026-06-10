import { LinearGradient } from 'expo-linear-gradient';
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

const C = {
  bg: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textMid: '#4A4A6A',
  textLight: '#9090A0',
  border: '#EEEEEE',
  green: '#00C853',
  red: '#FF3B30',
};

const TEMOIGNAGES = [
  { prenom: 'Youssef', ville: 'Tanger', texte: 'J\'ai trouvé mon crew en 10 min !', emoji: '⚽', gradient: ['#FF416C', '#FF4B2B'] as [string,string] },
  { prenom: 'Léa', ville: 'Bruxelles', texte: 'Nouvelle en ville, sortie dès le soir 🔥', emoji: '🎉', gradient: ['#FC466B', '#3F5EFB'] as [string,string] },
  { prenom: 'Mehdi', ville: 'Casablanca', texte: 'Le concept est génial, simple et efficace !', emoji: '🎮', gradient: ['#0072FF', '#00C6FF'] as [string,string] },
];

const ACTIVITES = [
  { emoji: '⚽', label: 'Sport', color: '#FF416C' },
  { emoji: '🍕', label: 'Resto', color: '#F7971E' },
  { emoji: '🎉', label: 'Soirée', color: '#FC466B' },
  { emoji: '🎮', label: 'Gaming', color: '#0072FF' },
  { emoji: '🎵', label: 'Musique', color: '#11998E' },
  { emoji: '✈️', label: 'Voyage', color: '#00B4DB' },
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
      setTemoIndex(prev => (prev + 1) % TEMOIGNAGES.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const seConnecter = async () => {
    router.replace('/(tabs)/explore' as any); return;
  };

  const temo = TEMOIGNAGES[temoIndex];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <LinearGradient colors={['#667EEA', '#764BA2']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Text style={s.logoW}>W</Text>
            </View>
          </View>
          <Text style={s.appName}>WyytU</Text>
          <Text style={s.tagline}>Ta communauté d'activités 🎉</Text>

          {/* Activités preview */}
          <View style={s.activitesRow}>
            {ACTIVITES.map((a, i) => (
              <View key={i} style={[s.activitePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={{ fontSize: 16 }}>{a.emoji}</Text>
                <Text style={s.activitePillTxt}>{a.label}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={s.heroStats}>
            {[
              { nb: '2,400+', label: 'Membres', emoji: '👥' },
              { nb: '890+', label: 'Plans/jour', emoji: '⚡' },
              { nb: '12+', label: 'Villes', emoji: '🌍' },
            ].map((st, i) => (
              <View key={i} style={s.heroStat}>
                <Text style={s.heroStatEmoji}>{st.emoji}</Text>
                <Text style={s.heroStatNb}>{st.nb}</Text>
                <Text style={s.heroStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── TÉMOIGNAGE ── */}
        <TouchableOpacity onPress={nextTemo} activeOpacity={0.92} style={s.temoWrap}>
          <Animated.View style={[s.temoCard, { opacity: fadeAnim }]}>
            <View style={s.temoTop}>
              <LinearGradient colors={temo.gradient} style={s.temoAvatar}>
                <Text style={s.temoAvatarTxt}>{temo.prenom[0]}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.temoPrenom}>{temo.prenom}</Text>
                <Text style={s.temoVille}>📍 {temo.ville}</Text>
              </View>
              <Text style={{ fontSize: 26 }}>{temo.emoji}</Text>
            </View>
            <Text style={s.temoTexte}>"{temo.texte}"</Text>
            <View style={s.temoDots}>
              {TEMOIGNAGES.map((_, i) => (
                <View key={i} style={[s.temoDot, i === temoIndex && { width: 20, backgroundColor: temo.gradient[0] }]} />
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* ── CARD CONNEXION ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Connexion</Text>
          <Text style={s.cardSub}>Rejoins ta communauté</Text>

          {erreur ? (
            <View style={s.erreurBox}>
              <Text style={s.erreurTxt}>⚠️ {erreur}</Text>
            </View>
          ) : null}

          {/* EMAIL */}
          <View style={[s.field, focusField === 'email' && { borderColor: '#667EEA', backgroundColor: '#F0F2FF' }]}>
            <View style={s.fieldIcon}><Text style={{ fontSize: 18 }}>✉️</Text></View>
            <TextInput
              style={s.fieldInput}
              placeholder="ton@email.com"
              placeholderTextColor="#B0B8C8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField('')}
            />
            {email.includes('@') && (
              <View style={s.checkIcon}><Text style={{ color: C.white, fontSize: 12, fontWeight: '800' }}>✓</Text></View>
            )}
          </View>

          {/* MOT DE PASSE */}
          <View style={[s.field, focusField === 'mdp' && { borderColor: '#667EEA', backgroundColor: '#F0F2FF' }]}>
            <View style={s.fieldIcon}><Text style={{ fontSize: 18 }}>🔒</Text></View>
            <TextInput
              style={s.fieldInput}
              placeholder="Mot de passe"
              placeholderTextColor="#B0B8C8"
              secureTextEntry={!showPassword}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onFocus={() => setFocusField('mdp')}
              onBlur={() => setFocusField('')}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.forgotBtn}>
            <Text style={s.forgotTxt}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* CONNEXION */}
          <TouchableOpacity style={[s.btnPrimary, loading && { opacity: 0.6 }]} onPress={seConnecter} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.btnTxt}>{loading ? '⏳ Connexion...' : 'Se connecter →'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* DÉMO */}
          <TouchableOpacity style={s.btnDemo} onPress={() => router.replace('/(tabs)/explore' as any)} activeOpacity={0.85}>
            <LinearGradient colors={['#FF416C', '#3F5EFB']} style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.btnTxt}>⚡ Mode démo — accès direct</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>activités disponibles</Text>
            <View style={s.dividerLine} />
          </View>

          {/* ACTIVITÉS COLORÉES */}
          <View style={s.activitesGrid}>
            {ACTIVITES.map((a, i) => (
              <View key={i} style={[s.activiteChip, { borderColor: a.color + '50', backgroundColor: a.color + '12' }]}>
                <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                <Text style={[s.activiteChipTxt, { color: a.color }]}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INSCRIPTION */}
        <View style={s.inscriptionRow}>
          <Text style={s.inscriptionTxt}>Pas encore membre ? </Text>
          <TouchableOpacity onPress={() => router.push('/inscription' as any)}>
            <Text style={s.inscriptionLien}>Rejoins-nous 🚀</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  // HERO
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  heroCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.08)', top: -100, right: -80 },
  heroCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -60, left: -60 },
  logoWrap: { marginBottom: 14 },
  logoBox: { width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  logoW: { color: C.white, fontSize: 38, fontWeight: '900' },
  appName: { fontSize: 34, fontWeight: '900', color: C.white, letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 20 },

  // ACTIVITÉS PILLS HERO
  activitesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  activitePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  activitePillTxt: { color: C.white, fontSize: 12, fontWeight: '700' },

  // STATS
  heroStats: { flexDirection: 'row', gap: 0, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, width: '100%' },
  heroStat: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatEmoji: { fontSize: 20 },
  heroStatNb: { fontSize: 18, fontWeight: '900', color: C.white },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  // TÉMO
  temoWrap: { marginHorizontal: 20, marginTop: -16, marginBottom: 16 },
  temoCard: { backgroundColor: C.white, borderRadius: 24, padding: 18, shadowColor: '#667EEA', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: C.border },
  temoTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  temoAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  temoAvatarTxt: { color: C.white, fontSize: 18, fontWeight: '800' },
  temoPrenom: { fontSize: 14, fontWeight: '800', color: C.text },
  temoVille: { fontSize: 12, color: C.textLight, marginTop: 2 },
  temoTexte: { fontSize: 14, color: C.textMid, lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
  temoDots: { flexDirection: 'row', gap: 6 },
  temoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },

  // CARD
  card: { marginHorizontal: 20, backgroundColor: C.white, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 5, gap: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  cardSub: { fontSize: 14, color: C.textLight, marginTop: -8 },

  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: C.red + '40' },
  erreurTxt: { color: C.red, fontSize: 13, fontWeight: '700' },

  // FIELDS
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: C.border },
  fieldIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldInput: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  checkIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 4 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotTxt: { fontSize: 13, color: '#667EEA', fontWeight: '700' },

  // BTNS
  btnPrimary: { borderRadius: 18, overflow: 'hidden', shadowColor: '#667EEA', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnDemo: { borderRadius: 18, overflow: 'hidden' },
  btnGrad: { padding: 18, alignItems: 'center' },
  btnTxt: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },

  // DIVIDER
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerTxt: { color: C.textLight, fontSize: 11, fontWeight: '600' },

  // ACTIVITÉS GRID
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  activiteChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  activiteChipTxt: { fontSize: 12, fontWeight: '800' },

  // INSCRIPTION
  inscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  inscriptionTxt: { color: C.textLight, fontSize: 14 },
  inscriptionLien: { color: '#667EEA', fontSize: 14, fontWeight: '800' },
});