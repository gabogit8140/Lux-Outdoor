import React from 'react';
import {
  Scissors,
  Repeat,
  Compass,
  ArrowRight,
  MapPin,
  Save,
  RotateCcw,
  X,
  Crosshair,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import type { SubTraceReturnMode } from '../../lib/routing/elasticTraceEditor';
import { computeTraceTotalDistanceKm } from '../../lib/routing/elasticTraceEditor';

interface SubTraceSlicerDashboardProps {
  editor: UseRouteEditorReturn;
}

export function SubTraceSlicerDashboard({ editor }: SubTraceSlicerDashboardProps) {
  const {
    isSubTracePanelOpen,
    closeSubTracePanel,
    originalRoute,
    originalTrace,
    subTraceInfo,
    subTraceStartKm,
    subTraceEndKm,
    subTraceReturnMode,
    subTracePickTarget,
    setSubTracePickTarget,
    updateSubTraceRange,
    setSubTraceReturnMode,
    resetToOriginalTrace,
    calculatedResult,
    isCalculating,
    openSaveModal,
  } = editor;

  if (!isSubTracePanelOpen || !originalTrace) {
    return null;
  }

  const totalParentKm =
    subTraceInfo?.totalParentKm ||
    Math.max(1, computeTraceTotalDistanceKm(originalTrace));

  const startKm = subTraceInfo ? subTraceInfo.startKm : subTraceStartKm;
  const endKm = subTraceInfo ? subTraceInfo.endKm : subTraceEndKm;
  const forwardKm = Number(Math.max(0.2, endKm - startKm).toFixed(1));

  const totalCalculatedKm =
    calculatedResult?.distanceKm ??
    (subTraceReturnMode === 'one_way' ? forwardKm : Number((forwardKm * 2).toFixed(1)));

  const returnDistanceKm =
    subTraceReturnMode === 'one_way'
      ? 0
      : Number(Math.max(0, totalCalculatedKm - forwardKm).toFixed(1));

  const startPct = Math.min(100, Math.max(0, (startKm / totalParentKm) * 100));
  const endPct = Math.min(100, Math.max(startPct + 2, (endKm / totalParentKm) * 100));

  const handleStartChange = (nextStart: number) => {
    const clampedStart = Number(
      Math.max(0, Math.min(nextStart, endKm - 0.5)).toFixed(1)
    );
    updateSubTraceRange(clampedStart, endKm);
  };

  const handleEndChange = (nextEnd: number) => {
    const clampedEnd = Number(
      Math.min(totalParentKm, Math.max(nextEnd, startKm + 0.5)).toFixed(1)
    );
    updateSubTraceRange(startKm, clampedEnd);
  };

  const applyTargetTotalDistance = (targetTotalKm: number) => {
    const legKm =
      subTraceReturnMode === 'one_way' ? targetTotalKm : targetTotalKm / 2;
    const nextEnd = Math.min(totalParentKm, Number((startKm + legKm).toFixed(1)));
    const nextStart =
      nextEnd - startKm < legKm
        ? Math.max(0, Number((nextEnd - legKm).toFixed(1)))
        : startKm;
    updateSubTraceRange(nextStart, nextEnd);
  };

  const returnModes: {
    id: SubTraceReturnMode;
    label: string;
    shortDesc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'out_and_back',
      label: 'Aller-Retour (A ⇄ B)',
      shortDesc: 'Retour inclus sur la même piste',
      icon: <Repeat className="w-3.5 h-3.5" />,
    },
    {
      id: 'loop_trail',
      label: 'Boucle Retour (A → B → A)',
      shortDesc: 'Retour par voies & sentiers annexes',
      icon: <Compass className="w-3.5 h-3.5" />,
    },
    {
      id: 'one_way',
      label: 'Aller simple (A → B)',
      shortDesc: 'Portion directe sans retour',
      icon: <ArrowRight className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className="fixed md:absolute inset-x-2 bottom-20 md:bottom-24 md:left-auto md:right-4 z-[520] md:w-[430px] max-h-[64dvh] md:max-h-[74dvh] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.48)] border border-teal-300/90 dark:border-teal-800/90 flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0 border-b border-teal-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-500/25 border border-teal-400/40 flex items-center justify-center shrink-0 text-teal-300">
            <Scissors className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black tracking-tight truncate">
                Studio Sous-Trace (Retour inclus)
              </h3>
              {isCalculating && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calcul...
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 truncate">
              {originalRoute?.title || 'Trace parente'} • Total d&apos;origine : {totalParentKm} km
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeSubTracePanel}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Fermer le découpeur de sous-trace"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body scrollable */}
      <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1">
        {/* 1. Choix du mode de retour */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
            <span>1. Type de retour inclus</span>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
              {subTraceReturnMode === 'out_and_back'
                ? '100% sur la trace'
                : subTraceReturnMode === 'loop_trail'
                ? 'Boucle cyclable'
                : 'Sans retour'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {returnModes.map((m) => {
              const active = subTraceReturnMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSubTraceReturnMode(m.id)}
                  className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    active
                      ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-500 shadow-md shadow-teal-600/25'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-1 font-extrabold text-[11px] leading-tight">
                    {m.icon}
                    <span className="truncate">{m.label.split(' (')[0]}</span>
                  </div>
                  <div
                    className={`text-[9.5px] leading-tight ${
                      active ? 'text-teal-50 font-semibold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {m.shortDesc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Jauge visuelle de la portion extraite sur la trace originale */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-slate-700 dark:text-slate-200">
              2. Portion sélectionnée sur la trace ({forwardKm} km aller)
            </span>
            <span className="font-mono-kpi font-bold text-teal-700 dark:text-teal-300">
              km {startKm} → km {endKm}
            </span>
          </div>

          {/* Barre visuelle de la trace parente */}
          <div className="relative h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all"
              style={{
                left: `${startPct}%`,
                width: `${Math.max(3, endPct - startPct)}%`,
              }}
            />
          </div>

          {/* Contrôle Point A (Départ de la sous-trace) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  A
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  Départ : {subTraceInfo?.startPlaceName || 'Début'}
                </span>
                <span className="text-[11px] font-mono-kpi font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                  (km {startKm})
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartChange(startKm - 0.5)}
                  disabled={startKm <= 0}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  title="Reculer le départ de 500 m"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartChange(startKm + 0.5)}
                  disabled={startKm >= endKm - 0.5}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  title="Avancer le départ de 500 m"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSubTracePickTarget(subTracePickTarget === 'start' ? null : 'start')
                  }
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                    subTracePickTarget === 'start'
                      ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  }`}
                  title="Touchez la carte ou la trace pour placer le point de départ A"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{subTracePickTarget === 'start' ? 'Touchez la carte...' : 'Carte'}</span>
                </button>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(0.5, Number((totalParentKm - 0.5).toFixed(1)))}
              step={0.5}
              value={startKm}
              onChange={(e) => handleStartChange( parseFloat(e.target.value) )}
              className="w-full accent-emerald-600 cursor-pointer h-1.5"
            />
          </div>

          {/* Contrôle Point B (Demi-tour / Fin de la sous-trace) */}
          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
                  B
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {subTraceReturnMode === 'one_way' ? 'Arrivée' : 'Demi-tour'} :{' '}
                  {subTraceInfo?.endPlaceName || 'Fin'}
                </span>
                <span className="text-[11px] font-mono-kpi font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  (km {endKm})
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEndChange(endKm - 0.5)}
                  disabled={endKm <= startKm + 0.5}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  title="Rapprocher le demi-tour de 500 m"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEndChange(endKm + 0.5)}
                  disabled={endKm >= totalParentKm}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  title="Éloigner le demi-tour de 500 m"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSubTracePickTarget(subTracePickTarget === 'end' ? null : 'end')
                  }
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                    subTracePickTarget === 'end'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  }`}
                  title="Touchez la carte ou la trace pour placer le demi-tour B"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{subTracePickTarget === 'end' ? 'Touchez la carte...' : 'Carte'}</span>
                </button>
              </div>
            </div>

            <input
              type="range"
              min={0.5}
              max={totalParentKm}
              step={0.5}
              value={endKm}
              onChange={(e) => handleEndChange( parseFloat(e.target.value) )}
              className="w-full accent-amber-500 cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* 3. Préréglages rapides de distance (Aller + Retour compris) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Découpes rapides (retour compris)
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                updateSubTraceRange(0, Number((totalParentKm * 0.5).toFixed(1)))
              }
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              1re moitié
            </button>
            <button
              type="button"
              onClick={() =>
                updateSubTraceRange(
                  Number((totalParentKm * 0.5).toFixed(1)),
                  totalParentKm
                )
              }
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              2nde moitié
            </button>
            {[15, 25, 35, 50].map((targetKm) => (
              <button
                key={targetKm}
                type="button"
                onClick={() => applyTargetTotalDistance(targetKm)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors"
              >
                {targetKm} km {subTraceReturnMode === 'one_way' ? '' : 'A/R'}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Résumé télémétrique Aller + Retour */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/50 dark:via-emerald-950/40 dark:to-teal-950/50 border border-teal-200/90 dark:border-teal-800/80 flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {subTraceInfo?.startPlaceName || 'Départ'}{' '}
                {subTraceReturnMode === 'one_way' ? '→' : '⇄'}{' '}
                {subTraceInfo?.endPlaceName || 'Demi-tour'}
              </span>
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {subTraceReturnMode === 'one_way' ? (
                <span>{totalCalculatedKm} km (Aller simple)</span>
              ) : (
                <span>
                  {forwardKm} km aller + {returnDistanceKm} km retour ={' '}
                  <span className="text-teal-700 dark:text-teal-300 underline decoration-teal-500/50">
                    {totalCalculatedKm} km
                  </span>
                </span>
              )}
            </div>
          </div>

          {calculatedResult && (
            <div className="text-right shrink-0 font-mono-kpi">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                +{calculatedResult.elevationGain}m D+
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                ~{Math.floor(calculatedResult.durationMinutes / 60)}h
                {String(calculatedResult.durationMinutes % 60).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={resetToOriginalTrace}
          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Revenir à la trace originale complète"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Trace entière</span>
        </button>

        <button
          type="button"
          onClick={() => {
            closeSubTracePanel();
            openSaveModal();
          }}
          disabled={!calculatedResult}
          className="flex-1 py-2 px-3.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Enregistrer cette sous-trace</span>
        </button>
      </div>
    </div>
  );
}
