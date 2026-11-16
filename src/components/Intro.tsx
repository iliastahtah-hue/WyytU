import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { logoMark, photos } from '@/src/theme/images';
import { colors } from '@/src/theme/tokens';

/**
 * Ouverture animée, jouée à chaque lancement :
 * fond orange (comme l'écran natif) → la photo apparaît en zoom lent,
 * le logo arrive en rebond, le nom et la phrase montent, puis tout s'efface.
 */
export function Intro() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  const photo = useSharedValue(0);
  const zoom = useSharedValue(1.12);
  const logo = useSharedValue(0);
  const text = useSharedValue(0);
  const out = useSharedValue(1);

  useEffect(() => {
    photo.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    zoom.value = withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) });
    logo.value = withDelay(250, withSpring(1, { damping: 11, stiffness: 140 }));
    text.value = withDelay(650, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));
    out.value = withSequence(
      withDelay(2600, withTiming(0, { duration: 450 }, (ok) => {
        if (ok) runOnJS(setDone)(true);
      })),
    );
  }, [photo, zoom, logo, text, out]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  const photoStyle = useAnimatedStyle(() => ({ opacity: photo.value, transform: [{ scale: zoom.value }] }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, logo.value * 1.5),
    transform: [{ scale: 0.4 + logo.value * 0.6 }, { rotate: `${(1 - logo.value) * -12}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: text.value, transform: [{ translateY: (1 - text.value) * 18 }] }));

  if (done) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
        <Image source={photos.intro} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(17,16,20,0.55)', 'rgba(17,16,20,0.1)', 'rgba(17,16,20,0)', 'rgba(17,16,20,0.35)']}
          locations={[0, 0.35, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.top}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image source={logoMark} style={styles.logo} accessibilityLabel="WyytU" />
        </Animated.View>
        <Animated.View style={[{ alignItems: 'center', gap: 4 }, textStyle]}>
          <AppText style={styles.word}>wyytu</AppText>
          <AppText variant="bodyStrong" color={colors.white} center style={styles.tagline}>
            {t('intro.tagline')}
          </AppText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.coral, zIndex: 100 },
  top: { position: 'absolute', top: '12%', left: 0, right: 0, alignItems: 'center', gap: 14 },
  logoWrap: {
    borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  logo: { width: 104, height: 104, borderRadius: 26 },
  word: {
    fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 48, lineHeight: 52, letterSpacing: -1.5,
    color: colors.white, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12,
  },
  tagline: { fontSize: 17, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 10 },
});
