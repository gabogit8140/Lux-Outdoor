# Graph Report - Trace Outdoor  (2026-10-28)

## Corpus Check
- 151 files · ~167,981 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .bat 5, (none) 3, .vbs 2)

## Summary
- 827 nodes · 2266 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af27c262`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- haversineDistance
- RouteTrace
- App.tsx
- localRouting.ts
- syncVaultService.ts
- gpxStorageService.ts
- syncAll.ts
- MapEditorLayer.tsx
- routeCatalog.ts
- steps
- Map.tsx
- MapLayersMenu.tsx
- ref_fs
- useOutdoorNavigation.ts
- mushroom.ts
- MapFilterBar.tsx
- generate-icons.js
- apply_all_fixes.cjs
- Guide de Déploiement Gratuit — Lux Outdoor PWA
- index-gpx.ts
- verify_all.cjs
- test_tolerance.mjs
- generate-greater-region-gpx.ts
- Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾
- classify_synthetic.mjs
- cleanup_routes.cjs
- ref_path
- check_missing_curated.mjs
- ErrorBoundary
- geoUtils.ts
- test_trace_cleaner.mjs
- start-local.mjs
- resolve-urls.js
- scan_all_jumps.mjs
- test_all_rechain.mjs

## God Nodes (most connected - your core abstractions)
1. `haversineDistance()` - 46 edges
2. `RouteTrace` - 44 edges
3. `RouteSuggestions` - 41 edges
4. `UseRouteEditorReturn` - 27 edges
5. `calculatePathDistance()` - 24 edges
6. `computeElevationProfile()` - 24 edges
7. `MapDisplay()` - 23 edges
8. `App()` - 22 edges
9. `useUserGpxLibrary()` - 18 edges
10. `computeOutdoorRouteFromWaypoints()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Étapes de mise en ligne :` --references--> `dist()`  [INFERRED]
  DEPLOYMENT.md → scripts/find_near_ansembourg.mjs
- `🧭 Workflow Systématique avec Graphify` --references--> `ElevationPoint`  [INFERRED]
  AGENTS.md → src/types.ts
- `🧭 Workflow Systématique avec Graphify` --references--> `RouteTrace`  [INFERRED]
  AGENTS.md → src/types.ts
- `removeWaypointSpurs()` --calls--> `haversineDistance()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts
- `densifyLongSegments()` --calls--> `haversineDistance()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts

## Import Cycles
- None detected.

## Communities (37 total, 4 thin omitted)

### Community 0 - "haversineDistance"
Cohesion: 0.08
Nodes (65): LoopGeneratorModalProps, SaveTraceModalProps, SegmentOrderDashboard(), SegmentOrderDashboardProps, SubTraceSlicerDashboard(), SubTraceSlicerDashboardProps, TraceEditorBar(), TraceEditorBarProps (+57 more)

### Community 1 - "RouteTrace"
Cohesion: 0.06
Nodes (77): Directives de Développement — Lux Outdoor, 🧭 Workflow Systématique avec Graphify, FavoriteCard(), FavoriteCardProps, Favorites(), FavoritesCategoryCounts, FavoritesFilterBar(), FavoritesFilterBarProps (+69 more)

### Community 2 - "App.tsx"
Cohesion: 0.16
Nodes (17): App(), LoopGeneratorModal(), SaveTraceModal(), NewMushroomSpotModal(), NewMushroomSpotModalProps, TopLeftCommandDock(), PWAInstallModal(), PWAInstallModalProps (+9 more)

### Community 3 - "localRouting.ts"
Cohesion: 0.09
Nodes (41): baseBike, baseHike, createPlaceIcon(), getPlaceVisual(), SelectedPlaceMapLayer(), SelectedPlaceMapLayerProps, MapFilterBarProps, CitySearchModal() (+33 more)

### Community 4 - "syncVaultService.ts"
Cohesion: 0.10
Nodes (36): FavoritesSyncTab(), FavoritesSyncTabProps, useFavorites(), useMushroomSpots(), getFirebaseApp(), getFirebaseDb(), FIREBASE_CONFIG, fetchFavoritesFromVault() (+28 more)

### Community 5 - "gpxStorageService.ts"
Cohesion: 0.13
Nodes (30): GpxDatabaseModal(), useUserGpxLibrary(), APP_CONFIG, APP_STORAGE_KEYS, batchUploadGpxToGitHub(), BatchUploadReport, ConnectionTestResult, DEFAULT_CONFIG (+22 more)

### Community 6 - "syncAll.ts"
Cohesion: 0.21
Nodes (14): importSentiersLocaux(), cleanTrackTitle(), DATASET_CATEGORIES, PC_NAMES, buildEnrichedGpxXml(), parseGpxData(), slugify(), syncPipeline() (+6 more)

### Community 7 - "MapEditorLayer.tsx"
Cohesion: 0.14
Nodes (26): createDragReticleIcon(), createMidpointHandleIcon(), createWaypointIcon(), DragPreviewState, getMidpointHandleIcon(), getWaypointIcon(), MapEditorLayer(), MapEditorLayerProps (+18 more)

### Community 8 - "routeCatalog.ts"
Cohesion: 0.06
Nodes (28): hikes, words, hikes, newMargin, oldMargin, routeMatchesFilter(), testFilterCombos(), hikes (+20 more)

### Community 9 - "steps"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, NODE_OPTIONS, name (+21 more)

### Community 10 - "Map.tsx"
Cohesion: 0.12
Nodes (25): InitialLuxembourgFitter(), flyToUserArea(), LocateControl(), LocateControlProps, locateUserIcon, DesktopZoomControl(), MapCenterWatcher(), MapClicker() (+17 more)

### Community 11 - "MapLayersMenu.tsx"
Cohesion: 0.20
Nodes (13): HuntingBattuesDockButton(), HuntingBattuesDockButtonProps, MapLayersMenuProps, MapLayerType, HuntingRifleIcon(), HuntingRifleIconProps, HuntingSafetyAlert(), HuntingSafetyAlertProps (+5 more)

### Community 12 - "ref_fs"
Cohesion: 0.08
Nodes (16): ico, icoHeader, icoPath, pwa192Path, pwa512Path, publicDir, pwa192, content (+8 more)

### Community 13 - "useOutdoorNavigation.ts"
Cohesion: 0.21
Nodes (12): OutdoorNavigationState, useOutdoorNavigation(), deviceSensors, DeviceSensorsManager, calculateBearing(), distanceMeters(), findNextManeuver(), NavigationManeuver (+4 more)

### Community 14 - "mushroom.ts"
Cohesion: 0.21
Nodes (12): MushroomSpotsTabProps, createMushroomPinIcon(), MapMushroomLayer(), MapMushroomLayerProps, MushroomDockButton(), MushroomDockButtonProps, COMMON_MUSHROOM_VARIETIES, isMushroomSeasonInLuxembourg() (+4 more)

### Community 15 - "MapFilterBar.tsx"
Cohesion: 0.13
Nodes (16): MAP_FILTER_OPTIONS, MapFilterBar(), MapFilterOption, NavigationCockpit(), TopLeftCommandDockProps, Preset, TouchDistanceSelector(), TouchDistanceSelectorProps (+8 more)

### Community 16 - "generate-icons.js"
Cohesion: 0.18
Nodes (9): appleIcon, CRC_TABLE, createPNG(), calculateCRC(), makeChunk(), publicDir, pwa192, pwa512 (+1 more)

### Community 17 - "apply_all_fixes.cjs"
Cohesion: 0.14
Nodes (15): catalogCode, catalogList, detailView, fs, mapLayer, match, path, resolverCode (+7 more)

### Community 18 - "Guide de Déploiement Gratuit — Lux Outdoor PWA"
Cohesion: 0.20
Nodes (9): Comment enrichir la base de traces sans toucher au code, Guide de Déploiement Gratuit — Lux Outdoor PWA, Méthode A : Directement dans la PWA (Sur le terrain / Hors-ligne), Méthode B : Intégration permanente dans votre dépôt GitHub (Statique), Option 1 : GitHub Pages (Recommandé & Pré-configuré), Option 2 : Cloudflare Pages (La plus rapide au monde), Étapes de mise en ligne :, Étapes de mise en ligne : (+1 more)

### Community 19 - "index-gpx.ts"
Cohesion: 0.25
Nodes (12): hikeDir, detectCountry(), detectRegion(), indexAllGpxFiles(), ParsedGpxResult, parseGpxFile(), parseXmlLink(), parseXmlTag() (+4 more)

### Community 20 - "verify_all.cjs"
Cohesion: 0.22
Nodes (9): fs, gazContent, gazUrls, genericGazUrls, herouInGaz, herouInResolver, isGenericHomepageUrl(), match (+1 more)

### Community 21 - "test_tolerance.mjs"
Cohesion: 0.31
Nodes (8): beaufortContent, haversineMeters(), perpendicularDistance(), rawBeaufort, rdpSimplify(), simp10, simp6, splitAndRechainSegments()

### Community 22 - "generate-greater-region-gpx.ts"
Cohesion: 0.19
Nodes (15): buildOrganicAnchors(), CROSS_BORDER_SEEDS, CrossBorderSeed, decodePolyline6(), densifyLongSegments(), escapeXml(), fetchCalibratedOsrmRoute(), generateGreaterRegionGpxCatalog() (+7 more)

### Community 23 - "Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾"
Cohesion: 0.29
Nodes (6): 📦 Ajout de Traces GPX Officielles dans le Code Source, 🚀 Déploiement Automatisé sur GitHub Pages, 🛠️ Développement Local, ✨ Fonctionnalités Clés, 📄 Licence, Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾

### Community 24 - "classify_synthetic.mjs"
Cohesion: 0.29
Nodes (6): allFiles, byPrefix, duplicates, realFiles, synthFiles, uniqueMocks

### Community 25 - "cleanup_routes.cjs"
Cohesion: 0.29
Nodes (6): after, before, content, fs, idx1, idx2

### Community 27 - "ref_path"
Cohesion: 0.09
Nodes (10): cyclorando, files, visitLux, walk(), near, target, found, map (+2 more)

### Community 28 - "check_missing_curated.mjs"
Cohesion: 0.15
Nodes (9): content, curatedContent, curatedIds, idMatches, missing, content, fs, genericUrls (+1 more)

### Community 29 - "ErrorBoundary"
Cohesion: 0.20
Nodes (3): ErrorBoundary, Props, State

### Community 30 - "geoUtils.ts"
Cohesion: 0.13
Nodes (22): escapeXml(), generateAllOfficialGpxFiles(), OFFICIAL_SEEDS, OfficialRouteSeed, cat, catDir, files, computeRealisticElevationProfile() (+14 more)

### Community 31 - "test_trace_cleaner.mjs"
Cohesion: 0.40
Nodes (5): chained, haversineMeters(), pc3Content, rawPts, splitAndRechainSegments()

### Community 36 - "scan_all_jumps.mjs"
Cohesion: 0.67
Nodes (3): badFiles, checkFile(), scan()

### Community 37 - "test_all_rechain.mjs"
Cohesion: 1.00
Nodes (3): haversineMeters(), scanAndTest(), splitAndRechainSegments()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RouteTrace` connect `RouteTrace` to `haversineDistance`, `App.tsx`, `localRouting.ts`, `syncVaultService.ts`, `gpxStorageService.ts`, `routeCatalog.ts`, `Map.tsx`, `useOutdoorNavigation.ts`, `index-gpx.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `haversineDistance` be split into smaller, more focused modules?**
  _Cohesion score 0.08491228070175438 - nodes in this community are weakly interconnected._
- **Why does `RouteSuggestions` connect `RouteTrace` to `haversineDistance`, `App.tsx`, `localRouting.ts`, `syncVaultService.ts`, `gpxStorageService.ts`, `routeCatalog.ts`, `Map.tsx`, `useOutdoorNavigation.ts`, `index-gpx.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `RouteTrace` be split into smaller, more focused modules?**
  _Cohesion score 0.055658627087198514 - nodes in this community are weakly interconnected._
- **Why does `haversineDistance()` connect `haversineDistance` to `RouteTrace`, `localRouting.ts`, `routeCatalog.ts`, `index-gpx.ts`, `generate-greater-region-gpx.ts`, `geoUtils.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `localRouting.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0942684766214178 - nodes in this community are weakly interconnected._
- **Should `syncVaultService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10235690235690235 - nodes in this community are weakly interconnected._