# Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾

Une **Progressive Web App (PWA)** autonome, rapide, et **100% gratuite** (zéro API payante, zéro abonnement) conçue pour chercher, explorer et organiser vos parcours de cyclotourisme, gravel, VTT et randonnées pédestres.

L'application permet d'embarquer et de synchroniser vos traces GPX au fil de vos voyages, utilisable sur smartphone (iOS/Android) et ordinateur, même sans connexion Internet.

---

## ✨ Fonctionnalités Clés

- 🌍 **Cartographie Libre & Gratuite Multi-Fonds** :
  - OpenStreetMap & OpenStreetMap France
  - **CyclOSM** (infrastructures cyclables européennes)
  - **OpenTopoMap** (reliefs, courbes de niveau et sentiers de randonnée)
  - Overlays **Waymarked Trails** (itinéraires balisés vélo & randonnée)

- 🔍 **Recherche Personnalisée Multi-Critères** :
  - Mode d'activité : Vélo ou Randonnée à pied
  - Curseur de distance et profils de dénivelé positif (D+ plat, modéré, sportif)
  - Type de surface (asphalte, gravel, sentiers) et taux de voies sans voiture (sécurité)
  - Filtre par carnet de voyage / séjour (*ex: "Voyage Bretagne", "Alpes VTT"*)

- 💾 **Gestionnaire de Traces GPX & Persistance (Option B)** :
  - **IndexedDB local** : vos traces importées restent accessibles hors-ligne en continu.
  - **Synchronisation Directe GitHub** : vos GPX peuvent être enregistrés directement dans ce dépôt GitHub via l'API REST, déclenchant automatiquement le redéploiement GitHub Pages.
  - Sauvegarde & restauration de la bibliothèque en JSON en 1 clic.

- 📱 **PWA Installable & Hors-Ligne** :
  - Compatible Safari iOS (Ajouter à l'écran d'accueil) et Chromium / Android.
  - Mise en cache intelligente des tuiles cartographiques et des données de parcours.

---

## 🚀 Déploiement Automatisé sur GitHub Pages

Le dépôt intègre un workflow GitHub Actions (`.github/workflows/deploy.yml`) qui reconstruit et déploie l'application à chaque mise à jour sur la branche `main` :

1. Allez dans les réglages de votre dépôt : **Settings** > **Pages**.
2. Dans **Source**, sélectionnez **GitHub Actions**.
3. Votre application est immédiatement accessible à l'adresse :
   ```
   https://gabogit8140.github.io/Trace-Outdoor/
   ```

---

## 🛠️ Développement Local

```bash
# 1. Cloner le dépôt
git clone https://github.com/gabogit8140/Trace-Outdoor.git
cd Trace-Outdoor

# 2. Installer les dépendances
npm install

# 3. Lancer en local
npm run dev

# 4. Compiler pour la production
npm run build
```

---

## 📦 Ajout de Traces GPX Officielles dans le Code Source

Pour intégrer de nouvelles traces permanentes dans le catalogue statique :
1. Déposez vos fichiers `.gpx` dans `public/gpx/bike/` ou `public/gpx/hike/`.
2. Exécutez :
   ```bash
   npm run index-gpx
   ```
3. Poussez sur GitHub :
   ```bash
   git add .
   git commit -m "feat(gpx): ajout de nouvelles traces"
   git push
   ```
GitHub Actions mettra automatiquement votre site à jour en moins d'une minute !

---

## 📄 Licence

Projet libre et personnel sous licence MIT. Données cartographiques © OpenStreetMap contributors.
