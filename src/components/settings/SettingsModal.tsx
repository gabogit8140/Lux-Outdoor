import React from 'react';
import {
  X,
  Settings,
  RefreshCw,
  Download,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSync: () => void;
  isInstalled: boolean;
  onOpenInstall: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalTracksCount: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  onOpenSync,
  isInstalled,
  onOpenInstall,
  isDarkMode,
  onToggleDarkMode,
  totalTracksCount,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4">
      {/* Arrière-plan flouté */}
      <div
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Carte modale */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-200/80 dark:border-slate-800 flex flex-col">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                Paramètres & Préférences
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Trace Outdoor · Configuration & PWA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Fermer les paramètres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des réglages défilable */}
        <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
          {/* Section 1 : Synchronisation multi-appareils */}
          <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-950/70 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Synchronisation Cloud multi-appareils
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-0.5">
                    Retrouvez vos favoris et traces sur iPhone, iPad, Android et PC sans inscription.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenSync();
                }}
                className="w-full py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ouvrir la synchronisation & QR Code</span>
              </button>
            </div>
          </div>

          {/* Section 2 : Installation PWA & Hors-ligne */}
          <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/70 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Application mobile & Hors-ligne
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-0.5">
                    Installation sur écran d'accueil et consultation des cartes sans connexion 4G.
                  </p>
                </div>
              </div>
              {isInstalled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Installée
                </span>
              )}
            </div>

            <div className="pt-1">
              {isInstalled ? (
                <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-slate-800/70 rounded-xl p-2.5 border border-emerald-200/80 dark:border-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lux Outdoor est déjà installée et prête pour le mode hors-ligne.</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenInstall();
                  }}
                  className="w-full py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Installer l'application sur cet appareil</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3 : Thème d'affichage */}
          <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Thème d'affichage
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Ambiance lumineuse cartographique
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (isDarkMode) onToggleDarkMode();
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-emerald-700 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-slate-300 border-transparent hover:bg-stone-200/70'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Mode Clair (Alpine)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isDarkMode) onToggleDarkMode();
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 text-amber-300 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-slate-300 border-transparent hover:bg-stone-200/70'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Mode Sombre (Cockpit)</span>
              </button>
            </div>
          </div>

          {/* Section 4 : Données & Stockage hors-ligne */}
          <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Base de données & Stockage
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {totalTracksCount} circuits répertoriés au Luxembourg & 200 km autour
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-stone-200/70 dark:border-slate-700/80 flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-stone-700 dark:text-slate-300 font-medium">
                  {isOnline ? 'Réseau connecté' : 'Mode hors-ligne actif'}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-stone-200/70 dark:border-slate-700/80 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="text-stone-700 dark:text-slate-300 font-medium">
                  Cache PWA actif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page modale */}
        <div className="px-5 py-3 border-t border-stone-100 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
              Trace Outdoor v1.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
