import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { env } from './env';
import type { Database } from './database.types';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Rafraîchit le jeton seulement quand l'app est au premier plan.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Transforme une erreur Supabase/PostgreSQL en message lisible. */
export function readableError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes('WEEKLY_LIMIT')) return 'Tu as atteint la limite de 2 groupes créés cette semaine.';
    // Les fonctions SQL renvoient des messages déjà rédigés en français.
    if (message && !message.startsWith('JWT') && message.length < 160) return message;
  }
  return fallback;
}
