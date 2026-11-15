import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, TOUCH } from '@/src/theme/tokens';
import { AppText } from './AppText';

type Props = { label: string; selected?: boolean; onPress?: () => void; color?: string; soft?: string };

export function Chip({ label, selected, onPress, color = colors.ink, soft = colors.card }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={4}
      style={[styles.chip, { backgroundColor: selected ? color : soft, borderColor: selected ? color : colors.line }]}
    >
      <AppText variant="label" color={selected ? (color === colors.ink ? colors.white : colors.ink) : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: TOUCH - 4, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center' },
});
