# ScoreParty

Application mobile (React Native / Expo) de suivi de parties de jeux de société, style **scoreboard esport** : fond bleu marine sombre, accents néon, typographies Rubik (titres) et Space Grotesk (corps de texte).

Recréée fidèlement à partir du handoff de design `ScoreParty.dc.html` (voir `design_handoff_scoreparty/README.md` d'origine pour la spec complète).

## Stack

- **Expo (React Native + TypeScript)** — cohérent avec l'écosystème React déjà utilisé côté équipe, itération rapide, un seul code pour iOS/Android.
- **React Navigation** — bottom tabs (Accueil / Historique / Stats / Règles) + stack imbriquée sur l'onglet Accueil (Accueil → Setup → Live → Récap), barre d'onglets masquée pendant une partie en cours.
- **Zustand** — state management global (joueurs, historique, partie en cours, filtres, etc.).
- **`@react-native-async-storage/async-storage`** — persistance locale des joueurs et de l'historique, source de vérité principale (remplace le `localStorage` du prototype web). L'app fonctionne entièrement hors-ligne sans rien configurer d'autre.
- **Firebase (Firestore)** — sauvegarde cloud *optionnelle* par code (pas de compte/connexion), voir [Sauvegarde cloud](#sauvegarde-cloud-optionnelle-firebase) ci-dessous.
- **`@expo-google-fonts/rubik`** et **`@expo-google-fonts/space-grotesk`** — polices exactes du design.
- **`expo-linear-gradient`** — CTA en dégradé rouge/orange.

## Lancer le projet

```bash
npm install
npm start        # puis scanner le QR code avec Expo Go, ou
npm run android  # / npm run ios
npm run web      # ouvre l'app dans le navigateur (aucun appareil requis)
```

## Déploiement en production (web)

Le projet est configuré pour un déploiement statique zero-config sur [Vercel](https://vercel.com) (`vercel.json` à la racine) :

1. Sur https://vercel.com, se connecter avec le compte GitHub.
2. **Add New… → Project**, importer le repo `scoreparty-app`.
3. Vercel détecte `vercel.json` (build `npm run build:web`, sortie `dist/`) — laisser tel quel et déployer.
4. Chaque `git push` sur `main` redéploie automatiquement l'URL de prod.

`npm run build:web` (= `expo export --platform web`) produit un export statique dans `dist/` déployable sur n'importe quel hébergeur statique (Netlify, Cloudflare Pages, GitHub Pages avec un sous-chemin adapté, etc.).

### PWA — installer l'app depuis le navigateur

Le site est une PWA installable (`public/manifest.json`, icônes, `public/index.html`) :

- **Android/Chrome/Edge** : menu ⋮ → *Installer l'application* (ou bannière automatique) → icône sur l'écran d'accueil, ouverture en plein écran sans barre de navigateur.
- **iOS/Safari** : bouton Partager → *Sur l'écran d'accueil*.

Ce n'est pas un vrai binaire natif publié sur l'App Store / Google Play (pour ça il faudrait un build EAS + compte développeur), mais l'expérience d'usage quotidien (icône, plein écran, hors-ligne grâce au stockage local) est équivalente à une app installée.

## Sauvegarde cloud (optionnelle) — Firebase

Par défaut l'app stocke tout en local (`AsyncStorage` / `localStorage`) : ça marche très bien seul, mais tu perds tout si tu désinstalles l'app ou changes d'appareil. La sauvegarde cloud Firestore résout ça, **sans écran de connexion** : au premier lancement, l'app génère un code aléatoire (ex. `XKPQR-7H4MN`), affiché sur l'écran d'Accueil dans la carte "☁️ Sauvegarde cloud". Ce code identifie ta sauvegarde dans Firestore — le retrouver ailleurs suffit à restaurer tes données.

### Mise en place (une seule fois)

1. Sur https://console.firebase.google.com, créer un nouveau projet (ex. `scoreparty`).
2. **Build → Firestore Database → Créer une base de données** (n'importe quelle région, peu importe le mode de démarrage).
3. Dans **Firestore → Règles**, coller le contenu de `firestore.rules` (à la racine du repo) et publier.
4. **⚙️ Paramètres du projet → Vos applications → Ajouter une application → Web** (icône `</>`), donner un nom, copier l'objet de config affiché.
5. Renseigner ces valeurs :
   - **En local** : copier `.env.example` en `.env`, remplir les 6 variables `EXPO_PUBLIC_FIREBASE_*`.
   - **Sur Vercel** (pour la prod) : Project Settings → Environment Variables, ajouter les 6 mêmes variables, puis redéployer.
6. Relancer l'app (`npm start` / `npm run web`) — la carte "Sauvegarde cloud" passe de *non configurée* à un vrai code.

### Comment ça marche

- À chaque partie enregistrée ou joueur ajouté, l'app pousse `{ players, history }` dans le document Firestore `syncs/{code}` (avec un léger anti-rebond de 1,5 s).
- Bouton **"Restaurer avec un code"** : saisir un code existant remplace joueurs + historique de l'appareil actuel par cette sauvegarde (confirmation demandée avant d'écraser).
- **Sans authentification** : quiconque connaît le code peut lire/écrire cette sauvegarde. C'est un choix assumé pour rester sans compte utilisateur — acceptable pour des données peu sensibles (pseudos et scores de jeux de société), à condition de ne pas partager le code publiquement. Les règles Firestore (`firestore.rules`) rejettent au moins les codes trop courts pour limiter le scan/brute-force.
- Si aucune variable Firebase n'est définie, la carte l'indique et l'app continue de fonctionner normalement en local uniquement.

## Architecture

```
src/
  theme/tokens.ts        Couleurs, polices, rayons, ombres (tokens du design)
  types/models.ts         Types partagés (Player, LiveGame, HistoryEntry, ...)
  games/                   Un module par jeu + un registre central
    types.ts               Contrat GameDef que chaque jeu doit implémenter
    cinqRois.ts             Les Cinq Rois : atout/donne par manche, pénalités, classement
    trouDuCul.ts             Trou du Cul : attribution des rôles, classement cumulé
    registry.ts              GAMES[] — liste des jeux disponibles
  state/store.ts           Store Zustand (joueurs, historique, partie en cours, filtres, sync cloud...)
  state/seed.ts             Données de démonstration au premier lancement
  state/cloudSync.ts        Lecture/écriture Firestore par code de sauvegarde
  lib/firebase.ts           Init Firebase à partir des variables d'env EXPO_PUBLIC_FIREBASE_*
  navigation/               Tab navigator + stack imbriquée + routeur d'écran "live"
  components/               UI partagée (boutons, chips, classement, clavier numérique, confettis, sauvegarde cloud...)
  screens/                  Les 8 écrans (Accueil, Setup, Live x2, Récap, Historique, Stats, Règles)
```

### Ajouter un 3ᵉ jeu

1. Créer `src/games/<monJeu>.ts` qui implémente l'interface `GameDef` (`src/games/types.ts`) : métadonnées (nom, badge, couleur, tagline), création de partie live, calcul du classement, construction de l'entrée d'historique, contenu des règles.
2. L'ajouter au tableau `GAMES` dans `src/games/registry.ts`.
3. Créer l'écran de saisie en direct (`src/screens/live/<MonJeu>LiveScreen.tsx`) et l'enregistrer dans `LIVE_SCREENS` (`src/navigation/LiveScreenRouter.tsx`).

Aucun autre écran (Accueil, Setup, Historique, Stats, Règles) n'a besoin d'être modifié : ils lisent tous le registre de jeux dynamiquement.

## Logique métier

- **Les Cinq Rois** — 11 manches fixes ; l'Atout de la manche suit son numéro (3, 4, … 10, V, D, R) ; pénalités 3–10 = valeur faciale, V/D/R = 10, Atout = 20, Joker = 50 ; le distributeur tourne à chaque manche ; le total le plus bas gagne.
- **Trou du Cul** — 5 manches fixes ; le rôle (Président / Vice-Président / Neutre(s) / Vice-Trou du Cul / Trou du Cul) est déduit automatiquement de l'ordre de sortie et du nombre de joueurs ; classement cumulé sur les points de position ; les variantes (Révolution, Bombes/Carrés, Putsch, Suites) sont indicatives uniquement.
