/**
 * Design tokens WyytU — repris de la maquette V1.
 */
export const colors = {
  coral: '#FF6A3D',
  coralDark: '#B8380F',
  coralSoft: '#FFE9E1',
  lime: '#D7FF3A',
  limeSoft: '#F3FFC2',
  ink: '#111014',
  sub: '#55535C',
  muted: '#8E8B93',
  line: '#DAD7D0',
  bg: '#F1EBE1',
  card: '#FFFFFF',
  sand: '#EADFCB',
  verified: '#1D9BF0',
  success: '#12B76A',
  successSoft: '#DDF7EA',
  danger: '#D92D20',
  white: '#FFFFFF',
} as const;

/** Une couleur par univers d'activité */
export const universeColors: Record<UniverseId, { bg: string; fg: string; soft: string }> = {
  sport: { bg: '#12B76A', fg: '#111014', soft: '#DDF7EA' },
  resto: { bg: '#FFB020', fg: '#111014', soft: '#FFF1D6' },
  cine: { bg: '#9D74F7', fg: '#111014', soft: '#EEE6FF' },
  soiree: { bg: '#FF5FA2', fg: '#111014', soft: '#FFE3EF' },
  jeux: { bg: '#3DA9FC', fg: '#111014', soft: '#E1F1FF' },
  nature: { bg: '#7CC243', fg: '#111014', soft: '#EAF6DF' },
  bienetre: { bg: '#FF8F6B', fg: '#111014', soft: '#FFE9E1' },
};

export type UniverseId = 'sport' | 'resto' | 'cine' | 'soiree' | 'jeux' | 'nature' | 'bienetre';

export const UNIVERSES: { id: UniverseId; emoji: string }[] = [
  { id: 'sport', emoji: '⚽' },
  { id: 'resto', emoji: '🍔' },
  { id: 'cine', emoji: '🎬' },
  { id: 'soiree', emoji: '🎉' },
  { id: 'jeux', emoji: '🎲' },
  { id: 'nature', emoji: '🌿' },
  { id: 'bienetre', emoji: '🧘' },
];

export const SPORTS = [
  'padel', 'tennis', 'foot', 'musculation', 'pilates', 'basket', 'volley',
  'running', 'velo', 'natation', 'surf', 'boxe', 'yoga', 'randonnee',
] as const;

export const LEVELS = ['C', 'C+', 'B', 'B+', 'A', 'A+'] as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Taille minimale d'une cible tactile (recommandation Apple) */
export const TOUCH = 44;
