-- ============================================================================
-- WyytU V1 — modération (dans l'app, pour les comptes administrateurs)
-- Pour te nommer admin (une seule fois, dans Supabase › SQL Editor) :
--   insert into public.admins (user_id) values ('<ton id utilisateur>');
-- ============================================================================

create table if not exists public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- chacun peut seulement savoir s'il est lui-même admin
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

create or replace function private.is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = p_user);
$$;
grant execute on function private.is_admin(uuid) to authenticated;

-- Lecture des files de modération par les admins
create policy ratings_admin on public.ratings for select to authenticated using (private.is_admin(auth.uid()));
create policy reports_admin on public.reports for select to authenticated using (private.is_admin(auth.uid()));
create policy disputes_admin on public.attendance_disputes for select to authenticated using (private.is_admin(auth.uid()));
create policy partners_admin on public.partners for select to authenticated using (private.is_admin(auth.uid()));

-- Les admins voient et suppriment les selfies (supprimés après vérification)
create policy selfies_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and private.is_admin(auth.uid()));
create policy selfies_admin_remove on storage.objects for delete to authenticated
  using (bucket_id = 'selfies' and private.is_admin(auth.uid()));

-- File des selfies à vérifier (le chemin du selfie n'est pas public)
create or replace function public.admin_pending_selfies()
returns table (id uuid, first_name text, selfie_path text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  return query
    select p.id, p.first_name, p.selfie_path, p.updated_at from profiles p
    where p.verification_status = 'pending' and p.selfie_path is not null
    order by p.updated_at;
end $$;

-- Valider ou refuser un selfie. Renvoie le chemin du fichier pour que l'app
-- le supprime du stockage (promesse faite à l'utilisateur).
create or replace function public.admin_review_selfie(p_user uuid, p_approve boolean)
returns text language plpgsql security definer set search_path = public, private as $$
declare
  v_path text;
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  select selfie_path into v_path from profiles where id = p_user;
  update profiles set
    verification_status = case when p_approve then 'verified'::verification_status else 'rejected'::verification_status end,
    selfie_path = case when p_approve then null else selfie_path end
  where id = p_user;
  insert into notifications (user_id, type, payload)
  values (p_user, case when p_approve then 'verified' else 'verify_rejected' end, '{}'::jsonb);
  return v_path;
end $$;

create or replace function public.admin_review_rating(p_rating uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  update ratings set moderation_status = case when p_approve then 'approved'::moderation_status else 'rejected'::moderation_status end
  where id = p_rating;
end $$;

create or replace function public.admin_resolve_report(p_report uuid, p_valid boolean)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  update reports set status = case when p_valid then 'approved'::moderation_status else 'rejected'::moderation_status end
  where id = p_report;
end $$;

-- Contestation acceptée : l'absence est effacée et la fiabilité recalculée
create or replace function public.admin_resolve_dispute(p_dispute uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  d attendance_disputes%rowtype;
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  select * into d from attendance_disputes where id = p_dispute;
  if not found then raise exception 'Contestation introuvable'; end if;
  update attendance_disputes set status = case when p_accept then 'approved'::moderation_status else 'rejected'::moderation_status end
  where id = p_dispute;
  if p_accept then
    update group_members set no_show = false, checked_in = true where group_id = d.group_id and user_id = d.user_id;
    perform refresh_attendance(d.user_id);
  end if;
  insert into notifications (user_id, type, payload)
  values (d.user_id, case when p_accept then 'dispute_accepted' else 'dispute_rejected' end, jsonb_build_object('group_id', d.group_id));
end $$;

create or replace function public.admin_review_partner(p_partner uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  v_owner uuid;
begin
  if not is_admin(auth.uid()) then raise exception 'Réservé aux administrateurs'; end if;
  update partners set status = case when p_approve then 'approved'::partner_status else 'suspended'::partner_status end
  where id = p_partner returning owner_id into v_owner;
  if v_owner is not null and exists (select 1 from profiles where id = v_owner) then
    insert into notifications (user_id, type, payload)
    values (v_owner, case when p_approve then 'partner_approved' else 'partner_rejected' end, jsonb_build_object('partner_id', p_partner));
  end if;
end $$;

revoke all on function public.admin_pending_selfies() from public, anon;
revoke all on function public.admin_review_selfie(uuid, boolean) from public, anon;
revoke all on function public.admin_review_rating(uuid, boolean) from public, anon;
revoke all on function public.admin_resolve_report(uuid, boolean) from public, anon;
revoke all on function public.admin_resolve_dispute(uuid, boolean) from public, anon;
revoke all on function public.admin_review_partner(uuid, boolean) from public, anon;
grant execute on function public.admin_pending_selfies() to authenticated;
grant execute on function public.admin_review_selfie(uuid, boolean) to authenticated;
grant execute on function public.admin_review_rating(uuid, boolean) to authenticated;
grant execute on function public.admin_resolve_report(uuid, boolean) to authenticated;
grant execute on function public.admin_resolve_dispute(uuid, boolean) to authenticated;
grant execute on function public.admin_review_partner(uuid, boolean) to authenticated;
