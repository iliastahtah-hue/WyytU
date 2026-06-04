import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ACTIVITES = [
  { emoji: '⚡', label: 'Sport', couleur: '#E8000D' },
  { emoji: '🍕', label: 'Resto', couleur: '#FF6A00' },
  { emoji: '🎉', label: 'Soirée', couleur: '#7B2FBE' },
  { emoji: '🎮', label: 'Gaming', couleur: '#0070F3' },
  { emoji: '✈️', label: 'Voyage', couleur: '#00B4D8' },
  { emoji: '🎵', label: 'Musique', couleur: '#1DB954' },
  { emoji: '🎬', label: 'Ciné', couleur: '#CC0000' },
  { emoji: '🏃', label: 'Bien-être', couleur: '#00897B' },
];

const TEMOIGNAGES = [
  { prenom: 'Youssef', ville: 'Tanger', texte: 'J\'ai trouvé mon crew en 10 min. Incroyable !', couleur: '#E8000D', emoji: '⚽' },
  { prenom: 'Léa', ville: 'Bruxelles', texte: 'Nouvelle en ville, j\'ai sorti dès le premier soir 🔥', couleur: '#7B2FBE', emoji: '🎉' },
  { prenom: 'Mehdi', ville: 'Casablanca', texte: 'Le concept est génial, simple et efficace !', couleur: '#0070F3', emoji: '🎮' },
  { prenom: 'Sara', ville: 'Paris', texte: 'J\'adore ! J\'ai fait des rencontres incroyables.', couleur: '#1DB954', emoji: '🏃' },
];

const STATS = [
  { nombre: '2,400+', label: 'Membres', emoji: '👥' },
  { nombre: '890+', label: 'Plans/jour', emoji: '🎯' },
  { nombre: '4.9★', label: 'Note', emoji: '⭐' },
  { nombre: '12+', label: 'Villes', emoji: '🌍' },
];

