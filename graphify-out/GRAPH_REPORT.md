# Graph Report - Trace Outdoor  (2026-10-28)

## Corpus Check
- 143 files · ~166,544 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .bat 5, (none) 3, .vbs 2)

## Summary
- 812 nodes · 2220 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3660c74a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- haversineDistance
- RouteTrace
- App.tsx
- localRouting.ts
- syncVaultService.ts
- gpxStorageService.ts
- generate-greater-region-gpx.ts
- MapEditorLayer.tsx
- routeCatalog.ts
- steps
- Map.tsx
- MapLayersMenu.tsx
- ref_fs
- useOutdoorNavigation.ts
- mushroom.ts
- LocateControl.tsx
- generate-icons.js
- apply_all_fixes.cjs
- Guide de Déploiement Gratuit — Lux Outdoor PWA
- ref_path
- verify_all.cjs
- test_tolerance.mjs
- generate-icons.ts
- Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾
- classify_synthetic.mjs
- cleanup_routes.cjs
- check_missing_curated.mjs
- test_full_index_sim.mjs
- test_full_sync_simulation.mjs
- test_trace_cleaner.mjs
- check_overlap.mjs
- inspect_links.ts
- DeviceSensorsManager
- resolve-urls.js
- scan_all_jumps.mjs
- test_all_rechain.mjs

## God Nodes (most connected - your core abstractions)
1. `haversineDistance()` - 45 edges
2. `RouteTrace` - 42 edges
3. `RouteSuggestions` - 40 edges
4. `UseRouteEditorReturn` - 27 edges
5. `MapDisplay()` - 23 edges
6. `calculatePathDistance()` - 23 edges
7. `computeElevationProfile()` - 23 edges
8. `App()` - 22 edges
9. `computeOutdoorRouteFromWaypoints()` - 18 edges
10. `MapRoutesLayer()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Étapes de mise en ligne :` --references--> `dist()`  [INFERRED]
  DEPLOYMENT.md → scripts/find_near_ansembourg.mjs
