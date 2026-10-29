# Graph Report - Trace Outdoor  (2026-10-29)

## Corpus Check
- 158 files · ~179,717 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .bat 5, (none) 3, .vbs 2)

## Summary
- 874 nodes · 2502 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2af80c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_full_sync_simulation.mjs
- RouteTrace
- App.tsx
- RouteDetailView.tsx
- syncVaultService.ts
- MapRoutesLayer.tsx
- syncAll.ts
- useRouteEditor.ts
- localRouting.ts
- steps
- Map.tsx
- useUserGpxLibrary.ts
- ref_fs
- useOutdoorNavigation.ts
- generate-icons.ts
- test_full_index_sim.mjs
- generate-icons.js
- apply_all_fixes.cjs
- Guide de Déploiement Gratuit — Lux Outdoor PWA
- CitySearchModal.tsx
- verify_all.cjs
- test_tolerance.mjs
- useRouteEditor.ts
- Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾
- classify_synthetic.mjs
- cleanup_routes.cjs
- MapLayersMenu.tsx
- ref_path
- GpxDatabaseModal.tsx
- test_trace_cleaner.mjs
- start-local.mjs
- ref_react
- MapFilterBar.tsx
- mushroom.ts
- routeGeometry.ts
- MapEditorLayer.tsx
- MapMushroomLayer.tsx
- PlanTabContent.tsx
- check_missing_curated.mjs
- verify_gaz.cjs
- BrandLogo.tsx
- inspect_links.ts
- test_all_rechain.mjs

