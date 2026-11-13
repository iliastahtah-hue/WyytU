/**
 * WyytU — design tokens partagés.
 *
 * Source unique de vérité pour les couleurs de l'app. Objectif : que deux
 * écrans qui utilisent "le violet de la marque" ou "le doré" utilisent
 * exactement la même valeur, au lieu de redéfinir leur propre variante
 * localement (c'était le cas avant : #667EEA vs #7C4DFF, #C9A84C vs
 * #FFB800, etc.)
 *
 * Usage dans un écran :
 *   import { COLORS, CATEGORY_COLORS } from '../constants/theme';
 *   const C = COLORS; // pour garder le style existant `C.xxx` dans les écrans
 */

export const COLORS = {
  // Neutres — fond crème/blanc cassé (cf. brief design WyytU)
  bg: '#FAF7F2',
  bgDeep: '#F0EDE8',
  white: '#FFFFFF',

  // Texte
  text: '#1A1A1A',
  textMid: '#555555',
  textLight: '#AAAAAA',
  border: '#F0EDE8',

  // Marque
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDark: '#A07830',

  purple: '#667EEA',
  purpleDark: '#764BA2',

  // États
  green: '#00C853',
  red: '#FF3B30',
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Tout: COLORS.purple,
  Sport: '#FF416C',
  Resto: '#F7971E',
  Ciné: '#8E2DE2',
  Soirée: '#FC466B',
  Gaming: '#0072FF',
  Voyage: '#00B4DB',
  Musique: '#11998E',
  'Bien-être': '#56AB2F',
  Social: '#FF4081',
  Art: '#F7971E',
};

export const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Tout: [COLORS.purple, COLORS.purpleDark],
  Sport: ['#FF416C', '#FF4B2B'],
  Resto: ['#F7971E', '#FFD200'],
  Ciné: ['#8E2DE2', '#4A00E0'],
  Soirée: ['#FC466B', '#3F5EFB'],
  Gaming: ['#0072FF', '#00C6FF'],
  Voyage: ['#00B4DB', '#0083B0'],
  Musique: ['#11998E', '#38EF7D'],
  'Bien-être': ['#56AB2F', '#A8E063'],
  Social: ['#FF416C', '#FF4B2B'],
  Art: ['#F7971E', '#FFD200'],
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  Tout: '✨',
  Sport: '⚡',
  Resto: '🍕',
  Ciné: '🎬',
  Soirée: '🎉',
  Gaming: '🎮',
  Voyage: '✈️',
  Musique: '🎵',
  'Bien-être': '🏃',
  Social: '👥',
  Art: '🎨',
};
