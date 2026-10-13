# Guide de Déploiement Gratuit — Trace Outdoor PWA

Ce document détaille la publication de votre application PWA sur des plateformes **100% gratuites**, sans serveur payant et sans aucune clé d'API.

---

## Option 1 : GitHub Pages (Recommandé & Pré-configuré)

L'application est déjà prête pour GitHub Pages :
- Le fichier `.github/workflows/deploy.yml` est pré-configuré.
- Le fichier `vite.config.ts` inclut déjà `base: './'` pour fonctionner sous n'importe quel sous-domaine GitHub (`https://<username>.github.io/<repo>/`).

### Étapes de mise en ligne :
1. Créez un nouveau dépôt sur [GitHub](https://github.com/) (public ou privé).
2. Initialisez et poussez votre code dans le dépôt :
   ```bash
   git init
   git add .
   git commit -m "Initial commit Trace Outdoor PWA"
   git branch -M main
   git remote add origin https://github.com/<votre-nom-utilisateur>/<nom-du-repo>.git
   git push -u origin main
   ```
3. Sur GitHub, rendez-vous dans les paramètres du dépôt :
   - Allez dans **Settings** > **Pages**.
   - Sous **Build and deployment** > **Source**, choisissez **GitHub Actions**.
4. C'est tout ! L'Action GitHub va construire et déployer automatiquement votre PWA.
   - Votre application sera accessible à l'adresse : `https://<votre-nom-utilisateur>.github.io/<nom-du-repo>/`
   - Chaque futur `git push` redéploiera automatiquement votre application.

---

## Option 2 : Cloudflare Pages (La plus rapide au monde)

Cloudflare Pages offre un réseau CDN mondial ultra-véloce avec **bande passante illimitée** sur son forfait gratuit, idéal pour charger la PWA instantanément partout lors de vos voyages.

### Étapes de mise en ligne :
1. Poussez votre code sur un dépôt GitHub (comme ci-dessus).
2. Connectez-vous sur [Cloudflare Dashboard](https://dash.cloudflare.com/) (inscription gratuite).
3. Rendez-vous dans **Workers & Pages** > **Create application** > onglet **Pages** > **Connect to Git**.
4. Sélectionnez votre dépôt GitHub `trace-outdoor`.
5. Configurez les options de build :
   - **Framework preset** : `Vite`
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
   - **Node.js version** : variable d'environnement `NODE_VERSION` = `20`
6. Cliquez sur **Save and Deploy**.
   - Cloudflare génère une URL du type `https://trace-outdoor.pages.dev` avec HTTPS gratuit et mises à jour automatiques à chaque commit.

---

## Comment enrichir la base de traces sans toucher au code

Vous avez deux méthodes pour intégrer des traces au fur et à mesure :

### Méthode A : Directement dans la PWA (Sur le terrain / Hors-ligne)
1. Ouvrez l'application (sur votre smartphone ou votre PC).
2. Cliquez sur l'icône de dossier en haut à gauche pour ouvrir la **Base de Traces**.
3. Allez dans l'onglet **Importer des GPX**, indiquez éventuellement le nom de votre séjour (ex: *Voyage Bretagne 2026*).
4. Glissez votre fichier `.gpx`.
5. **Résultat** : La trace est immédiatement enregistrée dans **IndexedDB** sur votre appareil et reste disponible même sans réseau !

### Méthode B : Intégration permanente dans votre dépôt GitHub (Statique)
1. Déposez vos fichiers `.gpx` dans :
   - `public/gpx/bike/` pour le vélo.
   - `public/gpx/hike/` pour la randonnée à pied.
2. Lancez dans votre terminal :
   ```bash
   npm run index-gpx
   ```
3. Committez et poussez sur GitHub :
   ```bash
   git add public/gpx/ src/lib/generatedGpxCatalog.ts
   git commit -m "Ajout de nouvelles traces officielles"
   git push
   ```
   L'indexeur pré-calcule automatiquement la distance, le profil altimétrique, le dénivelé et les statistiques sans aucune API !
