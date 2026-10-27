import React, { useState, useEffect } from 'react';
import { Save, Download, X, Footprints, Bike, Sparkles, FolderGit2 } from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import type { StoredGpxTrack } from '../../lib/gpxStorageService';
import { generateGPXString, downloadGPX } from '../../lib/gpx';

interface SaveTraceModalProps {
  editor: UseRouteEditorReturn;
  tripsList: string[];
  onSaveTrack: (track: StoredGpxTrack) => Promise<StoredGpxTrack>;
  onSelectSavedRoute: (id: string) => void;
  showToast: (msg: string) => void;
}

export function SaveTraceModal({
  editor,
  tripsList,
  onSaveTrack,
  onSelectSavedRoute,
  showToast,
}: SaveTraceModalProps) {
  const {
    isSaveModalOpen,
    closeSaveModal,
    calculatedResult,
    editorMode,
    originalRoute,
    activity,
    cancel,
  } = editor;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tripName, setTripName] = useState('');
  const [shouldDownload, setShouldDownload] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialise un titre par défaut intelligent à l'ouverture
  useEffect(() => {
    if (isSaveModalOpen && calculatedResult) {
      if (editorMode === 'edit' && originalRoute) {
        setTitle(`${originalRoute.title} (Variante perso)`);
        setDescription(`Variante personnalisée créée à partir de ${originalRoute.title}.`);
      } else {
        const sportLabel = activity === 'bike' ? 'Circuit Vélo' : 'Boucle Randonnée';
        setTitle(`${sportLabel} (${calculatedResult.distanceKm} km)`);
        setDescription(`Itinéraire personnalisé créé sur les sentiers (${calculatedResult.distanceKm} km, +${calculatedResult.elevationGain}m D+).`);
      }
    }
  }, [isSaveModalOpen, editorMode, originalRoute, calculatedResult, activity]);

  if (!isSaveModalOpen || !calculatedResult) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const gpxId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const rawGpx = generateGPXString(
        title.trim(),
        calculatedResult.coordinates,
        calculatedResult.elevationProfile
      );

      const newTrack: StoredGpxTrack = {
        id: gpxId,
        fileName: `${title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.gpx`,
        title: title.trim(),
        description: description.trim() || 'Circuit créé dans Lux Outdoor',
        tripName: tripName.trim() || undefined,
        activity,
        dateAdded: new Date().toISOString(),
        distanceKm: calculatedResult.distanceKm,
        elevationGain: calculatedResult.elevationGain,
        elevationLoss: calculatedResult.elevationLoss,
        coordinates: calculatedResult.coordinates,
        elevationProfile: calculatedResult.elevationProfile,
        difficulty: calculatedResult.difficulty,
        roadBreakdown: calculatedResult.roadBreakdown,
        segments: calculatedResult.segments,
        tags: [
          'Personnalisé',
          editorMode === 'edit' ? 'Variante' : 'Création',
          activity === 'bike' ? 'Vélo' : 'Randonnée',
        ],
        rawGpxContent: rawGpx,
      };

      // 1. Sauvegarde dans IndexedDB (disponible hors ligne et listé dans Mes Traces)
      await onSaveTrack(newTrack);

      // 2. Téléchargement immédiat du fichier GPX si coché
      if (shouldDownload) {
        downloadGPX(
          newTrack.title,
          newTrack.coordinates,
          newTrack.elevationProfile
        );
      }

      showToast(`Tracé "${newTrack.title}" enregistré dans vos parcours GPX !`);
      closeSaveModal();
      cancel(); // Quitte le mode éditeur
      onSelectSavedRoute(gpxId); // Affiche la nouvelle trace sur la carte
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du tracé:', err);
      showToast('Erreur lors de la sauvegarde du tracé.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {editorMode === 'edit' ? 'Enregistrer la variante GPX' : 'Enregistrer le nouveau tracé'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {calculatedResult.distanceKm} km • +{calculatedResult.elevationGain}m D+
              </p>
            </div>
          </div>
          <button
            onClick={closeSaveModal}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Reassurance banner: Original route remains completely unchanged */}
          {editorMode === 'edit' && originalRoute && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-snug">
                <div className="font-bold">Tracé d&apos;origine protégé et inchangé</div>
                <div className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                  Le parcours <strong>« {originalRoute.title} »</strong> reste 100% intact. Votre circuit modifié sera enregistré comme une <strong>nouvelle trace</strong> distincte dans Mes Traces.
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nom du tracé *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Boucle Mullerthal personnalisée"
              className="w-full px-3 py-2 rounded-xl text-base sm:text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes de terrain
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Passage par les crêtes et retour ombragé au fil de l'eau..."
              className="w-full px-3 py-2 rounded-xl text-base sm:text-xs font-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Trip / Carnet de voyage optionnel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Carnet de voyage / Dossier (optionnel)</span>
            </label>
            <input
              type="text"
              list="trips-datalist"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Ex: Séjour Ardennes, Échappée Belle..."
              className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {tripsList.length > 0 && (
              <datalist id="trips-datalist">
                {tripsList.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </div>

          {/* Download Checkbox */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shouldDownload}
                onChange={(e) => setShouldDownload(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Télécharger immédiatement le fichier .GPX</span>
              </span>
            </label>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-6 mt-0.5">
              Prêt pour votre montre GPS, Garmin, Wahoo ou Komoot.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeSaveModal}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[42px] flex items-center justify-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 min-h-[42px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer dans Mes Traces'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
