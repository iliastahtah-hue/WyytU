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
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: motDePasse,
        options: {
          data: {
            prenom: prenom,
            telephone: telephone,
            ville: ville,
          }
        }
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        await supabase.from('utilisateurs').insert({
          prenom: prenom,
          email: email,
          telephone: telephone,
          ville: ville,
          bio: bio,
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Crée ton compte</Text>
        <Text style={styles.sousTitre}>Rejoins la communauté 🔥</Text>
      </View>

      <View style={styles.formulaire}>

        {message ? (
          <View style={[styles.messageBox, {
            borderColor: message.includes('❌') ? '#FF4444' : '#27AE60',
            backgroundColor: message.includes('❌') ? '#3A1A1A' : '#1A3A2A',
          }]}>
            <Text style={[styles.messageTexte, {
              color: message.includes('❌') ? '#FF4444' : '#27AE60'
            }]}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Prénom *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ton prénom"
          placeholderTextColor="#888"
          value={prenom}
          onChangeText={setPrenom}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="ton@email.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="+32 ou +212..."
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
        />

        <Text style={styles.label}>Mot de passe *</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 6 caractères"
          placeholderTextColor="#888"
          secureTextEntry={true}
          value={motDePasse}
          onChangeText={setMotDePasse}
        />

        <Text style={styles.label}>Ville</Text>
        <TextInput
          style={styles.input}
          placeholder="Ta ville"
          placeholderTextColor="#888"
          value={ville}
          onChangeText={setVille}
        />

        <Text style={styles.label}>Ma bio 📝</Text>
        <TextInput
          style={styles.inputBio}
          placeholder="Décris-toi en quelques mots... Ex: Sportif, jovial, toujours partant pour une aventure !"
          placeholderTextColor="#888"
          multiline={true}
          numberOfLines={4}
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.label}>Mes activités favorites 🎯</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Sport, Cinéma, Restaurant, Voyages..."
          placeholderTextColor="#888"
          value={activitesFavorites}
          onChangeText={setActivitesFavorites}
        />

        <View style={styles.photosBox}>
          <Text style={styles.photosTitre}>
            📸 Mes photos de profil
          </Text>
          <Text style={styles.photosSubTitre}>
            Minimum 2 photos, maximum 3
          </Text>

          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.supprimerPhoto}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                  <Text style={styles.supprimerPhotoTexte}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 3 && (
              <TouchableOpacity style={styles.ajouterPhoto} onPress={choisirPhoto}>
                <Text style={styles.ajouterPhotoIcon}>+</Text>
                <Text style={styles.ajouterPhotoTexte}>
                  {photos.length}/3
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.verificationBox}>
          <Text style={styles.verificationTitre}>
            🪪 Vérification d'identité
          </Text>
          <Text style={styles.verificationTexte}>
            Pour la sécurité de tous, WyytU vérifie l'identité de chaque membre. Prends un selfie pour confirmer ton identité.
          </Text>

          {selfie ? (
            <View style={styles.selfiePreviewContainer}>
              <Image source={{ uri: selfie }} style={styles.selfiePreview} />
              <Text style={styles.selfieOk}>✅ Selfie validé !</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.verificationBouton} onPress={prendreSelfiee}>
            <Text style={styles.verificationBoutonTexte}>
              {selfie ? '🔄 Reprendre le selfie' : '🤳 Prendre mon selfie de vérification'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.boutonInscription, loading && styles.boutonLoading]}
          onPress={inscrire}
          disabled={loading}>
          <Text style={styles.boutonInscriptionTexte}>
            {loading ? 'Création en cours...' : 'Créer mon compte WyytU'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/connexion')}>
          <Text style={styles.connexionTexte}>
            Déjà un compte ?{' '}
            <Text style={styles.connexionLien}>Connecte-toi</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2E5A' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 10 },
  sousTitre: { fontSize: 16, color: '#FF6B2B', marginTop: 6, fontStyle: 'italic' },
  formulaire: { paddingHorizontal: 24, paddingBottom: 40 },
  messageBox: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  messageTexte: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#243660', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#2B4C9B' },
  inputBio: { backgroundColor: '#243660', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#2B4C9B', height: 100, textAlignVertical: 'top' },
  photosBox: { backgroundColor: '#243660', borderRadius: 16, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#3498DB' },
  photosTitre: { color: '#3498DB', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  photosSubTitre: { color: '#AAAAAA', fontSize: 12, marginBottom: 16 },
  photosGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoWrapper: { position: 'relative' },
  photoPreview: { width: 90, height: 90, borderRadius: 12 },
  supprimerPhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FF4444', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  supprimerPhotoTexte: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  ajouterPhoto: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#1A2E5A', borderWidth: 2, borderColor: '#3498DB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  ajouterPhotoIcon: { color: '#3498DB', fontSize: 30, fontWeight: 'bold' },
  ajouterPhotoTexte: { color: '#3498DB', fontSize: 12 },
  verificationBox: { backgroundColor: '#243660', borderRadius: 16, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#FF6B2B' },
  verificationTitre: { color: '#FF6B2B', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  verificationTexte: { color: '#AAAAAA', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  selfiePreviewContainer: { alignItems: 'center', marginBottom: 12 },
  selfiePreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#27AE60' },
  selfieOk: { color: '#27AE60', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  verificationBouton: { backgroundColor: '#FF6B2B', borderRadius: 12, padding: 14, alignItems: 'center' },
  verificationBoutonTexte: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  boutonInscription: { backgroundColor: '#FF6B2B', borderRadius: 30, padding: 18, alignItems: 'center', marginTop: 30 },
  boutonLoading: { backgroundColor: '#AA4400' },
  boutonInscriptionTexte: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  connexionTexte: { color: '#AAAAAA', textAlign: 'center', marginTop: 20, fontSize: 14 },
  connexionLien: { color: '#FF6B2B', fontWeight: 'bold' },
});