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
        .upload(filePath, decode(image.base64 ?? ''), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('photos-wyytu')
          .getPublicUrl(filePath);
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
        .upload(filePath, decode(image.base64 ?? ''), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('photos-wyytu')
          .getPublicUrl(filePath);
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

    const filePath = `${user.id}/${photo.nom}`;

    const { error } = await supabase.storage
      .from('photos-wyytu')
      .remove([filePath]);

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
    { icon: '🟢', nom: 'Jamais annulé', couleur: '#27AE60' },
    { icon: '⭐', nom: 'Top ponctualité', couleur: '#F39C12' },
    { icon: '👑', nom: 'Organisateur', couleur: '#9B59B6' },
    { icon: '🔥', nom: 'En feu', couleur: '#FF4444' },
    { icon: '🌍', nom: 'Explorateur', couleur: '#00BCD4' },
    { icon: '💎', nom: 'Premium', couleur: '#3498DB' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTexte}>Chargement... 🔄</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={modifierPhoto}>
            {photoProfile ? (
              <Image source={{ uri: photoProfile }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarTexte}>
                  {utilisateur?.prenom?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.modifierPhotoBtn} onPress={modifierPhoto}>
            <Text style={styles.modifierPhotoBtnTexte}>📷 Modifier ma photo</Text>
          </TouchableOpacity>

          <View style={styles.badgeVerifie}>
            <Text style={styles.badgeVerifieTexte}>✅ Vérifié</Text>
          </View>
        </View>

        <Text style={styles.nom}>{utilisateur?.prenom || 'Utilisateur'}</Text>
        <Text style={styles.ville}>📍 {utilisateur?.ville || 'Non renseigné'}</Text>
        <Text style={styles.email}>✉️ {utilisateur?.email}</Text>
        <Text style={styles.note}>⭐ {utilisateur?.note_moyenne || '0'} / 5</Text>

        {utilisateur?.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioTexte}>{utilisateur.bio}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>0</Text>
          <Text style={styles.statLabel}>Activités</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>0</Text>
          <Text style={styles.statLabel}>Groupes créés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{utilisateur?.note_moyenne || '0'}</Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Mes photos 📸</Text>
        <View style={styles.albumGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoAlbumWrapper}>
              <Image source={{ uri: photo.url }} style={styles.photoAlbum} />
              <TouchableOpacity
                style={styles.supprimerPhotoAlbum}
                onPress={() => supprimerPhotoAlbum(index)}>
                <Text style={styles.supprimerTexte}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 ? (
            <TouchableOpacity style={styles.ajouterPhotoAlbum} onPress={ajouterPhotoAlbum}>
              <Text style={styles.ajouterPhotoIcon}>+</Text>
              <Text style={styles.ajouterPhotoTexte}>
                {photos.length > 0 ? `${photos.length}/6` : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Mes badges 🏆</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <View key={index} style={[styles.badgeCard, { borderColor: badge.couleur }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeNom}>{badge.nom}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnecter}>
        <Text style={styles.boutonDeconnexionTexte}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.espaceBottom} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2E5A' },
  loadingContainer: { flex: 1, backgroundColor: '#1A2E5A', alignItems: 'center', justifyContent: 'center' },
  loadingTexte: { color: '#FFFFFF', fontSize: 18 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2, marginBottom: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  avatarTexte: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold' },
  modifierPhotoBtn: { backgroundColor: '#FF6B2B', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginTop: 8, marginBottom: 8 },
  modifierPhotoBtnTexte: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  badgeVerifie: { backgroundColor: '#1A3A2A', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: '#27AE60' },
  badgeVerifieTexte: { color: '#27AE60', fontSize: 12, fontWeight: 'bold' },
  nom: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  ville: { color: '#AAAAAA', fontSize: 14, marginTop: 4 },
  email: { color: '#AAAAAA', fontSize: 12, marginTop: 4 },
  note: { color: '#F39C12', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  bioBox: { backgroundColor: '#243660', borderRadius: 12, padding: 14, marginTop: 12, marginHorizontal: 20, borderWidth: 1, borderColor: '#2B4C9B' },
  bioTexte: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#243660', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2B4C9B' },
  statNombre: { color: '#FF6B2B', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#AAAAAA', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitre: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoAlbumWrapper: { position: 'relative' },
  photoAlbum: { width: 100, height: 100, borderRadius: 12 },
  supprimerPhotoAlbum: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF4444', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  ajouterPhotoAlbum: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#243660', borderWidth: 2, borderColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center' },
  ajouterPhotoIcon: { color: '#FF6B2B', fontSize: 28, fontWeight: 'bold' },
  ajouterPhotoTexte: { color: '#FF6B2B', fontSize: 11, marginTop: 2 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { backgroundColor: '#243660', borderRadius: 12, padding: 12, alignItems: 'center', width: '30%', borderWidth: 2 },
  badgeIcon: { fontSize: 28 },
  badgeNom: { color: '#FFFFFF', fontSize: 10, marginTop: 6, textAlign: 'center' },
  boutonDeconnexion: { backgroundColor: '#3A1A1A', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: '#FF4444' },
  boutonDeconnexionTexte: { color: '#FF4444', fontWeight: 'bold', fontSize: 16 },
  espaceBottom: { height: 40 },
});