-- ============================================================================
-- WyytU V1 — schéma complet
-- Nouvelles tables en anglais (le chat s’appelle group_messages) : elles ne touchent PAS aux anciennes tables
-- (activites, participations, utilisateurs, …), qui restent intactes.
-- Toutes les tables ont la sécurité RLS activée.
-- ============================================================================

-- gen_random_uuid() est intégré à PostgreSQL 13+ (pas d’extension nécessaire)

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.gender as enum ('homme', 'femme');
create type public.verification_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.member_status as enum ('pending', 'accepted', 'declined', 'left', 'removed');
create type public.member_role as enum ('organizer', 'co_organizer', 'member');
create type public.group_status as enum ('open', 'full', 'cancelled', 'done');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.partner_status as enum ('pending', 'approved', 'suspended');

-- Les 7 univers de la V1
create domain public.universe as text
  check (value in ('sport', 'resto', 'cine', 'soiree', 'jeux', 'nature', 'bienetre'));

-- ---------------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  first_name          text not null check (char_length(first_name) between 1 and 40),
  birth_date          date not null check (birth_date <= (current_date - interval '18 years')),
  show_age            boolean not null default false,
  gender              public.gender not null,
  city                text not null default 'Tanger',
  bio                 text check (char_length(bio) <= 300),
  studies             text check (char_length(studies) <= 80),
  job                 text check (char_length(job) <= 80),
  lifestyle           text[] not null default '{}',
  interests           text[] not null default '{}',
  app_language        text not null default 'fr' check (app_language in ('dar', 'fr', 'en')),
  verification_status public.verification_status not null default 'none',
  selfie_path         text,
  selfie_consent_at   timestamptz,
  is_premium          boolean not null default false,
  rating_avg          numeric(3, 2) not null default 0,
  rating_count        integer not null default 0,
  outings_count       integer not null default 0,
  attendance_rate     numeric(5, 2) not null default 100,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Champs privés (🔒) : visibles seulement par soi et par les membres
-- d'un groupe accepté en commun.
create table public.profile_private (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  residence           text check (char_length(residence) <= 80),
  height_cm           smallint check (height_cm between 120 and 230),
  relationship_status text check (relationship_status in ('celibataire', 'en_couple', 'marie', 'non_precise')),
  updated_at          timestamptz not null default now()
);

create table public.profile_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  path       text not null,
  position   smallint not null default 0 check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

-- ---------------------------------------------------------------------------
-- Partenaires (côté partenaires, façon Glovo)
-- ---------------------------------------------------------------------------
create table public.partners (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 80),
  universe     public.universe not null,
  address      text,
  lat          double precision,
  lng          double precision,
  logo_path    text,
  discount_pct smallint not null default 10 check (discount_pct between 0 and 50),
  status       public.partner_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- Plans publiés par les partenaires (créneau, séance, menu…)
create table public.partner_offers (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references public.partners (id) on delete cascade,
  title        text not null check (char_length(title) between 2 and 80),
  subcategory  text,
  starts_at    timestamptz not null,
  duration_min smallint not null default 90 check (duration_min between 15 and 600),
  capacity     smallint not null default 4 check (capacity between 1 and 50),
  price_mad    integer check (price_mad >= 0),
  boosted      boolean not null default false,
  booked       boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Groupes
-- ---------------------------------------------------------------------------
create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  universe     public.universe not null,
  subcategory  text check (char_length(subcategory) <= 40),
  title        text not null check (char_length(title) between 3 and 60),
  description  text check (char_length(description) <= 500),
  starts_at    timestamptz not null,
  duration_min smallint not null default 90 check (duration_min between 15 and 720),
  place_name   text not null check (char_length(place_name) between 2 and 80),
  partner_id   uuid references public.partners (id) on delete set null,
  offer_id     uuid references public.partner_offers (id) on delete set null,
  lat          double precision,
  lng          double precision,
  capacity     smallint not null check (capacity between 2 and 20),
  level        text check (level in ('C', 'C+', 'B', 'B+', 'A', 'A+')),
  women_only   boolean not null default false,
  budget       text check (char_length(budget) <= 40),
  status       public.group_status not null default 'open',
  created_at   timestamptz not null default now()
);

create index groups_starts_at_idx on public.groups (starts_at) where status in ('open', 'full');
create index groups_universe_idx on public.groups (universe);

