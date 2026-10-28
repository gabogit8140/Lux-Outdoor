import React, { useState } from 'react';
import {
  ListOrdered,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
  Trash2,
  X,
  Route,
  Compass,
  Flag,
  AlertTriangle,
  CheckCircle2,
  ArrowLeftRight,
  Lock,
} from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import { findNearestGazetteerPlace } from '../../lib/routing/subSection';
import { approxDistanceMeters } from '../../lib/routing/routeGeometry';

interface SegmentOrderDashboardProps {
  editor: UseRouteEditorReturn;
}

export function SegmentOrderDashboard({ editor }: SegmentOrderDashboardProps) {
  const {
    isSegmentsDashboardOpen,
    closeSegmentsDashboard,
    waypoints,
    segmentMetas,
    calculatedResult,
    isLoop,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    highlightedSegmentIndex,
    setHighlightedSegmentIndex,
    orderAnomalies,
    reorderWaypoints,
    swapWaypoints,
    setStartWaypoint,
    toggleSegmentRoutingMode,
    autoOptimizeOrder,
    removeWaypoint,
    reverseDirection,
    isCalculating,
  } = editor;

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isSegmentsDashboardOpen) return null;

  const n = waypoints.length;
  const totalSegments = isLoop ? n : Math.max(0, n - 1);
  const legs = calculatedResult?.legs || [];

  const showQuickFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2600);
  };

  const handleAutoOptimize = () => {
    const changed = autoOptimizeOrder();
    if (changed) {
      showQuickFeedback('Ordre des segments optimisé et relié sur les sentiers !');
    } else {
      showQuickFeedback("L'ordre actuel des segments est déjà optimal.");
    }
  };

  return (
    <div
      className="fixed md:absolute inset-x-2 bottom-20 md:bottom-24 md:left-auto md:right-4 z-[520] md:w-[410px] max-h-[58dvh] md:max-h-[68dvh] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.45)] border border-indigo-200/90 dark:border-indigo-800/90 flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header du Dashboard */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0 border-b border-indigo-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black tracking-tight truncate">
                Organisation des Segments ({totalSegments})
              </h3>
              {isCalculating && (
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Liaison sentiers...
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 truncate">
              Réordonnez librement • Liaison automatique par les sentiers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeSegmentsDashboard}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Fermer le dashboard des segments"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barre d'actions globales (Auto-optimisation 2-Opt & Inversion globale) */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleAutoOptimize}
          disabled={n < 4 || isCalculating}
          className="flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40 min-h-[34px]"
          title="Réorganise automatiquement les étapes pour décroiser les segments et supprimer les rebroussements"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span>Auto-ordonner sans croisement</span>
        </button>

        <button
          type="button"
          onClick={() => {
            reverseDirection();
            showQuickFeedback('Sens de tous les segments inversé !');
          }}
          disabled={n < 2 || isCalculating}
          className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0 min-h-[34px]"
          title="Inverser l'ordre complet du parcours"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Tout inverser</span>
        </button>
      </div>

      {/* Feedback de confirmation rapide */}
      {feedbackMsg && (
        <div className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Alerte automatique si deux segments semblent intervertis */}
      {orderAnomalies.length > 0 && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 truncate">
              {orderAnomalies[0].description}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              swapWaypoints(
                orderAnomalies[0].waypointIndex,
                orderAnomalies[0].swapWithIndex
              );
              showQuickFeedback(
                `Étapes ${orderAnomalies[0].waypointIndex + 1} et ${
                  orderAnomalies[0].swapWithIndex + 1
                } remises dans le bon ordre !`
              );
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black shrink-0 cursor-pointer transition-colors"
          >
            Corriger 1-clic
          </button>
        </div>
      )}

      {/* Liste interactive des étapes & segments */}
      <div className="p-2.5 space-y-1.5 overflow-y-auto flex-1">
        {n === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Aucun point posé. Touchez la carte pour créer des segments.
          </div>
        ) : (
          waypoints.map((wp, idx) => {
            const isStart = idx === 0;
            const nextIdx = (idx + 1) % n;
            const hasOutgoingSegment = isLoop ? n >= 2 : idx < n - 1;
            const leg = hasOutgoingSegment ? legs[idx] : undefined;
            const meta = segmentMetas[idx];

            const isSelected = selectedWaypointIndex === idx;
            const isHighlighted = highlightedSegmentIndex === idx;
            const hasAnomalyHere = orderAnomalies.some(
              (a) => a.waypointIndex === idx || a.swapWithIndex === idx
            );

            // Distance du segment sortant (en km)
            const segDistMeters =
              leg?.distanceMeters ??
              (hasOutgoingSegment
                ? approxDistanceMeters(
                    wp[1],
                    wp[0],
                    waypoints[nextIdx][1],
                    waypoints[nextIdx][0]
                  )
                : 0);
            const segDistKm = (segDistMeters / 1000).toFixed(2);
            const segGain = leg?.elevationGain ?? 0;

            // Nom du lieu le plus proche pour se repérer facilement
            const nearPlace = findNearestGazetteerPlace(wp, 8);
            const placeLabel = nearPlace
              ? `près de ${nearPlace.name}`
              : `${wp[1].toFixed(4)}°, ${wp[0].toFixed(4)}°`;

            const modeBadge =
              meta?.source === 'original'
                ? {
                    label: 'GPX Original',
                    cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
                    icon: Lock,
                  }
                : meta?.source === 'direct'
                ? {
                    label: 'Direct',
                    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                    icon: Compass,
                  }
                : {
                    label: 'Sentier OSM',
                    cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                    icon: Route,
                  };
            const ModeIcon = modeBadge.icon;

            return (
              <React.Fragment key={`seg-order-row-${idx}`}>
                <div
                  draggable={true}
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIdx !== null && draggedIdx !== idx) {
                      reorderWaypoints(draggedIdx, idx);
                      showQuickFeedback(
                        `Étape ${draggedIdx + 1} déplacée en position ${idx + 1}`
                      );
                    }
                    setDraggedIdx(null);
                  }}
                  onMouseEnter={() => setHighlightedSegmentIndex(idx)}
                  onMouseLeave={() =>
                    setHighlightedSegmentIndex(
                      selectedWaypointIndex !== null ? selectedWaypointIndex : null
                    )
                  }
                  onClick={() => {
                    setSelectedWaypointIndex(idx);
                    setHighlightedSegmentIndex(idx);
                  }}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected || isHighlighted
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 shadow-sm ring-1 ring-indigo-400/50'
                      : hasAnomalyHere
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700'
                      : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Gauche : Badge numéro + Sélecteur direct d'ordre + Infos */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs ${
                          isStart
                            ? 'bg-emerald-600'
                            : hasAnomalyHere
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {hasOutgoingSegment
                              ? `Segment ${idx + 1} (Étape ${idx + 1} ➔ ${nextIdx + 1})`
                              : `Étape ${idx + 1} (Arrivée)`}
                          </span>
                          {/* Menu déroulant pour changer directement la position (ex: placer en #2) */}
                          <select
                            value={idx}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const targetPos = Number(e.target.value);
                              reorderWaypoints(idx, targetPos);
                              showQuickFeedback(
                                `Segment déplacé en position #${targetPos + 1} (relié sur sentiers)`
                              );
                            }}
                            className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                            title="Choisir directement la position de cette étape dans l'ordre du parcours"
                          >
                            {waypoints.map((_, posIdx) => (
                              <option key={`opt-${posIdx}`} value={posIdx}>
                                Pos #{posIdx + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span className="truncate">{placeLabel}</span>
                          {hasOutgoingSegment && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {segDistKm} km
                              </span>
                              {segGain > 0 && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  +{segGain}m
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Droite : Contrôles Monter / Descendre / Mode / Supprimer */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Bascule Sentier OSM vs Direct pour ce segment */}
                      {hasOutgoingSegment && (
                        <button
                          type="button"
                          onClick={() => toggleSegmentRoutingMode(idx)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${modeBadge.cls}`}
                          title="Cliquer pour basculer ce segment entre Sentier OSM et Liaison Directe"
                        >
                          <ModeIcon className="w-3 h-3 shrink-0" />
                          <span className="hidden xs:inline">{modeBadge.label}</span>
                        </button>
                      )}

                      {/* Monter dans l'ordre */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          reorderWaypoints(idx, idx - 1);
                          showQuickFeedback(
                            `Étape ${idx + 1} remontée en #${idx} (sentiers reliés)`
                          );
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-30 cursor-pointer"
                        title="Monter ce segment plus tôt dans le parcours"
                        aria-label="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Descendre dans l'ordre */}
                      <button
                        type="button"
                        disabled={idx === n - 1}
                        onClick={() => {
                          reorderWaypoints(idx, idx + 1);
                          showQuickFeedback(
                            `Étape ${idx + 1} descendue en #${idx + 2} (sentiers reliés)`
                          );
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-30 cursor-pointer"
                        title="Descendre ce segment plus tard dans le parcours"
                        aria-label="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Définir comme point de départ (1) */}
                      {!isStart && isLoop && (
                        <button
                          type="button"
                          onClick={() => {
                            setStartWaypoint(idx);
                            showQuickFeedback(
                              `Étape ${idx + 1} définie comme nouveau départ (#1)`
                            );
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                          title="Définir cette étape comme Point de Départ (#1)"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Supprimer cette étape */}
                      {n > 2 && (
                        <button
                          type="button"
                          onClick={() => removeWaypoint(idx)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          title="Supprimer cette étape"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton rapide d'interversion directe entre l'étape idx et l'étape idx + 1 */}
                {idx < n - 1 && (
                  <div className="flex justify-center -my-1 relative z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        swapWaypoints(idx, idx + 1);
                        showQuickFeedback(
                          `Étapes ${idx + 1} et ${idx + 2} interverties et reliées sur sentiers !`
                        );
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                        orderAnomalies.some(
                          (a) => a.waypointIndex === idx && a.swapWithIndex === idx + 1
                        )
                          ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 hover:border-indigo-400'
                      }`}
                      title={`Intervertir l'ordre entre l'Étape ${idx + 1} et l'Étape ${idx + 2}`}
                    >
                      <ArrowUpDown className="w-2.5 h-2.5" />
                      <span>
                        Intervertir {idx + 1} ↔ {idx + 2}
                      </span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
