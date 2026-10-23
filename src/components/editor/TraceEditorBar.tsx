import React from 'react';
import {
  PenTool,
  Wand2,
  RotateCcw,
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
} from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';

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
    originalRoute,
    waypoints,
    isLoop,
    calculatedResult,
    isCalculating,
    canUndo,
    undo,
    clear,
    toggleLoop,
    reverseDirection,
    openSaveModal,
    openLoopModal,
    cancel,
  } = editor;

  return (
    <div
      className="absolute left-14 right-2 sm:left-16 sm:right-16 md:left-24 md:right-24 z-[460] pointer-events-none flex flex-col items-center gap-1.5 transition-all"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.65rem)' }}
    >
      {/* Main Studio Toolbar */}
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_12px_45px_-5px_rgba(15,23,42,0.28)] border border-indigo-200/80 dark:border-indigo-800/80 p-2 sm:p-2.5 max-w-4xl w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Tier 1: Title, Live KPIs & Close Button (mobile always fits on 1 line) */}
        <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto">
          {/* Mode Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
              {editorMode === 'create' ? (
                <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {editorMode === 'create' ? 'Tracé' : 'Variante'}
                </span>
                {isCalculating && (
                  <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-semibold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden xs:inline">Calcul...</span>
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
                {editorMode === 'create'
                  ? 'Tracé sur sentiers'
                  : originalRoute?.title || 'Variante perso'}
              </h3>
            </div>
          </div>

          {/* Live KPIs (Distance, D+) */}
          {calculatedResult ? (
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 px-2 py-0.5 sm:py-1 rounded-xl text-xs font-mono-kpi shrink-0 border border-slate-200/70 dark:border-slate-700/70">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {calculatedResult.distanceKm} <span className="font-sans text-[10px] text-slate-500">km</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                +{calculatedResult.elevationGain}m
              </span>
            </div>
          ) : (
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 italic px-1 shrink-0">
              {waypoints.length === 0 ? '1er clic = départ' : `${waypoints.length} pt(s)`}
            </div>
          )}

          {/* Close button visible in tier 1 on mobile */}
          <button
            onClick={cancel}
            className="sm:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Quitter le mode tracé"
            aria-label="Fermer le mode tracé"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier 2: Responsive Action Buttons Toolbar (Horizontally scrollable on small mobile) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:py-0 w-full sm:w-auto shrink-0">
          {/* Sport Selector */}
          <button
            onClick={() => setActivity(activity === 'hike' ? 'bike' : 'hike')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 min-h-[36px]"
            title={`Mode actuel : ${activity === 'hike' ? 'À pied' : 'Vélo'}. Cliquer pour basculer.`}
          >
            {activity === 'hike' ? (
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bike className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span className="text-[11px] font-semibold">{activity === 'hike' ? 'À pied' : 'Vélo'}</span>
          </button>

          {/* Loop Generator Modal Trigger */}
          <button
            onClick={openLoopModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 min-h-[36px]"
            title="Générer automatiquement une boucle selon un point de départ et une distance"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[11px]">Boucle auto</span>
          </button>

          {/* Loop Mode Toggle */}
          <button
            onClick={toggleLoop}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[36px] ${
              isLoop
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-800'
            }`}
            title="Activer ou désactiver la fermeture automatique en boucle vers le point de départ"
          >
            <Repeat className="w-3 h-3" />
            <span className="text-[11px]">Boucle</span>
            {isLoop && <Check className="w-3 h-3 text-indigo-600" />}
          </button>

          {/* Afficher / Masquer la trace pour voir les sentiers de la carte */}
          {onToggleTraceVisibility && waypoints.length >= 2 && (
            <button
              onClick={onToggleTraceVisibility}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[36px] ${
                isTraceVisible
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
              }`}
              title={
                isTraceVisible
                  ? 'Masquer la trace pour voir les sentiers sous-jacents'
                  : 'Démasquer la trace'
              }
            >
              {isTraceVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px]">Masquer</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px]">Démasquer</span>
                </>
              )}
            </button>
          )}

          {/* Reverse Direction */}
          {waypoints.length >= 2 && (
            <button
              onClick={reverseDirection}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Inverser le sens du parcours"
              aria-label="Inverser le sens du parcours"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Undo Point */}
          {canUndo && (
            <button
              onClick={undo}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Annuler le dernier point placé"
              aria-label="Annuler le dernier point"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Clear All */}
          {waypoints.length > 0 && (
            <button
              onClick={clear}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Effacer tous les points"
              aria-label="Effacer tous les points"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={openSaveModal}
            disabled={!calculatedResult || waypoints.length < 2}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer shrink-0 min-h-[36px] ${
              calculatedResult && waypoints.length >= 2
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-300 dark:bg-slate-700 opacity-60 cursor-not-allowed'
            }`}
            title="Enregistrer ce tracé dans un fichier GPX séparé"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer GPX</span>
          </button>

          {/* Close Button on Desktop/Tablet */}
          <button
            onClick={cancel}
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Quitter le mode tracé"
            aria-label="Fermer le mode tracé"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Helper Pill: Hidden on small mobile screens to keep the map clean and visible */}
      <div className="hidden sm:flex bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-medium shadow-md border border-slate-700/60 pointer-events-auto items-center gap-1.5">
        <span>📍 Cliquez sur la carte ou glissez le tracé pour insérer une étape • Sentiers réels suivis en direct</span>
      </div>
    </div>
  );
}