create table public.group_members (
  group_id     uuid not null references public.groups (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  status       public.member_status not null default 'pending',
  role         public.member_role not null default 'member',
  note         text check (char_length(note) <= 200),
  confirmed_at timestamptz,
  checked_in   boolean not null default false,
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id, status);

create table public.group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index group_messages_group_idx on public.group_messages (group_id, created_at);

-- ---------------------------------------------------------------------------
-- Confiance : notes, avis, signalements, blocages
-- ---------------------------------------------------------------------------
create table public.ratings (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups (id) on delete cascade,
  rater_id          uuid not null references public.profiles (id) on delete cascade,
  rated_id          uuid not null references public.profiles (id) on delete cascade,
  stars             smallint not null check (stars between 1 and 5),
  comment           text check (char_length(comment) <= 400),
  reason            text check (char_length(reason) <= 200),
  moderation_status public.moderation_status not null default 'pending',
  created_at        timestamptz not null default now(),
  unique (group_id, rater_id, rated_id),
  check (rater_id <> rated_id),
  -- une note de 2 ou moins demande un motif
  check (stars > 2 or reason is not null)
);

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  group_id         uuid references public.groups (id) on delete set null,
  message_id       uuid references public.group_messages (id) on delete set null,
  reason           text not null check (reason in ('comportement', 'faux_profil', 'harcelement', 'absence', 'contenu', 'autre')),
  details          text check (char_length(details) <= 1000),
  status           public.moderation_status not null default 'pending',
  created_at       timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires (security definer : contournent la RLS de façon
-- contrôlée, avec search_path fixé)
-- ---------------------------------------------------------------------------
create or replace function public.is_accepted_member(p_group uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = p_group and user_id = p_user and status = 'accepted'
  );
$$;

create or replace function public.is_group_organizer(p_group uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = p_group and user_id = p_user and status = 'accepted'
      and role in ('organizer', 'co_organizer')
  );
$$;

create or replace function public.shares_accepted_group(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members a
    join group_members b on b.group_id = a.group_id
    where a.user_id = p_a and b.user_id = p_b
      and a.status = 'accepted' and b.status = 'accepted'
  );
$$;

create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create or replace function public.accepted_count(p_group uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from group_members where group_id = p_group and status = 'accepted';
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger profile_private_touch before update on public.profile_private
  for each row execute function public.touch_updated_at();

-- Un utilisateur ne peut pas modifier lui-même ses champs « système »
-- (vérification, premium, notes…). Seul le service (dashboard, fonctions
-- serveur) peut les changer.
create or replace function public.protect_profile_system_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.verification_status := old.verification_status;
    new.is_premium          := old.is_premium;
    new.rating_avg          := old.rating_avg;
    new.rating_count        := old.rating_count;
    new.outings_count       := old.outings_count;
    new.attendance_rate     := old.attendance_rate;
    -- envoyer un selfie fait passer en « en attente » de vérification
    if new.selfie_path is distinct from old.selfie_path and new.selfie_path is not null then
      if new.selfie_consent_at is null then
        raise exception 'Le consentement au selfie est obligatoire';
      end if;
      new.verification_status := 'pending';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_system_fields();

create or replace function public.protect_profile_insert()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.verification_status := case when new.selfie_path is not null then 'pending' else 'none' end;
    new.is_premium      := false;
    new.rating_avg      := 0;
    new.rating_count    := 0;
    new.outings_count   := 0;
    new.attendance_rate := 100;
  end if;
  return new;
end $$;

create trigger profiles_protect_insert before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- Création d'un groupe : quota de 2 groupes créés par semaine en gratuit,
-- et l'organisateur devient automatiquement membre accepté.
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
      and created_at > now() - interval '7 days'
      and status <> 'cancelled';
    if v_count >= 2 then
      raise exception 'WEEKLY_LIMIT' using hint = 'Limite de 2 groupes créés par semaine en version gratuite';
    end if;
  end if;

  new.status := 'open';
  return new;
end $$;

create trigger groups_before_insert before insert on public.groups
  for each row execute function public.before_group_insert();

create or replace function public.after_group_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into group_members (group_id, user_id, status, role, decided_at)
  values (new.id, new.organizer_id, 'accepted', 'organizer', now());
  return new;
end $$;

create trigger groups_after_insert after insert on public.groups
  for each row execute function public.after_group_insert();

-- Seul le statut, la description et le lieu sont modifiables par
-- l'organisateur ; l'organisateur et la capacité minimale restent cohérents.
create or replace function public.before_group_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    new.organizer_id := old.organizer_id;
    new.created_at   := old.created_at;
    if new.capacity < accepted_count(old.id) then
      raise exception 'La capacité ne peut pas être inférieure au nombre de membres';
    end if;
  end if;
  return new;
end $$;

create trigger groups_before_update before update on public.groups
  for each row execute function public.before_group_update();

-- Notes : seuls les membres présents d'une sortie passée se notent.
create or replace function public.before_rating_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_starts timestamptz;
begin
  if new.rater_id <> auth.uid() then
    raise exception 'Auteur invalide';
  end if;
  select starts_at into v_starts from groups where id = new.group_id;
  if v_starts is null or v_starts > now() then
    raise exception 'On ne peut noter qu''après la sortie';
  end if;
  if v_starts < now() - interval '7 days' then
    raise exception 'Le délai pour noter cette sortie est dépassé';
  end if;
  if not (is_accepted_member(new.group_id, new.rater_id) and is_accepted_member(new.group_id, new.rated_id)) then
    raise exception 'Seuls les membres de la sortie peuvent se noter';
  end if;
  new.moderation_status := 'pending';
  return new;
end $$;

create trigger ratings_before_insert before insert on public.ratings
  for each row execute function public.before_rating_insert();

-- Recalcul de la note moyenne quand un avis est approuvé par la modération.
create or replace function public.refresh_rating_aggregate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles p set
    rating_avg = coalesce((select round(avg(stars)::numeric, 2) from ratings
                           where rated_id = p.id and moderation_status = 'approved'), 0),
    rating_count = (select count(*) from ratings
                    where rated_id = p.id and moderation_status = 'approved')
  where p.id = coalesce(new.rated_id, old.rated_id);
  return null;
end $$;

create trigger ratings_aggregate after insert or update of moderation_status or delete on public.ratings
  for each row execute function public.refresh_rating_aggregate();

-- ---------------------------------------------------------------------------
-- Actions sur les groupes (appelées depuis l'app via supabase.rpc)
-- ---------------------------------------------------------------------------

-- Demander à rejoindre un groupe
create or replace function public.request_join(p_group uuid, p_note text default null)
returns public.member_status language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_group  groups%rowtype;
  v_gender public.gender;
  v_status public.member_status;
begin
  if v_uid is null then raise exception 'Non connecté'; end if;

  select * into v_group from groups where id = p_group for update;
  if not found then raise exception 'Groupe introuvable'; end if;
  if v_group.status <> 'open' then raise exception 'Ce groupe n''accepte plus de demandes'; end if;
  if v_group.starts_at < now() then raise exception 'Cette sortie est déjà passée'; end if;
  if is_blocked_between(v_uid, v_group.organizer_id) then raise exception 'Action impossible'; end if;

  select gender into v_gender from profiles where id = v_uid;
  if v_gender is null then raise exception 'Complète ton profil d''abord'; end if;
  if v_group.women_only and v_gender <> 'femme' then
    raise exception 'Ce groupe est réservé aux femmes';
  end if;

  select status into v_status from group_members where group_id = p_group and user_id = v_uid;
  if v_status in ('accepted', 'pending') then return v_status; end if;
  if v_status = 'removed' then raise exception 'Tu ne peux plus rejoindre ce groupe'; end if;

  insert into group_members (group_id, user_id, status, role, note, requested_at)
  values (p_group, v_uid, 'pending', 'member', nullif(trim(p_note), ''), now())
  on conflict (group_id, user_id) do update
    set status = 'pending', note = excluded.note, requested_at = now(), decided_at = null;

  insert into notifications (user_id, type, payload)
  values (v_group.organizer_id, 'join_request', jsonb_build_object('group_id', p_group, 'user_id', v_uid));

  return 'pending';
end $$;

-- L'organisateur accepte ou refuse une demande
create or replace function public.respond_join(p_group uuid, p_user uuid, p_accept boolean)
returns public.member_status language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_group groups%rowtype;
  v_new   public.member_status;
begin
  if not is_group_organizer(p_group, v_uid) then
    raise exception 'Seul l''organisateur peut répondre';
  end if;

  select * into v_group from groups where id = p_group for update;

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

-- Annuler sa demande ou quitter un groupe. Si l'organisateur part, le
-- membre accepté le plus ancien devient co-organisateur automatiquement.
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

  update groups set status = 'open' where id = p_group and status = 'full';

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

-- Confirmer sa présence (demandé à tout le groupe avant la sortie)
create or replace function public.confirm_presence(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update group_members set confirmed_at = now()
  where group_id = p_group and user_id = auth.uid() and status = 'accepted';
  if not found then raise exception 'Tu ne fais pas partie de ce groupe'; end if;
end $$;

-- Suppression du compte depuis l'app (exigence App Store 5.1.1)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Non connecté'; end if;
  -- les fichiers (photos, selfie) sont supprimés par l'app via l'API Storage
  -- juste avant cet appel ; ici on supprime le compte et, en cascade, ses données.
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.request_join(uuid, text) from public, anon;
revoke all on function public.respond_join(uuid, uuid, boolean) from public, anon;
revoke all on function public.leave_group(uuid) from public, anon;
revoke all on function public.confirm_presence(uuid) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.request_join(uuid, text) to authenticated;
grant execute on function public.respond_join(uuid, uuid, boolean) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.confirm_presence(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Sécurité ligne par ligne (RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.profile_private enable row level security;
alter table public.profile_photos  enable row level security;
alter table public.partners        enable row level security;
alter table public.partner_offers  enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.group_messages  enable row level security;
alter table public.ratings         enable row level security;
alter table public.reports         enable row level security;
alter table public.blocks          enable row level security;
alter table public.notifications   enable row level security;

-- profils : visibles par les membres connectés, sauf en cas de blocage
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or not public.is_blocked_between(auth.uid(), id));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy private_select on public.profile_private for select to authenticated
  using (user_id = auth.uid() or public.shares_accepted_group(auth.uid(), user_id));
create policy private_insert on public.profile_private for insert to authenticated
  with check (user_id = auth.uid());
create policy private_update on public.profile_private for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy photos_select on public.profile_photos for select to authenticated using (true);
create policy photos_insert on public.profile_photos for insert to authenticated
  with check (user_id = auth.uid());
create policy photos_update on public.profile_photos for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy photos_delete on public.profile_photos for delete to authenticated
  using (user_id = auth.uid());

-- partenaires : les partenaires approuvés sont publics
create policy partners_select on public.partners for select to authenticated
  using (status = 'approved' or owner_id = auth.uid());
create policy partners_insert on public.partners for insert to authenticated
  with check (owner_id = auth.uid() and status = 'pending');
create policy partners_update on public.partners for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy offers_select on public.partner_offers for select to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id
                 and (p.status = 'approved' or p.owner_id = auth.uid())));
create policy offers_write on public.partner_offers for all to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()));

-- groupes : visibles par tous les membres connectés (sauf organisateur bloqué)
create policy groups_select on public.groups for select to authenticated
  using (not public.is_blocked_between(auth.uid(), organizer_id));
create policy groups_insert on public.groups for insert to authenticated
  with check (organizer_id = auth.uid());
create policy groups_update on public.groups for update to authenticated
  using (public.is_group_organizer(id, auth.uid()))
  with check (public.is_group_organizer(id, auth.uid()));

-- membres : les membres acceptés sont visibles de tous ; une demande en
-- attente est visible par son auteur et par l'organisateur.
-- Écriture uniquement via les fonctions request_join / respond_join / leave_group.
create policy members_select on public.group_members for select to authenticated
  using (status = 'accepted'
         or user_id = auth.uid()
         or public.is_group_organizer(group_id, auth.uid()));

-- messages : réservés aux membres acceptés du groupe
create policy messages_select on public.group_messages for select to authenticated
  using (public.is_accepted_member(group_id, auth.uid()));
create policy messages_insert on public.group_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_accepted_member(group_id, auth.uid()));

-- notes : on voit les avis approuvés, ceux qu'on a écrits, pas ceux en attente
create policy ratings_select on public.ratings for select to authenticated
  using (moderation_status = 'approved' or rater_id = auth.uid());
create policy ratings_insert on public.ratings for insert to authenticated
  with check (rater_id = auth.uid());

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid());

create policy blocks_all on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Temps réel : chat et notifications
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.group_members;

-- ---------------------------------------------------------------------------
-- Stockage : photos de profil (lecture pour les connectés) et selfies
-- (privés, lisibles uniquement par leur propriétaire et la modération)
-- Chaque fichier est rangé dans un dossier au nom de l'utilisateur :
-- photos/<user_id>/<fichier>, selfies/<user_id>/<fichier>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',  'photos',  false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('selfies', 'selfies', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos');
create policy photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_remove on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy selfies_read on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy selfies_write on storage.objects for insert to authenticated
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy selfies_update on storage.objects for update to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy selfies_remove on storage.objects for delete to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
