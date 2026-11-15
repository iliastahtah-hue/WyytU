import type { Partner, Universe } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export async function fetchPartners(universe: Universe | null): Promise<Partner[]> {
  let q = supabase.from('partners').select('*').eq('status', 'approved').order('discount_pct', { ascending: false });
  if (universe) q = q.eq('universe', universe);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Nombre de groupes créés ces 7 derniers jours (quota gratuit : 2) */
export async function countMyGroupsThisWeek(userId: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('organizer_id', userId)
    .gte('created_at', since); // même règle que le serveur : les groupes annulés comptent
  return count ?? 0;
}
