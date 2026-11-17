-- Chat : photos, vidéos et messages vocaux
alter table public.group_messages
  add column if not exists kind text not null default 'text' check (kind in ('text', 'image', 'video', 'audio')),
  add column if not exists media_path text,
  add column if not exists duration_ms integer;
alter table public.group_messages alter column body set default '';
alter table public.group_messages drop constraint if exists group_messages_body_check;
alter table public.group_messages add constraint group_messages_body_check check (
  char_length(body) <= 1000
  and (kind <> 'text' or char_length(body) >= 1)
  and (kind = 'text' or media_path is not null)
);

-- Fichiers rangés par groupe : <group_id>/<fichier>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 52428800, array['image/*', 'video/*', 'audio/*'])
on conflict (id) do nothing;

create policy "chat-media: membres lisent" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media' and private.is_accepted_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "chat-media: membres envoient" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and private.is_accepted_member(((storage.foldername(name))[1])::uuid, auth.uid()));
