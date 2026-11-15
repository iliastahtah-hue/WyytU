import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { colors, TOUCH } from '@/src/theme/tokens';

/** Sélecteur 1 à 5 étoiles, accessible (groupe de boutons radio) */
export function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
          onPress={() => onChange(n)}
          style={styles.star}
        >
          <AppText style={{ fontSize: 30, lineHeight: 36, color: n <= value ? '#FFB020' : colors.line }}>★</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
