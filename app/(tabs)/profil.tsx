import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BadgeSystem from '../../components/BadgeSystem';
import { supabase } from '../../lib/supabase';

const C = {
  bg: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textMid: '#4A4A6A',
  textLight: '#9090A0',
  border: '#EEEEEE',
  green: '#00C853',
  red: '#FF3B30',
  purple: '#7C4DFF',
  blue: '#2196F3',
  orange: '#FF9800',
};

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

type Photo = { url: string; nom: string };

export default function ProfilScreen() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoProfile, setPhotoProfile] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ongletActif, setOngletActif] = useState<'infos' | 'badges' | 'photos'>('infos');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => { chargerProfil(); }, []);

  const chargerProfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('utilisateurs').select('*').eq('email', user.email).single();
        setUtilisateur(data || {
          id: user.id, prenom: user.email?.split('@')[0] ?? 'Utilisateur',
          email: user.email ?? '', ville: 'Non renseigné', note_moyenne: 0,
        });
        const { data: fichiers, error } = await supabase.storage
          .from('photos-wyytu').list(user.id, { sortBy: { column: 'created_at', order: 'asc' } });
        if (!error && fichiers) {
          if (fichiers.find(f => f.name === 'avatar.jpg')) {
            const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/avatar.jpg`);
            setPhotoProfile(publicUrl);
          }
          setPhotos(fichiers.filter(f => f.name.startsWith('album_')).map(f => {
            const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/${f.name}`);
            return { url: publicUrl, nom: f.name };
          }));
        }
      }
    } catch (err) { console.log(err); }
    finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  };

  const modifierPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
      aspect: [1, 1], quality: 0.8, base64: true,
    });
    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.storage.from('photos-wyytu')
        .upload(`${user.id}/avatar.jpg`, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/avatar.jpg`);
        setPhotoProfile(publicUrl + '?t=' + Date.now());
      } else Alert.alert('Erreur', "Impossible d'uploader la photo.");
    }
  };

  const ajouterPhotoAlbum = async () => {
    if (photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
      aspect: [1, 1], quality: 0.8, base64: true,
    });
    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileName = `album_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('photos-wyytu')
        .upload(`${user.id}/${fileName}`, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(`${user.id}/${fileName}`);
        setPhotos([...photos, { url: publicUrl, nom: fileName }]);
      } else Alert.alert('Erreur', "Impossible d'uploader.");
    }
  };

  const supprimerPhoto = async (index: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.storage.from('photos-wyytu').remove([`${user.id}/${photos[index].nom}`]);
    if (!error) setPhotos(photos.filter((_, i) => i !== index));
    else Alert.alert('Erreur', 'Impossible de supprimer.');
  };

  const deconnecter = async () => { await supabase.auth.signOut(); router.push('/'); };

  if (loading) {
    return (
      <View style={s.loading}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={s.loadingAvatar}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>W</Text>
        </LinearGradient>
        <Text style={s.loadingTxt}>Chargement...</Text>
      </View>
    );
  }

  const note = utilisateur?.note_moyenne || 0;
  const initiale = utilisateur?.prenom?.[0]?.toUpperCase() || '?';
  const sorties = utilisateur?.nb_sorties || 0;
  const niveau = sorties >= 20 ? 'Expert' : sorties >= 10 ? 'Régulier' : sorties >= 5 ? 'Actif' : 'Débutant';
  const niveauPct = Math.min((sorties / 20) * 100, 100);
  const taux = utilisateur?.taux_presence || 100;

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* ── HERO ── */}
      <LinearGradient colors={['#667EEA', '#764BA2']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroCircle1} />
        <View style={s.heroCircle2} />

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={s.logoTxt}>WyytU</Text>
          <View style={s.topActions}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/mes-activites' as any)}>
              <Text style={{ fontSize: 18 }}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <Animated.View style={[s.avatarSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={s.avatarWrap}>
            <TouchableOpacity onPress={modifierPhoto} activeOpacity={0.85}>
              <View style={s.avatarRing}>
                {photoProfile ? (
                  <Image source={{ uri: photoProfile }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={['#FF416C', '#FF4B2B']} style={s.avatarFallback}>
                    <Text style={s.avatarInit}>{initiale}</Text>
                  </LinearGradient>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.cameraBtn} onPress={modifierPhoto}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </TouchableOpacity>
            <View style={s.onlineDot} />
          </View>

          <Text style={s.nomTxt}>{utilisateur?.prenom || 'Utilisateur'}</Text>
          <Text style={s.villeTxt}>📍 {utilisateur?.ville || 'Non renseigné'}</Text>

          {/* Étoiles */}
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={{ fontSize: 18, color: i <= Math.round(note) ? '#FFD700' : 'rgba(255,255,255,0.25)' }}>★</Text>
            ))}
            <Text style={s.noteTxt}>{note > 0 ? note.toFixed(1) : 'Nouveau'}</Text>
          </View>

          {/* Progress niveau */}
          <View style={s.niveauWrap}>
            <View style={s.niveauHeader}>
              <Text style={s.niveauLabel}>Niveau · {niveau}</Text>
              <Text style={s.niveauPct}>{Math.round(niveauPct)}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${niveauPct}%` as any }]} />
            </View>
          </View>

          {/* Badges */}
          <View style={s.heroBadges}>
            <View style={s.badgeGreen}><Text style={s.badgeGreenTxt}>✅ Vérifié</Text></View>
            <View style={s.badgeYellow}><Text style={s.badgeYellowTxt}>⭐ Top membre</Text></View>
            {sorties >= 5 && <View style={s.badgeRed}><Text style={s.badgeRedTxt}>🔥 Actif</Text></View>}
          </View>
        </Animated.View>

        {utilisateur?.bio ? (
          <View style={s.bioBox}>
            <Text style={s.bioTxt}>"{utilisateur.bio}"</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* ── STATS ── */}
      <Animated.View style={[s.statsRow, { opacity: fadeAnim }]}>
        {[
          { val: sorties, emoji: '🎯', label: 'Sorties', color: '#667EEA' },
          { val: note > 0 ? note.toFixed(1) : '—', emoji: '⭐', label: 'Note', color: C.red, featured: true },
          { val: utilisateur?.nb_organise || 0, emoji: '👑', label: 'Organisés', color: C.orange },
          { val: `${taux}%`, emoji: '✅', label: 'Présence', color: C.green },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, st.featured && { borderWidth: 2, borderColor: C.red }]}>
            <Text style={{ fontSize: 18 }}>{st.emoji}</Text>
            <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── ONGLETS ── */}
      <View style={s.tabs}>
        {(['infos', 'badges', 'photos'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, ongletActif === tab && s.tabActive]}
            onPress={() => setOngletActif(tab)}
            activeOpacity={0.8}>
            <Text style={{ fontSize: 16 }}>
              {tab === 'infos' ? 'ℹ️' : tab === 'badges' ? '🏅' : '📸'}
            </Text>
            <Text style={[s.tabTxt, ongletActif === tab && s.tabTxtActive]}>
              {tab === 'infos' ? 'Infos' : tab === 'badges' ? 'Badges' : 'Photos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENU ── */}
      <View style={s.content}>

        {ongletActif === 'infos' && (
          <View style={s.infoList}>
            {[
              { icon: '✉️', label: 'Email', val: utilisateur?.email || '—', color: '#667EEA' },
              { icon: '📍', label: 'Ville', val: utilisateur?.ville || 'Non renseigné', color: '#FF416C' },
              { icon: '🎯', label: 'Activités préférées', val: utilisateur?.activites_favorites || 'Non renseigné', color: '#F7971E' },
            ].map((row, i) => (
              <View key={i} style={s.infoRow}>
                <View style={[s.infoIconBox, { backgroundColor: row.color + '15' }]}>
                  <Text style={{ fontSize: 20 }}>{row.icon}</Text>
                </View>
                <View style={s.infoTexts}>
                  <Text style={s.infoLabel}>{row.label}</Text>
                  <Text style={s.infoVal} numberOfLines={1}>{row.val}</Text>
                </View>
                <Text style={{ fontSize: 22, color: C.border }}>›</Text>
              </View>
            ))}

            <TouchableOpacity onPress={() => router.push('/mes-activites' as any)} activeOpacity={0.85}>
              <LinearGradient colors={['#667EEA', '#764BA2']} style={s.mesPlansCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 30 }}>🎯</Text>
                  <View>
                    <Text style={s.mesPlansTitle}>Mes plans</Text>
                    <Text style={s.mesPlansSub}>Voir mes activités →</Text>
                  </View>
                </View>
                <View style={s.mesPlansCount}>
                  <Text style={s.mesPlansCountNb}>{sorties}</Text>
                  <Text style={s.mesPlansCountLbl}>sorties</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Activités colorées */}
            <Text style={s.activitesSectionTitle}>Mes catégories favorites</Text>
            <View style={s.activitesGrid}>
              {[
                { emoji: '⚽', label: 'Sport', gradient: ['#FF416C', '#FF4B2B'] as [string,string] },
                { emoji: '🍕', label: 'Resto', gradient: ['#F7971E', '#FFD200'] as [string,string] },
                { emoji: '🎉', label: 'Soirée', gradient: ['#FC466B', '#3F5EFB'] as [string,string] },
                { emoji: '🎮', label: 'Gaming', gradient: ['#0072FF', '#00C6FF'] as [string,string] },
              ].map((a, i) => (
                <LinearGradient key={i} colors={a.gradient} style={s.activiteCard}>
                  <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                  <Text style={s.activiteCardTxt}>{a.label}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {ongletActif === 'badges' && utilisateur && (
          <BadgeSystem user={utilisateur} mode="full" />
        )}

        {ongletActif === 'photos' && (
          <View>
            <View style={s.photosHeader}>
              <Text style={s.photosTitle}>Album photo</Text>
              <Text style={s.photosCount}>{photos.length}/6</Text>
            </View>
            <View style={s.photoGrid}>
              {photos.map((photo, i) => (
                <View key={i} style={s.photoWrap}>
                  <Image source={{ uri: photo.url }} style={s.photoImg} />
                  <TouchableOpacity style={s.photoDelete} onPress={() => supprimerPhoto(i)}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✕</Text>
                  </TouchableOpacity>
                  {i === 0 && (
                    <View style={s.photoPrimary}>
                      <Text style={s.photoPrimaryTxt}>Principal</Text>
                    </View>
                  )}
                </View>
              ))}
              {photos.length < 6 && (
                <TouchableOpacity style={s.photoAdd} onPress={ajouterPhotoAlbum}>
                  <Text style={{ color: C.textLight, fontSize: 28, fontWeight: '300' }}>+</Text>
                  <Text style={{ color: C.textLight, fontSize: 11, fontWeight: '600' }}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── DÉCONNEXION ── */}
      <TouchableOpacity style={s.decoBtn} onPress={deconnecter} activeOpacity={0.8}>
        <Text style={{ fontSize: 20 }}>🚪</Text>
        <Text style={s.decoBtnTxt}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingAvatar: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: C.textLight, fontSize: 14, fontWeight: '600' },

  // HERO
  hero: { paddingTop: Platform.OS === 'ios' ? 60 : 36, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden' },
  heroCircle1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.07)', top: -100, right: -80 },
  heroCircle2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -60, left: -80 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  logoTxt: { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // AVATAR
  avatarSection: { alignItems: 'center', width: '100%' },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarRing: { padding: 3, borderRadius: 62, backgroundColor: 'rgba(255,255,255,0.3)' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { color: C.white, fontSize: 46, fontWeight: '900' },
  cameraBtn: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  onlineDot: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: C.green, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.8)' },
  nomTxt: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5, marginBottom: 4 },
  villeTxt: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16 },
  noteTxt: { color: C.white, fontSize: 14, fontWeight: '800', marginLeft: 8 },

  // NIVEAU
  niveauWrap: { width: '100%', marginBottom: 16 },
  niveauHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  niveauLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700' },
  niveauPct: { color: C.white, fontSize: 12, fontWeight: '800' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.white },

  // BADGES HERO
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  badgeGreen: { backgroundColor: '#00C85325', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: C.green },
  badgeGreenTxt: { color: C.green, fontSize: 12, fontWeight: '700' },
  badgeYellow: { backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#FFD700' },
  badgeYellowTxt: { color: '#FFD700', fontSize: 12, fontWeight: '700' },
  badgeRed: { backgroundColor: '#FF3B3025', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: C.red },
  badgeRedTxt: { color: C.red, fontSize: 12, fontWeight: '700' },
  bioBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 14, width: '100%', marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  bioTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginTop: -18, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 12, alignItems: 'center', gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  statVal: { fontSize: 17, fontWeight: '900' },
  statLabel: { fontSize: 9, color: C.textLight, fontWeight: '700', textAlign: 'center' },

  // TABS
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.border, borderRadius: 18, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 14, gap: 2 },
  tabActive: { backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  tabTxt: { fontSize: 11, fontWeight: '700', color: C.textLight },
  tabTxtActive: { color: '#667EEA' },

  // CONTENT
  content: { paddingHorizontal: 20, marginBottom: 20 },
  infoList: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: C.border },
  infoIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 2 },
  infoVal: { fontSize: 14, color: C.text, fontWeight: '700' },

  // MES PLANS
  mesPlansCard: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  mesPlansTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  mesPlansSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  mesPlansCount: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 },
  mesPlansCountNb: { color: C.white, fontSize: 22, fontWeight: '900' },
  mesPlansCountLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },

  // ACTIVITÉS
  activitesSectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginTop: 16, marginBottom: 10 },
  activitesGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  activiteCard: { flex: 1, minWidth: '44%', borderRadius: 18, padding: 16, alignItems: 'center', gap: 6 },
  activiteCardTxt: { color: C.white, fontSize: 13, fontWeight: '800' },

  // PHOTOS
  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  photosTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  photosCount: { fontSize: 13, fontWeight: '700', color: C.textLight },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { position: 'relative' },
  photoImg: { width: 104, height: 104, borderRadius: 18 },
  photoDelete: { position: 'absolute', top: -6, right: -6, backgroundColor: C.red, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  photoPrimary: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  photoPrimaryTxt: { color: C.white, fontSize: 9, fontWeight: '700' },
  photoAdd: { width: 104, height: 104, borderRadius: 18, backgroundColor: C.border, borderWidth: 2, borderColor: '#DDD', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },

  // DÉCO
  decoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, borderRadius: 18, padding: 16, backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: C.red + '30' },
  decoBtnTxt: { color: C.red, fontWeight: '800', fontSize: 15 },
});