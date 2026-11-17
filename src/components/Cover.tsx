import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { coverFor, iconFor } from '@/src/theme/images';
import { universeColors, type UniverseId } from '@/src/theme/tokens';

/**
 * Couverture d'une sortie : couleur de l'univers, photo en simple texture
 * (on ne fixe pas des visages inconnus) et grosse icône 3D de l'activité.
 */
export function Cover({
  universe, subcategory, height = 170, iconSize = 112, style, children,
}: {
  universe: UniverseId; subcategory?: string | null; height?: number; iconSize?: number; style?: ViewStyle; children?: ReactNode;
}) {
  const u = universeColors[universe];
  return (
    <View style={[{ minHeight: height, backgroundColor: u.bg, overflow: 'hidden' }, style]}>
      <Image source={coverFor(universe, subcategory)} style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} contentFit="cover" blurRadius={2} />
      <LinearGradient colors={[`${u.bg}00`, `${u.bg}CC`, u.bg]} locations={[0, 0.55, 1]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* grands cercles décoratifs */}
      <View style={[styles.ring, { width: iconSize * 2.1, height: iconSize * 2.1, right: -iconSize * 0.55, top: -iconSize * 0.45 }]} />
      <View style={[styles.ring, { width: iconSize * 1.35, height: iconSize * 1.35, right: -iconSize * 0.15, top: -iconSize * 0.05, borderColor: 'rgba(255,255,255,0.35)' }]} />
      <Image source={iconFor(universe, subcategory)} style={[styles.icon, { width: iconSize, height: iconSize, right: 10, top: 14 }]} contentFit="contain" />
      <View style={{ flex: 1, padding: 14 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 18, borderColor: 'rgba(255,255,255,0.16)' },
  icon: { position: 'absolute', transform: [{ rotate: '12deg' }] },
});
