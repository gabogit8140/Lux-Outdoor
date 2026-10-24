import React, { useState, useMemo } from 'react';
import {
  X,
  Map as MapIcon,
  Calendar,
  Trash2,
  Download,
  Play,
  Mountain,
  Bike,
  Footprints,
  Edit3,
  Check,
  MessageSquare,
  ListTodo,
  Sparkles,
  Smartphone,
  Copy,
  CheckCheck,
  Cloud,
  Unlink,
  Radio,
} from 'lucide-react';
import type { SavedFavorite, FavoriteCategory } from '../hooks/useFavorites';
import type { RouteSuggestions, RouteTrace } from '../types';
import { downloadGPX } from '../lib/gpx';
import {
  FAVORITE_CATEGORIES,
  resolveFavoriteCategory,
} from '../lib/favorites/favoriteCategories';

interface FavoritesProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: SavedFavorite[];
  onDelete: (id: string) => void;
  onLoad: (route: RouteSuggestions, trace: RouteTrace) => void;
  onUpdateFavorite?: (
    id: string,
    category?: FavoriteCategory | null,
    userNotes?: string,
    hasMushrooms?: boolean,
    userRating?: number
  ) => void;
  pairingCode?: string | null;
  isSyncing?: boolean;
  onConnectPairingCode?: (code?: string) => Promise<{ success: boolean; message: string }>;
  onDisconnectPairing?: () => void;
}

type TabType = 'todo' | 'rated' | 'sync';

