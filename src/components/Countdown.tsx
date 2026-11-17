import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AppText } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius } from '@/src/theme/tokens';

const H = 3600_000;

/**
 * Compte à rebours en direct avant le début d'une sortie.
 * > 24 h : blanc · < 24 h : orange · < 3 h : rouge avec point qui pulse.
 */
export function Countdown({ startsAt, style }: { startsAt: string; style?: ViewStyle }) {
  const { t } = useI18n();
  const start = new Date(startsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const left = start - now;

  useEffect(() => {
    // une seconde sous l'heure, sinon toutes les 30 s
    const step = left < H ? 1000 : 30_000;
    const id = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(id);
  }, [left < H]); // eslint-disable-line react-hooks/exhaustive-deps

  const pulse = useSharedValue(1);
  const urgent = left > 0 && left < 3 * H;
  useEffect(() => {
    if (urgent) pulse.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true);
  }, [urgent, pulse]);
  const dot = useAnimatedStyle(() => ({ opacity: pulse.value }));

  let label: string;
  if (left <= 0) label = left > -3 * H ? t('countdown.live') : t('countdown.ended');
  else {
    const s = Math.floor(left / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d >= 1) label = t('countdown.days', { d, h });
    else if (h >= 1) label = t('countdown.hours', { h, m: String(m).padStart(2, '0') });
    else label = t('countdown.minutes', { m, s: String(s % 60).padStart(2, '0') });
  }

  const tone =
    left <= 0 ? { bg: colors.ink, fg: colors.white }
    : urgent ? { bg: colors.danger, fg: colors.white }
    : left < 24 * H ? { bg: colors.coral, fg: colors.white }
    : { bg: 'rgba(255,255,255,0.94)', fg: colors.ink };

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }, style]} accessibilityLabel={label}>
      {urgent || left <= 0 ? <Animated.View style={[styles.dot, { backgroundColor: tone.fg }, dot]} /> : <AppText variant="tag" color={tone.fg}>⏳</AppText>}
      <AppText variant="tag" color={tone.fg} style={{ fontVariant: ['tabular-nums'] }}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
