import React, { useState } from 'react';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { KomootIcon } from '../ui/KomootIcon';
import { downloadGPX } from '../../lib/gpx';
import {
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  Share2,
  Smartphone,
  Watch,
  FolderOpen,
} from 'lucide-react';

interface KomootExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteSuggestions;
  trace: RouteTrace | null;
}

export function KomootExportModal({
  isOpen,
  onClose,
  route,
  trace,
}: KomootExportModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !trace) return null;

  const safeFilename = `${route.title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.gpx`;

  const handleDownload = () => {
    downloadGPX(route.title, trace.coordinates, trace.elevationProfile);
    setDownloaded(true);
  };

  const handleOpenKomootApp = () => {
    // Tente d'ouvrir l'application native Komoot via son URL scheme
    window.location.href = 'komoot://';
  };

  const handleOpenKomootWeb = () => {
    window.open('https://www.komoot.com/upload', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#7DB434] via-[#6fa42b] to-[#588523] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <KomootIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Export vers Komoot
              </h3>
              <p className="text-[11px] text-lime-100 font-medium">
                Guidage sur Apple Watch & GPS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tracé récap */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {route.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {route.distanceKm || route.distance} km • +{route.elevationGain}m D+
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            {safeFilename}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-200 overflow-y-auto max-h-[75vh]">
          {/* Étape 1 : Télécharger */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                Télécharger le tracé sur votre iPhone
              </span>
              {downloaded && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fichier prêt
                </span>
              )}
            </div>

            <button
              onClick={handleDownload}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                downloaded
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{downloaded ? 'Télécharger à nouveau le GPX' : 'Télécharger le fichier GPX'}</span>
            </button>
          </div>

          {/* Étape 2 : Deux manières simples d'ouvrir dans Komoot */}
          <div className="space-y-2.5">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Ouvrir le tracé dans Komoot
            </span>

            {/* Méthode A : Depuis Safari / Fichiers (la plus rapide sur iPhone) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Méthode A : Depuis les téléchargements Safari</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                1. Dans Safari, touchez la flèche bleue de téléchargement <span className="font-bold">↓</span> (en bas ou en haut de l'écran).<br />
                2. Touchez le fichier <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">{safeFilename}</span>.<br />
                3. Touchez le bouton <Share2 className="w-3 h-3 inline text-blue-600" /> Partager : <span className="font-bold text-slate-800 dark:text-white">Komoot</span> apparaît immédiatement en première option !
              </p>
            </div>

            {/* Méthode B : Depuis l'application Komoot */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#7DB434]" />
                <span>Méthode B : Dans l'application Komoot</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Ouvrez Komoot &gt; onglet <span className="font-bold">Profil</span> &gt; <span className="font-bold">Itinéraires</span> &gt; <span className="font-bold">Importer un fichier GPS</span> et sélectionnez le tracé.
              </p>
              <button
                onClick={handleOpenKomootApp}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#7DB434] to-[#588523] hover:from-[#71a52e] hover:to-[#4a721c] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <KomootIcon className="w-3.5 h-3.5" />
                <span>Lancer l'application Komoot</span>
              </button>
            </div>
          </div>

          {/* Sync Apple Watch */}
          <div className="p-3 bg-lime-50/70 dark:bg-lime-950/20 rounded-2xl border border-lime-200/70 dark:border-lime-900/40 flex items-start gap-2.5">
            <Watch className="w-4 h-4 text-[#7DB434] shrink-0 mt-0.5" />
            <p className="text-[11px] text-lime-900 dark:text-lime-200 leading-relaxed">
              <strong>Synchronisation automatique Apple Watch</strong> : Dès que vous enregistrez le circuit dans Komoot, il est automatiquement synchronisé sur votre montre pour le guidage au poignet.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={handleOpenKomootWeb}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold"
          >
            <span>Import web komoot.com/upload</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