## God Nodes (most connected - your core abstractions)
1. `haversineDistance()` - 53 edges
2. `RouteTrace` - 48 edges
3. `RouteSuggestions` - 46 edges
4. `calculatePathDistance()` - 28 edges
5. `computeElevationProfile()` - 28 edges
6. `UseRouteEditorReturn` - 27 edges
7. `App()` - 23 edges
8. `MapDisplay()` - 23 edges
9. `fetchSelectableCyclewayAtPoint()` - 20 edges
10. `MapRoutesLayer()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `🧭 Workflow Systématique avec Graphify` --references--> `ElevationPoint`  [INFERRED]
  AGENTS.md → src/types.ts
- `Étapes de mise en ligne :` --references--> `dist()`  [INFERRED]
  DEPLOYMENT.md → scripts/find_near_ansembourg.mjs
- `🧭 Workflow Systématique avec Graphify` --references--> `RouteTrace`  [INFERRED]
  AGENTS.md → src/types.ts
- `ParsedGpxResult` --references--> `CatalogItem`  [EXTRACTED]
  scripts/index-gpx.ts → src/lib/routeCatalog.ts
- `buildEnrichedGpxXml()` --calls--> `computeElevationProfile()`  [EXTRACTED]
  scripts/pipeline/gpxTransformer.ts → src/lib/geoUtils.ts

## Import Cycles
- None detected.

## Communities (46 total, 4 thin omitted)

### Community 0 - "test_full_sync_simulation.mjs"
Cohesion: 0.33
Nodes (3): cat, catDir, files

### Community 1 - "RouteTrace"
Cohesion: 0.12
Nodes (32): Directives de Développement — Lux Outdoor, 🧭 Workflow Systématique avec Graphify, ParsedGpxResult, FavoriteCard(), FavoriteCardProps, Favorites(), FavoritesCategoryCounts, FavoritesFilterBar() (+24 more)

### Community 2 - "App.tsx"
Cohesion: 0.19
Nodes (15): App(), LoopGeneratorModal(), LoopGeneratorModalProps, MapFilterBar(), NewMushroomSpotModal(), TopLeftCommandDock(), PWAInstallModal(), PWAInstallModalProps (+7 more)

### Community 3 - "RouteDetailView.tsx"
Cohesion: 0.08
Nodes (40): SaveTraceModal(), SaveTraceModalProps, MapRouteQuickDock(), isTouchDeviceWithoutMouse(), RouteCatalogList(), RouteDetailView(), KomootIcon(), getCountryFlag() (+32 more)

### Community 4 - "syncVaultService.ts"
Cohesion: 0.10
Nodes (36): FavoritesSyncTab(), FavoritesSyncTabProps, useFavorites(), useMushroomSpots(), getFirebaseApp(), getFirebaseDb(), FIREBASE_CONFIG, fetchFavoritesFromVault() (+28 more)

### Community 5 - "MapRoutesLayer.tsx"
Cohesion: 0.21
Nodes (16): createCyclewayShieldPin(), createEndIcon(), createIcon(), createRouteStartPin(), createStartIcon(), getRouteRatingMeta(), MapRoutesLayer(), getHaloUnderlayPathOptions() (+8 more)

### Community 6 - "syncAll.ts"
Cohesion: 0.18
Nodes (16): importSentiersLocaux(), indexAllGpxFiles(), scanGpxRecursive(), cleanTrackTitle(), DATASET_CATEGORIES, PC_NAMES, buildEnrichedGpxXml(), parseGpxData() (+8 more)

### Community 7 - "useRouteEditor.ts"
Cohesion: 0.06
Nodes (87): buildOrganicAnchors(), CROSS_BORDER_SEEDS, CrossBorderSeed, decodePolyline6(), densifyLongSegments(), escapeXml(), fetchCalibratedOsrmRoute(), generateGreaterRegionGpxCatalog() (+79 more)

### Community 8 - "localRouting.ts"
Cohesion: 0.05
Nodes (73): hikes, words, hikes, newMargin, oldMargin, routeMatchesFilter(), testFilterCombos(), baseBike (+65 more)

### Community 9 - "steps"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, NODE_OPTIONS, name (+21 more)

### Community 10 - "Map.tsx"
Cohesion: 0.17
Nodes (18): InitialLuxembourgFitter(), DesktopZoomControl(), MapCenterWatcher(), MapClicker(), MapController(), MapResizer(), MapDisplay(), MapLayersMenuProps (+10 more)

### Community 11 - "useUserGpxLibrary.ts"
Cohesion: 0.28
Nodes (15): useUserGpxLibrary(), deleteStoredGpxTrack(), exportUserGpxLibraryJson(), getAllStoredGpxTracks(), getAllStoredTripNames(), importUserGpxLibraryFromJson(), markTrackAsSynced(), openDatabase() (+7 more)

### Community 12 - "ref_fs"
Cohesion: 0.11
Nodes (12): near, target, content, lines, trkptLines, content, trkpts, content (+4 more)

### Community 13 - "useOutdoorNavigation.ts"
Cohesion: 0.12
Nodes (24): flyToUserArea(), LocateControl(), LocateControlProps, locateUserIcon, NavigationCockpit(), NavigationCockpitProps, NavigationMapLayer(), NavigationMapLayerProps (+16 more)

### Community 14 - "generate-icons.ts"
Cohesion: 0.25
Nodes (7): ico, icoHeader, icoPath, pwa192Path, pwa512Path, publicDir, pwa192

### Community 15 - "test_full_index_sim.mjs"
Cohesion: 0.67
Nodes (5): haversineMeters(), perpendicularDistance(), rdpSimplify(), scan(), splitAndRechainSegments()

### Community 16 - "generate-icons.js"
Cohesion: 0.18
Nodes (9): appleIcon, CRC_TABLE, createPNG(), calculateCRC(), makeChunk(), publicDir, pwa192, pwa512 (+1 more)

### Community 17 - "apply_all_fixes.cjs"
Cohesion: 0.17
Nodes (10): catalogCode, catalogList, detailView, fs, mapLayer, match, path, resolverCode (+2 more)

### Community 18 - "Guide de Déploiement Gratuit — Lux Outdoor PWA"
Cohesion: 0.20
Nodes (9): Comment enrichir la base de traces sans toucher au code, Guide de Déploiement Gratuit — Lux Outdoor PWA, Méthode A : Directement dans la PWA (Sur le terrain / Hors-ligne), Méthode B : Intégration permanente dans votre dépôt GitHub (Statique), Option 1 : GitHub Pages (Recommandé & Pré-configuré), Option 2 : Cloudflare Pages (La plus rapide au monde), Étapes de mise en ligne :, Étapes de mise en ligne : (+1 more)

### Community 19 - "CitySearchModal.tsx"
Cohesion: 0.15
Nodes (23): createPlaceIcon(), getPlaceVisual(), SelectedPlaceMapLayer(), SelectedPlaceMapLayerProps, MapFilterBarProps, CitySearchModal(), CitySearchModalProps, getCategoryBadge() (+15 more)

### Community 20 - "verify_all.cjs"
Cohesion: 0.22
Nodes (9): fs, gazContent, gazUrls, genericGazUrls, herouInGaz, herouInResolver, isGenericHomepageUrl(), match (+1 more)

### Community 21 - "test_tolerance.mjs"
Cohesion: 0.31
Nodes (8): beaufortContent, haversineMeters(), perpendicularDistance(), rawBeaufort, rdpSimplify(), simp10, simp6, splitAndRechainSegments()

### Community 22 - "useRouteEditor.ts"
Cohesion: 0.25
Nodes (14): SegmentOrderDashboard(), SegmentOrderDashboardProps, SubTraceSlicerDashboard(), SubTraceSlicerDashboardProps, TraceEditorBar(), TraceEditorBarProps, EditorHistorySnapshot, rebuildSegmentMetasForNewOrder() (+6 more)

### Community 23 - "Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾"
Cohesion: 0.29
Nodes (6): 📦 Ajout de Traces GPX Officielles dans le Code Source, 🚀 Déploiement Automatisé sur GitHub Pages, 🛠️ Développement Local, ✨ Fonctionnalités Clés, 📄 Licence, Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾

### Community 24 - "classify_synthetic.mjs"
Cohesion: 0.29
Nodes (6): allFiles, byPrefix, duplicates, realFiles, synthFiles, uniqueMocks

### Community 25 - "cleanup_routes.cjs"
Cohesion: 0.29
Nodes (6): after, before, content, fs, idx1, idx2

### Community 28 - "MapLayersMenu.tsx"
Cohesion: 0.22
Nodes (11): HuntingBattuesDockButton(), HuntingBattuesDockButtonProps, MapLayersMenu(), HuntingRifleIcon(), HuntingRifleIconProps, HuntingSafetyAlert(), HuntingSafetyAlertProps, TOUCH_MAP_BUTTON_CLASS (+3 more)

### Community 29 - "ref_path"
Cohesion: 0.12
Nodes (9): hikeDir, cyclorando, files, visitLux, walk(), viewports, badFiles, checkFile() (+1 more)

### Community 30 - "GpxDatabaseModal.tsx"
Cohesion: 0.28
Nodes (14): GpxDatabaseModal(), GpxDatabaseModalProps, batchUploadGpxToGitHub(), BatchUploadReport, ConnectionTestResult, DEFAULT_CONFIG, getGitHubConfig(), GitHubConfig (+6 more)

### Community 31 - "test_trace_cleaner.mjs"
Cohesion: 0.40
Nodes (5): chained, haversineMeters(), pc3Content, rawPts, splitAndRechainSegments()

### Community 33 - "ref_react"
Cohesion: 0.16
Nodes (4): ErrorBoundary, Props, State, BeforeInstallPromptEvent

### Community 34 - "MapFilterBar.tsx"
Cohesion: 0.18
Nodes (11): MAP_FILTER_OPTIONS, MapFilterOption, TopLeftCommandDockProps, SAFE_AREA_BOTTOM_DOCK, SAFE_AREA_LEFT_DOCK, SAFE_AREA_RIGHT_DOCK, SAFE_AREA_SEARCH_BANNER, SAFE_AREA_TOP_BAR (+3 more)

### Community 35 - "mushroom.ts"
Cohesion: 0.23
Nodes (10): MushroomSpotsTabProps, MushroomDockButton(), MushroomDockButtonProps, NewMushroomSpotModalProps, COMMON_MUSHROOM_VARIETIES, isMushroomSeasonInLuxembourg(), KNOWN_LUXEMBOURG_MUSHROOM_SPOTS, KnownMushroomSpot (+2 more)

### Community 36 - "routeGeometry.ts"
Cohesion: 0.31
Nodes (12): approxDistanceMeters(), calculateMidpointHandles(), ClosestSegmentProjection, computeFlowCosine(), detectSegmentOrderAnomalies(), distSqCorrected(), findClosestWaypointInsertIndex(), MidpointHandle (+4 more)

### Community 37 - "MapEditorLayer.tsx"
Cohesion: 0.29
Nodes (10): createDragReticleIcon(), createMidpointHandleIcon(), createWaypointIcon(), DragPreviewState, getMidpointHandleIcon(), getWaypointIcon(), MapEditorLayer(), MapEditorLayerProps (+2 more)

### Community 39 - "MapMushroomLayer.tsx"
Cohesion: 0.31
Nodes (8): MapFavoritesLayer(), createMushroomPinIcon(), MapMushroomLayer(), MapMushroomLayerProps, createFavoriteMarkerIcon(), getAdaptiveMarkerDimensions(), MarkerDimensions, MarkerSizeTier

### Community 40 - "PlanTabContent.tsx"
Cohesion: 0.28
Nodes (7): FILTER_OPTIONS, PlanTabContent(), PlanTabContentProps, POPULAR_LOCATIONS, Preset, TouchDistanceSelector(), TouchDistanceSelectorProps

### Community 41 - "check_missing_curated.mjs"
Cohesion: 0.33
Nodes (5): content, curatedContent, curatedIds, idMatches, missing

### Community 42 - "verify_gaz.cjs"
Cohesion: 0.33
Nodes (4): content, fs, genericUrls, urls

### Community 43 - "BrandLogo.tsx"
Cohesion: 0.40
Nodes (4): BrandLogoProps, SIZE_CLASSES, APP_CONFIG, APP_STORAGE_KEYS

### Community 44 - "inspect_links.ts"
Cohesion: 0.40
Nodes (4): found, map, samplePerLink, scan()

### Community 45 - "test_all_rechain.mjs"
Cohesion: 1.00
Nodes (3): haversineMeters(), scanAndTest(), splitAndRechainSegments()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RouteTrace` connect `RouteTrace` to `App.tsx`, `RouteDetailView.tsx`, `syncVaultService.ts`, `MapRoutesLayer.tsx`, `useRouteEditor.ts`, `localRouting.ts`, `Map.tsx`, `useUserGpxLibrary.ts`, `useOutdoorNavigation.ts`, `CitySearchModal.tsx`, `useRouteEditor.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `RouteTrace` be split into smaller, more focused modules?**
  _Cohesion score 0.12317073170731707 - nodes in this community are weakly interconnected._
- **Why does `RouteSuggestions` connect `RouteTrace` to `App.tsx`, `RouteDetailView.tsx`, `syncVaultService.ts`, `MapRoutesLayer.tsx`, `useRouteEditor.ts`, `localRouting.ts`, `Map.tsx`, `useUserGpxLibrary.ts`, `useOutdoorNavigation.ts`, `CitySearchModal.tsx`, `useRouteEditor.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `RouteDetailView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08055152394775036 - nodes in this community are weakly interconnected._
- **Why does `haversineDistance()` connect `useRouteEditor.ts` to `localRouting.ts`, `RouteDetailView.tsx`, `useRouteEditor.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `syncVaultService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10235690235690235 - nodes in this community are weakly interconnected._
- **Should `useRouteEditor.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0628212450028555 - nodes in this community are weakly interconnected._