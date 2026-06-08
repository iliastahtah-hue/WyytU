import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
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

const { width, height } = Dimensions.get('window');

const ETAPES = [
  { label: 'Compte', emoji: '👤', desc: 'Tes infos de base' },
  { label: 'Profil', emoji: '✨', desc: 'Qui tu es' },
  { label: 'Photos', emoji: '📸', desc: 'Montre-toi' },
  { label: 'Vérif', emoji: '🔒', desc: 'Sécurité' },
];

const ACTIVITES_CHIPS = [
  { label: '⚡ Sport', couleur: '#E8000D' },
  { label: '🍕 Resto', couleur: '#FF6A00' },
  { label: '🎬 Ciné', couleur: '#CC0000' },
  { label: '🎉 Soirée', couleur: '#7B2FBE' },
  { label: '🎮 Gaming', couleur: '#0070F3' },
  { label: '✈️ Voyage', couleur: '#00B4D8' },
  { label: '🎵 Musique', couleur: '#1DB954' },
  { label: '🏃 Bien-être', couleur: '#00897B' },
  { label: '👥 Social', couleur: '#FF4B7D' },
  { label: '🎨 Art', couleur: '#FFD600' },
];

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
  const [focusField, setFocusField] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (toValue: number) => {
    Animated.spring(progressAnim, { toValue, useNativeDriver: false, tension: 60 }).start();
  };

  const toggleActivite = (a: string) => {
    setActivitesChoisies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const choisirPhoto = async () => {
    if (photos.length >= 4) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Active l\'accès aux photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  };

  const prendreSelfiee = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Active la caméra dans les réglages.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setSelfie(result.assets[0].uri);
  };

  const suivant = () => {
    setErreur('');
    if (etape === 0) {
      if (!prenom || !email || !motDePasse) { setErreur('Remplis tous les champs *'); return; }
      if (motDePasse.length < 6) { setErreur('Mot de passe trop court (min. 6)'); return; }
    }
    if (etape === 2 && photos.length < 2) { setErreur('Ajoute au moins 2 photos'); return; }
    if (etape === 3 && !selfie) { setErreur('Prends ton selfie de vérification'); return; }
    if (etape < 3) {
      setEtape(etape + 1);
      animateProgress((etape + 1) / 3);
    } else { inscrire(); }
  };

  const inscrire = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password: motDePasse, options: { data: { prenom, telephone, ville } } });
      if (error) { setErreur(error.message); setLoading(false); return; }
      await supabase.from('utilisateurs').insert({ prenom, email, telephone, ville, bio, activites_favorites: activitesChoisies.join(', ') });
      setSucces('🎉 Bienvenue sur WyytU !');
      setTimeout(() => router.push('/'), 1500);
    } catch { setErreur('Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* BG PREMIUM */}
      <View style={styles.bgTop} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoW}>W</Text>
          </View>
          <View>
            <Text style={styles.logo}>WyytU</Text>
            <Text style={styles.logoSub}>Rejoins la communauté</Text>
          </View>
        </View>

        {/* STEPPER PREMIUM */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperTrack}>
            <Animated.View style={[styles.stepperFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stepsRow}>
            {ETAPES.map((e, i) => (
              <View key={e.label} style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  i < etape && styles.stepDone,
                  i === etape && styles.stepActive,
                ]}>
                  <Text style={[styles.stepCircleTexte, (i <= etape) && styles.stepCircleTexteActive]}>
                    {i < etape ? '✓' : e.emoji}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, i === etape && styles.stepLabelActive]}>{e.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CARD PRINCIPALE */}
        <View style={styles.card}>

          {/* ÉTAPE HEADER */}
          <View style={styles.etapeHeader}>
            <Text style={styles.etapeEmoji}>{ETAPES[etape].emoji}</Text>
            <View>
              <Text style={styles.etapeTitre}>
                {etape === 0 ? 'Crée ton compte' : etape === 1 ? 'Ton profil' : etape === 2 ? 'Tes photos' : 'Vérification'}
              </Text>
              <Text style={styles.etapeSub}>{ETAPES[etape].desc}</Text>
            </View>
            <View style={styles.etapeNumBadge}>
              <Text style={styles.etapeNumTexte}>{etape + 1}/4</Text>
            </View>
          </View>

          {/* ALERTS */}
          {erreur ? (
            <View style={styles.alertErreur}>
              <Text style={styles.alertEmoji}>⚠️</Text>
              <Text style={styles.alertTexte}>{erreur}</Text>
            </View>
          ) : null}
          {succes ? (
            <View style={styles.alertSucces}>
              <Text style={styles.alertEmoji}>🎉</Text>
              <Text style={[styles.alertTexte, { color: '#1DB954' }]}>{succes}</Text>
            </View>
          ) : null}

          {/* ═══ ÉTAPE 0 — COMPTE ═══ */}
          {etape === 0 && (
            <View style={styles.etapeContent}>
              {[
                { key: 'prenom', icon: '😊', placeholder: 'Ton prénom *', value: prenom, set: setPrenom, type: 'default' },
                { key: 'email', icon: '✉️', placeholder: 'ton@email.com *', value: email, set: setEmail, type: 'email-address' },
                { key: 'tel', icon: '📱', placeholder: '+212 ou +32...', value: telephone, set: setTelephone, type: 'phone-pad' },
              ].map((field) => (
                <View key={field.key} style={[styles.fieldWrapper, focusField === field.key && styles.fieldWrapperFocus]}>
                  <View style={styles.fieldIconBox}>
                    <Text style={styles.fieldIcon}>{field.icon}</Text>
                  </View>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#AAA"
                    value={field.value}
                    onChangeText={field.set}
                    keyboardType={field.type as any}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                    onFocus={() => setFocusField(field.key)}
                    onBlur={() => setFocusField('')}
                  />
                  {field.key === 'email' && email.includes('@') && (
                    <View style={styles.fieldCheck}><Text style={styles.fieldCheckTexte}>✓</Text></View>
                  )}
                </View>
              ))}

              <View style={[styles.fieldWrapper, focusField === 'mdp' && styles.fieldWrapperFocus]}>
                <View style={styles.fieldIconBox}>
                  <Text style={styles.fieldIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Mot de passe *"
                  placeholderTextColor="#AAA"
                  secureTextEntry={!showPassword}
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  onFocus={() => setFocusField('mdp')}
                  onBlur={() => setFocusField('')}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              {/* FORCE MOT DE PASSE */}
              {motDePasse.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: motDePasse.length >= i * 3 ? (motDePasse.length >= 8 ? '#1DB954' : '#FF9500') : '#EEE8DE' }]} />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {motDePasse.length < 6 ? 'Trop court' : motDePasse.length < 8 ? 'Moyen' : 'Fort ✓'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═══ ÉTAPE 1 — PROFIL ═══ */}
          {etape === 1 && (
            <View style={styles.etapeContent}>
              <View style={[styles.fieldWrapper, focusField === 'ville' && styles.fieldWrapperFocus]}>
                <View style={styles.fieldIconBox}><Text style={styles.fieldIcon}>📍</Text></View>
                <TextInput style={styles.fieldInput} placeholder="Ta ville" placeholderTextColor="#AAA" value={ville} onChangeText={setVille} onFocus={() => setFocusField('ville')} onBlur={() => setFocusField('')} />
              </View>

              <View style={[styles.fieldWrapper, styles.fieldWrapperMulti, focusField === 'bio' && styles.fieldWrapperFocus]}>
                <View style={[styles.fieldIconBox, { alignSelf: 'flex-start', marginTop: 4 }]}><Text style={styles.fieldIcon}>💬</Text></View>
                <TextInput
                  style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Ta bio — ex: J'adore le sport et les sorties 🔥"
                  placeholderTextColor="#AAA"
                  multiline value={bio} onChangeText={setBio}
                  onFocus={() => setFocusField('bio')} onBlur={() => setFocusField('')}
                />
              </View>

              <Text style={styles.chipsLabel}>Tes activités favorites 🎯</Text>
              <View style={styles.chipsGrid}>
                {ACTIVITES_CHIPS.map((a) => {
                  const active = activitesChoisies.includes(a.label);
                  return (
                    <TouchableOpacity
                      key={a.label}
                      style={[styles.chip, active && { backgroundColor: a.couleur, borderColor: a.couleur }]}
                      onPress={() => toggleActivite(a.label)}>
                      <Text style={[styles.chipTexte, active && { color: '#fff' }]}>{a.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ═══ ÉTAPE 2 — PHOTOS ═══ */}
          {etape === 2 && (
            <View style={styles.etapeContent}>
              <View style={styles.photosInfo}>
                <Text style={styles.photosInfoTexte}>📸 Min. 2 photos · Max. 4 · Montre ton vrai toi !</Text>
              </View>

              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri: photo }} style={styles.photoImg} />
                    {index === 0 && <View style={styles.photoMainBadge}><Text style={styles.photoMainTexte}>⭐ Principal</Text></View>}
                    <TouchableOpacity style={styles.photoDelBtn} onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                      <Text style={styles.photoDelTexte}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < 4 && (
                  <TouchableOpacity style={styles.photoAddBtn} onPress={choisirPhoto}>
                    <Text style={styles.photoAddIcon}>+</Text>
                    <Text style={styles.photoAddLabel}>{photos.length}/4</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.photosTips}>
                {['😊 Souris naturellement', '💡 Bonne luminosité', '🙅 Pas de lunettes de soleil'].map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipTexte}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ═══ ÉTAPE 3 — VÉRIFICATION ═══ */}
          {etape === 3 && (
            <View style={styles.etapeContent}>
              <View style={styles.verifCard}>
                <Text style={styles.verifEmoji}>🛡️</Text>
                <Text style={styles.verifTitre}>Identité vérifiée</Text>
                <Text style={styles.verifDesc}>WyytU vérifie chaque membre pour garantir la sécurité de tous</Text>
              </View>

              <View style={styles.verifStep}>
                <View style={[styles.verifStepIcon, { backgroundColor: selfie ? '#1DB95420' : '#F8F6F2' }]}>
                  <Text style={styles.verifStepEmoji}>🤳</Text>
                </View>
                <View style={styles.verifStepInfo}>
                  <Text style={styles.verifStepTitre}>Selfie en temps réel</Text>
                  <Text style={styles.verifStepSub}>Confirme que c'est bien toi</Text>
                </View>
                <View style={[styles.verifCheck, selfie && styles.verifCheckDone]}>
                  <Text style={styles.verifCheckTexte}>{selfie ? '✓' : '○'}</Text>
                </View>
              </View>

              {selfie && (
                <View style={styles.selfiePreviewWrapper}>
                  <Image source={{ uri: selfie }} style={styles.selfieImg} />
                  <View style={styles.selfieBadge}>
                    <Text style={styles.selfieBadgeTexte}>✅ Selfie validé !</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.selfieBtn} onPress={prendreSelfiee} activeOpacity={0.85}>
                <Text style={styles.selfieBtnEmoji}>🤳</Text>
                <Text style={styles.selfieBtnTexte}>{selfie ? 'Reprendre le selfie' : 'Prendre mon selfie'}</Text>
              </TouchableOpacity>

              <View style={styles.securityBadge}>
                <Text style={styles.securityTexte}>🔒 Tes données sont chiffrées et ne seront jamais partagées</Text>
              </View>
            </View>
          )}

          {/* BOUTONS NAV */}
          <View style={styles.navBtns}>
            {etape > 0 && (
              <TouchableOpacity style={styles.btnBack} onPress={() => { setEtape(etape - 1); setErreur(''); animateProgress((etape - 1) / 3); }}>
                <Text style={styles.btnBackTexte}>←</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnNext, loading && { opacity: 0.6 }, etape === 0 && { flex: 1 }]}
              onPress={suivant}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.btnNextTexte}>
                {loading ? '⏳ Création...' : etape === 3 ? '🚀 Créer mon compte' : `Suivant →`}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* LIEN CONNEXION */}
        <TouchableOpacity onPress={() => router.push('/connexion' as any)} style={styles.loginLink}>
          <Text style={styles.loginTexte}>
            Déjà membre ?  <Text style={styles.loginLien}>Connecte-toi →</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.45, backgroundColor: '#0D0D0D' },
  bgCircle1: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#E8000D', opacity: 0.08, top: -100, right: -80 },
  bgCircle2: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7B2FBE', opacity: 0.06, top: 80, left: -60 },
  scroll: { paddingBottom: 40 },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 28 },
  logoWrapper: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  logoW: { color: '#fff', fontSize: 28, fontWeight: '900' },
  logo: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // STEPPER
  stepperContainer: { paddingHorizontal: 24, marginBottom: 24 },
  stepperTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  stepperFill: { height: 3, backgroundColor: '#E8000D', borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  stepActive: { backgroundColor: '#E8000D', borderColor: '#E8000D', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  stepDone: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  stepCircleTexte: { fontSize: 18, color: 'rgba(255,255,255,0.4)' },
  stepCircleTexteActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  stepLabelActive: { color: '#fff', fontWeight: '800' },

  // CARD
  card: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 12 },

  // ÉTAPE HEADER
  etapeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  etapeEmoji: { fontSize: 30, width: 44, textAlign: 'center' },
  etapeTitre: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  etapeSub: { fontSize: 13, color: '#AAA', marginTop: 2 },
  etapeNumBadge: { marginLeft: 'auto', backgroundColor: '#F5F3EF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  etapeNumTexte: { fontSize: 12, fontWeight: '800', color: '#1A1A1A' },

  // ALERTS
  alertErreur: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#E8000D30' },
  alertSucces: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF7EE', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#1DB95430' },
  alertEmoji: { fontSize: 18 },
  alertTexte: { flex: 1, fontSize: 13, fontWeight: '700', color: '#E8000D' },

  // FIELDS
  etapeContent: { gap: 12 },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F2', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: '#F0EDE8' },
  fieldWrapperFocus: { borderColor: '#E8000D', backgroundColor: '#FFF8F8' },
  fieldWrapperMulti: { alignItems: 'flex-start', paddingVertical: 10 },
  fieldIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldIcon: { fontSize: 18 },
  fieldInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  fieldCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fieldCheckTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },

  // FORCE MOT DE PASSE
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', width: 60 },

  // CHIPS
  chipsLabel: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginTop: 4 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F0EDE8', borderWidth: 2, borderColor: '#EEE8DE' },
  chipTexte: { fontSize: 13, fontWeight: '700', color: '#888' },

  // PHOTOS
  photosInfo: { backgroundColor: '#F8F6F2', borderRadius: 16, padding: 12, marginBottom: 4 },
  photosInfoTexte: { fontSize: 13, color: '#888', fontWeight: '600', textAlign: 'center' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { position: 'relative' },
  photoImg: { width: 96, height: 96, borderRadius: 20 },
  photoMainBadge: { position: 'absolute', bottom: 6, left: 0, right: 0, alignItems: 'center' },
  photoMainTexte: { backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 9, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  photoDelBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#E8000D', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  photoDelTexte: { color: '#fff', fontSize: 11, fontWeight: '900' },
  photoAddBtn: { width: 96, height: 96, borderRadius: 20, backgroundColor: '#F8F6F2', borderWidth: 2, borderColor: '#E8000D', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoAddIcon: { color: '#E8000D', fontSize: 32, fontWeight: '300' },
  photoAddLabel: { color: '#E8000D', fontSize: 11, fontWeight: '700' },
  photosTips: { backgroundColor: '#F8F6F2', borderRadius: 16, padding: 14, gap: 6 },
  tipRow: { flexDirection: 'row', alignItems: 'center' },
  tipTexte: { fontSize: 12, color: '#888', fontWeight: '500' },

  // VÉRIFICATION
  verifCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, alignItems: 'center', gap: 8, marginBottom: 4 },
  verifEmoji: { fontSize: 36 },
  verifTitre: { color: '#fff', fontSize: 16, fontWeight: '900' },
  verifDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  verifStep: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8F6F2', borderRadius: 18, padding: 14 },
  verifStepIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verifStepEmoji: { fontSize: 24 },
  verifStepInfo: { flex: 1 },
  verifStepTitre: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  verifStepSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  verifCheck: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  verifCheckDone: { backgroundColor: '#1DB954' },
  verifCheckTexte: { fontSize: 14, fontWeight: '800', color: '#AAA' },
  selfiePreviewWrapper: { alignItems: 'center', gap: 10 },
  selfieImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#1DB954' },
  selfieBadge: { backgroundColor: '#EEF7EE', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#1DB954' },
  selfieBadgeTexte: { color: '#1DB954', fontWeight: '800', fontSize: 13 },
  selfieBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1A1A1A', borderRadius: 18, padding: 17 },
  selfieBtnEmoji: { fontSize: 22 },
  selfieBtnTexte: { color: '#fff', fontSize: 15, fontWeight: '800' },
  securityBadge: { backgroundColor: '#EEF7EE', borderRadius: 14, padding: 12 },
  securityTexte: { color: '#1DB954', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  // NAV BTNS
  navBtns: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btnBack: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
  btnBackTexte: { fontSize: 22, color: '#1A1A1A' },
  btnNext: { flex: 2, borderRadius: 18, padding: 17, backgroundColor: '#E8000D', alignItems: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnNextTexte: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },

  // LOGIN LINK
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginTexte: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  loginLien: { color: '#E8000D', fontWeight: '800' },
});