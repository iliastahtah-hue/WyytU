import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TabBar from '../../components/TabBar';
import { supabase } from '../../lib/supabase';

type Utilisateur = {
  id: string;
  prenom: string;
  email: string;
  ville: string;
  bio?: string;
  note_moyenne: number;
  age?: number;
  activites_favorites?: string;
  langues?: string;
  situation?: string;
  personnalite?: string;
};

const AVIS_DEMO = [
  {
    id: '1',
    noteur_prenom: 'Youssef',
    note: 5,
    commentaire_public: 'Franchement wallah un vrai plaisir de faire un plan avec lui. Ponctuel, sympa, et toujours de bonne humeur. Je recommande à 100% !',
    titre_activite: 'Foot à 5 — Tanger City',
    date: '15 Mai 2025',
    couleur: '#E8000D',
  },
  {
    id: '2',
    noteur_prenom: 'Mehdi',
    note: 5,
    commentaire_public: 'Top personne, très respectueux et sérieux. Il est venu à l\'heure, bonne ambiance tout au long de la soirée. On refera ça bientôt inshallah 🙏',
    titre_activite: 'Soirée Rooftop — Casablanca',
    date: '2 Avril 2025',
    couleur: '#7B2FBE',
  },
  {
    id: '3',
    noteur_prenom: 'Amine',
    note: 4,
    commentaire_public: 'Très bon plan, bien organisé. Quelqu\'un de fiable et de classe. Hâte de refaire un plan ensemble !',
    titre_activite: 'Brunch Médina — Marrakech',
    date: '18 Mars 2025',
    couleur: '#FF6A00',
  },
  {
    id: '4',
    noteur_prenom: 'Karim',
    note: 5,
    commentaire_public: 'Machi 3adi, vraiment quelqu\'un de bien. Il a géré le groupe parfaitement, tout le monde était content. C\'est le genre de personne qui donne envie de sortir plus souvent !',
    titre_activite: 'Gaming Night — Rabat',
    date: '5 Février 2025',
    couleur: '#0070F3',
  },
  {
    id: '5',
    noteur_prenom: 'Hamza',
    note: 5,
    commentaire_public: 'Sérieux et authentique. J\'ai adoré le plan qu\'il a organisé, tout était bien pensé. Une vraie valeur ajoutée pour l\'app WyytU 💯',
    titre_activite: 'Randonnée Rif — Chefchaouen',
    date: '20 Janvier 2025',
    couleur: '#00897B',
  },
  {
    id: '6',
    noteur_prenom: 'Salim',
    note: 5,
    commentaire_public: 'Bghit ngoul rah bonne personne vraiment. Très à l\'écoute, il s\'assure que tout le monde passe un bon moment. Je l\'ai noté 5 étoiles sans hésiter !',
    titre_activite: 'Concert Live — Tanger',
    date: '8 Décembre 2024',
    couleur: '#1DB954',
  },
];

