-- Anciennes tables du prototype (vides, non utilisées par la V1) :
-- RLS activée sans aucune règle = plus aucun accès depuis l'app.
alter table if exists public.utilisateurs        enable row level security;
alter table if exists public.groupes             enable row level security;
alter table if exists public.membres_groupe      enable row level security;
alter table if exists public.messages            enable row level security;
alter table if exists public.notations           enable row level security;
alter table if exists public.badges_utilisateurs enable row level security;
alter table if exists public.partenaires         enable row level security;
