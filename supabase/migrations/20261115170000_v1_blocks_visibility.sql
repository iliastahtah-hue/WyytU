-- Celui qui bloque peut encore voir le profil qu'il a bloqué (pour la liste
-- « Personnes bloquées » et pour débloquer) ; la personne bloquée, elle, ne
-- voit plus son profil.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or not public.is_blocked_between(auth.uid(), id)
    or exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = profiles.id)
  );
