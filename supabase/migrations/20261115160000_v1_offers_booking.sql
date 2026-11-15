-- Un créneau partenaire utilisé par un groupe devient « réservé »
create or replace function public.book_offer_on_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.offer_id is not null then
    update partner_offers set booked = true
    where id = new.offer_id and not booked and partner_id = new.partner_id;
    if not found then
      raise exception 'Ce créneau n''est plus disponible';
    end if;
  end if;
  return new;
end $$;

create trigger groups_book_offer after insert on public.groups
  for each row execute function public.book_offer_on_group();

-- Si le groupe est annulé, le créneau se libère
create or replace function public.release_offer_on_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' and new.offer_id is not null then
    update partner_offers set booked = false where id = new.offer_id;
  end if;
  return new;
end $$;

create trigger groups_release_offer after update of status on public.groups
  for each row execute function public.release_offer_on_cancel();

revoke all on function public.book_offer_on_group() from public, anon, authenticated;
revoke all on function public.release_offer_on_cancel() from public, anon, authenticated;
