/**
 * Variables d'environnement publiques (préfixe EXPO_PUBLIC_).
 * Copie .env.example en .env et remplis tes valeurs Supabase.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[WyytU] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY manquant : copie .env.example en .env.',
  );
}

export const env = {
  supabaseUrl: url ?? 'https://example.supabase.co',
  supabaseAnonKey: anonKey ?? 'public-anon-key',
};
