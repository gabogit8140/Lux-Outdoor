import React, { useState } from 'react';
import {
  X,
  Settings,
  RefreshCw,
  Download,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Wifi,
  WifiOff,
  Share2,
  Check,
  Copy,
  Sparkles,
  Users,
  KeyRound,
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
  pairingCode?: string | null;
  connectedDevicesCount?: number;
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
  pairingCode,
  connectedDevicesCount = 0,
}: SettingsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleShareApp = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luxoutdoor.app';
    const shareData = {
      title: 'Trace Outdoor · Circuits Vélo & Randonnée',
      text: 'Découvrez Trace Outdoor : l’application outdoor pour explorer 885+ circuits de randonnée et vélo sur sentiers réels et voies sans voiture !',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Annulé par l'utilisateur
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Erreur de copie:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4">
      {/* Arrière-plan flouté */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Carte modale */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Réglages
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Préférences, partage & synchronisation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Fermer les réglages"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps structuré par sections thématiques claires */}
        <div className="p-5 space-y-5 overflow-y-auto overscroll-contain">
          {/* Groupe 1 : PARTAGE & COMMUNAUTÉ */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
              Partage & Communauté
            </span>
            <div className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-indigo-50/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Partager l&apos;application
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Recommandez Trace Outdoor à vos amis ou proches pour leurs sorties rando, gravel et vélo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleShareApp}
                  className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lien de l&apos;application copié !</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Partager Trace Outdoor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Groupe 2 : AFFICHAGE & EXPÉRIENCE */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
              Affichage & Thème
            </span>
            <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ambiance visuelle de la carte
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Basculez entre le mode clair outdoor et le mode sombre nocturne
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
                      ? 'bg-white text-emerald-800 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Clair (Alpine)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isDarkMode) onToggleDarkMode();
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 text-amber-300 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                      : 'bg-white/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Sombre (Cockpit)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Groupe 3 : APPAREIL & HORS-LIGNE */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
              Installation & Mode Hors-ligne
            </span>
            <div className="p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Application mobile & PWA
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Installez l&apos;application sur votre écran d&apos;accueil pour un accès instantané sans barre de navigateur.
                    </p>
                  </div>
                </div>
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 shrink-0 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Installée
                  </span>
                )}
              </div>

              <div className="pt-1">
                {isInstalled ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-800/80 rounded-xl p-2.5 border border-emerald-200/80 dark:border-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>L&apos;application est prête pour vos sorties sur le terrain en mode 100% hors-ligne.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInstall();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Installer l&apos;application sur cet appareil</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Groupe 4 : SYNCHRONISATION & DONNÉES */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
              Synchronisation & Stockage
            </span>
            <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              {/* Synchro multi-devices */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Synchronisation Cloud LUX-
                      </h3>
                      {pairingCode && (
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {pairingCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {pairingCode
                        ? `Connecté au coffre · ${connectedDevicesCount > 1 ? `${connectedDevicesCount} appareils connectés` : '1 appareil actif'}`
                        : 'Synchronisez vos favoris et vos traces entre iPhone, iPad et ordinateur.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerte si plusieurs appareils connectés */}
              {pairingCode && connectedDevicesCount > 1 && (
                <div className="flex items-center gap-2 text-xs bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>{connectedDevicesCount} appareils</strong> partagent actuellement ce code. Vous pouvez refuser l&apos;accès à tout moment.
                  </span>
                </div>
              )}

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSync();
                  }}
                  className="w-full py-2 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {pairingCode ? 'Gérer les appareils & refuser des accès' : 'Ouvrir la synchronisation multi-appareils'}
                  </span>
                </button>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/80 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block font-bold text-slate-800 dark:text-slate-100 truncate">
                      {totalTracksCount} circuits
                    </span>
                    <span className="text-[10px] text-slate-500">Base locale GPX</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/80 flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="block font-bold text-slate-800 dark:text-slate-100 truncate">
                      {isOnline ? 'En ligne' : 'Hors-ligne'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isOnline ? 'Tuiles & Sentiers' : 'Mode déconnecté'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page modale */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-white block leading-none">
                Trace Outdoor
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-kpi">
                v1.2 · Sentiers 0 voiture
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
