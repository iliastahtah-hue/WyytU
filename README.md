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
4. **Modération dans l'app** : après ta propre inscription, nomme-toi administrateur une fois
   (Supabase › SQL Editor) :
   `insert into public.admins (user_id) select id from auth.users where email = 'ton@email' or phone = '212XXXXXXXXX';`
   Un bouton « 🛡️ Modération » apparaît alors dans ton Profil : selfies (comparés aux photos,
   supprimés après validation), avis à publier, signalements, contestations d'absence, partenaires.

## Ce qui est en place (blocs 1 à 7)

| Parcours | Écrans |
|---|---|
| Premier lancement | Choix de la langue (darija, français, anglais) → tutoriel en 4 écrans |
| Inscription | Numéro marocain +212 ou e-mail → code à 6 chiffres → profil (prénom, date de naissance 18+, âge affiché ou non, genre, 3 photos minimum) → selfie avec consentement explicite → autorisations |
| Créer | Univers et sport, nom (proposé automatiquement), jour et heure, lieu via l'écran « Où ? » (carte des partenaires avec réductions ou lieu libre), nombre de places, niveau C à A+, budget resto, « Femmes uniquement » réservé aux organisatrices, quota de 2 groupes par semaine affiché |
| Mes sorties | À venir / passées, confirmation de présence, QR du chef de groupe (sorties chez un partenaire), « je ne peux plus venir », noter le groupe, pointer les présences, contester une absence |
| Messages | Liste des conversations de groupe et chat en temps réel (appui long pour signaler un message) |
| Notifications | Cloche avec compteur dans Explorer : demande reçue, acceptation, refus, passage co-organisateur, absence |
| Confiance | Notation 1 à 5 ★ avec avis écrit (motif obligatoire si ≤ 2 ★), profil public avec avis publiés et infos privées 🔒, signaler, bloquer/débloquer |
| Partenaires | Plans (créneaux libres avec réduction) → créer un groupe pré-rempli ; espace partenaire : candidature, créneaux, booster, groupes attendus, scanner de QR |
| Découverte | Mode swipe « Je sais pas quoi faire » (droite = demande pour rejoindre) |
| Profil | Complétion du profil, modifier (photos 3 à 6, bio, études, travail, mode de vie, intérêts, quartier/taille/situation privés), Premium, réglages (langue, bloqués, contact, infos légales, déconnexion, suppression du compte) |
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

## Version compilée (EAS) — notifications push et Premium

Expo Go suffit pour tester l'app, mais les **notifications push** et l'**abonnement Premium** demandent une version compilée :

```bash
npm i -g eas-cli
eas login                 # compte Expo
eas init                  # crée le projet EAS et ajoute extra.eas.projectId dans app.json
eas build --profile development --platform ios   # ou android : app de test installable
eas build --profile production --platform all    # versions pour les stores
eas submit --platform ios                         # envoi sur TestFlight / App Store
```

- **Push** : rien d'autre à faire. Chaque notification de la base part automatiquement sur le téléphone
  (trigger `notifications_push` → fonction `send-push` → Expo Push). Rappel « Tu viens toujours ? »
  envoyé à tout le groupe 2 h avant chaque sortie (tâche planifiée toutes les 15 min).
- **Premium (RevenueCat)** : créer le produit mensuel dans App Store Connect / Google Play, un
  *entitlement* `premium` et une *offering* dans RevenueCat, mettre les clés publiques dans `.env`
  (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`), puis dans RevenueCat ›
  Webhooks : URL `https://mmfzjsyrbgphdktwilrq.supabase.co/functions/v1/revenuecat-webhook` et en-tête
  `Authorization: Bearer <secret>` ; ajouter ce même secret dans Supabase › Edge Functions › Secrets
  sous le nom `REVENUECAT_WEBHOOK_SECRET`. Premium s'active alors côté serveur (jamais depuis l'app).

## Reste à faire avant la publication

- **Textes** : relecture de la darija ; traduction anglaise/darija des derniers écrans (le français s'affiche en secours) ; CGU par un avocat.
- **Connexion SMS** : brancher Twilio dans Supabase.

Icônes 3D : Microsoft Fluent Emoji (MIT), voir `assets/3d/LICENSE.md`.
