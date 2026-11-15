import type { Group, GroupMember, MemberStatus, Profile, Universe } from '@/src/lib/database.types';
import { signedUrls } from '@/src/lib/storage';
import { supabase } from '@/src/lib/supabase';

export type MiniProfile = Pick<
  Profile,
  'id' | 'first_name' | 'verification_status' | 'rating_avg' | 'rating_count' | 'outings_count' | 'attendance_rate'
> & { photo: string | null };

export type GroupCardData = Group & {
  organizer: MiniProfile | null;
  members: MiniProfile[];
  myStatus: MemberStatus | null;
};

const PROFILE_FIELDS = 'id, first_name, verification_status, rating_avg, rating_count, outings_count, attendance_rate';

/** Profils + première photo (lien temporaire) */
export async function fetchMiniProfiles(ids: string[]): Promise<Record<string, MiniProfile>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return {};
  const [{ data: profiles }, { data: photos }] = await Promise.all([
    supabase.from('profiles').select(PROFILE_FIELDS).in('id', unique),
    supabase.from('profile_photos').select('user_id, path, position').in('user_id', unique).order('position'),
  ]);
  // première photo de chaque personne (la plus petite position)
  const firstPath: Record<string, string> = {};
  for (const p of photos ?? []) if (!firstPath[p.user_id]) firstPath[p.user_id] = p.path;
  const urls = await signedUrls('photos', Object.values(firstPath));
  const photoOf = Object.fromEntries(Object.entries(firstPath).map(([uid, path]) => [uid, urls[path] ?? null]));
  return Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, { ...(p as Omit<MiniProfile, 'photo'>), photo: photoOf[p.id] ?? null }]),
  );
}

type Filters = { universe?: Universe | null; subcategory?: string | null };

/** Sorties à venir, avec organisateur, membres acceptés et mon statut. */
export async function fetchUpcomingGroups(userId: string, filters: Filters = {}): Promise<GroupCardData[]> {
  let query = supabase
    .from('groups')
    .select('*')
    .in('status', ['open', 'full'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(50);
  if (filters.universe) query = query.eq('universe', filters.universe);
  if (filters.subcategory) query = query.eq('subcategory', filters.subcategory);

  const { data: groups, error } = await query;
  if (error) throw error;
  if (!groups?.length) return [];

  const ids = groups.map((g) => g.id);
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, user_id, status')
    .in('group_id', ids);

  const rows = (memberships ?? []) as Pick<GroupMember, 'group_id' | 'user_id' | 'status'>[];
  const accepted = rows.filter((m) => m.status === 'accepted');
  const profiles = await fetchMiniProfiles([...groups.map((g) => g.organizer_id), ...accepted.map((m) => m.user_id)]);

  return groups.map((g) => ({
    ...g,
    organizer: profiles[g.organizer_id] ?? null,
    members: accepted.filter((m) => m.group_id === g.id).map((m) => profiles[m.user_id]).filter(Boolean),
    myStatus: rows.find((m) => m.group_id === g.id && m.user_id === userId)?.status ?? null,
  }));
}

export async function fetchGroupDetail(groupId: string, userId: string) {
  const { data: group, error } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
  if (error) throw error;
  if (!group) return null;

  const { data: memberships } = await supabase.from('group_members').select('*').eq('group_id', groupId);
  const rows = (memberships ?? []) as GroupMember[];
  const profiles = await fetchMiniProfiles([group.organizer_id, ...rows.map((m) => m.user_id)]);
  const mine = rows.find((m) => m.user_id === userId) ?? null;

  return {
    group,
    organizer: profiles[group.organizer_id] ?? null,
    members: rows.filter((m) => m.status === 'accepted').map((m) => ({ ...m, profile: profiles[m.user_id] })),
    pending: rows.filter((m) => m.status === 'pending').map((m) => ({ ...m, profile: profiles[m.user_id] })),
    mine,
    isOrganizer: !!mine && mine.status === 'accepted' && (mine.role === 'organizer' || mine.role === 'co_organizer'),
  };
}

export type GroupDetail = NonNullable<Awaited<ReturnType<typeof fetchGroupDetail>>>;

export async function requestJoin(groupId: string, note?: string) {
  const { data, error } = await supabase.rpc('request_join', { p_group: groupId, p_note: note ?? null });
  if (error) throw error;
  return data;
}

export async function respondJoin(groupId: string, userId: string, accept: boolean) {
  const { error } = await supabase.rpc('respond_join', { p_group: groupId, p_user: userId, p_accept: accept });
  if (error) throw error;
}

export async function leaveGroup(groupId: string) {
  const { error } = await supabase.rpc('leave_group', { p_group: groupId });
  if (error) throw error;
}
