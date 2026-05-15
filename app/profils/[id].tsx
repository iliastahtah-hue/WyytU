import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Utilisateur = {
  id: string;
  prenom: string;
  email: string;
  ville: string;
  note_moyenne: number;
  bio?: string;
  age?: number;
  couleur_preferee?: string;
  activites_favorites?: string;
  langues?: string;
  situation?: string;
  personnalite?: string;
};

type Activite = {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  date: string;
};

const CATEGORIES: Record<string, { couleur1: string; emoji: string }> = {
  Sport: { couleur1: '#E8000D', emoji: '⚡' },
  Resto: { couleur1: '#FF6A00', emoji: '🍕' },
  Ciné: { couleur1: '#CC0000', emoji: '🎬' },
  Soirée: { couleur1: '#7B2FBE', emoji: '🎉' },
  Gaming: { couleur1: '#0070F3', emoji: '🎮' },
  Voyage: { couleur1: '#00B4D8', emoji: '✈️' },
  Musique: { couleur1: '#1DB954', emoji: '🎵' },
  'Bien-être': { couleur1: '#00897B', emoji: '🏃' },
  Social: { couleur1: '#FF4B7D', emoji: '👥' },
  Art: { couleur1: '#FFD600', emoji: '🎨' },
};

const COULEURS_EMOJIS: Record<string, string> = {
  rouge: '🔴', bleu: '🔵', vert: '🟢', jaune: '🟡',
  orange: '🟠', violet: '🟣', noir: '⚫', blanc: '⚪',
  rose: '🩷', turquoise: '🩵',
};

const badges = [
  { icon: '🟢', nom: 'Jamais annulé', couleur: '#1DB954' },
  { icon: '⭐', nom: 'Top ponctualité', couleur: '#FF9500' },
  { icon: '👑', nom: 'Organisateur', couleur: '#7B2FBE' },
  { icon: '🔥', nom: 'En feu', couleur: '#E8000D' },
  { icon: '🌍', nom: 'Explorateur', couleur: '#00B4D8' },
  { icon: '💎', nom: 'Premium', couleur: '#0070F3' },
];

