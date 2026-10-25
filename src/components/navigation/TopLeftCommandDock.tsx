import React from 'react';
import {
  Menu,
  X,
  Heart,
  FolderGit2,
  PenTool,
  Settings,
} from 'lucide-react';
import { SAFE_AREA_TOP_BAR, SAFE_AREA_LEFT_DOCK } from '../../lib/layout/safeArea';
import { TOUCH_DOCK_BUTTON_CLASS } from '../../lib/layout/touchDimensions';

interface TopLeftCommandDockProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  tracksCount: number;
  onOpenGpxModal: () => void;
  isEditorActive: boolean;
  onToggleEditor: () => void;
  onOpenSettings: () => void;
  // Propriétés de rétrocompatibilité optionnelles
  onOpenSyncModal?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isInstalled?: boolean;
  onOpenInstallModal?: () => void;
}

export function TopLeftCommandDock({
  isSidebarOpen,
  onToggleSidebar,
  favoritesCount,
  onOpenFavorites,
  tracksCount,
  onOpenGpxModal,
  isEditorActive,
  onToggleEditor,
  onOpenSettings,
}: TopLeftCommandDockProps) {
  return (
    <nav
      aria-label="Commandes principales carte"
      className="absolute z-[400] flex flex-col gap-1 sm:gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/70 dark:border-slate-700/80 rounded-2xl p-1 sm:p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.14)] transition-all"
      style={{
        top: SAFE_AREA_TOP_BAR,
        left: SAFE_AREA_LEFT_DOCK,
      }}
    >
      {/* 1. Bascule d'ouverture du volet latéral */}
      <button
        onClick={onToggleSidebar}
        className={`${TOUCH_DOCK_BUTTON_CLASS} ${
          isSidebarOpen
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
        title={isSidebarOpen ? 'Masquer le panneau (100% carte)' : 'Ouvrir le panneau des circuits'}
        aria-label="Basculer le panneau latéral"
      >
        {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <div className="h-px bg-slate-200/80 dark:bg-slate-800 mx-1" />

      {/* 2. Bibliothèque des favoris & carnet de terrain */}
      <button
        onClick={onOpenFavorites}
        className={`${TOUCH_DOCK_BUTTON_CLASS} hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 relative group`}
        title="Bibliothèque des favoris & carnet de terrain"
        aria-label="Favoris"
      >
        <Heart className="w-4 h-4 fill-rose-500/15 text-rose-500 group-hover:scale-110 transition-transform" />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
            {favoritesCount}
          </span>
        )}
      </button>

      {/* 3. Base GPX & Carnets de voyage */}
      <button
        onClick={onOpenGpxModal}
        className={`${TOUCH_DOCK_BUTTON_CLASS} hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 relative group`}
        title={`Base GPX & Carnets de voyage (${tracksCount} traces)`}
        aria-label="Catalogue GPX"
      >
        <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-emerald-600 text-white font-mono-kpi font-bold text-[8px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
          {tracksCount}
        </span>
      </button>

      {/* 4. Nouveau tracé interactif sur la carte (Studio Création GPX) */}
      <button
        onClick={onToggleEditor}
        className={`${TOUCH_DOCK_BUTTON_CLASS} group relative ${
          isEditorActive
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-600/30'
            : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
        }`}
        title={
          isEditorActive
            ? 'Quitter le mode tracé'
            : 'Tracer un parcours sur la carte (Création GPX)'
        }
        aria-label="Tracer un parcours GPX"
      >
        <PenTool className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        {isEditorActive && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
        )}
      </button>

      {/* 5. Paramètres de l'application (Synchronisation Cloud, Installation PWA, Thème, Stockage) */}
      <button
        onClick={onOpenSettings}
        className={`${TOUCH_DOCK_BUTTON_CLASS} hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 group`}
        title="Paramètres, synchronisation & installation"
        aria-label="Paramètres de l'application"
      >
        <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
      </button>
    </nav>
  );
}