export function Favorites({
  isOpen,
  onClose,
  favorites,
  onDelete,
  onLoad,
  onUpdateFavorite,
  pairingCode,
  isSyncing,
  onConnectPairingCode,
  onDisconnectPairing,
}: FavoritesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [ratedSubFilter, setRatedSubFilter] = useState<'all' | FavoriteCategory>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Saisie de code de jumelage
  const [inputPairingCode, setInputPairingCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sépare les favoris entre : 1. Traces à faire (non notées) et 2. Traces notées
  const { todoFavorites, ratedFavorites } = useMemo(() => {
    const todo: SavedFavorite[] = [];
    const rated: SavedFavorite[] = [];

    favorites.forEach((fav) => {
      const cat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
      if (cat || fav.hasMushrooms) {
        rated.push(fav);
      } else {
        todo.push(fav);
      }
    });

    return { todoFavorites: todo, ratedFavorites: rated };
  }, [favorites]);

  // Sous-filtrage pour la section Traces notées
  const displayedRatedFavorites = useMemo(() => {
    if (ratedSubFilter === 'all') return ratedFavorites;
    return ratedFavorites.filter((fav) => {
      if (ratedSubFilter === 'champignons') {
        return fav.hasMushrooms || fav.category === 'champignons';
      }
      return fav.category === ratedSubFilter;
    });
  }, [ratedFavorites, ratedSubFilter]);

  if (!isOpen) return null;

  const handleStartEditNotes = (fav: SavedFavorite) => {
    setEditingNoteId(fav.id);
    setTempNotes(fav.userNotes || '');
  };

  const handleSaveNotes = (favId: string) => {
    if (onUpdateFavorite) {
      onUpdateFavorite(favId, undefined, tempNotes.trim());
    }
    setEditingNoteId(null);
  };

  const handleToggleCategory = (fav: SavedFavorite, targetCat: FavoriteCategory) => {
    if (!onUpdateFavorite) return;
    const currentCat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);

    if (targetCat === 'champignons') {
      const nextMushrooms = !fav.hasMushrooms;
      onUpdateFavorite(fav.id, undefined, undefined, nextMushrooms);
      return;
    }

    if (currentCat === targetCat) {
      onUpdateFavorite(fav.id, null, undefined, fav.hasMushrooms, 0);
    } else {
      onUpdateFavorite(fav.id, targetCat, undefined, fav.hasMushrooms);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinCode = async () => {
    if (!inputPairingCode.trim() || !onConnectPairingCode) return;
    const res = await onConnectPairingCode(inputPairingCode.trim());
    setSyncFeedback(res.message);
    setInputPairingCode('');
  };

  const handleGenerateCode = async () => {
    if (!onConnectPairingCode) return;
    const res = await onConnectPairingCode();
    setSyncFeedback(res.message);
  };

  const getCountryFlag = (country?: string) => {
    switch (country) {
      case 'LU':
        return '🇱🇺';
      case 'BE':
        return '🇧🇪';
      case 'DE':
        return '🇩🇪';
      case 'NL':
        return '🇳🇱';
      case 'FR':
        return '🇫🇷';
      default:
        return '🇪🇺';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Bibliothèque & Carnet de terrain
                </h2>
                {pairingCode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                    Sync Cloud ({pairingCode})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400">
                    Local
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {favorites.length} {favorites.length > 1 ? 'itinéraires enregistrés' : 'itinéraire enregistré'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs: 1. À faire | 2. Traces notées | 3. Synchroniser mes appareils */}
        <div className="flex border-b border-stone-200 dark:border-slate-800 bg-stone-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('todo')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'todo'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 shadow-xs'
                : 'text-stone-600 dark:text-slate-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>1. Traces à faire</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'todo'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {todoFavorites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rated')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'rated'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-500 dark:border-amber-400 shadow-xs'
                : 'text-stone-600 dark:text-slate-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>2. Traces notées (carte)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'rated'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {ratedFavorites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ml-auto shrink-0 ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-xs'
                : 'text-stone-600 dark:text-slate-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-500" />
            <span>3. Sync appareils</span>
            {pairingCode && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Sub-filter Bar for Section 2 (Traces notées) */}
        {activeTab === 'rated' && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-50 dark:bg-slate-900/90 border-b border-stone-200/80 dark:border-slate-800 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 shrink-0 mr-1">
              Filtrer par :
            </span>
            <button
              onClick={() => setRatedSubFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ratedSubFilter === 'all'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
              }`}
            >
              Toutes ({ratedFavorites.length})
            </button>

            {(['top', 'bien', 'ne_pas_refaire', 'champignons'] as FavoriteCategory[]).map((catKey) => {
              const meta = FAVORITE_CATEGORIES[catKey];
              const count = ratedFavorites.filter((f) =>
                catKey === 'champignons'
                  ? f.hasMushrooms || f.category === 'champignons'
                  : f.category === catKey
              ).length;

              return (
                <button
                  key={catKey}
                  onClick={() => setRatedSubFilter(catKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    ratedSubFilter === catKey
                      ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-2 ring-emerald-500/30 border shadow-xs`
                      : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 3: SYNCHRONISATION MULTI-APPAREILS */}
        {activeTab === 'sync' && (
          <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  Synchronisation automatique en temps réel
                </h3>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                  Grâce à votre compte Google Pro / Firebase Cloud Firestore, vos favoris, catégories (🏆 Top, 👍 Bien, ⛔ Ne pas refaire) et coins à champignons (🍄) sont partagés instantanément entre votre iPhone, iPad et Mac dès qu'ils utilisent le même code.
                </p>
              </div>
            </div>

            {pairingCode ? (
              /* Déjà jumelé */
              <div className="bg-white dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCheck className="w-5 h-5" />
                    <span>Cet appareil est synchronisé en temps réel</span>
                  </div>
                  {isSyncing && (
                    <span className="text-xs text-stone-400 animate-pulse">
                      Synchronisation...
                    </span>
                  )}
                </div>

                <div className="text-center py-3 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700">
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mb-1">
                    Votre code de jumelage :
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-black tracking-widest text-indigo-700 dark:text-indigo-300 font-mono">
                      {pairingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(pairingCode)}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 text-stone-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Copier le code"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                  👉 Pour connecter votre iPad ou votre ordinateur, ouvrez <strong>Trace Outdoor</strong> dessus, venez dans cet onglet et saisissez le code <strong className="font-mono text-indigo-600 dark:text-indigo-400">{pairingCode}</strong>.
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={onDisconnectPairing}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Dissocier cet appareil (conserve vos traces en local)
                  </button>
                </div>
              </div>
            ) : (
              /* Non jumelé : Choix entre générer ou rejoindre */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carte 1 : Premier appareil -> Générer code */}
                <div className="bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                      Option A : C'est mon premier appareil
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                      Crée un nouveau code de jumelage unique et téléverse automatiquement vos {favorites.length} trace(s) enregistrée(s) dans votre coffre Cloud sécurisé.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Créer mon code de jumelage</span>
                  </button>
                </div>

                {/* Carte 2 : Rejoindre un autre appareil */}
                <div className="bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                      Option B : Rejoindre un autre appareil
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mb-3">
                      Saisissez le code affiché sur votre premier appareil (ex. <code>LUX-9482</code>) pour fusionner et recevoir l'intégralité de vos traces notées.
                    </p>
                    <input
                      type="text"
                      value={inputPairingCode}
                      onChange={(e) => setInputPairingCode(e.target.value.toUpperCase())}
                      placeholder="Ex: LUX-9482"
                      className="w-full px-3 py-2 text-xs font-mono uppercase bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-stone-900 dark:text-stone-100 font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!inputPairingCode.trim()}
                    onClick={handleJoinCode}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider le jumelage</span>
                  </button>
                </div>
              </div>
            )}

            {syncFeedback && (
              <p className="text-xs font-semibold text-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {syncFeedback}
              </p>
            )}
          </div>
        )}

        {/* TAB 1 & 2: Content List (Traces à faire / Traces notées) */}
        {activeTab !== 'sync' && (
          <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3.5">
            {activeTab === 'todo' && todoFavorites.length === 0 && (
              <div className="text-center py-12 text-stone-500 dark:text-slate-400">
                <ListTodo className="w-12 h-12 mx-auto text-stone-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Aucune trace dans "À faire"
                </p>
                <p className="text-xs mt-1 text-stone-400 max-w-sm mx-auto">
                  Lorsque vous enregistrez un parcours sans lui attribuer de note, il apparaîtra ici pour vos futures sorties.
                </p>
              </div>
            )}

            {activeTab === 'rated' && displayedRatedFavorites.length === 0 && (
              <div className="text-center py-12 text-stone-500 dark:text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto text-amber-200 dark:text-amber-950 mb-3" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Aucune trace notée dans cette catégorie
                </p>
                <p className="text-xs mt-1 text-stone-400 max-w-sm mx-auto">
                  Attribuez une note (🏆 Top, 👍 Bien, ⛔ Ne pas refaire, 🍄 Champignons) à vos circuits pour qu'ils s'affichent ici et directement sur la carte !
                </p>
              </div>
            )}

            {/* Cards Rendering */}
            {(activeTab === 'todo' ? todoFavorites : displayedRatedFavorites).map((fav) => {
              const diff = fav.route.difficulty;
              const currentCat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
              const currentMeta = currentCat ? FAVORITE_CATEGORIES[currentCat] : null;
              const isEditingThis = editingNoteId === fav.id;

              return (
                <div
                  key={fav.id}
                  className="bg-stone-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-2xl p-4 border border-stone-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md flex flex-col gap-3 group"
                >
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {currentMeta && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${currentMeta.bgColor} ${currentMeta.borderColor} ${currentMeta.textColor}`}
                          >
                            <span>{currentMeta.icon}</span>
                            <span>{currentMeta.label}</span>
                          </span>
                        )}

                        {fav.hasMushrooms && currentCat !== 'champignons' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300/80">
                            🍄 Champignons
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                          {fav.activity === 'bike' ? (
                            <>
                              <Bike className="w-3 h-3" /> Vélo
                            </>
                          ) : (
                            <>
                              <Footprints className="w-3 h-3" /> Rando
                            </>
                          )}
                        </span>

                        {diff && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.badgeBg} ${diff.badgeText}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: diff.dotColor }}
                            />
                            {diff.label}
                          </span>
                        )}

                        {fav.country && (
                          <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
                            {getCountryFlag(fav.country)} {fav.country}
                          </span>
                        )}

                        <span className="text-[10px] text-stone-400 flex items-center gap-1 ml-auto">
                          <Calendar className="w-3 h-3" />
                          {new Date(fav.dateSaved).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {fav.title}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {fav.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onDelete(fav.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                      title="Supprimer des favoris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rating & Categorization Controls */}
                  <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-2.5 border border-stone-200/60 dark:border-slate-700/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 tracking-wider">
                        {currentCat ? 'Appréciation terrain :' : 'Noter ce circuit :'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {(['top', 'bien', 'ne_pas_refaire'] as FavoriteCategory[]).map((catKey) => {
                          const meta = FAVORITE_CATEGORIES[catKey];
                          const isSelected = currentCat === catKey;

                          return (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => handleToggleCategory(fav, catKey)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                isSelected
                                  ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-2 ring-emerald-500/30 scale-102 shadow-2xs`
                                  : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                              }`}
                              title={meta.shortDescription}
                            >
                              <span>{meta.icon}</span>
                              <span className="hidden sm:inline text-[11px]">{meta.label}</span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(fav, 'champignons')}
                          className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            fav.hasMushrooms || currentCat === 'champignons'
                              ? 'bg-orange-500/15 border-orange-400 text-orange-800 dark:text-orange-300 ring-2 ring-orange-500/30 shadow-2xs'
                              : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                          }`}
                          title="Marquer comme coin propice aux champignons"
                        >
                          <span>🍄</span>
                          <span className="hidden sm:inline text-[11px]">Champignons</span>
                        </button>
                      </div>
                    </div>

                    {/* Field Notes Display / Edit */}
                    {isEditingThis ? (
                      <div className="space-y-1.5 pt-1">
                        <textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Écrivez vos observations de terrain (état du sentier, point d'eau, panoramas...)"
                          rows={2}
                          className="w-full text-xs p-2 bg-stone-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-100"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 text-[11px] text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveNotes(fav.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 text-xs pt-1">
                        <div className="flex items-start gap-1.5 text-stone-600 dark:text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className={fav.userNotes ? 'italic' : 'text-stone-400 dark:text-slate-500 italic'}>
                            {fav.userNotes || 'Aucune note de terrain ajoutée.'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStartEditNotes(fav)}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          {fav.userNotes ? 'Modifier' : 'Ajouter'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-slate-300">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {fav.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1 text-stone-500 dark:text-slate-400">
                        <Mountain className="w-3.5 h-3.5 text-stone-400" />
                        {fav.elevationGain}m D+
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadGPX(fav.title, fav.trace.coordinates, fav.trace.elevationProfile)
                        }
                        className="px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-xl font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title="Télécharger GPX"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-500" />
                        GPX
                      </button>
                      <button
                        onClick={() => {
                          onLoad(fav.route, fav.trace);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Ouvrir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
