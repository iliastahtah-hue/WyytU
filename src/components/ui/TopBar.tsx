import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useI18n } from '@/src/i18n';
import { colors, TOUCH } from '@/src/theme/tokens';
import { AppText } from './AppText';

type Props = { title?: string; right?: ReactNode; onBack?: () => void; hideBack?: boolean };

export function TopBar({ title, right, onBack, hideBack }: Props) {
  const router = useRouter();
  const { t, isRTL } = useI18n();
  return (
    <View style={styles.bar}>
      {hideBack ? (
        <View style={styles.side} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          style={styles.back}
        >
          <AppText variant="heading">{isRTL ? '›' : '‹'}</AppText>
        </Pressable>
      )}
      <AppText variant="bodyStrong" center style={styles.title} numberOfLines={1}>
        {title ?? ''}
      </AppText>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 12 },
  back: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  side: { minWidth: TOUCH },
  title: { flex: 1 },
});
