import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Utilisateur = {
  prenom: string;
  email: string;
  ville: string;
  note_moyenne: number;
  bio?: string;
};

type Photo = {
  url: string;
  nom: string;
};

export default function ProfilScreen() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoProfile, setPhotoProfile] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('email', user.email)
          .single();

        if (data) {
          setUtilisateur(data);
        } else {
          setUtilisateur({
            prenom: user.email?.split('@')[0] ?? 'Utilisateur',
            email: user.email ?? '',
            ville: 'Non renseigné',
            note_moyenne: 0,
          });
        }

        const { data: fichiers, error } = await supabase.storage
          .from('photos-wyytu')
          .list(user.id, { sortBy: { column: 'created_at', order: 'asc' } });

        if (!error && fichiers) {
          const avatar = fichiers.find((f) => f.name === 'avatar.jpg');
          if (avatar) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos-wyytu')
              .getPublicUrl(`${user.id}/avatar.jpg`);
            setPhotoProfile(publicUrl);
          }

          const photosAlbum: Photo[] = fichiers
            .filter((f) => f.name.startsWith('album_'))
            .map((f) => {
              const { data: { publicUrl } } = supabase.storage
                .from('photos-wyytu')
                .getPublicUrl(`${user.id}/${f.name}`);
              return { url: publicUrl, nom: f.name };
            });

          setPhotos(photosAlbum);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const modifierPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const filePath = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('photos-wyytu')
        .upload(filePath, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(filePath);
        setPhotoProfile(publicUrl + '?t=' + Date.now());
      } else {
        Alert.alert('Erreur', "Impossible d'uploader la photo.");
      }
    }
  };

  const ajouterPhotoAlbum = async () => {
    if (photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileName = `album_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const { error } = await supabase.storage
        .from('photos-wyytu')
        .upload(filePath, decode(image.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos-wyytu').getPublicUrl(filePath);
        setPhotos([...photos, { url: publicUrl, nom: fileName }]);
      } else {
        Alert.alert('Erreur', "Impossible d'uploader la photo.");
      }
    }
  };

  const supprimerPhotoAlbum = async (index: number) => {
    const photo = photos[index];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.storage.from('photos-wyytu').remove([`${user.id}/${photo.nom}`]);
    if (!error) {
      setPhotos(photos.filter((_, i) => i !== index));
    } else {
      Alert.alert('Erreur', 'Impossible de supprimer la photo.');
    }
  };

  const deconnecter = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const badges = [
    { icon: '🟢', nom: 'Jamais annulé', couleur: '#1DB954' },
    { icon: '⭐', nom: 'Top ponctualité', couleur: '#FF9500' },
    { icon: '👑', nom: 'Organisateur', couleur: '#7B2FBE' },
    { icon: '🔥', nom: 'En feu', couleur: '#E8000D' },
    { icon: '🌍', nom: 'Explorateur', couleur: '#00B4D8' },
    { icon: '💎', nom: 'Premium', couleur: '#0070F3' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTexte}>Chargement... 🔄</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.hero}>
        <Text style={styles.logo}>WyytU</Text>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={modifierPhoto}>
            {photoProfile ? (
              <Image source={{ uri: photoProfile }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarTexte}>
                  {utilisateur?.prenom?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.editAvatarBtn} onPress={modifierPhoto}>
            <Text style={styles.editAvatarIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.nom}>{utilisateur?.prenom || 'Utilisateur'}</Text>
        <Text style={styles.ville}>📍 {utilisateur?.ville || 'Non renseigné'}</Text>

        <View style={styles.badgeVerifie}>
          <Text style={styles.badgeVerifieTexte}>✅ Profil vérifié</Text>
        </View>

        {utilisateur?.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioTexte}>{utilisateur.bio}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>0</Text>
          <Text style={styles.statLabel}>Plans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>0</Text>
          <Text style={styles.statLabel}>Organisés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNombre, { color: '#FF9500' }]}>
            ⭐ {utilisateur?.note_moyenne || '0'}
          </Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>✉️</Text>
          <Text style={styles.infoTexte}>{utilisateur?.email}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoTexte}>{utilisateur?.ville || 'Non renseigné'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Mes photos 📸</Text>
        <View style={styles.albumGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: photo.url }} style={styles.photoAlbum} />
              <TouchableOpacity
                style={styles.supprimerBtn}
                onPress={() => supprimerPhotoAlbum(index)}>
                <Text style={styles.supprimerTexte}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.ajouterPhoto} onPress={ajouterPhotoAlbum}>
              <Text style={styles.ajouterIcon}>+</Text>
              <Text style={styles.ajouterTexte}>
                {photos.length > 0 ? `${photos.length}/6` : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Mes badges 🏆</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <View key={index} style={[styles.badgeCard, { borderColor: badge.couleur }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={[styles.badgeNom, { color: badge.couleur }]}>{badge.nom}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* BOUTON MES PLANS */}
      <TouchableOpacity
        style={styles.boutonMesPlans}
        onPress={() => router.push('/mes-activites' as any)}>
        <Text style={styles.boutonMesPlansTexte}>📋 Mes plans</Text>
      </TouchableOpacity>

      {/* DECONNEXION */}
      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnecter}>
        <Text style={styles.boutonDeconnexionTexte}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  loadingTexte: { color: '#AAA', fontSize: 16 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, backgroundColor: '#FAF7F2' },
  logo: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#EEE8DE' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#EEE8DE' },
  avatarTexte: { color: '#fff', fontSize: 44, fontWeight: '800' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FAF7F2' },
  editAvatarIcon: { fontSize: 16 },
  nom: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 4 },
  ville: { fontSize: 14, color: '#AAA', marginBottom: 12 },
  badgeVerifie: { backgroundColor: '#EEF7EE', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1DB954', marginBottom: 12 },
  badgeVerifieTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },
  bioBox: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, marginTop: 4, borderWidth: 1, borderColor: '#DDD4C4', width: '100%' },
  bioTexte: { color: '#555', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  statNombre: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4, fontWeight: '600' },
  infoCard: { marginHorizontal: 20, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#DDD4C4' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  infoIcon: { fontSize: 16 },
  infoTexte: { fontSize: 14, color: '#555', flex: 1 },
  separator: { height: 1, backgroundColor: '#DDD4C4', marginVertical: 8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, letterSpacing: -0.3 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrapper: { position: 'relative' },
  photoAlbum: { width: 100, height: 100, borderRadius: 14 },
  supprimerBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#E8000D', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  ajouterPhoto: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#EEE8DE', borderWidth: 2, borderColor: '#DDD4C4', alignItems: 'center', justifyContent: 'center' },
  ajouterIcon: { color: '#AAA', fontSize: 28, fontWeight: '700' },
  ajouterTexte: { color: '#AAA', fontSize: 11, marginTop: 2 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, alignItems: 'center', width: '30%', borderWidth: 2 },
  badgeIcon: { fontSize: 26 },
  badgeNom: { fontSize: 10, marginTop: 6, textAlign: 'center', fontWeight: '700' },
  boutonMesPlans: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 20, marginBottom: 10 },
  boutonMesPlansTexte: { color: '#fff', fontWeight: '800', fontSize: 15 },
  boutonDeconnexion: { backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 20, marginBottom: 10, borderWidth: 1.5, borderColor: '#E8000D' },
  boutonDeconnexionTexte: { color: '#E8000D', fontWeight: '800', fontSize: 15 },
});
