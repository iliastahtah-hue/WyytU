import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';

export default function MotDePasseOublieScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  const envoyer = async () => {
    if (!email) { setErreur('Entre ton email'); return; }
    setLoading(true);
    setErreur('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'wyytu://reset-password',
    });
    if (error) { setErreur('Email introuvable'); setLoading(false); }
    else { setEnvoye(true); setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🔑</Text>
        </View>

        <Text style={styles.titre}>Mot de passe oublié ?</Text>
        <Text style={styles.sub}>Entre ton email et on t'envoie un lien pour le réinitialiser</Text>

        {!envoye ? (
          <>
            {erreur ? (
              <View style={styles.erreurBox}>
                <Text style={styles.erreurTexte}>⚠️ {erreur}</Text>
              </View>
            ) : null}

            <View style={styles.fieldWrapper}>
              <View style={styles.fieldIconBox}>
                <Text style={styles.fieldIcon}>✉️</Text>
              </View>
              <TextInput
                style={styles.fieldInput}
                placeholder="ton@email.com"
                placeholderTextColor="#BBB"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnEnvoyer, loading && { opacity: 0.6 }]}
              onPress={envoyer}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.btnEnvoyerTexte}>
                {loading ? '⏳ Envoi...' : 'Envoyer le lien 📧'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.succesCard}>
            <Text style={styles.succesEmoji}>✅</Text>
            <Text style={styles.succesTitre}>Email envoyé !</Text>
            <Text style={styles.succesSub}>Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.</Text>
            <TouchableOpacity style={styles.btnRetour} onPress={() => router.back()}>
              <Text style={styles.btnRetourTexte}>← Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: COLORS.gold, opacity: 0.08, top: -60, right: -80 },
  bgCircle2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.gold, opacity: 0.05, bottom: 100, left: -60 },
  backBtn: { position: 'absolute', top: 60, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgDeep, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  backIcon: { fontSize: 20, color: COLORS.text, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 16 },
  iconWrapper: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#FDF8EE', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  icon: { fontSize: 40 },
  titre: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: COLORS.red + '30' },
  erreurTexte: { color: COLORS.red, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 2, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fieldIcon: { fontSize: 18 },
  fieldInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  btnEnvoyer: { backgroundColor: COLORS.gold, borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnEnvoyerTexte: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  succesCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  succesEmoji: { fontSize: 48 },
  succesTitre: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  succesSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  btnRetour: { backgroundColor: COLORS.text, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnRetourTexte: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});