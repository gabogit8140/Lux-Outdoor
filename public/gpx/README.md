# Dépose & Maintenance des Traces GPX (100% Hors-Ligne & GitHub)

Ce sous-dossier permet d'enrichir la base de données cartographique sans nécessiter la moindre API externe ni base de données serveur.

## Structure du dossier
```
public/gpx/
├── bike/           # Déposez ici vos fichiers .gpx de vélo (route, gravel, VTT, voies vertes)
├── hike/           # Déposez ici vos fichiers .gpx de randonnée pédestre (trail, marche)
├── catalog.json    # Index JSON généré automatiquement
├── manifest.json   # Résumé des traces indexées
└── README.md       # Cette documentation
```

## Comment ajouter de nouvelles traces dans GitHub sans API :

1. **Déposez vos fichiers .gpx** directement dans `public/gpx/bike/` ou `public/gpx/hike/` (ou dans un sous-dossier de votre choix).
2. Les fichiers peuvent inclure dans leurs balises XML standards :
   - `<name>Nom de votre circuit</name>`
   - `<desc>Description officielle</desc>`
   - `<link href="https://votre-site-officiel.com"><text>Nom du site source</text></link>`
   - Les points GPS `<trkpt lat="..." lon="..."><ele>...</ele></trkpt>`
3. Exécutez la commande d'indexation :
   ```bash
   npm run index-gpx
   ```
   *(Cette commande s'exécute aussi automatiquement lors de `npm run build`)*.
4. L'indexeur calcule automatiquement :
   - La distance exacte en kilomètres
   - Le dénivelé positif (+) et négatif (-)
   - Le profil altimétrique échantillonné
   - Le niveau de difficulté (Facile, Modéré, Sportif, Expert)
   - L'estimation des pourcentages de voies vertes / sans voiture
   - La détection du pays et de la région
5. Committez vos modifications sur GitHub. C'est tout !
