import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/src/theme/tokens';
import { AppText } from './AppText';

const PASTELS = ['#DDF7EA', '#FFE3EF', '#E1F1FF', '#FFF1D6', '#EEE6FF', '#FFE9E1', '#EAF6DF'];

/** Couleur pastel stable pour une personne (même couleur partout dans l'app) */
export function pastelFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PASTELS[Math.abs(hash) % PASTELS.length];
}

type Props = { name: string; uri?: string | null; size?: number; seed?: string; ring?: boolean };

export function Avatar({ name, uri, size = 40, seed, ring }: Props) {
  const style = [
    styles.base,
    { width: size, height: size, borderRadius: size / 2, backgroundColor: pastelFor(seed ?? name) },
    ring ? styles.ring : null,
  ];
  if (uri) {
    return <Image source={{ uri }} style={style} contentFit="cover" accessibilityLabel={name} transition={150} />;
  }
  return (
    <View style={style} accessibilityLabel={name}>
      <AppText variant="label" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }} center>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { borderWidth: 2, borderColor: colors.white },
});
