import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  const activites = [
    { emoji: '⚡', label: 'Sport', couleur: '#E8000D' },
    { emoji: '🍕', label: 'Resto', couleur: '#FF6A00' },
    { emoji: '🎉', label: 'Soirée', couleur: '#7B2FBE' },
    { emoji: '🎮', label: 'Gaming', couleur: '#0070F3' },
    { emoji: '✈️', label: 'Voyage', couleur: '#00B4D8' },
    { emoji: '🎵', label: 'Musique', couleur: '#1DB954' },
  ];

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <View style={styles.top}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoLettre}>W</Text>
        </View>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.slogan}>Organise tes plans entre amis ✦</Text>
      </View>

      {/* CARDS ACTIVITES */}
      <View style={styles.activitesSection}>
        <Text style={styles.activitesTitre}>Qu'est-ce qu'on fait ce soir ?</Text>
        <View style={styles.activitesGrid}>
          {activites.map((act, i) => (
            <View key={i} style={[styles.activiteCard, { backgroundColor: act.couleur }]}>
              <Text style={styles.activiteEmoji}>{act.emoji}</Text>
              <Text style={styles.activiteLabel}>{act.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FEATURES */}
      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureTexte}>Profils 100% vérifiés</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureTexte}>Chat en temps réel</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureTexte}>Plans près de chez toi</Text>
        </View>
      </View>

      {/* BOUTONS */}
      <View style={styles.boutons}>
        <TouchableOpacity
          style={styles.boutonPrimary}
          onPress={() => router.push('/inscription')}>
          <Text style={styles.boutonPrimaryTexte}>Commencer gratuitement 🚀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonSecondary}
          onPress={() => router.push('/connexion')}>
          <Text style={styles.boutonSecondaryTexte}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>Des milliers de plans organisés chaque jour 🔥</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  top: { alignItems: 'center', marginBottom: 32 },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#E8000D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#E8000D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  logoLettre: { color: '#fff', fontSize: 40, fontWeight: '800' },
  logo: { fontSize: 36, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 8 },
  slogan: { fontSize: 15, color: '#AAA', fontStyle: 'italic' },

  activitesSection: { width: '100%', marginBottom: 28 },
  activitesTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, textAlign: 'center' },
  activitesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  activiteCard: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  activiteEmoji: { fontSize: 16 },
  activiteLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },

  features: { width: '100%', backgroundColor: '#EEE8DE', borderRadius: 20, padding: 18, marginBottom: 28, borderWidth: 1, borderColor: '#DDD4C4', gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1DB954' },
  featureTexte: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  boutons: { width: '100%', gap: 12, marginBottom: 20 },
  boutonPrimary: {
    backgroundColor: '#E8000D',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#E8000D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  boutonPrimaryTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
  boutonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD4C4',
  },
  boutonSecondaryTexte: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },

  footer: { fontSize: 12, color: '#AAA', textAlign: 'center' },
});