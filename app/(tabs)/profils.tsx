import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const C = {
  bg: '#FAF7F2',
  beige: '#EEE8DE',
  brown: '#1A1209',
  brownMid: '#5C4A2A',
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  white: '#FFFFFF',
  gray: '#8A7F72',
  grayLight: '#F0EDE8',
  red: '#E8000D',
  green: '#1DB954',
  purple: '#7B2FBE',
};

type Utilisateur = {
  id: string;
  prenom: string;
  email: string;
  ville: string;
  bio?: string;
  note_moyenne: number;
  age?: number;
  activites_favorites?: string;
};

const AVIS_DEMO = [
  { id: '1', noteur_prenom: 'Youssef', note: 5, commentaire_public: 'Franchement wallah un vrai plaisir de faire un plan avec lui. Ponctuel, sympa, et toujours de bonne humeur. Je recommande à 100% !', titre_activite: 'Foot à 5 — Tanger City', date: '15 Mai 2025', couleur: '#E8000D' },
  { id: '2', noteur_prenom: 'Mehdi', note: 5, commentaire_public: 'Top personne, très respectueux et sérieux. Il est venu à l\'heure, bonne ambiance tout au long de la soirée. On refera ça bientôt inshallah 🙏', titre_activite: 'Soirée Rooftop — Casablanca', date: '2 Avril 2025', couleur: '#7B2FBE' },
  { id: '3', noteur_prenom: 'Amine', note: 4, commentaire_public: 'Très bon plan, bien organisé. Quelqu\'un de fiable et de classe. Hâte de refaire un plan ensemble !', titre_activite: 'Brunch Médina — Marrakech', date: '18 Mars 2025', couleur: '#FF6A00' },
  { id: '4', noteur_prenom: 'Karim', note: 5, commentaire_public: 'Machi 3adi, vraiment quelqu\'un de bien. Il a géré le groupe parfaitement, tout le monde était content. C\'est le genre de personne qui donne envie de sortir plus souvent !', titre_activite: 'Gaming Night — Rabat', date: '5 Février 2025', couleur: '#0070F3' },
  { id: '5', noteur_prenom: 'Hamza', note: 5, commentaire_public: 'Sérieux et authentique. J\'ai adoré le plan qu\'il a organisé, tout était bien pensé. Une vraie valeur ajoutée pour l\'app WyytU 💯', titre_activite: 'Randonnée Rif — Chefchaouen', date: '20 Janvier 2025', couleur: '#00897B' },
  { id: '6', noteur_prenom: 'Salim', note: 5, commentaire_public: 'Bghit ngoul rah bonne personne vraiment. Très à l\'écoute, il s\'assure que tout le monde passe un bon moment. Je l\'ai noté 5 étoiles sans hésiter !', titre_activite: 'Concert Live — Tanger', date: '8 Décembre 2024', couleur: '#1DB954' },
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

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  const note = 4.9;
  const prenom = utilisateur?.prenom || 'Utilisateur';
  const initiale = prenom[0]?.toUpperCase();

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HERO ── */}
        <View style={s.hero}>
          {/* Fond beige chaud avec accent doré */}
          <LinearGradient
            colors={['#F5EDD8', '#FAF7F2', C.bg]}
            style={s.heroBg}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={s.heroAccent} />

          {/* Header */}
          <View style={s.heroHeader}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={s.heroLabel}>Profil</Text>
            <TouchableOpacity style={s.shareBtn}>
              <Text style={{ fontSize: 18 }}>↗️</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <LinearGradient colors={[C.goldLight, C.gold]} style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Text style={s.avatarInit}>{initiale}</Text>
              </View>
            </LinearGradient>
            <View style={s.onlineDot} />
          </View>

          <Text style={s.nom}>{prenom}</Text>
          {utilisateur?.age && <Text style={s.age}>{utilisateur.age} ans</Text>}
          <Text style={s.ville}>📍 {utilisateur?.ville || 'Tanger, Maroc'}</Text>

          {/* Étoiles */}
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={[s.star, { color: i <= 5 ? '#FF9500' : C.beige }]}>★</Text>
            ))}
            <Text style={s.noteTxt}>{note}</Text>
          </View>

          {/* Badges */}
          <View style={s.badgesRow}>
            <View style={s.badgeGreen}><Text style={s.badgeGreenTxt}>✅ Vérifié</Text></View>
            <View style={s.badgeGold}><Text style={s.badgeGoldTxt}>⭐ Top membre</Text></View>
            <View style={s.badgeRed}><Text style={s.badgeRedTxt}>🔥 {AVIS_DEMO.length} avis</Text></View>
          </View>
        </View>

        {/* ── STATS ── */}
        <View style={s.statsRow}>
          {[
            { val: '12', label: 'Plans', featured: false },
            { val: '4.9', label: 'Note ⭐', featured: true },
            { val: '6', label: 'Avis', featured: false },
          ].map((st, i) => (
            <View key={i} style={[s.statCard, st.featured && s.statFeatured]}>
              <Text style={[s.statVal, st.featured && { color: C.red }]}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── BIO ── */}
        {utilisateur?.bio && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>À propos</Text>
            <View style={s.bioCard}>
              <Text style={s.bioTxt}>"{utilisateur.bio}"</Text>
            </View>
          </View>
        )}

        {/* ── AVIS ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>⭐ Avis des leaders</Text>
            <View style={s.avisBadge}>
              <Text style={s.avisBadgeTxt}>{AVIS_DEMO.length} avis</Text>
            </View>
          </View>

          {/* Moyenne */}
          <View style={s.moyenneCard}>
            <View style={s.moyenneLeft}>
              <Text style={s.moyenneNote}>4.9</Text>
              <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Text key={i} style={{ fontSize: 16, color: '#FF9500' }}>★</Text>
                ))}
              </View>
              <Text style={s.moyenneSub}>sur 5 · {AVIS_DEMO.length} avis</Text>
            </View>
            <View style={s.moyenneRight}>
              {[5,4,3,2,1].map(n => {
                const count = AVIS_DEMO.filter(a => a.note === n).length;
                const pct = (count / AVIS_DEMO.length) * 100;
                return (
                  <View key={n} style={s.barreRow}>
                    <Text style={s.barreLabel}>{n}★</Text>
                    <View style={s.barreBg}>
                      <View style={[s.barreFill, {
                        width: `${pct}%` as any,
                        backgroundColor: n >= 4 ? C.green : n === 3 ? '#FF9500' : C.red
                      }]} />
                    </View>
                    <Text style={s.barreCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Liste avis */}
          {AVIS_DEMO.map(avis => (
            <View key={avis.id} style={s.avisCard}>
              <View style={s.avisHeader}>
                <View style={[s.avisAvatar, { backgroundColor: avis.couleur }]}>
                  <Text style={s.avisAvatarTxt}>{avis.noteur_prenom[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.avisNomRow}>
                    <Text style={s.avisNom}>{avis.noteur_prenom}</Text>
                    <View style={s.leaderBadge}>
                      <Text style={s.leaderBadgeTxt}>👑 Leader vérifié</Text>
                    </View>
                  </View>
                  <Text style={s.avisActivite}>via "{avis.titre_activite}"</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                  {[1,2,3,4,5].map(i => (
                    <Text key={i} style={{ fontSize: 12, color: i <= avis.note ? '#FF9500' : C.beige }}>★</Text>
                  ))}
                </View>
              </View>

              <View style={s.avisBody}>
                <Text style={s.guillemet}>"</Text>
                <Text style={s.avisTxt}>{avis.commentaire_public}</Text>
                <Text style={s.guillemet}>"</Text>
              </View>

              <View style={s.avisFooter}>
                <Text style={s.avisDate}>{avis.date}</Text>
                <View style={[s.avisColor, { backgroundColor: avis.couleur + '20', borderColor: avis.couleur + '40' }]}>
                  <Text style={[s.avisColorTxt, { color: avis.couleur }]}>{avis.titre_activite.split('—')[0].trim()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── CTA CONTACTER ── */}
        <View style={s.ctaWrap}>
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient colors={[C.brown, '#2C1F0A']} style={s.ctaBtn}>
              <Text style={s.ctaBtnTxt}>💬 Envoyer un message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  // HERO
  hero: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroAccent: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: C.gold, opacity: 0.07, top: -120, right: -80 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(26,18,9,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(26,18,9,0.08)' },
  backIcon: { fontSize: 20, color: C.brown, fontWeight: '700' },
  heroLabel: { fontSize: 16, fontWeight: '800', color: C.brown },
  shareBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(26,18,9,0.06)', alignItems: 'center', justifyContent: 'center' },

  // AVATAR
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarRing: { padding: 3, borderRadius: 62, shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  avatarInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { color: C.white, fontSize: 46, fontWeight: '900' },
  onlineDot: { position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: C.green, borderWidth: 2.5, borderColor: C.white },

  nom: { fontSize: 28, fontWeight: '900', color: C.brown, letterSpacing: -0.5, marginBottom: 4 },
  age: { fontSize: 14, color: C.gray, marginBottom: 4 },
  ville: { fontSize: 14, color: C.gray, marginBottom: 12 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 14 },
  star: { fontSize: 20 },
  noteTxt: { fontSize: 15, fontWeight: '800', color: C.brown, marginLeft: 8 },

  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badgeGreen: { backgroundColor: '#1DB95418', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1DB954' },
  badgeGreenTxt: { color: C.green, fontSize: 12, fontWeight: '700' },
  badgeGold: { backgroundColor: '#C9A84C18', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: C.gold },
  badgeGoldTxt: { color: C.gold, fontSize: 12, fontWeight: '700' },
  badgeRed: { backgroundColor: '#E8000D18', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: C.red },
  badgeRedTxt: { color: C.red, fontSize: 12, fontWeight: '700' },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 22, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statFeatured: { borderWidth: 2, borderColor: C.red },
  statVal: { fontSize: 22, fontWeight: '900', color: C.brown },
  statLabel: { color: C.gray, fontSize: 11, marginTop: 4, fontWeight: '600' },

  // SECTION
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.brown, marginBottom: 12, letterSpacing: -0.3 },
  avisBadge: { backgroundColor: C.red, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  avisBadgeTxt: { color: C.white, fontSize: 12, fontWeight: '700' },

  // BIO
  bioCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bioTxt: { color: C.brownMid, fontSize: 14, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },

  // MOYENNE
  moyenneCard: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  moyenneLeft: { alignItems: 'center', justifyContent: 'center' },
  moyenneNote: { fontSize: 42, fontWeight: '900', color: C.brown },
  moyenneSub: { fontSize: 11, color: C.gray, fontWeight: '600' },
  moyenneRight: { flex: 1, justifyContent: 'center', gap: 6 },
  barreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barreLabel: { fontSize: 11, color: C.gray, width: 20, fontWeight: '600' },
  barreBg: { flex: 1, height: 6, backgroundColor: C.beige, borderRadius: 3, overflow: 'hidden' },
  barreFill: { height: 6, borderRadius: 3 },
  barreCount: { fontSize: 11, color: C.gray, width: 16, textAlign: 'right' },

  // AVIS
  avisCard: { backgroundColor: C.white, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avisHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avisAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avisAvatarTxt: { color: C.white, fontSize: 20, fontWeight: '800' },
  avisNomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  avisNom: { fontSize: 15, fontWeight: '800', color: C.brown },
  leaderBadge: { backgroundColor: '#7B2FBE15', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: C.purple },
  leaderBadgeTxt: { color: C.purple, fontSize: 10, fontWeight: '700' },
  avisActivite: { fontSize: 11, color: C.gray },
  avisBody: { backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 6 },
  guillemet: { fontSize: 22, color: C.beige, fontWeight: '900', lineHeight: 26 },
  avisTxt: { flex: 1, fontSize: 14, color: C.brownMid, lineHeight: 22, fontStyle: 'italic' },
  avisFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avisDate: { fontSize: 11, color: '#BBB', fontWeight: '500' },
  avisColor: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  avisColorTxt: { fontSize: 10, fontWeight: '700' },

  // CTA
  ctaWrap: { paddingHorizontal: 20, marginBottom: 20 },
  ctaBtn: { borderRadius: 20, padding: 18, alignItems: 'center' },
  ctaBtnTxt: { color: C.white, fontSize: 16, fontWeight: '800' },
});