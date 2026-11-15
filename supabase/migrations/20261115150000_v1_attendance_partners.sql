-- ============================================================================
-- WyytU V1 — présences, absences, contestation, scan partenaire
-- ============================================================================

alter table public.group_members add column if not exists no_show boolean not null default false;

-- Contestation d'une absence (sous 72 h)
create table if not exists public.attendance_disputes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  message    text not null check (char_length(message) between 5 and 1000),
  status     public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);
alter table public.attendance_disputes enable row level security;

create policy disputes_select on public.attendance_disputes for select to authenticated
  using (user_id = auth.uid());

-- Recalcule sorties et taux de présence d'un membre
create or replace function public.refresh_attendance(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update profiles set
    outings_count = (select count(*) from group_members where user_id = p_user and checked_in),
    attendance_rate = coalesce((
      select round(100.0 * count(*) filter (where checked_in)
                   / nullif(count(*) filter (where checked_in or no_show), 0), 2)
      from group_members where user_id = p_user), 100)
  where id = p_user;
$$;

-- L'organisateur pointe les présents / absents après le début de la sortie
create or replace function public.mark_attendance(p_group uuid, p_user uuid, p_present boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_starts timestamptz;
begin
  if not is_group_organizer(p_group, auth.uid()) then
    raise exception 'Seul l''organisateur peut pointer les présences';
  end if;
  select starts_at into v_starts from groups where id = p_group;
  if v_starts > now() + interval '30 minutes' then
    raise exception 'Le pointage s''ouvre 30 minutes avant la sortie';
  end if;
  if v_starts < now() - interval '48 hours' then
    raise exception 'Le pointage est fermé (48 h après la sortie)';
  end if;

  update group_members set checked_in = p_present, no_show = not p_present
  where group_id = p_group and user_id = p_user and status = 'accepted';
  if not found then raise exception 'Ce membre ne fait pas partie du groupe'; end if;

  perform refresh_attendance(p_user);

  if not p_present then
    insert into notifications (user_id, type, payload)
    values (p_user, 'no_show', jsonb_build_object('group_id', p_group));
  end if;
end $$;

-- Le membre conteste une absence dans les 72 h
create or replace function public.contest_no_show(p_group uuid, p_message text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_starts timestamptz;
begin
  if not exists (select 1 from group_members where group_id = p_group and user_id = auth.uid() and no_show) then
    raise exception 'Aucune absence à contester pour cette sortie';
  end if;
  select starts_at into v_starts from groups where id = p_group;
  if v_starts < now() - interval '72 hours' then
    raise exception 'Le délai de 72 h pour contester est dépassé';
  end if;
  insert into attendance_disputes (group_id, user_id, message)
  values (p_group, auth.uid(), trim(p_message))
  on conflict (group_id, user_id) do update set message = excluded.message, status = 'pending', created_at = now();
end $$;

-- Le partenaire scanne le QR du chef de groupe : tous les membres acceptés
-- sont marqués présents et la réduction est confirmée.
create or replace function public.partner_check_in(p_group uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_group   groups%rowtype;
  v_partner partners%rowtype;
  v_count   integer;
  r         record;
begin
  select * into v_group from groups where id = p_group;
  if not found then raise exception 'QR inconnu'; end if;

  select * into v_partner from partners where id = v_group.partner_id;
  if not found or v_partner.owner_id <> auth.uid() then
    raise exception 'Ce groupe n''a pas réservé chez toi';
  end if;
  if v_group.starts_at > now() + interval '2 hours' or v_group.starts_at < now() - interval '6 hours' then
    raise exception 'Ce QR n''est pas valable à cette heure-ci';
  end if;

  update group_members set checked_in = true, no_show = false
  where group_id = p_group and status = 'accepted';
  get diagnostics v_count = row_count;

  for r in select user_id from group_members where group_id = p_group and status = 'accepted' loop
    perform refresh_attendance(r.user_id);
  end loop;

  return jsonb_build_object(
    'title', v_group.title,
    'starts_at', v_group.starts_at,
    'members', v_count,
    'discount_pct', v_partner.discount_pct
  );
end $$;

revoke all on function public.refresh_attendance(uuid) from public, anon, authenticated;
revoke all on function public.mark_attendance(uuid, uuid, boolean) from public, anon;
revoke all on function public.contest_no_show(uuid, text) from public, anon;
revoke all on function public.partner_check_in(uuid) from public, anon;
grant execute on function public.mark_attendance(uuid, uuid, boolean) to authenticated;
grant execute on function public.contest_no_show(uuid, text) to authenticated;
grant execute on function public.partner_check_in(uuid) to authenticated;

-- Le partenaire voit les groupes qui ont réservé chez lui (même si
-- l'organisateur l'a bloqué, ce qui n'a pas de sens pour un lieu)
create policy groups_select_partner on public.groups for select to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()));

-- Les champs « système » du profil restent protégés contre une modification
-- directe par l'utilisateur, mais les fonctions serveur (security definer,
-- qui s'exécutent sous le propriétaire) peuvent les mettre à jour.
create or replace function public.protect_profile_system_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    new.verification_status := old.verification_status;
    new.is_premium          := old.is_premium;
    new.rating_avg          := old.rating_avg;
    new.rating_count        := old.rating_count;
    new.outings_count       := old.outings_count;
    new.attendance_rate     := old.attendance_rate;
    if new.selfie_path is distinct from old.selfie_path and new.selfie_path is not null then
      if new.selfie_consent_at is null then
        raise exception 'Le consentement au selfie est obligatoire';
      end if;
      new.verification_status := 'pending';
    end if;
  end if;
  return new;
end $$;
