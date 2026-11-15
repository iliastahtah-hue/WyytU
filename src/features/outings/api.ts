import type { Group, GroupMember } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export type MyOuting = Group & {
  me: GroupMember;
  acceptedCount: number;
  confirmedCount: number;
  ratedByMe: boolean;
};

/** Mes groupes (acceptés ou en attente), avec compteurs. */
export async function fetchMyOutings(userId: string): Promise<MyOuting[]> {
  const { data: mine, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['accepted', 'pending']);
  if (error) throw error;
  const rows = (mine ?? []) as GroupMember[];
  if (!rows.length) return [];

  const ids = rows.map((m) => m.group_id);
  const [{ data: groups }, { data: members }, { data: ratings }] = await Promise.all([
    supabase.from('groups').select('*').in('id', ids).neq('status', 'cancelled'),
    supabase.from('group_members').select('group_id, status, confirmed_at').in('group_id', ids).eq('status', 'accepted'),
    supabase.from('ratings').select('group_id').eq('rater_id', userId).in('group_id', ids),
  ]);

  return (groups ?? [])
    .map((g) => {
      const accepted = (members ?? []).filter((m) => m.group_id === g.id);
      return {
        ...g,
        me: rows.find((m) => m.group_id === g.id) as GroupMember,
        acceptedCount: accepted.length,
        confirmedCount: accepted.filter((m) => m.confirmed_at).length,
        ratedByMe: (ratings ?? []).some((r) => r.group_id === g.id),
      };
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export async function confirmPresence(groupId: string) {
  const { error } = await supabase.rpc('confirm_presence', { p_group: groupId });
  if (error) throw error;
}

/** Nombre de notifications non lues (pour la cloche) */
export async function unreadCount(userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}
