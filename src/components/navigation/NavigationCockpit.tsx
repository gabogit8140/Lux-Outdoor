import React from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  RotateCcw,
  Flag,
  AlertTriangle,
  Compass,
  Volume2,
  VolumeX,
  X,
  Crosshair,
  Footprints,
  Bike,
} from 'lucide-react';
import type { UseOutdoorNavigationReturn } from '../../hooks/useOutdoorNavigation';
import { formatNavDistance } from '../../lib/navigation/navigationMath';

interface NavigationCockpitProps {
  navigation: UseOutdoorNavigationReturn;
  onRecenter: () => void;
}

export function NavigationCockpit({ navigation, onRecenter }: NavigationCockpitProps) {
  const {
    isNavigating,
    route,
    userPosition,
    speedKmh,
    accuracyMeters,
    distanceToTrackMeters,
    isOffTrack,
    remainingDistanceMeters,
    remainingElevationGain,
    progressPercent,
    estimatedRemainingMinutes,
    nextManeuver,
    isAudioAlertsEnabled,
    toggleAudioAlerts,
    isCompassOriented,
    toggleCompassOrientation,
    stopNavigation,
  } = navigation;

  if (!isNavigating || !route) return null;

  // Icône dynamique selon la manœuvre suivante
  const renderManeuverIcon = () => {
    if (!nextManeuver) {
      return <ArrowUp className="w-8 h-8 text-emerald-400 animate-pulse" />;
    }

    switch (nextManeuver.instructionType) {
      case 'arrivee':
        return <Flag className="w-8 h-8 text-emerald-300" />;
      case 'right':
        return <ArrowRight className="w-8 h-8 text-white" />;
      case 'left':
        return <ArrowLeft className="w-8 h-8 text-white" />;
      case 'slight-right':
        return <ArrowUpRight className="w-8 h-8 text-white" />;
      case 'slight-left':
        return <ArrowUpLeft className="w-8 h-8 text-white" />;
      case 'sharp-right':
        return <ArrowDownRight className="w-8 h-8 text-amber-300" />;
      case 'sharp-left':
        return <ArrowDownLeft className="w-8 h-8 text-amber-300" />;
      case 'u-turn':
        return <RotateCcw className="w-8 h-8 text-amber-400" />;
      default:
        return <ArrowUp className="w-8 h-8 text-emerald-400" />;
    }
  };

  const etaHours = Math.floor(estimatedRemainingMinutes / 60);
  const etaMinutes = estimatedRemainingMinutes % 60;
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + estimatedRemainingMinutes * 60000);
  const arrivalTimeStr = `${arrivalTime.getHours().toString().padStart(2, '0')}h${arrivalTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return (
    <>
      {/* 1. Bandeau supérieur tête-haute (Manoeuvre & Alerte hors-sentier) */}
      <div
        className="fixed left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[500] pointer-events-none flex flex-col items-center gap-1.5 transition-all"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.4rem)' }}
      >
        {/* Alerte Hors-Sentier Flottante (si déviation > 35m) */}
        {isOffTrack && (
          <div className="pointer-events-auto bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce border-2 border-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-slate-950" />
            <div className="text-xs leading-tight">
              <span>HORS-SENTIER (+{distanceToTrackMeters} m de la trace)</span>
              <span className="block text-[10px] font-semibold opacity-90">
                Faites demi-tour pour rejoindre le sentier balisé
              </span>
            </div>
          </div>
        )}

        {/* Manœuvre tête-haute principale */}
        <div className="pointer-events-auto w-full bg-slate-900/95 text-white backdrop-blur-2xl rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.45)] border border-white/15 p-3 sm:p-3.5 flex items-center justify-between gap-3">
          {/* Direction Icon Badge */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isOffTrack
                ? 'bg-amber-600/90 shadow-amber-600/30'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
            }`}
          >
            {renderManeuverIcon()}
          </div>

          {/* Manœuvre Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono-kpi tracking-tight text-white">
                {nextManeuver ? formatNavDistance(nextManeuver.distanceFromUserMeters) : '--'}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                {nextManeuver?.title || 'En route'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
              {nextManeuver?.detail || route.title}
            </p>
          </div>

          {/* Quitter le guidage */}
          <button
            onClick={stopNavigation}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Quitter le mode guidage"
            aria-label="Arrêter la navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Cockpit inférieur (Vitesse, Distance restante, D+ restant, ETA) */}
      <div
        className="fixed left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[500] pointer-events-none flex flex-col gap-1.5 transition-all"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.65rem)' }}
      >
        {/* Barre de progression visuelle le long de la trace */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dashboard Métriques Terrain */}
        <div className="pointer-events-auto bg-slate-900/95 text-white backdrop-blur-2xl rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.45)] border border-white/15 p-3 flex flex-col gap-2.5">
          {/* Ligne 1 : KPI métriques dynamiques */}
          <div className="grid grid-cols-4 gap-1 text-center divide-x divide-white/10">
            {/* Vitesse */}
            <div className="px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Vitesse
              </span>
              <span className="text-base font-black font-mono-kpi text-white">
                {speedKmh.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block -mt-1">km/h</span>
            </div>

            {/* Restant */}
            <div className="px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Restant
              </span>
              <span className="text-base font-black font-mono-kpi text-emerald-400">
                {(remainingDistanceMeters / 1000).toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block -mt-1">km</span>
            </div>

            {/* D+ Restant */}
            <div className="px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                D+ restant
              </span>
              <span className="text-base font-black font-mono-kpi text-teal-300">
                +{remainingElevationGain}
              </span>
              <span className="text-[9px] text-slate-400 block -mt-1">m</span>
            </div>

            {/* Arrivée estimée */}
            <div className="px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Arrivée
              </span>
              <span className="text-base font-black font-mono-kpi text-indigo-300">
                {arrivalTimeStr}
              </span>
              <span className="text-[9px] text-slate-400 block -mt-1">
                {etaHours > 0 ? `${etaHours}h${etaMinutes}` : `${etaMinutes} min`}
              </span>
            </div>
          </div>

          {/* Ligne 2 : Actions et boutons de contrôle terrain (Recentrage, Boussole, Bip sonore, Simulation) */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/10">
            {/* Recentrage sur ma position */}
            <button
              onClick={onRecenter}
              className="flex-1 py-2 px-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4 text-white" />
              <span>Me centrer</span>
            </button>

            {/* Orientation Boussole */}
            <button
              onClick={toggleCompassOrientation}
              className={`p-2 rounded-2xl border transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                isCompassOriented
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'
              }`}
              title={
                isCompassOriented
                  ? 'Désactiver la rotation boussole'
                  : 'Orienter la carte selon ma boussole'
              }
              aria-label="Boussole"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Sons d'alerte bip oscillateur */}
            <button
              onClick={toggleAudioAlerts}
              className={`p-2 rounded-2xl border transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                isAudioAlertsEnabled
                  ? 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
              title={isAudioAlertsEnabled ? 'Couper les bips sonores' : 'Activer les bips sonores'}
              aria-label="Bips sonores"
            >
              {isAudioAlertsEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
