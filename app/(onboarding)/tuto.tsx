import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { AppText, Button } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius, TOUCH } from '@/src/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

type Float = { src: ImageSourcePropType; x: number; y: number; size: number; rotate: number };
type Slide = { key: string; bg: string; floats: Float[]; card: { tag: string; title: string; color: string } };

const SLIDES: Slide[] = [
  {
    key: 's1', bg: '#DDF7EA',
    floats: [
      { src: img3d.tennis, x: 0.08, y: 0.08, size: 84, rotate: -18 },
      { src: img3d.pancakes, x: 0.42, y: 0.04, size: 70, rotate: 0 },
      { src: img3d.popcorn, x: 0.74, y: 0.12, size: 76, rotate: 12 },
      { src: img3d.clapper, x: 0.06, y: 0.66, size: 70, rotate: -8 },
      { src: img3d.hamburger, x: 0.42, y: 0.74, size: 64, rotate: 0 },
      { src: img3d.party, x: 0.76, y: 0.62, size: 80, rotate: 10 },
    ],
    card: { tag: 'SPORT · PADEL · 20:30', title: 'Il manque 2 joueurs', color: '#12B76A' },
  },
  {
    key: 's2', bg: '#FFF1D6',
    floats: [
      { src: img3d.speech, x: 0.1, y: 0.08, size: 80, rotate: -10 },
      { src: img3d.party, x: 0.72, y: 0.06, size: 84, rotate: 12 },
      { src: img3d.hamburger, x: 0.12, y: 0.7, size: 72, rotate: 0 },
      { src: img3d.sparkles, x: 0.74, y: 0.68, size: 70, rotate: 0 },
    ],
    card: { tag: 'RESTO · DEMAIN 21:00', title: 'Dîner street-food à 6', color: '#FFB020' },
  },
  {
    key: 's3', bg: '#E1F1FF',
    floats: [
      { src: img3d.shield, x: 0.1, y: 0.06, size: 88, rotate: -8 },
      { src: img3d.camera, x: 0.72, y: 0.08, size: 80, rotate: 10 },
      { src: img3d.star, x: 0.12, y: 0.7, size: 72, rotate: 0 },
      { src: img3d.check, x: 0.74, y: 0.68, size: 74, rotate: 0 },
    ],
    card: { tag: 'PROFIL VÉRIFIÉ', title: '4,8 ★ · 100 % présence', color: '#1D9BF0' },
  },
  {
    key: 's4', bg: '#FFE3EF',
    floats: [
      { src: img3d.money, x: 0.08, y: 0.06, size: 86, rotate: -12 },
      { src: img3d.tennis, x: 0.74, y: 0.06, size: 78, rotate: 14 },
      { src: img3d.popcorn, x: 0.1, y: 0.7, size: 72, rotate: 0 },
      { src: img3d.trophy, x: 0.74, y: 0.68, size: 76, rotate: 0 },
    ],
    card: { tag: 'CLUB PARTENAIRE', title: '−10 % pour ton groupe', color: '#FF6A3D' },
  },
];

export default function TutoScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { t } = useI18n();
  const { markTutoDone } = useOnboarding();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const heroH = Math.min(height * 0.46, 420);

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
            <View style={[styles.hero, { height: heroH, backgroundColor: item.bg }]}>
              {item.floats.map((f, k) => (
                <Image
                  key={k}
                  source={f.src}
                  accessibilityIgnoresInvertColors
                  style={{
                    position: 'absolute', left: f.x * width, top: 70 + f.y * (heroH - 90),
                    width: f.size, height: f.size, transform: [{ rotate: `${f.rotate}deg` }],
                  }}
                />
              ))}
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
  hero: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  mock: { width: '74%', borderRadius: radius.lg, padding: 18, gap: 6, transform: [{ rotate: '-3deg' }], marginTop: 40 },
  text: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
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
