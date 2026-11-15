-- Anciennes tables du prototype (vides, non utilisées par la V1) :
-- RLS activée sans aucune règle = plus aucun accès depuis l'app.
alter table public.utilisateurs        enable row level security;
alter table public.groupes             enable row level security;
alter table public.membres_groupe      enable row level security;
alter table public.messages            enable row level security;
alter table public.notations           enable row level security;
alter table public.badges_utilisateurs enable row level security;
alter table public.partenaires         enable row level security;
