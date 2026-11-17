-- Sorties « gardées de côté » (fonction Premium)
create table if not exists public.saved_groups (
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
alter table public.saved_groups enable row level security;

create policy "saved_groups: lire les siennes" on public.saved_groups
  for select to authenticated using (user_id = auth.uid());
create policy "saved_groups: premium ajoute" on public.saved_groups
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_premium)
  );
create policy "saved_groups: retirer les siennes" on public.saved_groups
  for delete to authenticated using (user_id = auth.uid());
