import type { Href } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/src/lib/database.types';

type State = {
  lang: string | null;
  tutoDone: boolean;
  session: Session | null;
  profile: Profile | null;
  permissionsDone: boolean;
};

/**
 * Décide quel écran afficher selon l'avancement :
 * accueil (connexion) → profil → selfie → autorisations → app.
 */
export function nextRoute(s: State): Href {
  // pas connecté : l'accueil avec toutes les façons de se connecter (la présentation est en lien)
  if (!s.session) return '/bienvenue';
  if (!s.lang) return '/langue';
  if (!s.profile) return '/creation-profil';
  // selfie jamais envoyé, ou refusé par la modération (après validation, le
  // fichier est supprimé : selfie_path redevient vide mais le statut est « verified »)
  if (s.profile.verification_status === 'none' || s.profile.verification_status === 'rejected') return '/selfie';
  if (!s.permissionsDone) return '/autorisations';
  return '/explorer';
}

export function isFullyOnboarded(s: State) {
  return nextRoute(s) === '/explorer';
}
