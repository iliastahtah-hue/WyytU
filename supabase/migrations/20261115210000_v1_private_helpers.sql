-- Les fonctions internes utilisées par les règles RLS passent dans un
-- schéma « private », non exposé par l'API : on ne peut plus les appeler
-- directement pour deviner qui est membre de quoi ou qui a bloqué qui.
-- (Les règles RLS gardent leur lien vers les fonctions, par identifiant.)
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_accepted_member(uuid, uuid)    set schema private;
alter function public.is_group_organizer(uuid, uuid)    set schema private;
alter function public.shares_accepted_group(uuid, uuid) set schema private;
alter function public.is_blocked_between(uuid, uuid)    set schema private;
alter function public.accepted_count(uuid)              set schema private;

-- Les fonctions qui les appellent cherchent aussi dans « private »
alter function public.request_join(uuid, text)                set search_path = public, private;
alter function public.respond_join(uuid, uuid, boolean)       set search_path = public, private;
alter function public.leave_group(uuid)                       set search_path = public, private;
alter function public.mark_attendance(uuid, uuid, boolean)    set search_path = public, private;
alter function public.before_rating_insert()                  set search_path = public, private;
alter function public.before_group_update()                   set search_path = public, private;
alter function public.public_age(uuid)                        set search_path = public, private;
alter function public.partner_check_in(uuid, text)            set search_path = public, private;
alter function public.contest_no_show(uuid, text)             set search_path = public, private;
