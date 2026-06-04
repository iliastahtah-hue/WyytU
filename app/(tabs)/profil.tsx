import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BadgeSystem from '../../components/BadgeSystem';
import { supabase } from '../../lib/supabase';

type Utilisateur = {
  id: string;
  prenom: string;
  email: string;
  ville: string;
  note_moyenne: number;
  bio?: string;
  nb_sorties?: number;
  nb_organise?: number;
  taux_presence?: number;
  activites_favorites?: string;
};

type Photo = { url: string; nom: string; };

export default function ProfilScreen() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoProfile, setPhotoProfile] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ongletActif, setOngletActif] = useState<'infos' | 'badges' | 'photos'>('infos');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => { chargerProfil(); }, []);

  const chargerProfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('utilisateurs').select('*').eq('email', user.email).single();
        if (data) { setUtilisateur(data); }
        else {
          setUtilisateur({ id: user.id, prenom: user.email?.split('@')[0] ?? 'Utilisateur', email: user.email ?? '', ville: 'Non renseigné', note_moyenne: 0 });
        }
        const { data: fichiers, error } = await supabase.storage.from('photos-wyytu').list(user.id, { sortBy: { column: 'created_at', order: 'asc' } });
        if (!error && fichiers) {
          const avatar = fichiers.find((f) => f.name === 'avatar.jpg');
          if (avatar) {
            const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/avatar.jpg`);
            setPhotoProfile(publicUrl);
          }
          const photosAlbum: Photo[] = fichiers.filter((f) => f.name.startsWith('album_')).map((f) => {
            const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/${f.name}`);
            return { url: publicUrl, nom: f.name };
          });
          setPhotos(photosAlbum);
        }
      }
    } catch (err) { console.log(err); }
    finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  };

  const modifierPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const filePath = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage.from('photos-wyytu').upload(filePath, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(filePath);
        setPhotoProfile(publicUrl + '?t=' + Date.now());
      } else { Alert.alert('Erreur', "Impossible d'uploader la photo."); }
    }
  };

  const ajouterPhotoAlbum = async () => {
    if (photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileName = `album_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const { error } = await supabase.storage.from('photos-wyytu').upload(filePath, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(filePath);
        setPhotos([...photos, { url: publicUrl, nom: fileName }]);
      } else { Alert.alert('Erreur', "Impossible d'uploader la photo."); }
    }
  };

  const supprimerPhotoAlbum = async (index: number) => {
    const photo = photos[index];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.storage.from('photos-wyytu').remove([`${user.id}/${photo.nom}`]);
    if (!error) { setPhotos(photos.filter((_, i) => i !== index)); }
    else { Alert.alert('Erreur', 'Impossible de supprimer la photo.'); }
  };

  const deconnecter = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingAvatar}><Text style={styles.loadingAvatarTexte}>W</Text></View>
        <Text style={styles.loadingTexte}>Chargement du profil...</Text>
      </View>
    );
  }

  const note = utilisateur?.note_moyenne || 0;
  const initiale = utilisateur?.prenom?.[0]?.toUpperCase() || '?';
  const taux = utilisateur?.taux_presence || 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ═══ HERO PREMIUM ═══ */}
      <View style={styles.hero}>
        {/* BG GRADIENT SOMBRE */}
        <View style={styles.heroBg} />
        <View style={styles.heroBgCircle1} />
        <View style={styles.heroBgCircle2} />

        {/* HEADER */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroLogo}>WyytU</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/mes-activites' as any)}>
              <Text style={styles.actionBtnIcon}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AVATAR PREMIUM */}
        <Animated.View style={[styles.avatarSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.avatarRing}>
            <TouchableOpacity onPress={modifierPhoto} style={styles.avatarContainer}>
              {photoProfile ? (
                <Image source={{ uri: photoProfile }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarTexte}>{initiale}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={modifierPhoto}>
              <Text style={styles.editBtnIcon}>📷</Text>
            </TouchableOpacity>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.nom}>{utilisateur?.prenom || 'Utilisateur'}</Text>
          <Text style={styles.ville}>📍 {utilisateur?.ville || 'Non renseigné'}</Text>

          {/* ÉTOILES */}
          <View style={styles.noteRow}>
            {[1,2,3,4,5].map((s) => (
              <Text key={s} style={[styles.star, { color: s <= Math.round(note) ? '#FF9500' : 'rgba(255,255,255,0.2)' }]}>★</Text>
            ))}
            <Text style={styles.noteVal}>{note > 0 ? note.toFixed(1) : 'Nouveau'}</Text>
          </View>

          {/* BADGES HERO */}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge1}><Text style={styles.heroBadge1Texte}>✅ Vérifié</Text></View>
            <View style={styles.heroBadge2}><Text style={styles.heroBadge2Texte}>🌟 Top membre</Text></View>
            {(utilisateur?.nb_sorties || 0) >= 5 && (
              <View style={styles.heroBadge3}><Text style={styles.heroBadge3Texte}>🔥 Actif</Text></View>
            )}
          </View>
        </Animated.View>

        {/* BIO */}
        {utilisateur?.bio && (
          <View style={styles.bioBox}>
            <Text style={styles.bioTexte}>"{utilisateur.bio}"</Text>
          </View>
        )}
      </View>

      {/* ═══ STATS PREMIUM ═══ */}
      <Animated.View style={[styles.statsSection, { opacity: fadeAnim }]}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{utilisateur?.nb_sorties || 0}</Text>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statLabel}>Sorties</Text>
        </View>
        <View style={[styles.statCard, styles.statCardFeatured]}>
          <Text style={[styles.statNombre, { color: '#E8000D' }]}>{note > 0 ? note.toFixed(1) : '—'}</Text>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{utilisateur?.nb_organise || 0}</Text>
          <Text style={styles.statEmoji}>👑</Text>
          <Text style={styles.statLabel}>Organisés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{taux}%</Text>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statLabel}>Présence</Text>
        </View>
      </Animated.View>

      {/* ═══ ONGLETS ═══ */}
      <View style={styles.onglets}>
        {(['infos', 'badges', 'photos'] as const).map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.onglet, ongletActif === o && styles.ongletActif]}
            onPress={() => setOngletActif(o)}>
            <Text style={styles.ongletEmoji}>
              {o === 'infos' ? 'ℹ️' : o === 'badges' ? '🏅' : '📸'}
            </Text>
            <Text style={[styles.ongletTexte, ongletActif === o && styles.ongletTexteActif]}>
              {o === 'infos' ? 'Infos' : o === 'badges' ? 'Badges' : 'Photos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══ CONTENU ═══ */}
      <View style={styles.content}>

        {/* INFOS */}
        {ongletActif === 'infos' && (
          <View style={styles.infoSection}>
            {[
              { icon: '✉️', label: 'Email', valeur: utilisateur?.email || '—' },
              { icon: '📍', label: 'Ville', valeur: utilisateur?.ville || 'Non renseigné' },
              { icon: '🎯', label: 'Activités', valeur: utilisateur?.activites_favorites || 'Non renseigné' },
            ].map((info, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Text style={styles.infoIcon}>{info.icon}</Text>
                </View>
                <View style={styles.infoTextes}>
                  <Text style={styles.infoLabel}>{info.label}</Text>
                  <Text style={styles.infoValeur} numberOfLines={1}>{info.valeur}</Text>
                </View>
                <Text style={styles.infoArrow}>›</Text>
              </View>
            ))}

            {/* CARD ACTIVITÉ */}
            <View style={styles.activiteCard}>
              <View style={styles.activiteCardLeft}>
                <Text style={styles.activiteCardEmoji}>🎯</Text>
                <View>
                  <Text style={styles.activiteCardTitre}>Mes plans</Text>
                  <Text style={styles.activiteCardSub}>Voir mes activités</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.activiteCardBtn} onPress={() => router.push('/mes-activites' as any)}>
                <Text style={styles.activiteCardBtnTexte}>Voir →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* BADGES */}
        {ongletActif === 'badges' && utilisateur && (
          <BadgeSystem user={utilisateur} mode="full" />
        )}

        {/* PHOTOS */}
        {ongletActif === 'photos' && (
          <View>
            <Text style={styles.photosLabel}>Mes photos · {photos.length}/6</Text>
            <View style={styles.albumGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.url }} style={styles.photoAlbum} />
                  <TouchableOpacity style={styles.supprimerBtn} onPress={() => supprimerPhotoAlbum(index)}>
                    <Text style={styles.supprimerTexte}>✕</Text>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.photoPrincipale}>
                      <Text style={styles.photoPrincipaleTexte}>Principal</Text>
                    </View>
                  )}
                </View>
              ))}
              {photos.length < 6 && (
                <TouchableOpacity style={styles.ajouterPhoto} onPress={ajouterPhotoAlbum}>
                  <Text style={styles.ajouterIcon}>+</Text>
                  <Text style={styles.ajouterTexte}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ═══ BOUTON DÉCO ═══ */}
      <TouchableOpacity style={styles.decoBtn} onPress={deconnecter} activeOpacity={0.8}>
        <Text style={styles.decoBtnIcon}>🚪</Text>
        <Text style={styles.decoBtnTexte}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingAvatar: { width: 80, height: 80, borderRadius: 26, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  loadingAvatarTexte: { color: '#fff', fontSize: 36, fontWeight: '900' },
  loadingTexte: { color: '#AAA', fontSize: 14, fontWeight: '600' },

  // HERO
  hero: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 280, backgroundColor: '#0D0D0D' },
  heroBgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#E8000D', opacity: 0.08, top: -80, right: -80 },
  heroBgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#7B2FBE', opacity: 0.06, top: 40, left: -60 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  heroLogo: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  actionBtnIcon: { fontSize: 16 },

  // AVATAR
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarRing: { position: 'relative', marginBottom: 14 },
  avatarContainer: { borderWidth: 3, borderColor: '#E8000D', borderRadius: 64, padding: 3 },
  avatar: { width: 114, height: 114, borderRadius: 57 },
  avatarPlaceholder: { width: 114, height: 114, borderRadius: 57, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { color: '#fff', fontSize: 48, fontWeight: '900' },
  editBtn: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  editBtnIcon: { fontSize: 16 },
  onlineDot: { position: 'absolute', top: 8, right: 8, width: 14, height: 14, borderRadius: 7, backgroundColor: '#1DB954', borderWidth: 2.5, borderColor: '#0D0D0D' },
  nom: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  ville: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 14 },
  star: { fontSize: 20 },
  noteVal: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 },
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge1: { backgroundColor: '#1DB95430', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1DB954' },
  heroBadge1Texte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },
  heroBadge2: { backgroundColor: '#FF950030', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#FF9500' },
  heroBadge2Texte: { color: '#FF9500', fontSize: 12, fontWeight: '700' },
  heroBadge3: { backgroundColor: '#E8000D30', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8000D' },
  heroBadge3Texte: { color: '#E8000D', fontSize: 12, fontWeight: '700' },
  bioBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14, width: '100%', marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bioTexte: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },

  // STATS
  statsSection: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginTop: -16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, gap: 3 },
  statCardFeatured: { borderWidth: 2, borderColor: '#E8000D' },
  statNombre: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statEmoji: { fontSize: 16 },
  statLabel: { color: '#AAA', fontSize: 9, fontWeight: '700', textAlign: 'center' },

  // ONGLETS
  onglets: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#EEE8DE', borderRadius: 18, padding: 4, marginBottom: 20 },
  onglet: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 14, gap: 2 },
  ongletActif: { backgroundColor: '#1A1A1A' },
  ongletEmoji: { fontSize: 16 },
  ongletTexte: { fontSize: 11, fontWeight: '700', color: '#AAA' },
  ongletTexteActif: { color: '#fff' },

  // CONTENU
  content: { paddingHorizontal: 20, marginBottom: 20 },

  // INFOS
  infoSection: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoIconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 20 },
  infoTextes: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', marginBottom: 2 },
  infoValeur: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  infoArrow: { fontSize: 22, color: '#DDD4C4' },
  activiteCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18, marginTop: 4 },
  activiteCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activiteCardEmoji: { fontSize: 28 },
  activiteCardTitre: { color: '#fff', fontSize: 15, fontWeight: '800' },
  activiteCardSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  activiteCardBtn: { backgroundColor: '#E8000D', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  activiteCardBtnTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // PHOTOS
  photosLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 14 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrapper: { position: 'relative' },
  photoAlbum: { width: 105, height: 105, borderRadius: 18 },
  supprimerBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#E8000D', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  photoPrincipale: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  photoPrincipaleTexte: { color: '#fff', fontSize: 9, fontWeight: '700' },
  ajouterPhoto: { width: 105, height: 105, borderRadius: 18, backgroundColor: '#EEE8DE', borderWidth: 2, borderColor: '#DDD4C4', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  ajouterIcon: { color: '#AAA', fontSize: 28, fontWeight: '300' },
  ajouterTexte: { color: '#AAA', fontSize: 11, fontWeight: '600' },

  // DÉCO
  decoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, borderRadius: 18, padding: 16, backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#E8000D22' },
  decoBtnIcon: { fontSize: 20 },
  decoBtnTexte: { color: '#E8000D', fontWeight: '800', fontSize: 15 },
});