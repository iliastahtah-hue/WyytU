import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { Group, Partner, PartnerOffer } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { fetchMyPartner } from './api';

/** Établissement de l'utilisateur, ses créneaux et les groupes (30 jours passés → à venir), rechargés à chaque visite. */
export function usePartner() {
  const { session } = useAuth();
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const p = await fetchMyPartner(session.user.id);
    setPartner(p);
    if (!p) return;
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [{ data: o }, { data: g }] = await Promise.all([
      supabase.from('partner_offers').select('*').eq('partner_id', p.id).gte('starts_at', since).order('starts_at'),
      supabase.from('groups').select('*').eq('partner_id', p.id).gte('starts_at', since).neq('status', 'cancelled').order('starts_at'),
    ]);
    setOffers((o ?? []) as PartnerOffer[]);
    setGroups((g ?? []) as Group[]);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { partner, offers, groups, reload: load, setPartner };
}
