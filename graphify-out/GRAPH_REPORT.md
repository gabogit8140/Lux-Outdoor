# Graph Report - Trace Outdoor  (2026-10-29)

## Corpus Check
- 159 files · ~181,407 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .bat 5, (none) 3, .vbs 2)

## Summary
- 880 nodes · 2518 edges · 52 communities (48 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22691c55`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_full_sync_simulation.mjs
- MapMushroomLayer.tsx
- App.tsx
- RouteTrace
- syncVaultService.ts
- MapRoutesLayer.tsx
- syncAll.ts
- useRouteEditor.ts
- routeCatalog.ts
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
- MapFilterBar.tsx
- verify_all.cjs
- test_tolerance.mjs
- generate-greater-region-gpx.ts
- Lux Outdoor — Luxembourg & Greater Region Outdoor Trails 🦁🚴‍♂️🥾
- classify_synthetic.mjs
- cleanup_routes.cjs
- MapLayersMenu.tsx
- check_overlap.mjs
- src/types.ts
- test_trace_cleaner.mjs
- osmCyclewayExtractor.ts
- geoUtils.ts
- LocateControl.tsx
- mushroom.ts
- mapViewport.ts
- MapEditorLayer.tsx
- elevationService.ts
- localRouting.ts
- check_missing_curated.mjs
- routeSourceResolver.ts
- scan_all_jumps.mjs
- ref_path
- test_all_rechain.mjs
- ErrorBoundary
- BrandLogo.tsx
- PlanTabContent.tsx
- touchDimensions.ts
- SelectedPlaceMapLayer.tsx
- resolve-urls.js

## God Nodes (most connected - your core abstractions)
1. `haversineDistance()` - 53 edges
2. `RouteTrace` - 48 edges
3. `RouteSuggestions` - 46 edges
4. `calculatePathDistance()` - 28 edges
5. `computeElevationProfile()` - 28 edges
6. `UseRouteEditorReturn` - 27 edges
7. `MapDisplay()` - 24 edges
8. `fetchSelectableCyclewayAtPoint()` - 24 edges
9. `App()` - 23 edges
10. `MapRoutesLayer()` - 19 edges

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

## Communities (52 total, 4 thin omitted)

### Community 0 - "test_full_sync_simulation.mjs"
Cohesion: 0.33
Nodes (3): cat, catDir, files

### Community 1 - "MapMushroomLayer.tsx"
Cohesion: 0.43
Nodes (6): createMushroomPinIcon(), MapMushroomLayer(), getAdaptiveMarkerDimensions(), MarkerDimensions, MarkerSizeTier, openWazeNavigation()

### Community 2 - "App.tsx"
Cohesion: 0.17
Nodes (16): App(), LoopGeneratorModal(), SaveTraceModal(), NewMushroomSpotModal(), NewMushroomSpotModalProps, NavigationCockpit(), TopLeftCommandDock(), TopLeftCommandDockProps (+8 more)

### Community 3 - "RouteTrace"
Cohesion: 0.07
Nodes (61): Directives de Développement — Lux Outdoor, 🧭 Workflow Systématique avec Graphify, FavoriteCard(), FavoriteCardProps, Favorites(), FavoritesCategoryCounts, FavoritesFilterBar(), FavoritesFilterBarProps (+53 more)

### Community 4 - "syncVaultService.ts"
Cohesion: 0.10
Nodes (35): FavoritesSyncTabProps, useFavorites(), useMushroomSpots(), getFirebaseApp(), getFirebaseDb(), FIREBASE_CONFIG, fetchFavoritesFromVault(), fetchVaultData() (+27 more)

### Community 5 - "MapRoutesLayer.tsx"
Cohesion: 0.30
Nodes (12): createCyclewayShieldPin(), createEndIcon(), createIcon(), createRouteStartPin(), createStartIcon(), getRouteRatingMeta(), MapRoutesLayer(), calculateBearing() (+4 more)

### Community 6 - "syncAll.ts"
Cohesion: 0.14
Nodes (16): importSentiersLocaux(), cleanTrackTitle(), DATASET_CATEGORIES, PC_NAMES, buildEnrichedGpxXml(), parseGpxData(), slugify(), syncPipeline() (+8 more)

### Community 7 - "useRouteEditor.ts"
Cohesion: 0.06
Nodes (81): LoopGeneratorModalProps, SaveTraceModalProps, SegmentOrderDashboard(), SegmentOrderDashboardProps, SubTraceSlicerDashboard(), SubTraceSlicerDashboardProps, TraceEditorBar(), TraceEditorBarProps (+73 more)

### Community 8 - "routeCatalog.ts"
Cohesion: 0.09
Nodes (16): hikes, words, hikes, newMargin, oldMargin, routeMatchesFilter(), testFilterCombos(), hikes (+8 more)

### Community 9 - "steps"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, NODE_OPTIONS, name (+21 more)

### Community 10 - "Map.tsx"
Cohesion: 0.29
Nodes (12): CycleNetworkDockButton(), InitialLuxembourgFitter(), DesktopZoomControl(), MapCenterWatcher(), MapClicker(), MapController(), MapResizer(), MapDisplay() (+4 more)

### Community 11 - "useUserGpxLibrary.ts"
Cohesion: 0.12
Nodes (31): GpxDatabaseModal(), GpxDatabaseModalProps, useUserGpxLibrary(), APP_CONFIG, APP_STORAGE_KEYS, batchUploadGpxToGitHub(), BatchUploadReport, ConnectionTestResult (+23 more)

### Community 12 - "ref_fs"
Cohesion: 0.11
Nodes (12): hikeDir, content, lines, trkptLines, content, trkpts, content, trkpts (+4 more)

### Community 13 - "useOutdoorNavigation.ts"
Cohesion: 0.20
Nodes (13): OutdoorNavigationState, useOutdoorNavigation(), deviceSensors, DeviceSensorsManager, calculateBearing(), distanceMeters(), findNextManeuver(), formatNavDistance() (+5 more)

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

### Community 19 - "MapFilterBar.tsx"
Cohesion: 0.17
Nodes (16): MAP_FILTER_OPTIONS, MapFilterBar(), MapFilterBarProps, MapFilterOption, CitySearchModal(), CitySearchModalProps, getCategoryBadge(), POPULAR_CITY_KEYS (+8 more)

### Community 20 - "verify_all.cjs"
Cohesion: 0.22
Nodes (9): fs, gazContent, gazUrls, genericGazUrls, herouInGaz, herouInResolver, isGenericHomepageUrl(), match (+1 more)

### Community 21 - "test_tolerance.mjs"
Cohesion: 0.31
Nodes (8): beaufortContent, haversineMeters(), perpendicularDistance(), rawBeaufort, rdpSimplify(), simp10, simp6, splitAndRechainSegments()

### Community 22 - "generate-greater-region-gpx.ts"
Cohesion: 0.18
Nodes (16): buildOrganicAnchors(), CROSS_BORDER_SEEDS, CrossBorderSeed, decodePolyline6(), densifyLongSegments(), escapeXml(), fetchCalibratedOsrmRoute(), generateGreaterRegionGpxCatalog() (+8 more)

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
Cohesion: 0.24
Nodes (10): HuntingBattuesDockButton(), HuntingBattuesDockButtonProps, MapLayersMenu(), HuntingRifleIcon(), HuntingRifleIconProps, HuntingSafetyAlert(), HuntingSafetyAlertProps, checkHuntingSeason() (+2 more)

### Community 29 - "check_overlap.mjs"
Cohesion: 0.40
Nodes (4): cyclorando, files, visitLux, walk()

### Community 30 - "src/types.ts"
Cohesion: 0.18
Nodes (21): BikeClassificationResult, classifyBikeRoute(), classifyOsmCyclewayTags(), CYCLEWAY_CATEGORIES, CYCLEWAY_CATEGORY_LIST, CyclewayCategoryMeta, enrichRouteWithCyclewayMeta(), extractCyclewayRef() (+13 more)

### Community 31 - "test_trace_cleaner.mjs"
Cohesion: 0.40
Nodes (5): chained, haversineMeters(), pc3Content, rawPts, splitAndRechainSegments()

### Community 32 - "osmCyclewayExtractor.ts"
Cohesion: 0.17
Nodes (20): chainMultiSegmentsToContinuousLine(), Coord3D, deduplicateSegments(), minDistanceToTarget(), normalizeCyclewayTrace(), ptDist(), segmentLengthMeters(), splitInternalJumps() (+12 more)

### Community 33 - "geoUtils.ts"
Cohesion: 0.18
Nodes (27): escapeXml(), generateAllOfficialGpxFiles(), OfficialRouteSeed, detectCountry(), detectRegion(), indexAllGpxFiles(), ParsedGpxResult, parseGpxFile() (+19 more)

### Community 34 - "LocateControl.tsx"
Cohesion: 0.26
Nodes (7): flyToUserArea(), LocateControl(), LocateControlProps, locateUserIcon, NavigationMapLayerProps, createDirectionalUserIcon(), DirectionalConeOptions

### Community 35 - "mushroom.ts"
Cohesion: 0.24
Nodes (10): MushroomSpotsTabProps, MapMushroomLayerProps, MushroomDockButton(), MushroomDockButtonProps, COMMON_MUSHROOM_VARIETIES, isMushroomSeasonInLuxembourg(), KNOWN_LUXEMBOURG_MUSHROOM_SPOTS, KnownMushroomSpot (+2 more)

### Community 36 - "mapViewport.ts"
Cohesion: 0.25
Nodes (8): MapLayersMenuProps, MapLayerType, MapTileLayersProps, DEFAULT_MAP_ZOOM, DEFAULT_ZOOM_SNAP, LUXEMBOURG_BOUNDS, LUXEMBOURG_CENTER, LUXEMBOURG_VIEWPORT_PADDING

### Community 37 - "MapEditorLayer.tsx"
Cohesion: 0.24
Nodes (13): createDragReticleIcon(), createMidpointHandleIcon(), createWaypointIcon(), DragPreviewState, getMidpointHandleIcon(), getWaypointIcon(), MapEditorLayer(), waypointIconCache (+5 more)

### Community 39 - "elevationService.ts"
Cohesion: 0.50
Nodes (4): computeRealisticElevationProfile(), getTopographicalElevation(), RELIEF_NODES, ReliefNode

### Community 40 - "localRouting.ts"
Cohesion: 0.26
Nodes (15): baseBike, baseHike, useRouteManager(), isCyclewayRoute(), filterAndSearchOffline(), findNearestLocationOffline(), generateRealOSRMRoute, isRegionalZoneLocation() (+7 more)

### Community 41 - "check_missing_curated.mjs"
Cohesion: 0.33
Nodes (5): content, curatedContent, curatedIds, idMatches, missing

### Community 42 - "routeSourceResolver.ts"
Cohesion: 0.13
Nodes (14): TraceProfile(), AUTO_PEDESTRE_SPECIAL, CONFORT_SLUGS, COURSE_SLUGS, EISLEK_SLUGS, ESCAPARDENNE_SLUGS, GUTTLAND_SLUGS, isGenericHomepageUrl() (+6 more)

### Community 43 - "scan_all_jumps.mjs"
Cohesion: 0.67
Nodes (3): badFiles, checkFile(), scan()

### Community 44 - "ref_path"
Cohesion: 0.12
Nodes (8): near, target, found, map, samplePerLink, scan(), viewports, files

### Community 45 - "test_all_rechain.mjs"
Cohesion: 1.00
Nodes (3): haversineMeters(), scanAndTest(), splitAndRechainSegments()

### Community 46 - "ErrorBoundary"
Cohesion: 0.20
Nodes (3): ErrorBoundary, Props, State

### Community 47 - "BrandLogo.tsx"
Cohesion: 0.29
Nodes (7): PWAInstallModal(), PWAInstallModalProps, SettingsModal(), SettingsModalProps, BrandLogo(), BrandLogoProps, SIZE_CLASSES

### Community 48 - "PlanTabContent.tsx"
Cohesion: 0.24
Nodes (8): FILTER_OPTIONS, PlanTabContent(), PlanTabContentProps, POPULAR_LOCATIONS, Sidebar(), Preset, TouchDistanceSelector(), TouchDistanceSelectorProps

### Community 49 - "touchDimensions.ts"
Cohesion: 0.40
Nodes (4): CycleNetworkDockButtonProps, TOUCH_DOCK_BUTTON_CLASS, TOUCH_MAP_BUTTON_CLASS, TOUCH_POLYLINE_HIT_WEIGHT

### Community 50 - "SelectedPlaceMapLayer.tsx"
Cohesion: 0.60
Nodes (5): createPlaceIcon(), getPlaceVisual(), SelectedPlaceMapLayer(), SelectedPlaceMapLayerProps, getCountryFlag()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RouteTrace` connect `RouteTrace` to `osmCyclewayExtractor.ts`, `geoUtils.ts`, `App.tsx`, `syncVaultService.ts`, `MapRoutesLayer.tsx`, `useRouteEditor.ts`, `localRouting.ts`, `routeCatalog.ts`, `Map.tsx`, `routeSourceResolver.ts`, `useUserGpxLibrary.ts`, `useOutdoorNavigation.ts`, `src/types.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `RouteTrace` be split into smaller, more focused modules?**
  _Cohesion score 0.0688088283024992 - nodes in this community are weakly interconnected._
- **Why does `RouteSuggestions` connect `RouteTrace` to `osmCyclewayExtractor.ts`, `geoUtils.ts`, `App.tsx`, `syncVaultService.ts`, `MapRoutesLayer.tsx`, `useRouteEditor.ts`, `localRouting.ts`, `routeCatalog.ts`, `Map.tsx`, `routeSourceResolver.ts`, `useUserGpxLibrary.ts`, `useOutdoorNavigation.ts`, `src/types.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `syncVaultService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10482180293501048 - nodes in this community are weakly interconnected._
- **Why does `haversineDistance()` connect `useRouteEditor.ts` to `osmCyclewayExtractor.ts`, `geoUtils.ts`, `RouteTrace`, `elevationService.ts`, `localRouting.ts`, `routeCatalog.ts`, `generate-greater-region-gpx.ts`, `src/types.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `syncAll.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._
- **Should `useRouteEditor.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06416999789606564 - nodes in this community are weakly interconnected._