import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, TOUCH } from '@/src/theme/tokens';
import { AppText } from './AppText';

type Kind = 'primary' | 'dark' | 'lime' | 'ghost' | 'outline';

const KINDS: Record<Kind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.coral, fg: colors.ink },
  dark: { bg: colors.ink, fg: colors.white },
  lime: { bg: colors.lime, fg: colors.ink },
  ghost: { bg: 'transparent', fg: colors.ink },
  outline: { bg: colors.card, fg: colors.ink, border: colors.line },
};

type Props = {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  small?: boolean;
  accessibilityHint?: string;
};

export function Button({ label, onPress, kind = 'primary', disabled, loading, icon, style, small, accessibilityHint }: Props) {
  const k = KINDS[kind];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.large,
        { backgroundColor: k.bg, borderColor: k.border ?? k.bg, opacity: inactive ? 0.45 : pressed ? 0.85 : 1 },
        pressed && !inactive ? { transform: [{ scale: 0.98 }] } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <AppText variant="bodyStrong">{icon}</AppText> : null}
          <AppText variant={small ? 'label' : 'bodyStrong'} color={k.fg} center style={{ fontWeight: '700' }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, paddingHorizontal: 22 },
  large: { minHeight: 56 },
  small: { minHeight: TOUCH, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