- `removeWaypointSpurs()` --calls--> `haversineDistance()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts
- `densifyLongSegments()` --calls--> `haversineDistance()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts
- `fetchCalibratedOsrmRoute()` --calls--> `calculatePathDistance()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts
- `generateGreaterRegionGpxCatalog()` --calls--> `computeElevationProfile()`  [EXTRACTED]
  scripts/generate-greater-region-gpx.ts → src/lib/geoUtils.ts

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Community 0 - "haversineDistance"
Cohesion: 0.07
Nodes (81): escapeXml(), generateAllOfficialGpxFiles(), OFFICIAL_SEEDS, OfficialRouteSeed, detectCountry(), detectRegion(), ParsedGpxResult, parseGpxFile() (+73 more)

### Community 1 - "RouteTrace"
Cohesion: 0.08
Nodes (62): FavoriteCard(), FavoriteCardProps, Favorites(), FavoritesCategoryCounts, FavoritesFilterBar(), FavoritesFilterBarProps, FavoritesFilterType, FavoritesProps (+54 more)

### Community 2 - "App.tsx"
Cohesion: 0.07
Nodes (37): App(), LoopGeneratorModal(), LoopGeneratorModalProps, SaveTraceModal(), MAP_FILTER_OPTIONS, MapFilterBar(), MapFilterOption, NewMushroomSpotModal() (+29 more)

### Community 3 - "localRouting.ts"
Cohesion: 0.08
Nodes (46): baseBike, baseHike, createPlaceIcon(), getPlaceVisual(), SelectedPlaceMapLayer(), SelectedPlaceMapLayerProps, MapFilterBarProps, CitySearchModal() (+38 more)

### Community 4 - "syncVaultService.ts"
Cohesion: 0.10
Nodes (35): FavoritesSyncTabProps, useFavorites(), useMushroomSpots(), getFirebaseApp(), getFirebaseDb(), FIREBASE_CONFIG, fetchFavoritesFromVault(), fetchVaultData() (+27 more)

### Community 5 - "gpxStorageService.ts"
Cohesion: 0.10
Nodes (38): SaveTraceModalProps, GpxDatabaseModal(), GpxDatabaseModalProps, useUserGpxLibrary(), APP_CONFIG, APP_STORAGE_KEYS, batchUploadGpxToGitHub(), BatchUploadReport (+30 more)

### Community 6 - "generate-greater-region-gpx.ts"
Cohesion: 0.08
Nodes (33): buildOrganicAnchors(), CROSS_BORDER_SEEDS, CrossBorderSeed, decodePolyline6(), densifyLongSegments(), escapeXml(), fetchCalibratedOsrmRoute(), generateGreaterRegionGpxCatalog() (+25 more)

### Community 7 - "MapEditorLayer.tsx"
Cohesion: 0.08
Nodes (38): SegmentOrderDashboard(), SegmentOrderDashboardProps, SubTraceSlicerDashboard(), SubTraceSlicerDashboardProps, TraceEditorBar(), TraceEditorBarProps, createDragReticleIcon(), createMidpointHandleIcon() (+30 more)

### Community 8 - "routeCatalog.ts"
Cohesion: 0.09
Nodes (16): hikes, words, hikes, newMargin, oldMargin, routeMatchesFilter(), testFilterCombos(), hikes (+8 more)

### Community 9 - "steps"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, NODE_OPTIONS, name (+21 more)

### Community 10 - "Map.tsx"
Cohesion: 0.15
Nodes (22): InitialLuxembourgFitter(), DesktopZoomControl(), MapCenterWatcher(), MapClicker(), MapController(), MapResizer(), MapDisplay(), MapFavoritesLayer() (+14 more)

### Community 11 - "MapLayersMenu.tsx"
Cohesion: 0.15
Nodes (16): HuntingBattuesDockButton(), HuntingBattuesDockButtonProps, MapLayersMenu(), MapLayersMenuProps, MapLayerType, TraceProfile(), HuntingRifleIcon(), HuntingRifleIconProps (+8 more)

### Community 12 - "ref_fs"
Cohesion: 0.11
Nodes (12): content, lines, trkptLines, content, trkpts, content, trkpts, files (+4 more)

### Community 13 - "useOutdoorNavigation.ts"
Cohesion: 0.31
Nodes (12): OutdoorNavigationState, useOutdoorNavigation(), deviceSensors, calculateBearing(), distanceMeters(), findNextManeuver(), formatNavDistance(), NavigationManeuver (+4 more)

### Community 14 - "mushroom.ts"
Cohesion: 0.24
Nodes (10): MushroomSpotsTabProps, MapMushroomLayerProps, MushroomDockButton(), MushroomDockButtonProps, COMMON_MUSHROOM_VARIETIES, isMushroomSeasonInLuxembourg(), KNOWN_LUXEMBOURG_MUSHROOM_SPOTS, KnownMushroomSpot (+2 more)

### Community 15 - "LocateControl.tsx"
Cohesion: 0.23
Nodes (10): flyToUserArea(), LocateControl(), LocateControlProps, locateUserIcon, NavigationCockpitProps, NavigationMapLayer(), NavigationMapLayerProps, UseOutdoorNavigationReturn (+2 more)

### Community 16 - "generate-icons.js"
Cohesion: 0.18
Nodes (9): appleIcon, CRC_TABLE, createPNG(), calculateCRC(), makeChunk(), publicDir, pwa192, pwa512 (+1 more)

### Community 17 - "apply_all_fixes.cjs"
Cohesion: 0.17
Nodes (10): catalogCode, catalogList, detailView, fs, mapLayer, match, path, resolverCode (+2 more)

### Community 18 - "Guide de Déploiement Gratuit — Lux Outdoor PWA"
Cohesion: 0.20
Nodes (9): Comment enrichir la base de traces sans toucher au code, Guide de Déploiement Gratuit — Lux Outdoor PWA, Méthode A : Directement dans la PWA (Sur le terrain / Hors-ligne), Méthode B : Intégration permanente dans votre dépôt GitHub (Statique), Option 1 : GitHub Pages (Recommandé & Pré-configuré), Option 2 : Cloudflare Pages (La plus rapide au monde), Étapes de mise en ligne :, Étapes de mise en ligne : (+1 more)

### Community 19 - "ref_path"
Cohesion: 0.20
Nodes (4): hikeDir, near, target, viewports

### Community 20 - "verify_all.cjs"
Cohesion: 0.22
Nodes (9): fs, gazContent, gazUrls, genericGazUrls, herouInGaz, herouInResolver, isGenericHomepageUrl(), match (+1 more)

### Community 21 - "test_tolerance.mjs"
Cohesion: 0.31
Nodes (8): beaufortContent, haversineMeters(), perpendicularDistance(), rawBeaufort, rdpSimplify(), simp10, simp6, splitAndRechainSegments()

### Community 22 - "generate-icons.ts"
Cohesion: 0.25
Nodes (7): ico, icoHeader, icoPath, pwa192Path, pwa512Path, publicDir, pwa192

### Community 23 - "Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾"
Cohesion: 0.29
Nodes (6): 📦 Ajout de Traces GPX Officielles dans le Code Source, 🚀 Déploiement Automatisé sur GitHub Pages, 🛠️ Développement Local, ✨ Fonctionnalités Clés, 📄 Licence, Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾

### Community 24 - "classify_synthetic.mjs"
Cohesion: 0.29
Nodes (6): allFiles, byPrefix, duplicates, realFiles, synthFiles, uniqueMocks

### Community 25 - "cleanup_routes.cjs"
Cohesion: 0.29
Nodes (6): after, before, content, fs, idx1, idx2

### Community 28 - "check_missing_curated.mjs"
Cohesion: 0.33
Nodes (5): content, curatedContent, curatedIds, idMatches, missing

### Community 29 - "test_full_index_sim.mjs"
Cohesion: 0.67
Nodes (5): haversineMeters(), perpendicularDistance(), rdpSimplify(), scan(), splitAndRechainSegments()

### Community 30 - "test_full_sync_simulation.mjs"
Cohesion: 0.33
Nodes (3): cat, catDir, files

### Community 31 - "test_trace_cleaner.mjs"
Cohesion: 0.40
Nodes (5): chained, haversineMeters(), pc3Content, rawPts, splitAndRechainSegments()

### Community 32 - "check_overlap.mjs"
Cohesion: 0.40
Nodes (4): cyclorando, files, visitLux, walk()

### Community 33 - "inspect_links.ts"
Cohesion: 0.40
Nodes (4): found, map, samplePerLink, scan()

### Community 36 - "scan_all_jumps.mjs"
Cohesion: 0.67
Nodes (3): badFiles, checkFile(), scan()

### Community 37 - "test_all_rechain.mjs"
Cohesion: 1.00
Nodes (3): haversineMeters(), scanAndTest(), splitAndRechainSegments()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RouteTrace` connect `RouteTrace` to `haversineDistance`, `App.tsx`, `localRouting.ts`, `syncVaultService.ts`, `gpxStorageService.ts`, `MapEditorLayer.tsx`, `routeCatalog.ts`, `Map.tsx`, `MapLayersMenu.tsx`, `useOutdoorNavigation.ts`, `LocateControl.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `haversineDistance` be split into smaller, more focused modules?**
  _Cohesion score 0.07333970377448638 - nodes in this community are weakly interconnected._
- **Why does `RouteSuggestions` connect `RouteTrace` to `haversineDistance`, `App.tsx`, `localRouting.ts`, `syncVaultService.ts`, `gpxStorageService.ts`, `MapEditorLayer.tsx`, `routeCatalog.ts`, `Map.tsx`, `MapLayersMenu.tsx`, `useOutdoorNavigation.ts`, `LocateControl.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `RouteTrace` be split into smaller, more focused modules?**
  _Cohesion score 0.07858807858807859 - nodes in this community are weakly interconnected._
- **Why does `haversineDistance()` connect `haversineDistance` to `routeCatalog.ts`, `RouteTrace`, `localRouting.ts`, `generate-greater-region-gpx.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06656426011264721 - nodes in this community are weakly interconnected._
- **Should `localRouting.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07676767676767676 - nodes in this community are weakly interconnected._