import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { AppText, Button } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { photos } from '@/src/theme/images';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, TOUCH } from '@/src/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

type Slide = { key: string; photo: ImageSourcePropType; card: { tag: string; title: string; color: string } };

/* Une vraie photo par écran + une carte de l'app posée dessus */
const SLIDES: Slide[] = [
  { key: 's1', photo: photos.tuto[0], card: { tag: 'RESTO · ⏳ DANS 2 H 14 MIN', title: 'Il reste 1 place à table', color: '#FFB020' } },
  { key: 's2', photo: photos.tuto[1], card: { tag: 'SPORT · PADEL · 19:00', title: 'Il manque 2 joueurs', color: '#12B76A' } },
  { key: 's3', photo: photos.tuto[2], card: { tag: 'PROFIL VÉRIFIÉ ✓', title: '4,8 ★ · 100 % présence', color: '#FFFFFF' } },
  { key: 's4', photo: photos.tuto[3], card: { tag: 'CLUB PARTENAIRE', title: '−10 % pour ton groupe', color: '#FF6A3D' } },
];

export default function TutoScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { t } = useI18n();
  const { markTutoDone } = useOnboarding();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const heroH = Math.min(height * 0.55, 520);

  const finish = async () => {
    await markTutoDone();
    router.replace('/');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    } else finish();
  };

  return (
    <SafeAreaView style={styles.fill} edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={32}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={{ width }}>
            <View style={[styles.hero, { height: heroH }]}>
              <Image source={item.photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
              <LinearGradient
                colors={['rgba(17,16,20,0.35)', 'rgba(17,16,20,0)', 'rgba(17,16,20,0)', 'rgba(17,16,20,0.45)']}
                locations={[0, 0.22, 0.6, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.mock, { backgroundColor: item.card.color }]}>
                <AppText variant="tag" color={colors.ink}>{item.card.tag}</AppText>
                <AppText variant="heading" color={colors.ink}>{item.card.title}</AppText>
              </View>
            </View>
            <View style={styles.text}>
              <View style={styles.tag}>
                <AppText variant="tag">{t(`tuto.s${i + 1}Tag`)}</AppText>
              </View>
              <AppText variant="display">{t(`tuto.s${i + 1}Title`)}</AppText>
              <AppText color={colors.sub} style={{ fontSize: 17, lineHeight: 25 }}>
                {t(`tuto.s${i + 1}Body`)}
              </AppText>
            </View>
          </View>
        )}
      />

      <Pressable accessibilityRole="button" onPress={finish} style={styles.skip} hitSlop={8}>
        <AppText variant="label">{t('common.skip')}</AppText>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`${index + 1} / ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <Button label={index === SLIDES.length - 1 ? t('tuto.start') : t('common.next')} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  hero: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: colors.sand },
  mock: {
    alignSelf: 'flex-start', maxWidth: '78%', margin: 20, borderRadius: radius.lg, padding: 16, gap: 4,
    transform: [{ rotate: '-2deg' }], shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  text: { paddingHorizontal: 24, paddingTop: 22, gap: 10 },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.lime, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  skip: {
    position: 'absolute', top: 54, right: 20, minHeight: TOUCH, paddingHorizontal: 18,
    borderRadius: TOUCH / 2, backgroundColor: colors.card, justifyContent: 'center',
  },
  footer: { paddingHorizontal: 20, gap: 18, paddingBottom: 8 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 26, backgroundColor: colors.ink },
});