const FEATURES = [
  { emoji: '✅', titre: 'Vérifié', desc: 'Chaque membre est vérifié par selfie' },
  { emoji: '🟢', titre: 'Dispo now', desc: 'Trouve quelqu\'un en moins de 2 min' },
  { emoji: '👑', titre: 'Réputation', desc: 'Avis des leaders après chaque sortie' },
  { emoji: '🔒', titre: 'Sécurisé', desc: 'Données 100% protégées' },
];

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [temoIndex, setTemoIndex] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      setTemoIndex((prev) => (prev + 1) % TEMOIGNAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>

      {/* ═══ HERO ═══ */}
      <View style={styles.hero}>
        {/* BG CERCLES */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        {/* LOGO ANIMÉ */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.logoW}>W</Text>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeTexte}>🔥</Text>
            </View>
          </Animated.View>
          <Text style={styles.logo}>WyytU</Text>
          <Text style={styles.tagline}>Trouve ton prochain plan{'\n'}en moins de 2 minutes ⚡</Text>
        </Animated.View>

        {/* SOCIAL PROOF */}
        <Animated.View style={[styles.socialProof, { opacity: fadeAnim }]}>
          <View style={styles.avatarsRow}>
            {['Y', 'M', 'A', 'K', 'S', 'H'].map((l, i) => (
              <View key={i} style={[styles.miniAvatar, {
                backgroundColor: ['#E8000D', '#7B2FBE', '#0070F3', '#1DB954', '#FF6A00', '#00B4D8'][i],
                marginLeft: i > 0 ? -10 : 0,
                zIndex: 6 - i,
              }]}>
                <Text style={styles.miniAvatarTexte}>{l}</Text>
              </View>
            ))}
          </View>
          <View>
            <Text style={styles.socialProofNombre}>2,400+ membres actifs</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineTexte}>127 dispos maintenant</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ═══ STATS ═══ */}
      <View style={styles.statsRow}>
        {STATS.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statNombre}>{s.nombre}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ═══ ACTIVITÉS ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Qu'est-ce qu'on fait ? 🎯</Text>
        <Text style={styles.sectionSub}>8 catégories d'activités disponibles</Text>
        <View style={styles.activitesGrid}>
          {ACTIVITES.map((act, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.activiteCard, { backgroundColor: act.couleur }]}
              onPress={() => router.push('/inscription' as any)}
              activeOpacity={0.85}>
              <Text style={styles.activiteEmoji}>{act.emoji}</Text>
              <Text style={styles.activiteLabel}>{act.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ═══ COMMENT ÇA MARCHE ═══ */}
      <View style={styles.howSection}>
        <Text style={styles.sectionTitre}>Comment ça marche ? 🤔</Text>
        <View style={styles.stepsRow}>
          {[
            { num: '1', titre: 'Crée ton profil', desc: 'Vérifié en 30 sec', emoji: '👤', couleur: '#E8000D' },
            { num: '2', titre: 'Trouve un plan', desc: 'Près de chez toi', emoji: '🎯', couleur: '#7B2FBE' },
            { num: '3', titre: 'Rejoins & profite', desc: 'C\'est aussi simple !', emoji: '🔥', couleur: '#1DB954' },
          ].map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={[styles.stepNum, { backgroundColor: step.couleur }]}>
                <Text style={styles.stepNumTexte}>{step.num}</Text>
              </View>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <Text style={styles.stepTitre}>{step.titre}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ═══ FEATURES ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Pourquoi WyytU ? ✨</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureCard, { borderTopColor: ['#E8000D', '#1DB954', '#7B2FBE', '#0070F3'][i] }]}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureTitre}>{f.titre}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Ils en parlent 🙌</Text>
        <View style={[styles.temoCard, { borderLeftColor: TEMOIGNAGES[temoIndex].couleur }]}>
          <View style={styles.temoHeader}>
            <View style={[styles.temoAvatar, { backgroundColor: TEMOIGNAGES[temoIndex].couleur }]}>
              <Text style={styles.temoAvatarTexte}>{TEMOIGNAGES[temoIndex].prenom[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.temoPrenom}>{TEMOIGNAGES[temoIndex].prenom}</Text>
              <Text style={styles.temoVille}>📍 {TEMOIGNAGES[temoIndex].ville}</Text>
            </View>
            <Text style={styles.temoEmoji}>{TEMOIGNAGES[temoIndex].emoji}</Text>
          </View>
          <Text style={styles.temoTexte}>"{TEMOIGNAGES[temoIndex].texte}"</Text>
          <View style={styles.temoEtoiles}>
            {[1,2,3,4,5].map((s) => <Text key={s} style={styles.temoEtoile}>★</Text>)}
          </View>
        </View>

        {/* INDICATEURS */}
        <View style={styles.indicators}>
          {TEMOIGNAGES.map((_, i) => (
            <View key={i} style={[styles.indicator, i === temoIndex && styles.indicatorActive]} />
          ))}
        </View>
      </View>

      {/* ═══ CTA ═══ */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBg} />
        <Text style={styles.ctaTitre}>Prêt à sortir ? 🎯</Text>
        <Text style={styles.ctaSub}>Rejoins +2,400 personnes{'\n'}qui profitent de la vie</Text>

        <TouchableOpacity
          style={styles.boutonPrimary}
          onPress={() => router.push('/inscription' as any)}
          activeOpacity={0.85}>
          <Text style={styles.boutonPrimaryTexte}>🚀 Commencer gratuitement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonSecondary}
          onPress={() => router.push('/connexion' as any)}
          activeOpacity={0.85}>
          <Text style={styles.boutonSecondaryTexte}>J'ai déjà un compte →</Text>
        </TouchableOpacity>

        <Text style={styles.ctaNote}>✅ Gratuit · ✅ Vérifié · ✅ Sans engagement</Text>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>© 2025 WyytU · Tanger · Bruxelles · Casablanca</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  // HERO
  hero: { minHeight: height * 0.55, backgroundColor: '#0D0D0D', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', justifyContent: 'center', paddingTop: 70, paddingBottom: 36, paddingHorizontal: 24, overflow: 'hidden', position: 'relative' },
  bgCircle1: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#E8000D', opacity: 0.1, top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#7B2FBE', opacity: 0.07, bottom: -60, left: -60 },
  bgCircle3: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#0070F3', opacity: 0.05, top: 100, left: 20 },

  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoWrapper: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#E8000D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12, position: 'relative' },
  logoW: { color: '#fff', fontSize: 50, fontWeight: '900' },
  logoBadge: { position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF9500', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0D0D0D' },
  logoBadgeTexte: { fontSize: 14 },
  logo: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -2, marginBottom: 10 },
  tagline: { fontSize: 17, color: 'rgba(255,255,255,0.6)', fontWeight: '500', textAlign: 'center', lineHeight: 26 },

  socialProof: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, paddingVertical: 12, paddingHorizontal: 18, marginTop: 8 },
  avatarsRow: { flexDirection: 'row' },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0D0D0D' },
  miniAvatarTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  socialProofNombre: { color: '#fff', fontSize: 13, fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1DB954' },
  onlineTexte: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginTop: 20, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNombre: { fontSize: 16, fontWeight: '900', color: '#E8000D', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, color: '#AAA', fontWeight: '600', marginTop: 2 },

  // SECTION
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 4 },
  sectionSub: { fontSize: 14, color: '#AAA', marginBottom: 16 },

  // ACTIVITÉS
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activiteCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  activiteEmoji: { fontSize: 20 },
  activiteLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // HOW IT WORKS
  howSection: { paddingHorizontal: 20, marginTop: 28 },
  stepsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stepCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepNumTexte: { color: '#fff', fontSize: 13, fontWeight: '900' },
  stepEmoji: { fontSize: 28 },
  stepTitre: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  stepDesc: { fontSize: 10, color: '#AAA', textAlign: 'center' },

  // FEATURES
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  featureCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, width: '47%', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  featureEmoji: { fontSize: 28, marginBottom: 8 },
  featureTitre: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  featureDesc: { fontSize: 11, color: '#AAA', lineHeight: 16 },

  // TÉMOIGNAGES
  temoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginTop: 16 },
  temoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  temoAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  temoAvatarTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  temoPrenom: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  temoVille: { fontSize: 12, color: '#AAA', marginTop: 2 },
  temoEmoji: { fontSize: 28 },
  temoTexte: { fontSize: 15, color: '#555', lineHeight: 24, fontStyle: 'italic', marginBottom: 12 },
  temoEtoiles: { flexDirection: 'row', gap: 3 },
  temoEtoile: { color: '#FF9500', fontSize: 16 },
  indicators: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 14 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD4C4' },
  indicatorActive: { width: 20, backgroundColor: '#E8000D' },

  // CTA
  ctaSection: { marginHorizontal: 20, marginTop: 28, borderRadius: 32, padding: 28, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  ctaBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1A1A1A' },
  ctaTitre: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  ctaSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },
  boutonPrimary: { width: '100%', backgroundColor: '#E8000D', borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6, marginBottom: 12 },
  boutonPrimaryTexte: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  boutonSecondary: { width: '100%', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  boutonSecondaryTexte: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  ctaNote: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  footer: { color: '#AAA', fontSize: 11, textAlign: 'center', marginTop: 20 },
});