export default function ProfilAutreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [photoProfile, setPhotoProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    try {
      const { data: user } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', id)
        .single();

      if (user) {
        setUtilisateur(user);

        const { data: fichiers } = await supabase.storage
          .from('photos-wyytu')
          .list(id, { sortBy: { column: 'created_at', order: 'asc' } });

        if (fichiers) {
          const avatar = fichiers.find((f) => f.name === 'avatar.jpg');
          if (avatar) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos-wyytu')
              .getPublicUrl(`${id}/avatar.jpg`);
            setPhotoProfile(publicUrl);
          }
        }

        const { data: acts } = await supabase
          .from('activites')
          .select('id, titre, categorie, ville, date')
          .eq('createur_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (acts) setActivites(acts);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getCouleurEmoji = (couleur?: string) => {
    if (!couleur) return '🎨';
    const key = couleur.toLowerCase();
    return COULEURS_EMOJIS[key] || '🎨';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8000D" />
      </View>
    );
  }

  if (!utilisateur) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTexte}>Profil introuvable 😔</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.avatarWrapper}>
          {photoProfile ? (
            <Image source={{ uri: photoProfile }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarTexte}>
                {utilisateur.prenom?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.nom}>
          {utilisateur.prenom}{utilisateur.age ? `, ${utilisateur.age} ans` : ''}
        </Text>
        <Text style={styles.ville}>📍 {utilisateur.ville || 'Non renseigné'}</Text>
        <Text style={styles.note}>⭐ {utilisateur.note_moyenne || '0'} / 5</Text>

        <View style={styles.badgeVerifie}>
          <Text style={styles.badgeVerifieTexte}>✅ Profil vérifié</Text>
        </View>

        {utilisateur.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioTexte}>"{utilisateur.bio}"</Text>
          </View>
        ) : null}
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{activites.length}</Text>
          <Text style={styles.statLabel}>Plans créés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNombre, { color: '#FF9500' }]}>
            {utilisateur.note_moyenne || '0'}
          </Text>
          <Text style={styles.statLabel}>⭐ Note</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>✅</Text>
          <Text style={styles.statLabel}>Vérifié</Text>
        </View>
      </View>

      {/* INFOS PERSONNELLES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>À propos 👤</Text>
        <View style={styles.infoCard}>
          {utilisateur.personnalite && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>✨</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Personnalité</Text>
                <Text style={styles.infoValeur}>{utilisateur.personnalite}</Text>
              </View>
            </View>
          )}
          {utilisateur.situation && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>💼</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Situation</Text>
                  <Text style={styles.infoValeur}>{utilisateur.situation}</Text>
                </View>
              </View>
            </>
          )}
          {utilisateur.langues && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🗣️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Langues parlées</Text>
                  <Text style={styles.infoValeur}>{utilisateur.langues}</Text>
                </View>
              </View>
            </>
          )}
          {utilisateur.couleur_preferee && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>{getCouleurEmoji(utilisateur.couleur_preferee)}</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Couleur préférée</Text>
                  <Text style={styles.infoValeur}>{utilisateur.couleur_preferee}</Text>
                </View>
              </View>
            </>
          )}
          {utilisateur.ville && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ville</Text>
                  <Text style={styles.infoValeur}>{utilisateur.ville}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ACTIVITES FAVORITES */}
      {utilisateur.activites_favorites && (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Activités favorites 🎯</Text>
          <View style={styles.tagsContainer}>
            {utilisateur.activites_favorites.split(',').map((act, i) => {
              const trimmed = act.trim();
              const cat = CATEGORIES[trimmed];
              return (
                <View
                  key={i}
                  style={[
                    styles.tag,
                    { backgroundColor: cat ? cat.couleur1 : '#EEE8DE' },
                  ]}>
                  <Text style={[styles.tagTexte, { color: cat ? '#fff' : '#555' }]}>
                    {cat ? cat.emoji : '✦'} {trimmed}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* PLANS ORGANISES */}
      {activites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Plans organisés 📋</Text>
          <View style={styles.activitesList}>
            {activites.map((a) => {
              const cat = CATEGORIES[a.categorie] || { couleur1: '#1A1A1A', emoji: '✦' };
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.activiteCard, { backgroundColor: cat.couleur1 }]}
                  onPress={() => router.push(`/activite/${a.id}` as any)}>
                  <Text style={styles.activiteEmoji}>{cat.emoji}</Text>
                  <View style={styles.activiteInfo}>
                    <Text style={styles.activiteTitre} numberOfLines={1}>{a.titre}</Text>
                    <Text style={styles.activiteMeta}>📍 {a.ville} · 🗓 {formatDate(a.date)}</Text>
                  </View>
                  <Text style={styles.activiteArrow}>→</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* BADGES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Badges 🏆</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <View key={index} style={[styles.badgeCard, { borderColor: badge.couleur }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={[styles.badgeNom, { color: badge.couleur }]}>{badge.nom}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  errorTexte: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  retourTexte: { fontSize: 16, color: '#E8000D', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatarWrapper: { marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#EEE8DE' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#EEE8DE' },
  avatarTexte: { color: '#fff', fontSize: 44, fontWeight: '800' },
  nom: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 4 },
  ville: { fontSize: 14, color: '#AAA', marginBottom: 6 },
  note: { fontSize: 16, fontWeight: '700', color: '#FF9500', marginBottom: 10 },
  badgeVerifie: { backgroundColor: '#EEF7EE', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1DB954', marginBottom: 12 },
  badgeVerifieTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },
  bioBox: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#DDD4C4', width: '100%' },
  bioTexte: { color: '#555', fontSize: 14, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  statNombre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, letterSpacing: -0.3 },
  infoCard: { backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DDD4C4' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  infoIcon: { fontSize: 20, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', marginBottom: 2 },
  infoValeur: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#DDD4C4', marginVertical: 2 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagTexte: { fontSize: 13, fontWeight: '700' },
  activitesList: { gap: 10 },
  activiteCard: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activiteEmoji: { fontSize: 24 },
  activiteInfo: { flex: 1 },
  activiteTitre: { color: '#fff', fontSize: 14, fontWeight: '700' },
  activiteMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  activiteArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '700' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, alignItems: 'center', width: '30%', borderWidth: 2 },
  badgeIcon: { fontSize: 26 },
  badgeNom: { fontSize: 10, marginTop: 6, textAlign: 'center', fontWeight: '700' },
});