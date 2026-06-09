import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// ─── PALETTE WyytU ───────────────────────────────────────────────────────────
const C = {
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDark: '#A07830',
  beige: '#FAF7F2',
  beigeDeep: '#EEE8DE',
  brown: '#1A1209',
  brownMid: '#5C4A2A',
  white: '#FFFFFF',
  grayLight: '#F0EDE8',
  grayMid: '#C8C0B4',
  grayText: '#8A7F72',
  error: '#D94F3D',
};

// ─── ÉTAPES ──────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;

// ─── DONNÉES ─────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'sport', emoji: '🏃', label: 'Sport & Fitness', desc: 'Cours, gym, randos, matchs...' },
  { id: 'sorties', emoji: '🎉', label: 'Sorties & Soirées', desc: 'Fêtes, clubs, afterworks...' },
  { id: 'culture', emoji: '🎨', label: 'Culture & Loisirs', desc: 'Expos, ciné, concerts...' },
  { id: 'food', emoji: '🍽️', label: 'Food & Restos', desc: 'Bons plans cuisine & restos...' },
];

const INTERETS_CATEGORIES = [
  {
    cat: 'Sport & Bien-être',
    items: ['Football', 'Basketball', 'Tennis', 'Running', 'Yoga', 'CrossFit', 'Natation', 'Randonnée', 'Cyclisme', 'Arts martiaux'],
  },
  {
    cat: 'Culture & Loisirs',
    items: ['Cinéma', 'Musique', 'Concerts', 'Théâtre', 'Musées', 'Lecture', 'Photography', 'Danse', 'Jeux vidéo', 'Voyages'],
  },
  {
    cat: 'Food & Sorties',
    items: ['Cuisine', 'Restos', 'Street food', 'Cafés', 'Rooftops', 'Soirées', 'Brunches', 'Pâtisserie', 'Cocktails', 'Night life'],
  },
];

const LIFESTYLE_QUESTIONS = [
  {
    id: 'sport_freq',
    icon: '💪',
    question: 'Tu fais du sport ?',
    options: ['Tous les jours', 'Souvent', 'Parfois', 'Jamais'],
  },
  {
    id: 'sortie_freq',
    icon: '🌙',
    question: 'Tu sors le week-end ?',
    options: ['Toujours', 'Souvent', 'Parfois', 'Rarement'],
  },
  {
    id: 'food_pref',
    icon: '🍕',
    question: 'Ton rapport à la bouffe ?',
    options: ['Foodie passionné', 'J\'aime bien manger', 'Je mange pour vivre', 'Healthy only'],
  },
  {
    id: 'niveau',
    icon: '🎓',
    question: 'Ton niveau d\'étude ?',
    options: ['Lycée', 'Bac+2/3', 'Bac+5', 'Doctorat', 'Autodidacte'],
  },
];

