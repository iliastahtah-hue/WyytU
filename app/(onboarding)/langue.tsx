import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Screen } from '@/src/components/ui';
import { LANGS, useI18n, type Lang } from '@/src/i18n';
import { logoMark } from '@/src/theme/images';
import { colors, radius } from '@/src/theme/tokens';

export default function LangueScreen() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  const choose = async (id: Lang) => {
    await setLang(id);
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.brand}>
          <Image source={logoMark} style={{ width: 56, height: 56 }} accessibilityLabel="WyytU" />
          <AppText style={styles.wordmark}>wyytu</AppText>
        </View>
        <AppText variant="title">{t('language.title')}</AppText>
        <AppText color={colors.sub}>{t('language.subtitle')}</AppText>
      </View>
      <View style={styles.list} accessibilityRole="radiogroup">
        {LANGS.map((l) => {
          const selected = lang === l.id;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={l.label}
              onPress={() => choose(l.id)}
              style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && { opacity: 0.85 }]}
            >
              <AppText style={styles.flag}>{l.flag}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="heading" style={l.id === 'dar' ? { writingDirection: 'rtl', textAlign: 'left' } : undefined}>
                  {l.native}
                </AppText>
                {l.id === 'dar' ? <AppText variant="small" color={colors.sub}>{l.label}</AppText> : null}
              </View>
              <View style={[styles.radio, selected && styles.radioOn]} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginTop: 48, gap: 10, marginBottom: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  wordmark: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 44, lineHeight: 48, letterSpacing: -1.5, color: colors.coral },
  list: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 76, paddingHorizontal: 20,
    borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.card,
  },
  optionOn: { borderColor: colors.ink },
  flag: { fontSize: 30, lineHeight: 36 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.line },
  radioOn: { borderColor: colors.ink, borderWidth: 7 },
});
