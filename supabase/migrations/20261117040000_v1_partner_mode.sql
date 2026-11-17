-- Mode partenaire : fiche établissement et réduction par créneau (heures creuses)
alter table public.partners
  add column if not exists description text check (char_length(description) <= 500),
  add column if not exists opening_hours text check (char_length(opening_hours) <= 200),
  add column if not exists phone text check (char_length(phone) <= 30);
alter table public.partner_offers
  add column if not exists discount_pct integer check (discount_pct between 0 and 50);
