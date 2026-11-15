-- ============================================================================
-- Notifications push (Expo) : jetons des appareils + envoi automatique
-- ============================================================================
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  platform   text check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

create policy push_tokens_select on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy push_tokens_insert on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy push_tokens_update on public.push_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_delete on public.push_tokens for delete to authenticated using (user_id = auth.uid());

-- Un jeton passe d'un compte à l'autre si on change de compte sur le même téléphone
create or replace function public.register_push_token(p_token text, p_platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  insert into push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
end $$;
revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

alter table public.notifications add column if not exists pushed_at timestamptz;

-- À chaque notification, la fonction send-push est appelée (asynchrone).
-- Elle ne fait qu'envoyer une notification existante à son destinataire,
-- une seule fois (pushed_at), donc l'appel ne demande pas de clé.
create or replace function public.dispatch_push()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://mmfzjsyrbgphdktwilrq.supabase.co/functions/v1/send-push',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  -- l'envoi push ne doit jamais bloquer l'action de l'utilisateur
  return new;
end $$;
revoke all on function public.dispatch_push() from public, anon, authenticated;

create trigger notifications_push after insert on public.notifications
  for each row execute function public.dispatch_push();

-- Rappel « Tu viens toujours ? » à tout le groupe, 2 h avant la sortie
create extension if not exists pg_cron;

create or replace function public.queue_confirm_reminders()
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, type, payload)
  select m.user_id, 'confirm_reminder', jsonb_build_object('group_id', g.id)
  from groups g
  join group_members m on m.group_id = g.id and m.status = 'accepted' and m.confirmed_at is null
  where g.status in ('open', 'full')
    and g.starts_at between now() + interval '105 minutes' and now() + interval '120 minutes'
    and not exists (
      select 1 from notifications n
      where n.user_id = m.user_id and n.type = 'confirm_reminder' and n.payload->>'group_id' = g.id::text
    );
$$;
revoke all on function public.queue_confirm_reminders() from public, anon, authenticated;

select cron.schedule('wyytu-confirm-reminders', '*/15 * * * *', $$select public.queue_confirm_reminders()$$);
