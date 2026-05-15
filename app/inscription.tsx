import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function InscriptionScreen() {
  const router = useRouter();
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [ville, setVille] = useState('');
  const [bio, setBio] = useState('');
  const [activitesFavorites, setActivitesFavorites] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const choisirPhoto = async () => {
    if (photos.length >= 3) {
      setMessage('❌ Maximum 3 photos !');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
      setMessage('');
    }
  };

  const prendreSelfiee = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelfie(result.assets[0].uri);
      setMessage('✅ Selfie pris ! Vérification en cours...');
    }
  };

  const inscrire = async () => {
    if (!prenom || !email || !motDePasse) {
      setMessage('❌ Remplis tous les champs obligatoires !');
      return;
    }
    if (photos.length < 2) {
      setMessage('❌ Ajoute au minimum 2 photos de profil !');
      return;
    }
    if (!selfie) {
      setMessage('❌ Prends ton selfie de vérification !');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: { data: { prenom, telephone, ville } },
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        await supabase.from('utilisateurs').insert({
          prenom, email, telephone, ville, bio,
          activites_favorites: activitesFavorites,
        });
        setMessage('🎉 Compte créé avec succès ! Bienvenue sur WyytU !');
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (err) {
      setMessage('❌ Une erreur est survenue. Réessaie !');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoTexte}>W</Text>
        </View>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Crée ton compte 🔥</Text>
        <Text style={styles.sousTitre}>Rejoins la communauté</Text>
      </View>

      <View style={styles.formulaire}>

        {message ? (
          <View style={[styles.messageBox, {
            borderColor: message.includes('❌') ? '#E8000D' : '#1DB954',
            backgroundColor: message.includes('❌') ? '#FFF0F0' : '#EEF7EE',
          }]}>
            <Text style={[styles.messageTexte, {
              color: message.includes('❌') ? '#E8000D' : '#1DB954',
            }]}>{message}</Text>
          </View>
        ) : null}

        {/* CHAMPS */}
        <Text style={styles.label}>Prénom *</Text>
        <TextInput style={styles.input} placeholder="Ton prénom" placeholderTextColor="#BBB" value={prenom} onChangeText={setPrenom} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="ton@email.com" placeholderTextColor="#BBB" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput style={styles.input} placeholder="+32 ou +212..." placeholderTextColor="#BBB" keyboardType="phone-pad" value={telephone} onChangeText={setTelephone} />

        <Text style={styles.label}>Mot de passe *</Text>
        <TextInput style={styles.input} placeholder="Minimum 6 caractères" placeholderTextColor="#BBB" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} />

        <Text style={styles.label}>Ville</Text>
        <TextInput style={styles.input} placeholder="Ta ville" placeholderTextColor="#BBB" value={ville} onChangeText={setVille} />

        <Text style={styles.label}>Ma bio 📝</Text>
        <TextInput
          style={styles.inputBio}
          placeholder="Décris-toi en quelques mots..."
          placeholderTextColor="#BBB"
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.label}>Activités favorites 🎯</Text>
        <TextInput style={styles.input} placeholder="Ex: Sport, Ciné, Resto, Voyages..." placeholderTextColor="#BBB" value={activitesFavorites} onChangeText={setActivitesFavorites} />

        {/* PHOTOS */}
        <View style={styles.photosBox}>
          <Text style={styles.boxTitre}>📸 Mes photos de profil</Text>
          <Text style={styles.boxSub}>Minimum 2 photos, maximum 3</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.supprimerPhoto}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                  <Text style={styles.supprimerTexte}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity style={styles.ajouterPhoto} onPress={choisirPhoto}>
                <Text style={styles.ajouterIcon}>+</Text>
                <Text style={styles.ajouterTexte}>{photos.length}/3</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* VERIFICATION */}
        <View style={styles.verificationBox}>
          <Text style={styles.boxTitre}>🪪 Vérification d'identité</Text>
          <Text style={styles.boxSub}>
            Pour la sécurité de tous, WyytU vérifie l'identité de chaque membre.
          </Text>
          {selfie ? (
            <View style={styles.selfieContainer}>
              <Image source={{ uri: selfie }} style={styles.selfiePreview} />
              <Text style={styles.selfieOk}>✅ Selfie validé !</Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.selfieBtn} onPress={prendreSelfiee}>
            <Text style={styles.selfieBtnTexte}>
              {selfie ? '🔄 Reprendre le selfie' : '🤳 Prendre mon selfie'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOUTON */}
        <TouchableOpacity
          style={[styles.bouton, loading && styles.boutonLoading]}
          onPress={inscrire}
          disabled={loading}>
          <Text style={styles.boutonTexte}>
            {loading ? 'Création en cours...' : 'Créer mon compte WyytU 🚀'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/connexion')}>
          <Text style={styles.lienTexte}>
            Déjà un compte ?{' '}
            <Text style={styles.lien}>Connecte-toi</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  logoWrapper: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoTexte: { color: '#fff', fontSize: 36, fontWeight: '800' },
  logo: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 6 },
  titre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sousTitre: { fontSize: 14, color: '#AAA', fontStyle: 'italic' },

  formulaire: { paddingHorizontal: 24, paddingBottom: 40 },

  messageBox: { borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  messageTexte: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  label: { color: '#1A1A1A', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  input: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 16, color: '#1A1A1A', fontSize: 15, borderWidth: 1, borderColor: '#DDD4C4' },
  inputBio: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 16, color: '#1A1A1A', fontSize: 15, borderWidth: 1, borderColor: '#DDD4C4', height: 100, textAlignVertical: 'top' },

  photosBox: { backgroundColor: '#EEE8DE', borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1.5, borderColor: '#0070F3' },
  verificationBox: { backgroundColor: '#EEE8DE', borderRadius: 20, padding: 20, marginTop: 16, borderWidth: 1.5, borderColor: '#E8000D' },

  boxTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  boxSub: { fontSize: 12, color: '#AAA', marginBottom: 16, lineHeight: 18 },

  photosGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoWrapper: { position: 'relative' },
  photoPreview: { width: 90, height: 90, borderRadius: 14 },
  supprimerPhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: '#E8000D', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#fff', fontSize: 12, fontWeight: '800' },
  ajouterPhoto: { width: 90, height: 90, borderRadius: 14, backgroundColor: '#FAF7F2', borderWidth: 2, borderColor: '#0070F3', alignItems: 'center', justifyContent: 'center' },
  ajouterIcon: { color: '#0070F3', fontSize: 30, fontWeight: '700' },
  ajouterTexte: { color: '#0070F3', fontSize: 12, marginTop: 2 },

  selfieContainer: { alignItems: 'center', marginBottom: 14 },
  selfiePreview: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#1DB954' },
  selfieOk: { color: '#1DB954', fontWeight: '800', marginTop: 8, fontSize: 14 },
  selfieBtn: { backgroundColor: '#E8000D', borderRadius: 14, padding: 14, alignItems: 'center' },
  selfieBtnTexte: { color: '#fff', fontSize: 14, fontWeight: '800' },

  bouton: { backgroundColor: '#E8000D', borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 28 },
  boutonLoading: { backgroundColor: '#AAA' },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },

  lienTexte: { color: '#AAA', textAlign: 'center', marginTop: 20, fontSize: 14 },
  lien: { color: '#E8000D', fontWeight: '800' },
});