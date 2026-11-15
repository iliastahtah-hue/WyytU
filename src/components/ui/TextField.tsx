import { forwardRef } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { useI18n } from '@/src/i18n';
import { colors, fonts, radius } from '@/src/theme/tokens';
import { AppText } from './AppText';

type Props = TextInputProps & { label: string; error?: string | null; prefix?: string };

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, prefix, style, ...rest }, ref) {
  const { isRTL } = useI18n();
  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.sub} nativeID={`${label}-label`}>
        {label}
      </AppText>
      <View style={[styles.box, error ? styles.boxError : null]}>
        {prefix ? (
          <AppText variant="bodyStrong" style={styles.prefix} numberOfLines={1}>
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          aria-labelledby={`${label}-label`}
          placeholderTextColor={colors.muted}
          style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }, style]}
          {...rest}
        />
      </View>
      {error ? (
        <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16,
  },
  boxError: { borderColor: colors.danger },
  prefix: { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: colors.line, flexShrink: 0 },
  input: {
    flex: 1, fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.ink, paddingVertical: 14,
    // pas de contour du navigateur sur la version web
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null),
  },
});