// ─── COMPOSANTS RÉUTILISABLES ─────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const progress = (step / TOTAL_STEPS) * 100;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={pb.container}>
      <Animated.View
        style={[
          pb.fill,
          {
            width: anim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const pb = StyleSheet.create({
  container: {
    height: 3,
    backgroundColor: C.beigeDeep,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: C.gold,
    borderRadius: 2,
  },
});

function NextButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    if (!disabled) onPress();
  };
  return (
    <Animated.View style={[nb.wrap, { transform: [{ scale }], opacity: disabled ? 0.35 : 1 }]}>
      <TouchableOpacity onPress={press} activeOpacity={0.85}>
        <LinearGradient colors={[C.goldLight, C.gold]} style={nb.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={nb.arrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const nb = StyleSheet.create({
  wrap: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 20, right: 16, zIndex: 999 },
  btn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  arrow: { fontSize: 26, color: C.white, fontWeight: '700' },
});

function BigButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={[bbs.btn, disabled && bbs.disabled]}>
      <LinearGradient colors={disabled ? [C.grayLight, C.grayMid] : [C.goldLight, C.gold]} style={bbs.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[bbs.txt, disabled && bbs.txtDis]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const bbs = StyleSheet.create({
  btn: { marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  grad: { paddingVertical: 18, alignItems: 'center' },
  txt: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: 0.3 },
  disabled: { shadowOpacity: 0 },
  txtDis: { color: C.grayText },
});

function StepLayout({
  step,
  onBack,
  children,
  showBack = true,
  showSkip = false,
  onSkip,
}: {
  step: number;
  onBack?: () => void;
  children: React.ReactNode;
  showBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}) {
  return (
    <View style={sl.root}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={sl.header}>
        {showBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={sl.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={sl.backArrow}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={sl.backBtn} />
        )}
        <View style={sl.barWrap}>
          <ProgressBar step={step} />
        </View>
        {showSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={sl.skip}>Passer</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>
      {children}
    </View>
  );
}

const sl = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.beige },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 8, gap: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 30, color: C.brownMid, fontWeight: '300', lineHeight: 34 },
  barWrap: { flex: 1 },
  skip: { fontSize: 15, fontWeight: '600', color: C.grayText, width: 60, textAlign: 'right' },
});

// ─── ÉCRANS ───────────────────────────────────────────────────────────────────

// STEP 0: Splash
function SplashScreen({ onNext }: { onNext: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onNext, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={[C.beige, C.beigeDeep, '#DDD4C4']} style={splash.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <View style={splash.logoBox}>
          <Text style={splash.logoText}>W</Text>
          <View style={splash.goldDot} />
        </View>
        <Text style={splash.appName}>WyytU</Text>
        <Text style={splash.tagline}>Trouve ta bande, vis tes passions</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const splash = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBox: { width: 90, height: 90, borderRadius: 28, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: C.goldDark, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  logoText: { fontSize: 52, fontWeight: '800', color: C.white },
  goldDot: { position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderRadius: 7, backgroundColor: C.white },
  appName: { fontSize: 40, fontWeight: '800', color: C.brown, letterSpacing: -1 },
  tagline: { fontSize: 16, color: C.grayText, marginTop: 10, fontWeight: '500' },
});

// STEP 1: Téléphone
function StepPhone({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState({ code: 'MA', dial: '+212', flag: '🇲🇦' });

  const countries = [
    { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Maroc' },
    { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgique' },
    { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
    { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Pays-Bas' },
  ];

  const [showCountry, setShowCountry] = useState(false);

  return (
    <StepLayout step={step} onBack={onBack}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={ph.scroll} keyboardShouldPersistTaps="handled">
          <Text style={ph.title}>Quel est ton numéro ?</Text>
          <Text style={ph.sub}>Ton numéro est uniquement utilisé pour vérifier ton identité.</Text>

          <View style={ph.row}>
            <TouchableOpacity style={ph.countryBtn} onPress={() => setShowCountry(true)}>
              <Text style={ph.flag}>{country.flag}</Text>
              <Text style={ph.dial}>{country.dial}</Text>
              <Text style={ph.chevron}>▾</Text>
            </TouchableOpacity>
            <TextInput
              style={ph.input}
              placeholder="06 64 68 35 62"
              placeholderTextColor={C.grayMid}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          <View style={ph.noteRow}>
            <Text style={ph.lock}>🔒</Text>
            <Text style={ph.note}>Ton numéro ne sera jamais visible sur ton profil.</Text>
          </View>
        </ScrollView>

        <NextButton onPress={() => phone.length >= 8 && onNext(country.dial + phone)} disabled={phone.length < 8} />
      </KeyboardAvoidingView>

      <Modal visible={showCountry} transparent animationType="slide">
        <View style={ph.modalOverlay}>
          <View style={ph.modalCard}>
            <Text style={ph.modalTitle}>Choisir un pays</Text>
            {countries.map(c => (
              <TouchableOpacity key={c.code} style={ph.countryItem} onPress={() => { setCountry(c); setShowCountry(false); }}>
                <Text style={ph.flag}>{c.flag}</Text>
                <Text style={ph.countryName}>{c.name}</Text>
                <Text style={ph.dial}>{c.dial}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowCountry(false)} style={ph.closeModal}>
              <Text style={ph.closeModalTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

const ph = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 10, lineHeight: 36 },
  sub: { fontSize: 15, color: C.grayText, marginBottom: 36, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: C.beigeDeep },
  flag: { fontSize: 20 },
  dial: { fontSize: 15, fontWeight: '700', color: C.brown },
  chevron: { fontSize: 11, color: C.grayText },
  input: { flex: 1, backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontSize: 18, fontWeight: '600', color: C.brown, borderWidth: 1.5, borderColor: C.gold },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  lock: { fontSize: 14, marginTop: 2 },
  note: { fontSize: 13, color: C.grayText, flex: 1, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.beige, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.brown, marginBottom: 20 },
  countryItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.beigeDeep },
  countryName: { flex: 1, fontSize: 16, fontWeight: '600', color: C.brown },
  closeModal: { marginTop: 24, alignItems: 'center', padding: 14, backgroundColor: C.grayLight, borderRadius: 14 },
  closeModalTxt: { fontSize: 16, fontWeight: '700', color: C.brownMid },
});

// STEP 2: OTP
function StepOTP({ step, phone, onBack, onNext }: { step: number; phone: string; onBack: () => void; onNext: () => void }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const id = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const full = code.join('').length === 6;

  return (
    <StepLayout step={step} onBack={onBack}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={otp.container}>
          <Text style={otp.title}>Vérifie ton numéro</Text>
          <Text style={otp.sub}>Code envoyé au <Text style={otp.phone}>{phone}</Text></Text>

          <View style={otp.boxes}>
            {code.map((c, i) => (
              <TextInput
                key={i}
                ref={r => (inputs.current[i] = r)}
                style={[otp.box, c !== '' && otp.boxFilled]}
                value={c}
                onChangeText={v => handleChange(v.slice(-1), i)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={i === 0}
              />
            ))}
          </View>

          <View style={otp.resendRow}>
            <Text style={otp.resendLabel}>Code non reçu ? </Text>
            {timer > 0 ? (
              <Text style={otp.timer}>Renvoyer dans {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => setTimer(30)}>
                <Text style={otp.resendLink}>Renvoyer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <NextButton onPress={onNext} disabled={!full} />
      </KeyboardAvoidingView>
    </StepLayout>
  );
}

const otp = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 10 },
  sub: { fontSize: 15, color: C.grayText, marginBottom: 40 },
  phone: { fontWeight: '700', color: C.brownMid },
  boxes: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  box: { flex: 1, aspectRatio: 1, borderRadius: 16, backgroundColor: C.white, borderWidth: 2, borderColor: C.beigeDeep, textAlign: 'center', fontSize: 24, fontWeight: '700', color: C.brown },
  boxFilled: { borderColor: C.gold, backgroundColor: '#FDF8EE' },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendLabel: { fontSize: 14, color: C.grayText },
  timer: { fontSize: 14, color: C.grayMid, fontWeight: '600' },
  resendLink: { fontSize: 14, color: C.gold, fontWeight: '700' },
});

// STEP 3: Prénom
function StepPrenom({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (prenom: string) => void }) {
  const [prenom, setPrenom] = useState('');
  return (
    <StepLayout step={step} onBack={onBack}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={pr.container}>
          <Text style={pr.title}>C'est quoi ton prénom ?</Text>
          <Text style={pr.sub}>Ton prénom sera visible sur ton profil.</Text>
          <View style={pr.inputWrap}>
            <Text style={pr.label}>Prénom</Text>
            <TextInput
              style={pr.input}
              placeholder="Ilias"
              placeholderTextColor={C.grayMid}
              value={prenom}
              onChangeText={setPrenom}
              autoFocus
              autoCapitalize="words"
            />
            <View style={pr.underline} />
            <Text style={pr.hint}>Voici comment ça va apparaître sur ton profil.</Text>
          </View>
        </View>
        <NextButton onPress={() => prenom.trim().length > 0 && onNext(prenom.trim())} disabled={prenom.trim().length === 0} />
      </KeyboardAvoidingView>
    </StepLayout>
  );
}

const pr = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 10 },
  sub: { fontSize: 15, color: C.grayText, marginBottom: 40 },
  inputWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: C.brownMid, letterSpacing: 0.5 },
  input: { fontSize: 26, fontWeight: '700', color: C.brown, paddingVertical: 8 },
  underline: { height: 2, backgroundColor: C.gold, borderRadius: 1 },
  hint: { fontSize: 13, color: C.grayText, marginTop: 6 },
});

// STEP 4: Date de naissance
function StepDateNaissance({ step, prenom, onBack, onNext }: { step: number; prenom: string; onBack: () => void; onNext: (dob: string) => void }) {
  const [jour, setJour] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const moisRef = useRef<TextInput>(null);
  const anneeRef = useRef<TextInput>(null);

  const getAge = () => {
    const d = new Date(parseInt(annee), parseInt(mois) - 1, parseInt(jour));
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const valid = jour.length === 2 && mois.length === 2 && annee.length === 4;

  return (
    <StepLayout step={step} onBack={onBack}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={dn.container}>
          <Text style={dn.title}>C'est quand ton anniv' ?</Text>
          <Text style={dn.sub}>Ton âge sera visible sur ton profil, pas ta date de naissance.</Text>

          <View style={dn.row}>
            <View style={dn.field}>
              <Text style={dn.label}>Jour</Text>
              <TextInput
                style={dn.input}
                placeholder="JJ"
                placeholderTextColor={C.grayMid}
                keyboardType="number-pad"
                maxLength={2}
                value={jour}
                onChangeText={v => { setJour(v); if (v.length === 2) moisRef.current?.focus(); }}
                autoFocus
              />
            </View>
            <View style={dn.field}>
              <Text style={dn.label}>Mois</Text>
              <TextInput
                ref={moisRef}
                style={dn.input}
                placeholder="MM"
                placeholderTextColor={C.grayMid}
                keyboardType="number-pad"
                maxLength={2}
                value={mois}
                onChangeText={v => { setMois(v); if (v.length === 2) anneeRef.current?.focus(); }}
              />
            </View>
            <View style={[dn.field, { flex: 1.5 }]}>
              <Text style={dn.label}>Année</Text>
              <TextInput
                ref={anneeRef}
                style={dn.input}
                placeholder="AAAA"
                placeholderTextColor={C.grayMid}
                keyboardType="number-pad"
                maxLength={4}
                value={annee}
                onChangeText={setAnnee}
              />
            </View>
          </View>
        </View>

        <NextButton
          onPress={() => valid && setShowConfirm(true)}
          disabled={!valid}
        />
      </KeyboardAvoidingView>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={dn.overlay}>
          <View style={dn.card}>
            <Text style={dn.cardTitle}>Tu as {getAge()} ans</Text>
            <Text style={dn.cardSub}>Vérifie bien ton âge, tu ne pourras pas le modifier après.</Text>
            <View style={dn.cardBtns}>
              <TouchableOpacity style={dn.btnMod} onPress={() => setShowConfirm(false)}>
                <Text style={dn.btnModTxt}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dn.btnConf} onPress={() => { setShowConfirm(false); onNext(`${annee}-${mois}-${jour}`); }}>
                <Text style={dn.btnConfTxt}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

const dn = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 10 },
  sub: { fontSize: 15, color: C.grayText, marginBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: C.grayText, letterSpacing: 0.5 },
  input: { backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16, fontSize: 20, fontWeight: '700', color: C.brown, borderWidth: 2, borderColor: C.gold, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { backgroundColor: C.beige, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.brown, marginBottom: 10 },
  cardSub: { fontSize: 14, color: C.grayText, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  cardBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  btnMod: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.grayLight, alignItems: 'center' },
  btnModTxt: { fontSize: 15, fontWeight: '700', color: C.brownMid },
  btnConf: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.gold, alignItems: 'center' },
  btnConfTxt: { fontSize: 15, fontWeight: '700', color: C.white },
});

// STEP 5: Genre
function StepGenre({ step, prenom, onBack, onNext }: { step: number; prenom: string; onBack: () => void; onNext: (genre: string, afficher: boolean) => void }) {
  const [selected, setSelected] = useState('');
  const [afficher, setAfficher] = useState(true);

  const genres = [
    { id: 'femme', label: 'Je suis une femme' },
    { id: 'homme', label: 'Je suis un homme' },
    { id: 'autre', label: 'Autre / Non-binaire' },
  ];

  return (
    <StepLayout step={step} onBack={onBack}>
      <View style={gn.container}>
        <Text style={gn.title}>Qu'est-ce qui te{'\n'}décrit le mieux ?</Text>

        <View style={gn.options}>
          {genres.map(g => (
            <TouchableOpacity key={g.id} style={[gn.option, selected === g.id && gn.optSelected]} onPress={() => setSelected(g.id)} activeOpacity={0.75}>
              <Text style={[gn.optTxt, selected === g.id && gn.optTxtSel]}>{g.label}</Text>
              <View style={[gn.radio, selected === g.id && gn.radioSel]}>
                {selected === g.id && <View style={gn.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={gn.toggleRow}>
          <View style={gn.toggleText}>
            <Text style={gn.toggleLabel}>Afficher sur mon profil ?</Text>
            <Text style={gn.toggleSub}>Modifiable plus tard</Text>
          </View>
          <Switch
            value={afficher}
            onValueChange={setAfficher}
            trackColor={{ false: C.grayMid, true: C.gold }}
            thumbColor={C.white}
          />
        </View>
      </View>
      <NextButton onPress={() => selected && onNext(selected, afficher)} disabled={!selected} />
    </StepLayout>
  );
}

const gn = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 32, lineHeight: 36 },
  options: { gap: 12, marginBottom: 28 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 18, borderWidth: 2, borderColor: C.beigeDeep },
  optSelected: { borderColor: C.gold, backgroundColor: '#FDF8EE' },
  optTxt: { flex: 1, fontSize: 17, fontWeight: '600', color: C.brownMid },
  optTxtSel: { color: C.brown },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.grayMid, justifyContent: 'center', alignItems: 'center' },
  radioSel: { borderColor: C.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.gold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.beigeDeep },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: C.brown },
  toggleSub: { fontSize: 12, color: C.grayText, marginTop: 2 },
});

// STEP 6: Mode / Ambiance
function StepMode({ step, prenom, onBack, onNext }: { step: number; prenom: string; onBack: () => void; onNext: (mode: string) => void }) {
  const [selected, setSelected] = useState('');

  return (
    <StepLayout step={step} onBack={onBack}>
      <View style={md.container}>
        <Text style={md.title}>Quelle est ton{'\n'}ambiance, {prenom} ?</Text>
        <Text style={md.sub}>Choisis ce qui correspond à ton mood du moment !</Text>

        <View style={md.grid}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[md.card, selected === m.id && md.cardSel]}
              onPress={() => setSelected(m.id)}
              activeOpacity={0.75}
            >
              <Text style={md.emoji}>{m.emoji}</Text>
              <Text style={[md.cardLabel, selected === m.id && md.cardLabelSel]}>{m.label}</Text>
              <Text style={md.cardDesc}>{m.desc}</Text>
              {selected === m.id && (
                <View style={md.checkBadge}>
                  <Text style={md.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <NextButton onPress={() => selected && onNext(selected)} disabled={!selected} />
    </StepLayout>
  );
}

const md = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '800', color: C.brown, marginBottom: 10, lineHeight: 34 },
  sub: { fontSize: 14, color: C.grayText, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: (width - 52) / 2, backgroundColor: C.white, borderRadius: 20, padding: 18, borderWidth: 2, borderColor: C.beigeDeep, position: 'relative', minHeight: 120 },
  cardSel: { borderColor: C.gold, backgroundColor: '#FDF8EE' },
  emoji: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '800', color: C.brownMid, marginBottom: 4 },
  cardLabelSel: { color: C.brown },
  cardDesc: { fontSize: 12, color: C.grayText, lineHeight: 16 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 13, color: C.white, fontWeight: '800' },
});

// STEP 7: Centres d'intérêt
function StepInterets({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (interets: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const MAX = 10;

  const toggle = (item: string) => {
    if (selected.includes(item)) setSelected(selected.filter(s => s !== item));
    else if (selected.length < MAX) setSelected([...selected, item]);
  };

  return (
    <StepLayout step={step} onBack={onBack} showSkip onSkip={() => onNext(selected)}>
      <View style={int.container}>
        <Text style={int.title}>C'est quoi tes Passions ?</Text>
        <Text style={int.sub}>Choisis au moins 3 activités pour trouver des gens qui partagent tes goûts.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={int.scroll}>
          {INTERETS_CATEGORIES.map(cat => (
            <View key={cat.cat} style={int.catBlock}>
              <Text style={int.catLabel}>{cat.cat}</Text>
              <View style={int.tagsWrap}>
                {cat.items.map(item => {
                  const sel = selected.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[int.tag, sel && int.tagSel]}
                      onPress={() => toggle(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[int.tagTxt, sel && int.tagTxtSel]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <View style={int.footer}>
        <Text style={int.count}>{selected.length}/{MAX} sélectionnés</Text>
        <TouchableOpacity
          style={[int.nextBtn, selected.length < 3 && int.nextBtnDis]}
          onPress={() => selected.length >= 3 && onNext(selected)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={selected.length >= 3 ? [C.goldLight, C.gold] : [C.grayLight, C.grayMid]} style={int.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[int.nextTxt, selected.length < 3 && int.nextTxtDis]}>Suivant →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </StepLayout>
  );
}

const int = StyleSheet.create({
  container: { flex: 1, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '800', color: C.brown, paddingHorizontal: 24, marginBottom: 8 },
  sub: { fontSize: 14, color: C.grayText, paddingHorizontal: 24, marginBottom: 16, lineHeight: 20 },
  scroll: { paddingHorizontal: 24 },
  catBlock: { marginBottom: 24 },
  catLabel: { fontSize: 13, fontWeight: '800', color: C.brownMid, letterSpacing: 0.8, marginBottom: 12 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.beigeDeep },
  tagSel: { backgroundColor: C.gold, borderColor: C.gold },
  tagTxt: { fontSize: 14, fontWeight: '600', color: C.brownMid },
  tagTxtSel: { color: C.white },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.beige, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: C.beigeDeep },
  count: { fontSize: 13, color: C.grayText, textAlign: 'center', marginBottom: 10 },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextBtnDis: {},
  nextGrad: { paddingVertical: 17, alignItems: 'center' },
  nextTxt: { fontSize: 17, fontWeight: '700', color: C.white },
  nextTxtDis: { color: C.grayText },
});

// STEP 8: Lifestyle
function StepLifestyle({ step, prenom, onBack, onNext }: { step: number; prenom: string; onBack: () => void; onNext: (data: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const set = (qid: string, val: string) => setAnswers(prev => ({ ...prev, [qid]: val }));

  return (
    <StepLayout step={step} onBack={onBack} showSkip onSkip={() => onNext(answers)}>
      <ScrollView contentContainerStyle={ls.scroll}>
        <Text style={ls.title}>Et si on parlait de ton Lifestyle, {prenom} ?</Text>
        <Text style={ls.sub}>Ça correspond au tien ? Tu commences.</Text>

        {LIFESTYLE_QUESTIONS.map((q, qi) => (
          <View key={q.id} style={[ls.qBlock, qi < LIFESTYLE_QUESTIONS.length - 1 && ls.qBorder]}>
            <View style={ls.qHeader}>
              <Text style={ls.qIcon}>{q.icon}</Text>
              <Text style={ls.qText}>{q.question}</Text>
            </View>
            <View style={ls.optWrap}>
              {q.options.map(opt => {
                const sel = answers[q.id] === opt;
                return (
                  <TouchableOpacity key={opt} style={[ls.opt, sel && ls.optSel]} onPress={() => set(q.id, opt)}>
                    <Text style={[ls.optTxt, sel && ls.optTxtSel]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={ls.footer}>
        <BigButton label={`Suivant ${Object.keys(answers).length}/${LIFESTYLE_QUESTIONS.length}`} onPress={() => onNext(answers)} disabled={Object.keys(answers).length < 2} />
      </View>
    </StepLayout>
  );
}

const ls = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '800', color: C.brown, marginBottom: 6, lineHeight: 32 },
  sub: { fontSize: 14, color: C.grayText, marginBottom: 28 },
  qBlock: { paddingBottom: 24, marginBottom: 24 },
  qBorder: { borderBottomWidth: 1, borderBottomColor: C.beigeDeep },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  qIcon: { fontSize: 18 },
  qText: { fontSize: 15, fontWeight: '700', color: C.brown },
  optWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.beigeDeep },
  optSel: { backgroundColor: C.gold, borderColor: C.gold },
  optTxt: { fontSize: 13, fontWeight: '600', color: C.brownMid },
  optTxtSel: { color: C.white },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.beige, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderTopColor: C.beigeDeep },
});

// STEP 9: Bio
function StepBio({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (bio: string) => void }) {
  const [bio, setBio] = useState('');
  const MAX = 300;

  return (
    <StepLayout step={step} onBack={onBack} showSkip onSkip={() => onNext(bio)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={bio_.container}>
          <Text style={bio_.title}>Ma bio</Text>
          <Text style={bio_.sub}>Décris-toi : ce que tu aimes faire, tes activités préférées, et pourquoi tu rejoins WyytU.</Text>

          <View style={bio_.inputWrap}>
            <TextInput
              style={bio_.input}
              placeholder="Ex : Passionné de sport et de food, je cherche des gens motivés pour explorer Tanger..."
              placeholderTextColor={C.grayMid}
              value={bio}
              onChangeText={v => v.length <= MAX && setBio(v)}
              multiline
              autoFocus
            />
            <Text style={bio_.counter}>{bio.length}/{MAX}</Text>
          </View>

          <View style={bio_.tipBox}>
            <Text style={bio_.tipIcon}>💡</Text>
            <Text style={bio_.tipTxt}>Une bio, même courte, multiplie tes chances de trouver ta bande 😎</Text>
          </View>
        </View>

        <View style={bio_.footer}>
          <View style={bio_.footRow}>
            <TouchableOpacity onPress={() => onNext('')} style={bio_.skip}>
              <Text style={bio_.skipTxt}>Plus tard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={bio_.nextBtn} onPress={() => onNext(bio)} activeOpacity={0.85}>
              <LinearGradient colors={[C.goldLight, C.gold]} style={bio_.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={bio_.nextTxt}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </StepLayout>
  );
}

const bio_ = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 8 },
  sub: { fontSize: 14, color: C.grayText, marginBottom: 24, lineHeight: 20 },
  inputWrap: { backgroundColor: C.white, borderRadius: 20, padding: 18, minHeight: 160, borderWidth: 2, borderColor: C.gold, marginBottom: 20 },
  input: { fontSize: 16, color: C.brown, lineHeight: 24, flex: 1, minHeight: 120 },
  counter: { textAlign: 'right', fontSize: 12, color: C.grayText, marginTop: 8 },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.grayLight, borderRadius: 16, padding: 16 },
  tipIcon: { fontSize: 16 },
  tipTxt: { flex: 1, fontSize: 13, color: C.brownMid, lineHeight: 19 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { padding: 12 },
  skipTxt: { fontSize: 15, fontWeight: '600', color: C.grayText },
  nextBtn: { borderRadius: 30, overflow: 'hidden' },
  nextGrad: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  nextTxt: { fontSize: 26, color: C.white, fontWeight: '700' },
});

// STEP 10: Photos
function StepPhotos({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (photos: string[]) => void }) {
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);

  const pick = async (idx: number) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!res.canceled) {
      const newPhotos = [...photos];
      newPhotos[idx] = res.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const filled = photos.filter(Boolean).length;

  return (
    <StepLayout step={step} onBack={onBack}>
      <View style={ph2.container}>
        <Text style={ph2.title}>Ajoute tes photos</Text>
        <Text style={ph2.sub}>Ajoute au moins 2 photos pour commencer.</Text>

        <View style={ph2.grid}>
          {photos.map((p, i) => (
            <TouchableOpacity key={i} style={ph2.slot} onPress={() => pick(i)} activeOpacity={0.8}>
              {p ? (
                <>
                  <View style={ph2.photoFill}>
                    <Text style={ph2.photoPlaceholder}>📷</Text>
                  </View>
                  <View style={ph2.checkCircle}>
                    <Text style={ph2.checkMark}>✓</Text>
                  </View>
                </>
              ) : (
                <View style={ph2.plus}>
                  <Text style={ph2.plusTxt}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={ph2.counter}>
          <View style={ph2.counterDot} />
          <Text style={ph2.counterTxt}>{filled}/6 — {filled < 2 ? `Ajoutes-en encore ${2 - filled} pour commencer.` : 'Super ! Tu peux continuer.'}</Text>
        </View>
      </View>

      <View style={ph2.footer}>
        <BigButton label="Continuer" onPress={() => onNext(photos.filter(Boolean) as string[])} disabled={filled < 2} />
      </View>
    </StepLayout>
  );
}

const ph2 = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 8 },
  sub: { fontSize: 14, color: C.grayText, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  slot: { width: (width - 68) / 3, aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: C.white, borderWidth: 2, borderColor: C.beigeDeep, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  photoFill: { ...StyleSheet.absoluteFillObject, backgroundColor: C.beigeDeep, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholder: { fontSize: 32 },
  checkCircle: { position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 13, color: C.white, fontWeight: '800' },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.beigeDeep, justifyContent: 'center', alignItems: 'center' },
  plusTxt: { fontSize: 24, color: C.grayText, lineHeight: 28 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  counterTxt: { fontSize: 13, color: C.grayText },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
});

// STEP 11: Distance
function StepDistance({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: (km: number) => void }) {
  const [km, setKm] = useState(30);
  const sliderRef = useRef<View>(null);

  const handleSlider = (e: any) => {
    const { locationX, target } = e.nativeEvent;
    const sliderWidth = width - 48;
    const newVal = Math.round(Math.max(5, Math.min(100, (locationX / sliderWidth) * 100)));
    setKm(newVal);
  };

  const pos = ((km - 5) / 95) * 100;

  return (
    <StepLayout step={step} onBack={onBack}>
      <View style={dist.container}>
        <Text style={dist.title}>Ta distance maximale ?</Text>
        <Text style={dist.sub}>Utilise le curseur pour définir la zone autour de toi.</Text>

        <View style={dist.sliderWrap}>
          <View style={dist.sliderRow}>
            <Text style={dist.distLabel}>Distance maximale</Text>
            <Text style={dist.distVal}>{km} km</Text>
          </View>

          <View style={dist.track} onStartShouldSetResponder={() => true} onResponderMove={handleSlider} onResponderGrant={handleSlider}>
            <LinearGradient colors={[C.gold, C.goldLight]} style={[dist.fill, { width: `${pos}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[dist.thumb, { left: `${pos}%` }]}>
              <View style={dist.thumbInner} />
            </View>
          </View>

          <View style={dist.labels}>
            <Text style={dist.trackLbl}>5 km</Text>
            <Text style={dist.trackLbl}>100 km</Text>
          </View>
        </View>

        <View style={dist.note}>
          <Text style={dist.noteIcon}>📍</Text>
          <Text style={dist.noteTxt}>Tu peux changer cette préférence plus tard dans les Réglages.</Text>
        </View>
      </View>

      <View style={dist.footer}>
        <BigButton label="Suivant" onPress={() => onNext(km)} />
      </View>
    </StepLayout>
  );
}

const dist = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 30, fontWeight: '800', color: C.brown, marginBottom: 10 },
  sub: { fontSize: 15, color: C.grayText, marginBottom: 48 },
  sliderWrap: { backgroundColor: C.white, borderRadius: 20, padding: 24, marginBottom: 24 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  distLabel: { fontSize: 15, color: C.brownMid, fontWeight: '600' },
  distVal: { fontSize: 22, fontWeight: '800', color: C.gold },
  track: { height: 6, backgroundColor: C.beigeDeep, borderRadius: 3, marginBottom: 8, position: 'relative', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: 3 },
  thumb: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, borderWidth: 3, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', top: -11, marginLeft: -14, shadowColor: C.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  thumbInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trackLbl: { fontSize: 12, color: C.grayText },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.grayLight, borderRadius: 16, padding: 16 },
  noteIcon: { fontSize: 16 },
  noteTxt: { flex: 1, fontSize: 13, color: C.grayText, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
});

// STEP 12: Géolocalisation
function StepGeo({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: () => void }) {
  const requestGeo = async () => {
    await Location.requestForegroundPermissionsAsync();
    onNext();
  };

  return (
    <StepLayout step={step} onBack={onBack} showBack={false}>
      <View style={geo.container}>
        <View style={geo.iconWrap}>
          <View style={geo.iconBg}>
            <Text style={geo.iconEmoji}>📍</Text>
          </View>
          <View style={geo.checkCircle}>
            <Text style={geo.checkMark}>✓</Text>
          </View>
        </View>

        <Text style={geo.title}>Alors, tu vis pas loin ?</Text>
        <Text style={geo.sub}>Nous utilisons ta localisation pour te montrer des activités et des gens dans ta zone. Tu ne pourras pas matcher sans ça.</Text>

        <TouchableOpacity onPress={() => {}}>
          <Text style={geo.howLink}>Comment ma localisation est-elle utilisée ? ▾</Text>
        </TouchableOpacity>
      </View>

      <View style={geo.footer}>
        <BigButton label="Activer la localisation" onPress={requestGeo} />
        <TouchableOpacity style={geo.later} onPress={onNext}>
          <Text style={geo.laterTxt}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </StepLayout>
  );
}

const geo = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  iconWrap: { position: 'relative', marginBottom: 40 },
  iconBg: { width: 110, height: 110, borderRadius: 32, backgroundColor: C.grayLight, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 52 },
  checkCircle: { position: 'absolute', top: -6, right: -6, width: 30, height: 30, borderRadius: 15, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.beige },
  checkMark: { fontSize: 15, color: C.white, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: C.brown, marginBottom: 14, textAlign: 'center' },
  sub: { fontSize: 15, color: C.grayText, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  howLink: { fontSize: 14, color: C.gold, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  later: { alignItems: 'center', padding: 12 },
  laterTxt: { fontSize: 15, color: C.grayText, fontWeight: '600' },
});

// STEP 13: Notifications
function StepNotifs({ step, onBack, onNext }: { step: number; onBack: () => void; onNext: () => void }) {
  const requestNotifs = async () => {
    await Notifications.requestPermissionsAsync();
    onNext();
  };

  return (
    <StepLayout step={step} onBack={onBack} showBack={false}>
      <View style={notif.container}>
        <Text style={notif.emoji}>🔔</Text>
        <Text style={notif.title}>Ne rate aucune activité !</Text>
        <Text style={notif.sub}>Active les notifications pour être prévenu quand quelqu'un rejoint ton activité, te contacte ou qu'une sortie est disponible près de toi.</Text>
      </View>

      <View style={notif.footer}>
        <BigButton label="Activer les notifications" onPress={requestNotifs} />
        <TouchableOpacity style={notif.later} onPress={onNext}>
          <Text style={notif.laterTxt}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </StepLayout>
  );
}

const notif = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80, alignItems: 'center' },
  emoji: { fontSize: 72, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: C.brown, marginBottom: 14, textAlign: 'center' },
  sub: { fontSize: 15, color: C.grayText, textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  later: { alignItems: 'center', padding: 12 },
  laterTxt: { fontSize: 15, color: C.grayText, fontWeight: '600' },
});

// ─── ÉCRAN PRINCIPAL ──────────────────────────────────────────────────────────
export default function Inscription() {
  const [step, setStep] = useState(0);

  // Données collectées
  const [phone, setPhone] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dob, setDob] = useState('');
  const [genre, setGenre] = useState('');
  const [afficherGenre, setAfficherGenre] = useState(true);
  const [mode, setMode] = useState('');
  const [interets, setInterets] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<Record<string, string>>({});
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [distance, setDistance] = useState(30);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finishOnboarding = async () => { require('expo-router').router.replace('/(tabs)/explore'); return; require('expo-router').router.replace('/(tabs)/explore'); return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('utilisateurs').upsert({
        id: user.id,
        prenom,
        date_naissance: dob,
        genre,
        afficher_genre: afficherGenre,
        mode_principal: mode,
        interets,
        lifestyle,
        bio,
        distance_max: distance,
        onboarding_complete: true,
        created_at: new Date().toISOString(),
      });

      router.replace('/(tabs)/explorer');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder ton profil. Réessaie.');
    }
  };

  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 0: return <SplashScreen onNext={next} />;
      case 1: return <StepPhone step={step} onBack={back} onNext={p => { setPhone(p); next(); }} />;
      case 2: return <StepOTP step={step} phone={phone} onBack={back} onNext={next} />;
      case 3: return <StepPrenom step={step} onBack={back} onNext={p => { setPrenom(p); next(); }} />;
      case 4: return <StepDateNaissance step={step} prenom={prenom} onBack={back} onNext={d => { setDob(d); next(); }} />;
      case 5: return <StepGenre step={step} prenom={prenom} onBack={back} onNext={(g, a) => { setGenre(g); setAfficherGenre(a); next(); }} />;
      case 6: return <StepMode step={step} prenom={prenom} onBack={back} onNext={m => { setMode(m); next(); }} />;
      case 7: return <StepInterets step={step} onBack={back} onNext={i => { setInterets(i); next(); }} />;
      case 8: return <StepLifestyle step={step} prenom={prenom} onBack={back} onNext={l => { setLifestyle(l); next(); }} />;
      case 9: return <StepBio step={step} onBack={back} onNext={b => { setBio(b); next(); }} />;
      case 10: return <StepPhotos step={step} onBack={back} onNext={p => { setPhotos(p); next(); }} />;
      case 11: return <StepDistance step={step} onBack={back} onNext={d => { setDistance(d); next(); }} />;
      case 12: return <StepGeo step={step} onBack={back} onNext={next} />;
      case 13: return <StepNotifs step={step} onBack={back} onNext={finishOnboarding} />;
      default: return null;
    }
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY: step === 0 ? 0 : slideAnim }] }}>
      {renderStep()}
    </Animated.View>
  );
}
