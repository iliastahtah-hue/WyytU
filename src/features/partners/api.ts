import type { Group, Partner, PartnerOffer, Universe } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export type OfferWithPartner = PartnerOffer & { partner: Partner };

/** Plans à venir encore libres, avec leur partenaire */
export async function fetchOpenOffers(universe: Universe | null): Promise<OfferWithPartner[]> {
  const { data: partners } = await supabase.from('partners').select('*').eq('status', 'approved');
  const list = (partners ?? []).filter((p) => !universe || p.universe === universe);
  if (!list.length) return [];
  const { data: offers, error } = await supabase
    .from('partner_offers')
    .select('*')
    .in('partner_id', list.map((p) => p.id))
    .eq('booked', false)
    .gte('starts_at', new Date().toISOString())
    .order('boosted', { ascending: false })
    .order('starts_at', { ascending: true })
    .limit(60);
  if (error) throw error;
  return (offers ?? []).map((o) => ({ ...o, partner: list.find((p) => p.id === o.partner_id) as Partner }));
}

export async function fetchMyPartner(userId: string): Promise<Partner | null> {
  const { data } = await supabase.from('partners').select('*').eq('owner_id', userId).order('created_at').limit(1).maybeSingle();
  return data ?? null;
}

export async function fetchPartnerAgenda(partnerId: string) {
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const [{ data: offers }, { data: groups }] = await Promise.all([
    supabase.from('partner_offers').select('*').eq('partner_id', partnerId).gte('starts_at', since).order('starts_at'),
    supabase.from('groups').select('*').eq('partner_id', partnerId).gte('starts_at', since).neq('status', 'cancelled').order('starts_at'),
  ]);
  return { offers: (offers ?? []) as PartnerOffer[], groups: (groups ?? []) as Group[] };
}
