import type { Universe } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export type CityPlace = {
  id: number; name: string; lat: number; lng: number; kind: string; detail: string | null; address: string | null; universe: Universe | null;
};

/** Émoji affiché selon le type de lieu OpenStreetMap */
export const KIND_EMOJI: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', fast_food: '🍔', ice_cream: '🍦', cinema: '🎬', theatre: '🎭', arts_centre: '🎨',
  museum: '🏛️', gallery: '🖼️', nightclub: '🪩', sports_centre: '🏟️', pitch: '⚽', fitness_centre: '🏋️',
  stadium: '🏟️', swimming_pool: '🏊', golf_course: '⛳', bowling_alley: '🎳', escape_game: '🗝️',
  amusement_arcade: '🕹️', park: '🌳', garden: '🌷', viewpoint: '🌅', attraction: '📸', beach: '🏖️',
  beach_resort: '🏖️', mall: '🛍️', community_centre: '🏘️',
};

/** Recherche dans les lieux de la ville (nom, et univers si choisi) */
export async function searchPlaces(query: string, universe: Universe | null) {
  let q = supabase.from('places').select('id,name,lat,lng,kind,detail,address,universe').limit(80);
  const text = query.trim();
  if (text) q = q.ilike('name', `%${text.replace(/[%_]/g, '')}%`);
  if (universe) q = q.eq('universe', universe);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return (data ?? []) as CityPlace[];
}
