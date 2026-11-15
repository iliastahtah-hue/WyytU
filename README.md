# WyytU — V1

App mobile de sorties en groupe à Tanger (pas de dating) : on rejoint ou on crée un groupe autour d'une activité, avec des profils vérifiés et des réductions chez les partenaires.

**Stack** : React Native + Expo SDK 54 (Expo Router) · Supabase (Auth, Postgres + RLS, Storage, Realtime) · TypeScript strict.

## Lancer le projet

```bash
npm install
cp .env.example .env      # puis colle l'URL et la clé "publishable" de ton projet Supabase
npx expo start            # scanne le QR code avec Expo Go
```

## Préparer Supabase (une seule fois)

1. **Appliquer le schéma** (déjà fait sur le projet `wyytu` le 15/11/2026) : Supabase › SQL Editor › colle et exécute
   `supabase/migrations/20261115120000_v1_schema.sql`
   (ou `npx supabase db push` avec la CLI). Les nouvelles tables sont en anglais et
   **ne touchent pas** aux anciennes tables (`activites`, `utilisateurs`…).
2. **Connexion par SMS** : Authentication › Providers › Phone → activer, et brancher un
   fournisseur SMS (Twilio, MessageBird ou Vonage). Sans fournisseur, utilise la connexion
   par e-mail (déjà prévue dans l'app) ou des numéros de test (Authentication › Phone › Test OTP).
3. **Connexion par e-mail** : Authentication › Email templates › « Magic Link » : mets
   `{{ .Token }}` dans le modèle pour envoyer un code à 6 chiffres.
4. **Modération** : depuis le tableau de bord, passer `profiles.verification_status` à
   `verified` après contrôle du selfie, et `ratings.moderation_status` à `approved` pour publier
   un avis (la note moyenne se recalcule toute seule).

## Ce qui est en place (blocs 1 à 3)

| Parcours | Écrans |
|---|---|
| Premier lancement | Choix de la langue (darija, français, anglais) → tutoriel en 4 écrans |
| Inscription | Numéro marocain +212 ou e-mail → code à 6 chiffres → profil (prénom, date de naissance 18+, âge affiché ou non, genre, 3 photos minimum) → selfie avec consentement explicite → autorisations |
| Créer | Univers et sport, nom (proposé automatiquement), jour et heure, lieu via l'écran « Où ? » (carte des partenaires avec réductions ou lieu libre), nombre de places, niveau C à A+, budget resto, « Femmes uniquement » réservé aux organisatrices, quota de 2 groupes par semaine affiché |
| App | Barre du bas sable · Explorer (univers, sports, recherche) · fiche d'un groupe (membres, demande pour rejoindre avec un mot, annulation, salle d'attente de l'organisateur avec accepter/refuser) · Profil (photos, langue, déconnexion, suppression du compte) |

### Sécurité côté base (testée)

- Toutes les tables sous RLS ; écriture dans `group_members` **uniquement** via les fonctions
  `request_join`, `respond_join`, `leave_group`, `confirm_presence`.
- 18 ans minimum vérifié par la base ; champs système (vérifié, premium, notes) non modifiables par l'utilisateur.
- Quota de 2 groupes créés par semaine en gratuit ; « Femmes uniquement » réservé aux organisatrices.
- Champs privés 🔒 (taille, situation, quartier) visibles seulement par les membres d'un groupe en commun.
- Chat réservé aux membres acceptés ; notes seulement après la sortie, entre membres, motif obligatoire si ≤ 2 ★.
- Si l'organisateur part, le premier membre accepté devient co-organisateur.
- Blocage : on ne voit plus les profils ni les groupes de la personne bloquée.
- Suppression du compte depuis l'app (exigence App Store).

## Structure

```
app/                     écrans (Expo Router)
  (onboarding)/          langue, tutoriel
  (auth)/                inscription, code, création du profil, selfie, autorisations
  (tabs)/                explorer, sorties, créer, messages, profil
  groupe/[id].tsx        fiche d'un groupe
src/
  components/ui/         boutons, champs, puces, avatars, badge vérifié…
  features/              logique par domaine (groupes, onboarding)
  i18n/                  traductions dar / fr / en
  lib/                   client Supabase, types de la base, stockage, dates
  providers/             session, avancement de l'inscription
  theme/                 couleurs, polices, icônes 3D
supabase/migrations/     schéma SQL
```

## Prochains blocs

4. Mes sorties, confirmation de présence, chat en temps réel, notifications
5. Notation et avis, signalement, blocage, contestation
6. Plans partenaires, scan du QR, espace partenaire
7. Mode swipe, Premium (achats intégrés), profil complet

Icônes 3D : Microsoft Fluent Emoji (MIT), voir `assets/3d/LICENSE.md`.
