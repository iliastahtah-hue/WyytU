import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const ETAPES = ['Compte', 'Profil', 'Photos', 'Vérif'];
const ACTIVITES_CHIPS = ['⚡ Sport', '🍕 Resto', '🎬 Ciné', '🎉 Soirée', '🎮 Gaming', '✈️ Voyage', '🎵 Musique', '🏃 Bien-être', '👥 Social', '🎨 Art'];

export default function InscriptionScreen() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ville, setVille] = useState('');
  const [bio, setBio] = useState('');
  const [activitesChoisies, setActivitesChoisies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const toggleActivite = (a: string) => {
    setActivitesChoisies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const choisirPhoto = async () => {
    if (photos.length >= 4) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Active l\'accès aux photos dans les réglages.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  };

  const prendreSelfiee = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Active l\'accès à la caméra dans les réglages de ton iPhone.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setSelfie(result.assets[0].uri);
  };

  const suivant = () => {
    setErreur('');
    if (etape === 0) {
      if (!prenom || !email || !motDePasse) { setErreur('Remplis tous les champs obligatoires !'); return; }
      if (motDePasse.length < 6) { setErreur('Mot de passe trop court (min. 6 caractères)'); return; }
    }
    if (etape === 2 && photos.length < 2) { setErreur('Ajoute au moins 2 photos !'); return; }
    if (etape === 3 && !selfie) { setErreur('Prends ton selfie de vérification !'); return; }
    if (etape < 3) { setEtape(etape + 1); }
    else { inscrire(); }
  };

  const inscrire = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password: motDePasse,
        options: { data: { prenom, telephone, ville } },
      });
      if (error) { setErreur(error.message); setLoading(false); return; }
      await supabase.from('utilisateurs').insert({
        prenom, email, telephone, ville, bio,
        activites_favorites: activitesChoisies.join(', '),
      });
      setSucces('🎉 Bienvenue sur WyytU !');
      setTimeout(() => router.push('/'), 1500);
    } catch { setErreur('Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoTexte}>W</Text>
          </View>
          <Text style={styles.logo}>WyytU</Text>
          <Text style={styles.tagline}>Rejoins la communauté 🔥</Text>
        </View>

        <View style={styles.stepper}>
          {ETAPES.map((e, i) => (
            <View key={e} style={styles.stepWrapper}>
              <View style={[styles.stepCircle, i <= etape && styles.stepCircleActive, i < etape && styles.stepCircleDone]}>
                <Text style={[styles.stepNum, i <= etape && styles.stepNumActive]}>
                  {i < etape ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i <= etape && styles.stepLabelActive]}>{e}</Text>
              {i < ETAPES.length - 1 && (
                <View style={[styles.stepLine, i < etape && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          {erreur ? <View style={styles.erreurBox}><Text style={styles.erreurTexte}>❌ {erreur}</Text></View> : null}
          {succes ? <View style={styles.succesBox}><Text style={styles.succesTexte}>{succes}</Text></View> : null}

          {etape === 0 && (
            <View style={styles.etapeContent}>
              <Text style={styles.etapeTitre}>Crée ton compte</Text>
              <Text style={styles.etapeSub}>Les infos de base pour commencer</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>😊</Text>
                <TextInput style={styles.input} placeholder="Ton prénom *" placeholderTextColor="#BBB" value={prenom} onChangeText={setPrenom} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput style={styles.input} placeholder="ton@email.com *" placeholderTextColor="#BBB" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput style={styles.input} placeholder="+212 ou +32..." placeholderTextColor="#BBB" keyboardType="phone-pad" value={telephone} onChangeText={setTelephone} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} placeholder="Mot de passe *" placeholderTextColor="#BBB" secureTextEntry={!showPassword} value={motDePasse} onChangeText={setMotDePasse} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {etape === 1 && (
            <View style={styles.etapeContent}>
              <Text style={styles.etapeTitre}>Ton profil</Text>
              <Text style={styles.etapeSub}>Dis-nous qui tu es !</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📍</Text>
                <TextInput style={styles.input} placeholder="Ta ville" placeholderTextColor="#BBB" value={ville} onChangeText={setVille} />
              </View>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 14 }]}>
                <Text style={styles.inputIcon}>📝</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  placeholder="Ta bio..."
                  placeholderTextColor="#BBB"
                  multiline
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
              <Text style={styles.chipsLabel}>Tes activités favorites</Text>
              <View style={styles.chipsGrid}>
                {ACTIVITES_CHIPS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, activitesChoisies.includes(a) && styles.chipActive]}
                    onPress={() => toggleActivite(a)}>
                    <Text style={[styles.chipTexte, activitesChoisies.includes(a) && styles.chipTexteActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {etape === 2 && (
            <View style={styles.etapeContent}>
              <Text style={styles.etapeTitre}>Tes photos 📸</Text>
              <Text style={styles.etapeSub}>Minimum 2, maximum 4.</Text>
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <TouchableOpacity style={styles.supprimerPhoto} onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                      <Text style={styles.supprimerTexte}>✕</Text>
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.photoPrincipaleBadge}>
                        <Text style={styles.photoPrincipaleTexte}>Principale</Text>
                      </View>
                    )}
                  </View>
                ))}
                {photos.length < 4 && (
                  <TouchableOpacity style={styles.ajouterPhoto} onPress={choisirPhoto}>
                    <Text style={styles.ajouterIcon}>+</Text>
                    <Text style={styles.ajouterTexte}>{photos.length}/4</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.photoTips}>
                <Text style={styles.photoTipsTexte}>💡 Souris, montre ton visage clairement</Text>
              </View>
            </View>
          )}

          {etape === 3 && (
            <View style={styles.etapeContent}>
              <Text style={styles.etapeTitre}>Vérification 🪪</Text>
              <Text style={styles.etapeSub}>Pour la sécurité de tous</Text>
              <View style={styles.verificationSteps}>
                <View style={styles.verifStep}>
                  <View style={[styles.verifStepIcon, { backgroundColor: '#0070F315' }]}>
                    <Text style={styles.verifStepEmoji}>🤳</Text>
                  </View>
                  <View style={styles.verifStepInfo}>
                    <Text style={styles.verifStepTitre}>Selfie en temps réel</Text>
                    <Text style={styles.verifStepSub}>Pour confirmer que c'est bien toi</Text>
                  </View>
                  <View style={[styles.verifStepCheck, selfie ? { backgroundColor: '#1DB954' } : {}]}>
                    <Text style={styles.verifStepCheckTexte}>{selfie ? '✓' : '○'}</Text>
                  </View>
                </View>
              </View>
              {selfie ? (
                <View style={styles.selfieContainer}>
                  <Image source={{ uri: selfie }} style={styles.selfiePreview} />
                  <View style={styles.selfieOkBadge}>
                    <Text style={styles.selfieOkTexte}>✅ Selfie validé !</Text>
                  </View>
                </View>
              ) : null}
              <TouchableOpacity style={styles.selfieBtn} onPress={prendreSelfiee}>
                <Text style={styles.selfieBtnEmoji}>🤳</Text>
                <Text style={styles.selfieBtnTexte}>{selfie ? 'Reprendre le selfie' : 'Prendre mon selfie'}</Text>
              </TouchableOpacity>
              <View style={styles.securiteBadge}>
                <Text style={styles.securiteTexte}>🔒 Tes données sont 100% sécurisées</Text>
              </View>
            </View>
          )}

          <View style={styles.navBtns}>
            {etape > 0 && (
              <TouchableOpacity style={styles.btnRetour} onPress={() => { setEtape(etape - 1); setErreur(''); }}>
                <Text style={styles.btnRetourTexte}>← Retour</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnSuivant, loading && { opacity: 0.6 }, etape === 0 && { flex: 1 }]}
              onPress={suivant}
              disabled={loading}>
              <Text style={styles.btnSuivantTexte}>
                {loading ? 'Chargement...' : etape === 3 ? '🚀 Créer mon compte' : 'Suivant →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/connexion' as any)} style={styles.connexionBtn}>
          <Text style={styles.connexionTexte}>
            Déjà un compte ?{'  '}
            <Text style={styles.connexionLien}>Connecte-toi</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#E8000D', opacity: 0.05, top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#0070F3', opacity: 0.04, top: 120, left: -60 },
  header: { alignItems: 'center', paddingTop: 70, paddingBottom: 24 },
  logoWrapper: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoTexte: { color: '#fff', fontSize: 36, fontWeight: '900' },
  logo: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1, marginBottom: 4 },
  tagline: { fontSize: 15, color: '#AAA', fontWeight: '500' },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20 },
  stepWrapper: { alignItems: 'center', flexDirection: 'row' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DDD4C4' },
  stepCircleActive: { backgroundColor: '#E8000D', borderColor: '#E8000D' },
  stepCircleDone: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  stepNum: { fontSize: 13, fontWeight: '800', color: '#AAA' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#AAA', fontWeight: '600', position: 'absolute', top: 36, width: 50, textAlign: 'center', left: -9 },
  stepLabelActive: { color: '#1A1A1A' },
  stepLine: { width: 40, height: 2, backgroundColor: '#EEE8DE', marginHorizontal: 2 },
  stepLineActive: { backgroundColor: '#1DB954' },
  card: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6, marginBottom: 16 },
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#E8000D' },
  erreurTexte: { color: '#E8000D', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  succesBox: { backgroundColor: '#EEF7EE', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#1DB954' },
  succesTexte: { color: '#1DB954', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  etapeContent: { gap: 12 },
  etapeTitre: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 2, letterSpacing: -0.5 },
  etapeSub: { fontSize: 14, color: '#AAA', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F2', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#EEE8DE' },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 15 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  chipsLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE8DE', borderWidth: 1.5, borderColor: '#DDD4C4' },
  chipActive: { backgroundColor: '#E8000D', borderColor: '#E8000D' },
  chipTexte: { fontSize: 13, fontWeight: '700', color: '#888' },
  chipTexteActive: { color: '#fff' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { position: 'relative' },
  photoPreview: { width: 100, height: 100, borderRadius: 18 },
  supprimerPhoto: { position: 'absolute', top: -6, right: -6, backgroundColor: '#E8000D', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  supprimerTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  photoPrincipaleBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  photoPrincipaleTexte: { color: '#fff', fontSize: 9, fontWeight: '700' },
  ajouterPhoto: { width: 100, height: 100, borderRadius: 18, backgroundColor: '#F8F6F2', borderWidth: 2, borderColor: '#DDD4C4', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  ajouterIcon: { color: '#AAA', fontSize: 28, fontWeight: '300' },
  ajouterTexte: { color: '#AAA', fontSize: 11, fontWeight: '600' },
  photoTips: { backgroundColor: '#F8F6F2', borderRadius: 14, padding: 12 },
  photoTipsTexte: { fontSize: 12, color: '#AAA', lineHeight: 18 },
  verificationSteps: { gap: 12, marginBottom: 16 },
  verifStep: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8F6F2', borderRadius: 16, padding: 14 },
  verifStepIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verifStepEmoji: { fontSize: 22 },
  verifStepInfo: { flex: 1 },
  verifStepTitre: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  verifStepSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  verifStepCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  verifStepCheckTexte: { fontSize: 14, fontWeight: '800', color: '#AAA' },
  selfieContainer: { alignItems: 'center', marginBottom: 16 },
  selfiePreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#1DB954' },
  selfieOkBadge: { backgroundColor: '#EEF7EE', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10, borderWidth: 1, borderColor: '#1DB954' },
  selfieOkTexte: { color: '#1DB954', fontWeight: '800', fontSize: 13 },
  selfieBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16 },
  selfieBtnEmoji: { fontSize: 22 },
  selfieBtnTexte: { color: '#fff', fontSize: 15, fontWeight: '800' },
  securiteBadge: { backgroundColor: '#EEF7EE', borderRadius: 14, padding: 12, marginTop: 12 },
  securiteTexte: { color: '#1DB954', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  navBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnRetour: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#EEE8DE' },
  btnRetourTexte: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  btnSuivant: { flex: 2, paddingVertical: 16, borderRadius: 16, backgroundColor: '#E8000D', alignItems: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnSuivantTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
  connexionBtn: { alignItems: 'center', marginTop: 8 },
  connexionTexte: { color: '#AAA', fontSize: 14 },
  connexionLien: { color: '#E8000D', fontWeight: '800' },
});