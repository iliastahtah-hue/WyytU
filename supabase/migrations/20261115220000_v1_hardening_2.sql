-- ============================================================================
-- WyytU V1 — durcissement (2e relecture)
-- ============================================================================

-- Créneaux partenaires : « réservé » est géré uniquement par le serveur ;
-- un créneau réservé ne peut plus changer d'heure, de durée ni de lieu.
create or replace function public.protect_offer_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.booked := false;
    else
      new.booked := old.booked;
      if old.booked and (new.starts_at is distinct from old.starts_at
                         or new.duration_min is distinct from old.duration_min
                         or new.partner_id is distinct from old.partner_id) then
        raise exception 'Ce créneau est réservé par un groupe : il ne peut plus être modifié';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger partner_offers_protect before insert or update on public.partner_offers
  for each row execute function public.protect_offer_fields();

-- Un créneau réservé ne peut pas non plus être supprimé par le partenaire
create or replace function public.protect_offer_delete()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' and old.booked then
    raise exception 'Ce créneau est réservé par un groupe : contacte le groupe pour l''annuler';
  end if;
  return old;
end $$;
create trigger partner_offers_protect_delete before delete on public.partner_offers
  for each row execute function public.protect_offer_delete();

-- Partenaires : réduction plafonnée à 30 % aussi à la création
create or replace function public.protect_partner_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.status := 'pending';
    else
      new.status     := old.status;
      new.owner_id   := old.owner_id;
      new.created_at := old.created_at;
    end if;
    if new.discount_pct > 30 then new.discount_pct := 30; end if;
  end if;
  return new;
end $$;
drop trigger if exists partners_protect on public.partners;
create trigger partners_protect before insert or update on public.partners
  for each row execute function public.protect_partner_fields();

-- Selfie : consentement obligatoire aussi à la création du profil
create or replace function public.protect_profile_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.selfie_path is not null then
      if split_part(new.selfie_path, '/', 1) <> new.id::text then
        raise exception 'Selfie invalide';
      end if;
      if new.selfie_consent_at is null then
        raise exception 'Le consentement au selfie est obligatoire';
      end if;
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

-- Groupes : lieu et durée figés dès qu'il y a des membres ou un partenaire ;
-- changer la capacité rouvre ou complète le groupe automatiquement.
create or replace function public.before_group_update()
returns trigger language plpgsql security invoker set search_path = public, private as $$
declare
  v_members integer;
begin
  if current_user = 'authenticated' then
    v_members := accepted_count(old.id);
    new.organizer_id := old.organizer_id;
    new.created_at   := old.created_at;
    new.partner_id   := old.partner_id;
    new.offer_id     := old.offer_id;
    new.universe     := old.universe;
    new.subcategory  := old.subcategory;
    new.women_only   := old.women_only;
    new.starts_at    := old.starts_at;
    if old.partner_id is not null or v_members > 1 then
      new.place_name   := old.place_name;
      new.lat          := old.lat;
      new.lng          := old.lng;
      new.duration_min := old.duration_min;
    end if;
    if new.status is distinct from old.status
       and not (new.status = 'cancelled' and old.status in ('open', 'full')) then
      raise exception 'Changement de statut non autorisé';
    end if;
    if new.capacity < v_members then
      raise exception 'La capacité ne peut pas être inférieure au nombre de membres';
    end if;
    if new.status <> 'cancelled' then
      new.status := case when v_members >= new.capacity then 'full' else 'open' end;
    end if;
  end if;
  return new;
end $$;

-- Pas d'acceptation dans un groupe annulé ou déjà passé
create or replace function public.respond_join(p_group uuid, p_user uuid, p_accept boolean)
returns public.member_status language plpgsql security definer set search_path = public, private as $$
declare
  v_uid   uuid := auth.uid();
  v_group groups%rowtype;
  v_new   public.member_status;
begin
  if not is_group_organizer(p_group, v_uid) then
    raise exception 'Seul l''organisateur peut répondre';
  end if;

  select * into v_group from groups where id = p_group for update;
  if v_group.status not in ('open', 'full') or v_group.starts_at < now() then
    raise exception 'Ce groupe est fermé';
  end if;

  if not exists (select 1 from group_members where group_id = p_group and user_id = p_user and status = 'pending') then
    raise exception 'Aucune demande en attente';
  end if;

  if p_accept then
    if accepted_count(p_group) >= v_group.capacity then
      raise exception 'Le groupe est déjà complet';
    end if;
    v_new := 'accepted';
  else
    v_new := 'declined';
  end if;

  update group_members set status = v_new, decided_at = now()
  where group_id = p_group and user_id = p_user;

  if accepted_count(p_group) >= v_group.capacity then
    update groups set status = 'full' where id = p_group;
  end if;

  insert into notifications (user_id, type, payload)
  values (p_user, case when p_accept then 'join_accepted' else 'join_declined' end,
          jsonb_build_object('group_id', p_group));

  return v_new;
end $$;

revoke all on function public.protect_offer_fields() from public, anon, authenticated;
revoke all on function public.protect_offer_delete() from public, anon, authenticated;
