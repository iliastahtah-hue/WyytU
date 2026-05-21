import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TabBar from '../../components/TabBar';

export default function ProfilsScreen() {
  const router = useRouter();

  const profils = [
    {
      prenom: 'Sarah', age: 26, ville: 'Bruxelles', note: 4.8,
      activites: ['🏋️ Sport', '🎬 Cinéma', '🌿 Nature'],
      badges: ['⭐ Top ponctualité', '❤️ Bienveillant'], verifie: true,
    },
    {
      prenom: 'Karim', age: 31, ville: 'Tanger', note: 4.5,
      activites: ['⚽ Football', '🍽️ Restaurant', '🎵 Festival'],
      badges: ['🟢 Jamais annulé', '🔥 En feu'], verifie: true,
    },
    {
      prenom: 'Léa', age: 24, ville: 'Paris', note: 4.9,
      activites: ['🧘 Yoga', '🎨 Culture', '☕ Café'],
      badges: ['👑 Organisatrice', '💎 Premium'], verifie: true,
    },
    {
      prenom: 'Ahmed', age: 28, ville: 'Bruxelles', note: 4.3,
      activites: ['🏃 Running', '🎮 Loisirs', '✈️ Voyage'],
      badges: ['🌍 Explorateur'], verifie: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Partenaires 👥</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.activiteChoisie}>
          <Text style={styles.activiteTexte}>🏋️ Sport • 3 personnes • Aujourd'hui</Text>
        </View>

        {profils.map((profil, index) => (
          <View key={index} style={styles.profilCard}>
            <View style={styles.profilHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexte}>{profil.prenom[0]}</Text>
              </View>
              <View style={styles.profilInfo}>
                <View style={styles.profilNomRow}>
                  <Text style={styles.profilNom}>{profil.prenom}, {profil.age}</Text>
                  {profil.verifie && <Text style={styles.verifie}>✅ Vérifié</Text>}
                </View>
                <Text style={styles.profilVille}>📍 {profil.ville}</Text>
                <Text style={styles.profilNote}>⭐ {profil.note} / 5</Text>
              </View>
            </View>

            <View style={styles.activitesRow}>
              {profil.activites.map((activite, i) => (
                <View key={i} style={styles.activiteTag}>
                  <Text style={styles.activiteTagTexte}>{activite}</Text>
                </View>
              ))}
            </View>

            <View style={styles.badgesRow}>
              {profil.badges.map((badge, i) => (
                <View key={i} style={styles.badgeTag}>
                  <Text style={styles.badgeTagTexte}>{badge}</Text>
                </View>
              ))}
            </View>

            <View style={styles.boutonsRow}>
              <TouchableOpacity style={styles.boutonRefuser}>
                <Text style={styles.boutonRefuserTexte}>✕ Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.boutonAccepter}>
                <Text style={styles.boutonAccepterTexte}>✓ Accepter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  titre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  activiteChoisie: { backgroundColor: '#EEE8DE', marginHorizontal: 20, marginBottom: 16, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  activiteTexte: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  profilCard: { backgroundColor: '#EEE8DE', marginHorizontal: 20, marginBottom: 16, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#DDD4C4' },
  profilHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTexte: { color: '#fff', fontSize: 24, fontWeight: '800' },
  profilInfo: { flex: 1 },
  profilNomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profilNom: { color: '#1A1A1A', fontSize: 18, fontWeight: '800' },
  verifie: { fontSize: 12, color: '#1DB954' },
  profilVille: { color: '#AAA', fontSize: 13, marginTop: 2 },
  profilNote: { color: '#FF9500', fontSize: 14, fontWeight: '700', marginTop: 2 },
  activitesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  activiteTag: { backgroundColor: '#FAF7F2', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#DDD4C4' },
  activiteTagTexte: { color: '#1A1A1A', fontSize: 11 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  badgeTag: { backgroundColor: '#F0FFF4', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#1DB954' },
  badgeTagTexte: { color: '#1DB954', fontSize: 11, fontWeight: '700' },
  boutonsRow: { flexDirection: 'row', gap: 10 },
  boutonRefuser: { flex: 1, backgroundColor: 'transparent', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#FF4444' },
  boutonRefuserTexte: { color: '#FF4444', fontWeight: '700', fontSize: 15 },
  boutonAccepter: { flex: 1, backgroundColor: '#1DB954', borderRadius: 12, padding: 12, alignItems: 'center' },
  boutonAccepterTexte: { color: '#fff', fontWeight: '700', fontSize: 15 },
});