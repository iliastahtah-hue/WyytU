import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    finally { setLoading(false); }
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8, base64: true });
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
    return <View style={styles.loadingContainer}><Text style={styles.loadingTexte}>Chargement... 🔄</Text></View>;
  }

  const note = utilisateur?.note_moyenne || 0;
  const initiale = utilisateur?.prenom?.[0]?.toUpperCase() || '?';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.heroHeader}>
          <Text style={styles.heroLogo}>WyytU</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/mes-activites' as any)}>
              <Text style={styles.settingsIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={modifierPhoto} style={styles.avatarContainer}>
            {photoProfile ? (
              <Image source={{ uri: photoProfile }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarTexte}>{initiale}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.editAvatarBtn} onPress={modifierPhoto}>
            <Text style={styles.editAvatarIcon}>📷</Text>
          </TouchableOpacity>
          <View style={styles.onlineIndicator} />
        </View>

        <Text style={styles.nom}>{utilisateur?.prenom || 'Utilisateur'}</Text>
        <Text style={styles.ville}>📍 {utilisateur?.ville || 'Non renseigné'}</Text>

        {/* NOTE ÉTOILES */}
        <View style={styles.noteRow}>
          {[1,2,3,4,5].map((s) => (
            <Text key={s} style={[styles.star, { color: s <= Math.round(note) ? '#FF9500' : '#DDD4C4' }]}>★</Text>
          ))}
          <Text style={styles.noteTexte}>{note > 0 ? note.toFixed(1) : 'Nouveau'}</Text>
        </View>

        {/* BADGES RAPIDES */}
        <View style={styles.quickBadges}>
          <View style={styles.quickBadge}><Text style={styles.quickBadgeTexte}>✅ Vérifié</Text></View>
          <View style={[styles.quickBadge, { backgroundColor: '#FF950022', borderColor: '#FF9500' }]}>
            <Text style={[styles.quickBadgeTexte, { color: '#FF9500' }]}>⭐ Top membre</Text>
          </View>
        </View>

        {utilisateur?.bio && (
          <View style={styles.bioBox}><Text style={styles.bioTexte}>"{utilisateur.bio}"</Text></View>
        )}
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{utilisateur?.nb_sorties || 0}</Text>
          <Text style={styles.statLabel}>Sorties</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCenter]}>
          <Text style={[styles.statNombre, { color: '#E8000D' }]}>{note > 0 ? note.toFixed(1) : '—'}</Text>
          <Text style={styles.statLabel}>Note ⭐</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{utilisateur?.nb_organise || 0}</Text>
          <Text style={styles.statLabel}>Organisés</Text>
        </View>
      </View>

      {/* ONGLETS */}
      <View style={styles.onglets}>
        {(['infos', 'badges', 'photos'] as const).map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.onglet, ongletActif === o && styles.ongletActif]}
            onPress={() => setOngletActif(o)}>
            <Text style={[styles.ongletTexte, ongletActif === o && styles.ongletTexteActif]}>
              {o === 'infos' ? 'ℹ️ Infos' : o === 'badges' ? '🏅 Badges' : '📸 Photos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENU ONGLET */}
      <View style={styles.ongletContent}>

        {/* INFOS */}
        {ongletActif === 'infos' && (
          <View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}><Text style={styles.infoIcon}>✉️</Text></View>
                <View>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValeur}>{utilisateur?.email}</Text>
                </View>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}><Text style={styles.infoIcon}>📍</Text></View>
                <View>
                  <Text style={styles.infoLabel}>Ville</Text>
                  <Text style={styles.infoValeur}>{utilisateur?.ville || 'Non renseigné'}</Text>
                </View>
              </View>
              {utilisateur?.activites_favorites && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}><Text style={styles.infoIcon}>🎯</Text></View>
                    <View>
                      <Text style={styles.infoLabel}>Activités favorites</Text>
                      <Text style={styles.infoValeur}>{utilisateur.activites_favorites}</Text>
                    </View>
                  </View>
                </>
              )}
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
            <View style={styles.albumGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.url }} style={styles.photoAlbum} />
                  <TouchableOpacity style={styles.supprimerBtn} onPress={() => supprimerPhotoAlbum(index)}>
                    <Text style={styles.supprimerTexte}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 6 && (
                <TouchableOpacity style={styles.ajouterPhoto} onPress={ajouterPhotoAlbum}>
                  <Text style={styles.ajouterIcon}>+</Text>
                  <Text style={styles.ajouterTexte}>{photos.length}/6</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* BOUTONS */}
      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnecter}>
        <Text style={styles.boutonDeconnexionTexte}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  loadingTexte: { color: '#AAA', fontSize: 16 },

  // HERO
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, position: 'relative' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: '#1A1A1A', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  heroLogo: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', gap: 8 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarContainer: { padding: 3, borderRadius: 60, backgroundColor: '#E8000D' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { color: '#fff', fontSize: 44, fontWeight: '900' },
  editAvatarBtn: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  editAvatarIcon: { fontSize: 16 },
  onlineIndicator: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#1DB954', borderWidth: 2, borderColor: '#fff' },
  nom: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 4 },
  ville: { fontSize: 14, color: '#AAA', marginBottom: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12 },
  star: { fontSize: 18 },
  noteTexte: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginLeft: 6 },
  quickBadges: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBadge: { backgroundColor: '#1DB95422', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1DB954' },
  quickBadgeTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },
  bioBox: { backgroundColor: '#EEE8DE', borderRadius: 16, padding: 14, width: '100%', borderWidth: 1, borderColor: '#DDD4C4' },
  bioTexte: { color: '#555', fontSize: 14, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },

  // STATS
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16, marginTop: -8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statCardCenter: { borderWidth: 2, borderColor: '#E8000D' },
  statNombre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4, fontWeight: '600' },

  // ONGLETS
  onglets: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#DDD4C4' },
  onglet: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  ongletActif: { backgroundColor: '#1A1A1A' },
  ongletTexte: { fontSize: 12, fontWeight: '700', color: '#AAA' },
  ongletTexteActif: { color: '#fff' },
  ongletContent: { paddingHorizontal: 20, marginBottom: 20 },

  // INFOS
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  infoIconWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 18 },
  infoLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', marginBottom: 2 },
  infoValeur: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#F0EDE8', marginVertical: 4 },

  // PHOTOS
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrapper: { position: 'relative' },
  photoAlbum: { width: 100, height: 100, borderRadius: 16 },
  supprimerBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#E8000D', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  ajouterPhoto: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#EEE8DE', borderWidth: 2, borderColor: '#DDD4C4', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  ajouterIcon: { color: '#AAA', fontSize: 28, fontWeight: '300' },
  ajouterTexte: { color: '#AAA', fontSize: 11, marginTop: 2, fontWeight: '600' },

  // DECONNEXION
  boutonDeconnexion: { marginHorizontal: 20, borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8000D', backgroundColor: '#FFF0F0' },
  boutonDeconnexionTexte: { color: '#E8000D', fontWeight: '800', fontSize: 15 },
});