import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { logoMark, photos } from '@/src/theme/images';
import { colors, fonts, radius } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];
const LANGS = [
  { id: 'dar', label: 'الدارجة' },
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
] as const;

/** Accueil : photo de groupe, langue, et toutes les façons de se connecter. */
export default function BienvenueScreen() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();

  const ensureLang = async () => {
    if (!lang) await setLang('fr');
  };
  const go = async (mode: 'phone' | 'email') => {
    await ensureLang();
    router.push({ pathname: '/inscription', params: { mode } });
  };
  const soon = (provider: string) => Alert.alert(t('welcome.soonTitle'), t('welcome.soonBody', { provider }));

  const buttons: { icon: IconName; label: string; bg: string; fg: string; border?: string; onPress: () => void }[] = [
    { icon: 'logo-apple', label: t('welcome.apple'), bg: colors.ink, fg: colors.white, border: 'rgba(255,255,255,0.35)', onPress: () => soon('Apple') },
    { icon: 'logo-google', label: t('welcome.google'), bg: colors.white, fg: colors.ink, onPress: () => soon('Google') },
    { icon: 'call', label: t('welcome.phone'), bg: colors.coral, fg: colors.white, onPress: () => go('phone') },
    { icon: 'mail-outline', label: t('welcome.email'), bg: 'transparent', fg: colors.white, border: 'rgba(255,255,255,0.7)', onPress: () => go('email') },
  ];

  return (
    <View style={styles.fill}>
      <Image source={photos.intro} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(17,16,20,0.55)', 'rgba(17,16,20,0.05)', 'rgba(17,16,20,0.55)', 'rgba(17,16,20,0.92)']}
        locations={[0, 0.3, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.langs}>
          {LANGS.map((l) => {
            const on = (lang ?? 'fr') === l.id;
            return (
              <Pressable key={l.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setLang(l.id)}
                style={[styles.lang, on && styles.langOn]}>
                <AppText variant="label" color={on ? colors.ink : colors.white}>{l.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.brand}>
          <Image source={logoMark} style={styles.logo} accessibilityLabel="WyytU" />
          <AppText style={styles.word}>wyytu</AppText>
          <AppText variant="bodyStrong" color={colors.white} center style={styles.tagline}>{t('intro.tagline')}</AppText>
        </View>

        <View style={styles.bottom}>
          {buttons.map((b) => (
            <Pressable key={b.label} accessibilityRole="button" onPress={b.onPress}
              style={({ pressed }) => [styles.btn, { backgroundColor: b.bg, borderColor: b.border ?? b.bg }, pressed && { opacity: 0.85 }]}>
              <Ionicons name={b.icon} size={20} color={b.fg} style={styles.btnIcon} />
              <AppText variant="bodyStrong" color={b.fg}>{b.label}</AppText>
            </Pressable>
          ))}
          <AppText variant="small" color="rgba(255,255,255,0.7)" center style={{ marginTop: 6 }}>{t('auth.legal')}</AppText>
          <Pressable accessibilityRole="link" onPress={async () => { await ensureLang(); router.push('/tuto'); }} style={styles.how}>
            <Ionicons name="play-circle-outline" size={18} color={colors.white} />
            <AppText variant="label" color={colors.white} style={{ textDecorationLine: 'underline' }}>{t('welcome.how')}</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ink },
  langs: { flexDirection: 'row', alignSelf: 'center', gap: 4, marginTop: 8, padding: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.18)' },
  lang: { minHeight: 34, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center' },
  langOn: { backgroundColor: colors.white },
  brand: { alignItems: 'center', gap: 6, marginTop: 28 },
  logo: { width: 76, height: 76, borderRadius: 20 },
  word: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1.5, color: colors.white, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12 },
  tagline: { fontSize: 17, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 10 },
  bottom: { marginTop: 'auto', paddingHorizontal: 22, paddingBottom: 8, gap: 10 },
  btn: { minHeight: 54, borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  btnIcon: { position: 'absolute', left: 22 },
  how: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
});
