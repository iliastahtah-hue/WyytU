-- ============================================================================
-- WyytU V1 — durcissement de sécurité (suite à la relecture du code)
-- ============================================================================

-- 1. Partenaires : le statut (validation) et le propriétaire ne sont
--    jamais modifiables par l'utilisateur ; réduction plafonnée.
create or replace function public.protect_partner_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    new.status   := old.status;
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
    if new.discount_pct > 30 then new.discount_pct := 30; end if;
  end if;
  return new;
end $$;

create trigger partners_protect before update on public.partners
  for each row execute function public.protect_partner_fields();

-- 2. Profil : genre et date de naissance figés après l'inscription ; le
--    selfie doit être dans le dossier de l'utilisateur.
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
    new.gender              := old.gender;
    new.birth_date          := old.birth_date;
    new.created_at          := old.created_at;
    if new.selfie_path is distinct from old.selfie_path and new.selfie_path is not null then
      if split_part(new.selfie_path, '/', 1) <> new.id::text then
        raise exception 'Selfie invalide';
      end if;
      if new.selfie_consent_at is null then
        raise exception 'Le consentement au selfie est obligatoire';
      end if;
      new.verification_status := 'pending';
    end if;
  end if;
  return new;
end $$;

create or replace function public.protect_profile_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.selfie_path is not null and split_part(new.selfie_path, '/', 1) <> new.id::text then
      raise exception 'Selfie invalide';
    end if;
    new.verification_status := case when new.selfie_path is not null then 'pending' else 'none' end;
    new.is_premium      := false;
    new.rating_avg      := 0;
    new.rating_count    := 0;
    new.outings_count   := 0;
    new.attendance_rate := 100;
  end if;
  return new;
end $$;

-- 3. Photos : le fichier doit être dans le dossier de son propriétaire
alter table public.profile_photos
  add constraint profile_photos_path_owner check (split_part(path, '/', 1) = user_id::text);

-- 4. Données sensibles du profil (date de naissance exacte, selfie) :
--    plus lisibles directement par les autres membres.
revoke select on public.profiles from authenticated, anon;
grant select (
  id, first_name, show_age, gender, city, bio, studies, job, lifestyle, interests, app_language,
  verification_status, is_premium, rating_avg, rating_count, outings_count, attendance_rate,
  created_at, updated_at
) on public.profiles to authenticated;

