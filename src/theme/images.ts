import type { ImageSourcePropType } from 'react-native';
/* Icônes 3D Fluent Emoji (licence MIT, voir assets/3d/LICENSE.md) */
export const logoMark = require('@/assets/brand/logo-mark.png');

export const img3d = {
  tennis: require('@/assets/3d/tennis_3d.png'),
  popcorn: require('@/assets/3d/popcorn_3d.png'),
  hamburger: require('@/assets/3d/hamburger_3d.png'),
  party: require('@/assets/3d/party_popper_3d.png'),
  shield: require('@/assets/3d/shield_3d.png'),
  check: require('@/assets/3d/check_mark_button_3d.png'),
  star: require('@/assets/3d/glowing_star_3d.png'),
  camera: require('@/assets/3d/camera_with_flash_3d.png'),
  money: require('@/assets/3d/money_with_wings_3d.png'),
  phone: require('@/assets/3d/mobile_phone_3d.png'),
  die: require('@/assets/3d/game_die_3d.png'),
  sparkles: require('@/assets/3d/sparkles_3d.png'),
  soccer: require('@/assets/3d/soccer_ball_3d.png'),
  clapper: require('@/assets/3d/clapper_board_3d.png'),
  pancakes: require('@/assets/3d/pancakes_3d.png'),
  herb: require('@/assets/3d/herb_3d.png'),
  lotus: require('@/assets/3d/lotus_3d.png'),
  speech: require('@/assets/3d/speech_balloon_3d.png'),
  trophy: require('@/assets/3d/trophy_3d.png'),
} as const;

/* Photos de marque (générées pour WyytU, personnes fictives) */
export const photos = {
  intro: require('@/assets/photos/intro.jpg'),
  tuto: [
    require('@/assets/photos/tuto-1.jpg'),
    require('@/assets/photos/tuto-2.jpg'),
    require('@/assets/photos/tuto-3.jpg'),
    require('@/assets/photos/tuto-4.jpg'),
  ],
} as const;

const covers = {
  resto: require('@/assets/photos/cover-resto.jpg'),
  cine: require('@/assets/photos/cover-cine.jpg'),
  soiree: require('@/assets/photos/cover-soiree.jpg'),
  jeux: require('@/assets/photos/cover-jeux.jpg'),
  nature: require('@/assets/photos/cover-nature.jpg'),
  bienetre: require('@/assets/photos/cover-bienetre.jpg'),
  foot: require('@/assets/photos/cover-foot.jpg'),
  running: require('@/assets/photos/cover-running.jpg'),
  padel: require('@/assets/photos/cover-padel.jpg'),
} as const;

const SPORT_COVER: Record<string, keyof typeof covers> = {
  padel: 'padel', tennis: 'padel',
  foot: 'foot', basket: 'foot', volley: 'foot',
  running: 'running', velo: 'running', randonnee: 'nature', surf: 'running', natation: 'running',
  yoga: 'bienetre', pilates: 'bienetre', musculation: 'foot', boxe: 'foot',
};

/** Photo de couverture d'une sortie, selon l'univers (et le sport si précisé) */
export function coverFor(universe: string, subcategory?: string | null): ImageSourcePropType {
  if (universe === 'sport') return covers[(subcategory && SPORT_COVER[subcategory]) || 'foot'];
  return covers[universe as keyof typeof covers] ?? covers.resto;
}