export default function ProfilUtilisateurScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { chargerProfil(); }, []);

  const chargerProfil = async () => {
    try {
      const { data } = await supabase.from('utilisateurs').select('*').eq('id', id).single();
      if (data) setUtilisateur(data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const renderEtoiles = (note: number) => [1,2,3,4,5].map((s) => (
    <Text key={s} style={[styles.etoile, { color: s <= note ? '#FF9500' : '#EEE8DE' }]}>★</Text>
  ));

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E8000D" /></View>;
  }

  const note = utilisateur?.note_moyenne || 4.9;
  const prenom = utilisateur?.prenom || 'Utilisateur';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroBg} />
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBorder}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarTexte}>{prenom[0]?.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.nom}>{prenom}</Text>
          {utilisateur?.age && <Text style={styles.age}>{utilisateur.age} ans</Text>}
          <Text style={styles.ville}>📍 {utilisateur?.ville || 'Tanger, Maroc'}</Text>

          <View style={styles.noteRow}>
            {renderEtoiles(5)}
            <Text style={styles.noteTexte}>4.9</Text>
          </View>

          <View style={styles.quickBadges}>
            <View style={styles.badge1}><Text style={styles.badge1Texte}>✅ Vérifié</Text></View>
            <View style={styles.badge2}><Text style={styles.badge2Texte}>⭐ Top membre</Text></View>
            <View style={styles.badge3}><Text style={styles.badge3Texte}>🔥 6 avis</Text></View>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNombre}>12</Text>
            <Text style={styles.statLabel}>Plans</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCenter]}>
            <Text style={[styles.statNombre, { color: '#E8000D' }]}>4.9</Text>
            <Text style={styles.statLabel}>Note ⭐</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNombre}>6</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
        </View>

        {/* BIO */}
        {utilisateur?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>À propos</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioTexte}>"{utilisateur.bio}"</Text>
            </View>
          </View>
        )}

        {/* AVIS DES LEADERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitre}>⭐ Avis des leaders</Text>
            <View style={styles.avisCountBadge}>
              <Text style={styles.avisCountTexte}>{AVIS_DEMO.length} avis</Text>
            </View>
          </View>

          {/* MOYENNE VISUELLE */}
          <View style={styles.moyenneCard}>
            <View style={styles.moyenneGauche}>
              <Text style={styles.moyenneNote}>4.9</Text>
              <View style={styles.moyenneEtoiles}>
                {renderEtoiles(5)}
              </View>
              <Text style={styles.moyenneSub}>sur 5 · {AVIS_DEMO.length} avis</Text>
            </View>
            <View style={styles.moyenneDroite}>
              {[5, 4, 3, 2, 1].map((n) => {
                const count = AVIS_DEMO.filter((a) => a.note === n).length;
                const pct = (count / AVIS_DEMO.length) * 100;
                return (
                  <View key={n} style={styles.barreRow}>
                    <Text style={styles.barreLabel}>{n}★</Text>
                    <View style={styles.barreBg}>
                      <View style={[styles.barreFill, { width: `${pct}%` as any, backgroundColor: n >= 4 ? '#1DB954' : n === 3 ? '#FF9500' : '#E8000D' }]} />
                    </View>
                    <Text style={styles.barreCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* LISTE AVIS */}
          {AVIS_DEMO.map((avis) => (
            <View key={avis.id} style={styles.avisCard}>
              <View style={styles.avisHeader}>
                <View style={[styles.avisAvatar, { backgroundColor: avis.couleur }]}>
                  <Text style={styles.avisAvatarTexte}>{avis.noteur_prenom[0]}</Text>
                </View>
                <View style={styles.avisInfo}>
                  <View style={styles.avisNomRow}>
                    <Text style={styles.avisNom}>{avis.noteur_prenom}</Text>
                    <View style={styles.leaderBadge}>
                      <Text style={styles.leaderBadgeTexte}>👑 Leader vérifié</Text>
                    </View>
                  </View>
                  <Text style={styles.avisActivite}>via "{avis.titre_activite}"</Text>
                </View>
                <View style={styles.avisNoteRow}>
                  {renderEtoiles(avis.note)}
                </View>
              </View>

              <View style={styles.avisCommentaire}>
                <Text style={styles.guillemet}>"</Text>
                <Text style={styles.avisTexte}>{avis.commentaire_public}</Text>
                <Text style={styles.guillemet}>"</Text>
              </View>

              <Text style={styles.avisDate}>{avis.date}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2' },

  // HERO
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, position: 'relative' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 210, backgroundColor: '#1A1A1A', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff' },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarBorder: { padding: 4, borderRadius: 60, backgroundColor: '#E8000D' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { color: '#fff', fontSize: 40, fontWeight: '900' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#1DB954', borderWidth: 2, borderColor: '#fff' },
  nom: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 2 },
  age: { fontSize: 14, color: '#AAA', marginBottom: 4 },
  ville: { fontSize: 14, color: '#AAA', marginBottom: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 14 },
  etoile: { fontSize: 20 },
  noteTexte: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginLeft: 8 },
  quickBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge1: { backgroundColor: '#1DB95422', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1DB954' },
  badge1Texte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },
  badge2: { backgroundColor: '#FF950022', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#FF9500' },
  badge2Texte: { color: '#FF9500', fontSize: 12, fontWeight: '700' },
  badge3: { backgroundColor: '#E8000D22', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8000D' },
  badge3Texte: { color: '#E8000D', fontSize: 12, fontWeight: '700' },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 20, marginTop: -8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statCardCenter: { borderWidth: 2, borderColor: '#E8000D' },
  statNombre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4, fontWeight: '600' },

  // SECTION
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 12, letterSpacing: -0.3 },
  avisCountBadge: { backgroundColor: '#E8000D', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  avisCountTexte: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // BIO
  bioCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bioTexte: { color: '#555', fontSize: 14, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },

  // MOYENNE
  moyenneCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  moyenneGauche: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  moyenneNote: { fontSize: 42, fontWeight: '900', color: '#1A1A1A' },
  moyenneEtoiles: { flexDirection: 'row', gap: 2 },
  moyenneSub: { fontSize: 11, color: '#AAA', fontWeight: '600' },
  moyenneDroite: { flex: 1, justifyContent: 'center', gap: 6 },
  barreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barreLabel: { fontSize: 11, color: '#AAA', width: 20, fontWeight: '600' },
  barreBg: { flex: 1, height: 6, backgroundColor: '#EEE8DE', borderRadius: 3, overflow: 'hidden' },
  barreFill: { height: 6, borderRadius: 3 },
  barreCount: { fontSize: 11, color: '#AAA', width: 16, textAlign: 'right' },

  // AVIS
  avisCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avisHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avisAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avisAvatarTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  avisInfo: { flex: 1 },
  avisNomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  avisNom: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  leaderBadge: { backgroundColor: '#7B2FBE22', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: '#7B2FBE' },
  leaderBadgeTexte: { color: '#7B2FBE', fontSize: 10, fontWeight: '700' },
  avisActivite: { fontSize: 11, color: '#AAA', marginTop: 2 },
  avisNoteRow: { flexDirection: 'row', gap: 1 },
  avisCommentaire: { backgroundColor: '#FAF7F2', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 6 },
  guillemet: { fontSize: 22, color: '#DDD4C4', fontWeight: '900', lineHeight: 26 },
  avisTexte: { flex: 1, fontSize: 14, color: '#555', lineHeight: 22, fontStyle: 'italic' },
  avisDate: { fontSize: 11, color: '#BBB', textAlign: 'right', fontWeight: '500' },
});