-- Mon profil complet (pour l'app)
create or replace function public.get_my_profile()
returns setof public.profiles language sql stable security definer set search_path = public as $$
  select * from profiles where id = auth.uid();
$$;

-- Âge public : seulement si la personne a choisi de l'afficher
create or replace function public.public_age(p_user uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case when show_age and not is_blocked_between(auth.uid(), id)
              then date_part('year', age(current_date, birth_date))::int end
  from profiles where id = p_user;
$$;

revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.public_age(uuid) from public, anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.public_age(uuid) to authenticated;

-- 5. Groupes : l'organisateur ne peut modifier que le titre, la
--    description, le budget, la capacité et annuler. Le reste est figé
--    (date, lieu partenaire, créneau, univers, « femmes uniquement »).
-- (security invoker : current_user vaut 'authenticated' quand c'est
--  l'utilisateur qui modifie, et le propriétaire quand c'est une fonction serveur)
create or replace function public.before_group_update()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_user = 'authenticated' then
    new.organizer_id := old.organizer_id;
    new.created_at   := old.created_at;
    new.partner_id   := old.partner_id;
    new.offer_id     := old.offer_id;
    new.universe     := old.universe;
    new.subcategory  := old.subcategory;
    new.women_only   := old.women_only;
    new.starts_at    := old.starts_at;
    if new.status is distinct from old.status
       and not (new.status = 'cancelled' and old.status in ('open', 'full')) then
      raise exception 'Changement de statut non autorisé';
    end if;
    if new.capacity < accepted_count(old.id) then
      raise exception 'La capacité ne peut pas être inférieure au nombre de membres';
    end if;
  end if;
  return new;
end $$;

-- Un groupe annulé ne compte plus, mais on garde la trace des annulations
-- pour le quota : un groupe annulé moins de 24 h après sa création compte
-- quand même (évite de contourner la limite en annulant/recréant).
create or replace function public.before_group_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_premium boolean;
  v_count   integer;
  v_gender  public.gender;
begin
  if new.organizer_id <> auth.uid() then
    raise exception 'Organisateur invalide';
  end if;
  if new.starts_at < now() then
    raise exception 'La date de la sortie est déjà passée';
  end if;

  select is_premium, gender into v_premium, v_gender from profiles where id = new.organizer_id;

  if new.women_only and v_gender <> 'femme' then
    raise exception 'Seule une organisatrice peut créer un groupe « Femmes uniquement »';
  end if;

  if not coalesce(v_premium, false) then
    select count(*) into v_count from groups
    where organizer_id = new.organizer_id
      and created_at > now() - interval '7 days';
    if v_count >= 2 then
      raise exception 'WEEKLY_LIMIT' using hint = 'Limite de 2 groupes créés par semaine en version gratuite';
    end if;
  end if;

  new.status := 'open';
  return new;
end $$;

-- 6. Quitter : on ne rouvre un groupe complet que s'il reste vraiment
--    de la place (annuler une demande en attente ne change rien).
create or replace function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_role public.member_role;
  v_next uuid;
begin
  select role into v_role from group_members
  where group_id = p_group and user_id = v_uid and status in ('pending', 'accepted');
  if not found then return; end if;

  update group_members set status = 'left', decided_at = now()
  where group_id = p_group and user_id = v_uid;

  update groups set status = 'open'
  where id = p_group and status = 'full' and accepted_count(p_group) < capacity;

  if v_role = 'organizer' then
    select user_id into v_next from group_members
    where group_id = p_group and status = 'accepted'
    order by decided_at nulls last, requested_at limit 1;

    if v_next is null then
      update groups set status = 'cancelled' where id = p_group;
    else
      update group_members set role = 'co_organizer' where group_id = p_group and user_id = v_next;
      insert into notifications (user_id, type, payload)
      values (v_next, 'now_co_organizer', jsonb_build_object('group_id', p_group));
    end if;
  end if;
end $$;

-- 7. QR partenaire : un code secret par groupe, visible seulement par
--    l'organisateur ; le scan vérifie le code, le partenaire validé et
--    que le groupe n'est pas annulé.
create table if not exists public.group_secrets (
  group_id     uuid primary key references public.groups (id) on delete cascade,
  check_in_code text not null default encode(extensions.gen_random_bytes(12), 'hex')
);
alter table public.group_secrets enable row level security;
create policy group_secrets_select on public.group_secrets for select to authenticated
  using (public.is_group_organizer(group_id, auth.uid()));

create or replace function public.after_group_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into group_members (group_id, user_id, status, role, decided_at)
  values (new.id, new.organizer_id, 'accepted', 'organizer', now());
  insert into group_secrets (group_id) values (new.id);
  return new;
end $$;

insert into public.group_secrets (group_id) select id from public.groups on conflict do nothing;

drop function if exists public.partner_check_in(uuid);
create or replace function public.partner_check_in(p_group uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_group   groups%rowtype;
  v_partner partners%rowtype;
  v_count   integer;
  r         record;
begin
  select * into v_group from groups where id = p_group;
  if not found or not exists (select 1 from group_secrets where group_id = p_group and check_in_code = p_code) then
    raise exception 'QR non valide';
  end if;
  if v_group.status not in ('open', 'full') then raise exception 'Ce groupe est annulé'; end if;

  select * into v_partner from partners where id = v_group.partner_id;
  if not found or v_partner.owner_id <> auth.uid() or v_partner.status <> 'approved' then
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

  return jsonb_build_object('title', v_group.title, 'starts_at', v_group.starts_at,
                            'members', v_count, 'discount_pct', v_partner.discount_pct);
end $$;
revoke all on function public.partner_check_in(uuid, text) from public, anon;
grant execute on function public.partner_check_in(uuid, text) to authenticated;

-- 8. Créneaux partenaires : l'heure du groupe doit être celle du créneau,
--    et le créneau se libère si le groupe est supprimé.
create or replace function public.book_offer_on_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.offer_id is not null then
    update partner_offers set booked = true
    where id = new.offer_id and not booked and partner_id = new.partner_id and starts_at = new.starts_at;
    if not found then
      raise exception 'Ce créneau n''est plus disponible';
    end if;
  end if;
  return new;
end $$;

create or replace function public.release_offer_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.offer_id is not null then
    update partner_offers set booked = false where id = old.offer_id;
  end if;
  return old;
end $$;
create trigger groups_release_offer_delete after delete on public.groups
  for each row execute function public.release_offer_on_delete();
revoke all on function public.release_offer_on_delete() from public, anon, authenticated;
revoke all on function public.protect_partner_fields() from public, anon, authenticated;

-- 9. Dernier message de chaque conversation (onglet Messages)
create or replace function public.my_conversations()
returns table (group_id uuid, body text, created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select distinct on (m.group_id) m.group_id, m.body, m.created_at
  from group_messages m
  where m.group_id in (select gm.group_id from group_members gm where gm.user_id = auth.uid() and gm.status = 'accepted')
  order by m.group_id, m.created_at desc;
$$;
revoke all on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;
