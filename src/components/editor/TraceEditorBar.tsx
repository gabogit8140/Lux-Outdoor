import React from 'react';
import {
  PenTool,
  Wand2,
  RotateCcw,
  RotateCw,
  Repeat,
  Save,
  X,
  Footprints,
  Bike,
  Check,
  Loader2,
  Trash2,
  ArrowLeftRight,
  Sparkles,
  Eye,
  EyeOff,
  Route,
  Compass,
  CheckCircle2,
  ListOrdered,
  AlertTriangle,
  Scissors,
  Flag,
  GitFork,
} from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import type { SegmentRoutingMode } from '../../lib/routing/segmentRouter';
import { SegmentOrderDashboard } from './SegmentOrderDashboard';
import { SubTraceSlicerDashboard } from './SubTraceSlicerDashboard';

interface TraceEditorBarProps {
  editor: UseRouteEditorReturn;
  isTraceVisible?: boolean;
  onToggleTraceVisibility?: () => void;
}

export function TraceEditorBar({
  editor,
  isTraceVisible = true,
  onToggleTraceVisibility,
}: TraceEditorBarProps) {
  const {
    editorMode,
    activity,
    setActivity,
    routingMode,
    setRoutingMode,
    originalRoute,
    waypoints,
    segmentMetas,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    orderAnomalies,
    swapWaypoints,
    setStartWaypoint,
    removeWaypoint,
    toggleSelectedWaypointDirectMode,
    resetToOriginalTrace,
    isLoop,
    calculatedResult,
    isCalculating,
    loopCalibrationPass,
    targetLoopDistanceKm,
    isSegmentsDashboardOpen,
    toggleSegmentsDashboard,
    isSubTracePanelOpen,
    toggleSubTracePanel,
    subTraceInfo,
    subTracePickTarget,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    toggleLoop,
    reverseDirection,
    openSaveModal,
    openLoopModal,
    cancel,
  } = editor;

  // Mode de routage du segment lié au point sélectionné ('trail' | 'free' | 'direct' | 'original')
  const selectedPointMode = React.useMemo<SegmentRoutingMode>(() => {
    if (selectedWaypointIndex === null || waypoints.length < 2) return routingMode;
    const totalSegs = isLoop ? waypoints.length : waypoints.length - 1;
    const incomingIdx =
      selectedWaypointIndex > 0
        ? selectedWaypointIndex - 1
        : isLoop
        ? totalSegs - 1
        : 0;
    return segmentMetas[incomingIdx]?.source || routingMode;
  }, [selectedWaypointIndex, waypoints.length, isLoop, segmentMetas, routingMode]);

  // Compte combien de segments ont été modifiés en mode édition
  const modifiedSegmentsCount = React.useMemo(() => {
    if (editorMode !== 'edit') return 0;
    return segmentMetas.filter((m) => m.source !== 'original').length;
  }, [editorMode, segmentMetas]);

  const totalSegmentsCount = isLoop
    ? waypoints.length
    : Math.max(0, waypoints.length - 1);

  // Message de guidage contextuel adapté à l'action en cours
  const helperMessage = React.useMemo(() => {
    if (subTracePickTarget === 'start') {
      return '🎯 Touchez la trace pointillée sur la carte pour placer votre point de Départ (A)';
    }
    if (subTracePickTarget === 'end') {
      return '🎯 Touchez la trace pointillée sur la carte pour placer votre Demi-tour (B)';
    }
    if (isCalculating) {
      if (loopCalibrationPass) {
        return `Calibrage de la boucle sans impasse (passe ${loopCalibrationPass}/3)...`;
      }
      return 'Adaptation précise sur les sentiers réels...';
    }
    if (selectedWaypointIndex !== null) {
      return `Étape ${selectedWaypointIndex + 1} active : glissez-la ou touchez la carte pour la déplacer exactement là.`;
    }
    if (subTraceInfo) {
      return `Sous-trace active : ${subTraceInfo.startPlaceName} ${
        subTraceInfo.returnMode === 'one_way' ? '→' : '⇄'
      } ${subTraceInfo.endPlaceName} (km ${subTraceInfo.startKm} à ${subTraceInfo.endKm})`;
    }
    if (editorMode === 'edit') {
      return modifiedSegmentsCount === 0
        ? 'Trace GPX 100% intacte • Touchez « Sous-trace » pour extraire une portion avec retour'
        : `${modifiedSegmentsCount} tronçon(s) adapté(s) • Le reste de la trace originale est verrouillé`;
    }
    if (waypoints.length === 0) {
      return 'Touchez la carte pour placer votre point de départ (1) ou lancez Boucle auto';
    }
    if (waypoints.length === 1) {
      return 'Touchez un 2e point sur la carte pour tracer sur les sentiers';
    }
    return 'Touchez la carte pour prolonger • Touchez « Segments » pour réordonner librement';
  }, [
    subTracePickTarget,
    isCalculating,
    loopCalibrationPass,
    selectedWaypointIndex,
    subTraceInfo,
    editorMode,
    modifiedSegmentsCount,
    waypoints.length,
  ]);

  return (
    <>
      {/* Dashboard flottant de réorganisation manuelle & automatique des segments */}
      <SegmentOrderDashboard editor={editor} />

      {/* Dashboard flottant de création de Sous-Trace (avec retour inclus) */}
      <SubTraceSlicerDashboard editor={editor} />

      {/* ZONE 1 (HAUT) : Pilule de Télémétrie Compacte (Zéro collision avec les docks gauche et droite) */}
      <div
        className="absolute left-14 right-14 sm:left-16 sm:right-16 md:left-24 md:right-24 z-[460] pointer-events-none flex flex-col items-center transition-all"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.65rem)' }}
      >
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.28)] border border-indigo-200/80 dark:border-indigo-800/80 px-2.5 py-1.5 sm:px-3.5 sm:py-2 max-w-xl w-full flex items-center justify-between gap-2">
          {/* Icône & Titre du mode */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25">
              {editorMode === 'create' ? (
                <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {editorMode === 'create'
                    ? 'Tracé Précis'
                    : subTraceInfo
                    ? 'Sous-Trace (Retour inclus)'
                    : 'Modification Locale'}
                </span>
                {isCalculating && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-bold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                )}
              </div>
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[115px] xs:max-w-[150px] sm:max-w-[220px]">
                {editorMode === 'create'
                  ? targetLoopDistanceKm
                    ? `Boucle calibrée (${targetLoopDistanceKm} km)`
                    : 'Tracé sur sentiers'
                  : subTraceInfo
                  ? `${subTraceInfo.startPlaceName} ⇄ ${subTraceInfo.endPlaceName}`
                  : originalRoute?.title || 'Variante sur mesure'}
              </h3>
            </div>
          </div>

          {/* KPIs Temps Réel (Distance, D+ & Précision de boucle) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {calculatedResult ? (
              <div className="flex items-center gap-1.5 bg-slate-100/95 dark:bg-slate-800/95 px-2.5 py-1 rounded-xl text-xs font-mono-kpi border border-slate-200/80 dark:border-slate-700/80">
                <span className="font-black text-slate-900 dark:text-white">
                  {calculatedResult.distanceKm}{' '}
                  <span className="font-sans text-[10px] text-slate-500">km</span>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                  +{calculatedResult.elevationGain}m
                </span>
              </div>
            ) : (
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-2 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/70">
                {waypoints.length === 0 ? '0 étape' : `${waypoints.length} étape(s)`}
              </div>
            )}

            {onToggleTraceVisibility && (
              <button
                type="button"
                onClick={onToggleTraceVisibility}
                className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isTraceVisible
                    ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 ring-1 ring-amber-400'
                }`}
                title={
                  isTraceVisible
                    ? 'Masquer la trace pour voir les sentiers de la carte'
                    : 'Réafficher la trace'
                }
                aria-label={isTraceVisible ? 'Masquer la trace' : 'Afficher la trace'}
              >
                {isTraceVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={cancel}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Quitter l'éditeur de trace"
              aria-label="Fermer l'éditeur"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ZONE 2 (BAS - ZONE DU POUCE) : Dock Ergonomique Mobile & Desktop */}
      <div
        className="absolute left-2 right-2 sm:left-6 sm:right-6 z-[460] pointer-events-none flex flex-col items-center gap-1.5"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.65rem)' }}
      >
        {/* Bandeau d'alerte rapide si deux segments semblent intervertis (quand le dashboard est fermé) */}
        {!isSegmentsDashboardOpen && orderAnomalies.length > 0 && (
          <div className="pointer-events-auto bg-amber-500 text-slate-950 px-3 py-1.5 rounded-2xl shadow-lg border border-amber-300 max-w-xl w-full flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-extrabold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">{orderAnomalies[0].description}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  swapWaypoints(
                    orderAnomalies[0].waypointIndex,
                    orderAnomalies[0].swapWithIndex
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[11px] font-bold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Intervertir
              </button>
              <button
                type="button"
                onClick={toggleSegmentsDashboard}
                className="px-2 py-1 rounded-xl bg-white/80 text-slate-900 text-[11px] font-bold cursor-pointer hover:bg-white transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Panneau contextuel d'action directe lorsqu'un point est sélectionné */}
        {selectedWaypointIndex !== null && (
          <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-900/98 text-white backdrop-blur-xl px-3 py-2 rounded-2xl shadow-xl border border-amber-400/50 max-w-xl w-full flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-amber-300 truncate">
                  {selectedWaypointIndex === 0
                    ? '🚩 Point de départ (#1) sélectionné'
                    : `Étape ${selectedWaypointIndex + 1} sélectionnée`}
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  {selectedWaypointIndex === 0
                    ? 'Glissez-le ou touchez la carte pour déplacer le départ'
                    : 'Glissez ce point ou touchez un sentier sur la carte'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Définir cette étape comme nouveau point de départ de la boucle (#1) */}
              {isLoop && selectedWaypointIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStartWaypoint(selectedWaypointIndex)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] shadow-sm"
                  title="Définir cette étape comme nouveau point de départ de la boucle (#1)"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Nouveau départ</span>
                </button>
              )}

              {/* Cycle d'assistance sur ce tronçon : Boucle auto -> Sentier libre A-R -> Hors-sentier */}
              {waypoints.length >= 2 && (
                <button
                  type="button"
                  onClick={toggleSelectedWaypointDirectMode}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer min-h-[34px] ${
                    selectedPointMode === 'direct'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                      : selectedPointMode === 'free'
                      ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sm'
                      : 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500'
                  }`}
                  title="Changer le mode de ce tronçon : Boucle auto -> Sentier libre (A-R autorisé) -> Hors-sentier direct"
                >
                  {selectedPointMode === 'direct' ? (
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                  ) : selectedPointMode === 'free' ? (
                    <GitFork className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Route className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {selectedPointMode === 'direct'
                      ? 'Hors-sentier'
                      : selectedPointMode === 'free'
                      ? 'Sentier libre (A-R)'
                      : 'Boucle auto'}
                  </span>
                </button>
              )}

              {/* Supprimer ce point */}
              {waypoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWaypoint(selectedWaypointIndex)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Supprimer cette étape"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Supprimer</span>
                </button>
              )}

              {/* Terminer / Désélectionner */}
              <button
                type="button"
                onClick={() => setSelectedWaypointIndex(null)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 cursor-pointer min-h-[34px]"
                title="Valider la position de ce point"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OK</span>
              </button>
            </div>
          </div>
        )}

        {/* Barre principale d'outils tactiles au pouce */}
        <div className="pointer-events-auto bg-white/96 dark:bg-slate-900/96 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_16px_45px_rgba(15,23,42,0.35)] border border-slate-200/90 dark:border-slate-700/90 p-2 sm:p-2.5 max-w-2xl w-full flex flex-col gap-1.5">
          {/* Bandeau d'instruction permanent (visible sur mobile et desktop) */}
          <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <span className="truncate">{helperMessage}</span>
            {targetLoopDistanceKm && calculatedResult && (
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                Cible {targetLoopDistanceKm} km ✓
              </span>
            )}
          </div>

          {/* Rangée de boutons d'action ergonomiques (min-h-40px pour le pouce) */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Undo */}
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Annuler la dernière action (Undo)"
                aria-label="Annuler"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Rétablir l'action annulée (Redo)"
                aria-label="Rétablir"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Masquer / Démasquer la trace en Mode Studio pour inspecter les sentiers sous-jacents */}
              {onToggleTraceVisibility && (waypoints.length >= 1 || editorMode === 'edit') && (
                <button
                  type="button"
                  onClick={onToggleTraceVisibility}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    isTraceVisible
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-200'
                      : 'bg-amber-500 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/50'
                  }`}
                  title={
                    isTraceVisible
                      ? 'Masquer la trace pour voir les sentiers de la carte'
                      : 'Réafficher la trace'
                  }
                  aria-label={isTraceVisible ? 'Masquer la trace' : 'Afficher la trace'}
                >
                  {isTraceVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Bouton Studio Sous-Trace (avec retour inclus) */}
              {editorMode === 'edit' && (
                <button
                  type="button"
                  onClick={toggleSubTracePanel}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shrink-0 min-h-[40px] ${
                    isSubTracePanelOpen
                      ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30'
                      : subTraceInfo
                      ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 border-teal-400'
                      : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                  }`}
                  title="Extraire une sous-trace personnalisée avec retour inclus (Aller-Retour sur piste ou Boucle)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Sous-trace</span>
                  {subTraceInfo && !isSubTracePanelOpen && (
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                  )}
                </button>
              )}

              {/* Bouton Dashboard d'Organisation des Segments */}
              {waypoints.length >= 2 && (
                <button
                  type="button"
                  onClick={toggleSegmentsDashboard}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shrink-0 min-h-[40px] ${
                    isSegmentsDashboardOpen
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : orderAnomalies.length > 0
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                  title="Ouvrir le dashboard pour réorganiser l'ordre des segments et étapes"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Segments ({totalSegmentsCount})</span>
                  {orderAnomalies.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              )}

              {/* Sport Selector */}
              <button
                type="button"
                onClick={() => setActivity(activity === 'hike' ? 'bike' : 'hike')}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 min-h-[40px]"
                title={`Activité : ${activity === 'hike' ? 'À pied' : 'Vélo'}`}
              >
                {activity === 'hike' ? (
                  <Footprints className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Bike className="w-4 h-4 text-teal-600" />
                )}
                <span className="text-[11px]">{activity === 'hike' ? 'À pied' : 'Vélo'}</span>
              </button>

              {/* Sélecteur Ergonomique de Mode d'Assistance (Boucle auto / Sentiers libres A-R / Hors-sentier) */}
              <button
                type="button"
                onClick={() => {
                  const nextMode: SegmentRoutingMode =
                    routingMode === 'trail'
                      ? 'free'
                      : routingMode === 'free'
                      ? 'direct'
                      : 'trail';
                  setRoutingMode(nextMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[40px] shadow-xs active:scale-95 ${
                  routingMode === 'trail'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : routingMode === 'free'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-700'
                }`}
                title={
                  routingMode === 'trail'
                    ? 'Mode Boucle Auto : l’algorithme cherche des sentiers distincts pour former une boucle sans repasser par le même chemin. Touchez pour passer en Sentiers Libres (Aller-retour permis).'
                    : routingMode === 'free'
                    ? 'Mode Sentiers Libres : suit les sentiers au plus court sans forcer de boucle (allers-retours et repassages 100% permis). Touchez pour passer en Hors-sentier direct.'
                    : 'Mode Hors-sentier : liaison directe manuelle en ligne droite point par point (à travers champs/bois). Touchez pour revenir en Boucle Auto.'
                }
              >
                {routingMode === 'trail' && <Route className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                {routingMode === 'free' && <GitFork className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                {routingMode === 'direct' && <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-extrabold">
                    {routingMode === 'trail'
                      ? 'Boucle auto'
                      : routingMode === 'free'
                      ? 'Sentier libre'
                      : 'Hors-sentier'}
                  </span>
                  <span className="text-[9px] opacity-75 font-normal hidden sm:inline">
                    {routingMode === 'trail'
                      ? 'Anti-doublon'
                      : routingMode === 'free'
                      ? 'A-R permis'
                      : 'Ligne droite'}
                  </span>
                </div>
              </button>

              {/* Boucle Auto Calibrée */}
              <button
                type="button"
                onClick={openLoopModal}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 min-h-[40px]"
                title="Générer une boucle automatique calibrée sans impasse"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-[11px]">Boucle auto</span>
              </button>

              {/* Fermeture en boucle On/Off */}
              <button
                type="button"
                onClick={toggleLoop}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[40px] ${
                  isLoop
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
                title="Activer ou désactiver le retour automatique au point de départ"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span className="text-[11px]">Boucle</span>
                {isLoop && <Check className="w-3 h-3 text-indigo-600" />}
              </button>

              {/* Inverser le sens */}
              {waypoints.length >= 2 && (
                <button
                  type="button"
                  onClick={reverseDirection}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Inverser le sens du parcours"
                  aria-label="Inverser le sens"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              )}

              {/* Réinitialiser l'original (mode édition) ou Tout effacer (mode création) */}
              {editorMode === 'edit' && modifiedSegmentsCount > 0 ? (
                <button
                  type="button"
                  onClick={resetToOriginalTrace}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors cursor-pointer shrink-0 min-h-[40px]"
                  title="Rétablir la trace GPX originale intacte"
                >
                  Rétablir original
                </button>
              ) : (
                waypoints.length > 0 &&
                editorMode === 'create' && (
                  <button
                    type="button"
                    onClick={clear}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Effacer tous les points"
                    aria-label="Effacer tout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>

            {/* Bouton Principal Enregistrer GPX */}
            <button
              type="button"
              onClick={openSaveModal}
              disabled={!calculatedResult || waypoints.length < 2}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md transition-all cursor-pointer shrink-0 min-h-[40px] ${
                calculatedResult && waypoints.length >= 2
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
              title="Enregistrer ce tracé dans vos parcours GPX"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
