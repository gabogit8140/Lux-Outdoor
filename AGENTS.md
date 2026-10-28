# Directives de Développement — Lux Outdoor

Ce projet utilise **Graphify** pour la navigation d'architecture, l'analyse d'impact et la minimisation de la consommation de tokens.

---

## 🧭 Workflow Systématique avec Graphify

Pour chaque nouvelle évolution, débogage ou refactorisation :

1. **Recherche ciblée via le Graphe (Zéro gâchis de tokens)** :
   - Avant de lire des fichiers complets, interroger l'index `graphify-out/graph.json` (via les outils MCP `graphify` ou `python -m graphify query "<sujet>"`).
   - Identifier le sous-graphe exact, les fonctions concernées et leurs dépendances directes.

2. **Analyse d'Impact Préalable** :
   - Pour toute modification d'un composant, d'un type (`RouteTrace`, `ElevationPoint`...) ou d'un algorithme de routage : inspecter ses liaisons amont/aval (`get_neighbors`, `god_nodes`) pour prévenir toute régression.

3. **Modifications Chirurgicales & Règles Utilisateur** :
   - Appliquer le processus standard Senior Software Engineer (Analyse, Explication en 1 phrase, Correction, Vérification, Sécurité).
   - **Étape finale systématique** : Refactoriser le code à sa forme la plus modulaire possible dès que les étapes précédentes sont implémentées et validées.

4. **Actualisation Automatique du Graphe** :
   - Après chaque session d'évolution du code, exécuter :
     ```bash
     npm run graph
     ```
   - Cela garantit que `graph.json`, `graph.html` et `GRAPH_REPORT.md` restent toujours parfaitement synchronisés avec l'état réel du code source.
