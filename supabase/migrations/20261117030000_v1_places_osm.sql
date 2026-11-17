-- Lieux de la ville importés d'OpenStreetMap (© contributeurs OSM, licence ODbL)
create table if not exists public.places (
  id bigint generated always as identity primary key,
  osm_id text unique,
  name text not null,
  name_fr text,
  lat double precision not null,
  lng double precision not null,
  kind text not null,
  detail text,
  address text,
  universe public.universe,
  city text not null default 'Tanger',
  created_at timestamptz not null default now()
);
create index if not exists places_universe_idx on public.places (universe);
create index if not exists places_name_idx on public.places (lower(name));
alter table public.places enable row level security;
create policy "places: lecture connectés" on public.places for select to authenticated using (true);
-- Données : supabase/seed_places_tanger.sql (586 lieux de Tanger, novembre 2026)
