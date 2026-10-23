import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FolderGit2,
  FileText,
  CheckCircle,
  Download,
  Copy,
  ExternalLink,
  Layers,
  Bike,
  Footprints,
  Sparkles,
  Info,
  Trash2,
  MapPin,
  Calendar,
  Search,
  Database,
  Share2,
  CloudUpload,
  Key,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  GitCommit,
} from 'lucide-react';
import type { StoredGpxTrack } from '../lib/gpxStorageService';
import {
  getGitHubConfig,
  saveGitHubConfig,
  testGitHubConnection,
  uploadGpxToGitHub,
  batchUploadGpxToGitHub,
  type GitHubConfig,
  type ConnectionTestResult,
} from '../lib/githubSyncService';

interface GpxDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMultiple: (files: { name: string; content: string }[], tripName?: string) => Promise<number>;
  totalOfficialCount: number;
  bikeCount: number;
  hikeCount: number;
  activity: 'bike' | 'hike';
  userTracks?: StoredGpxTrack[];
  tripsList?: string[];
  onDeleteTrack?: (id: string) => Promise<void>;
  onMarkTrackSynced?: (id: string, sha?: string) => Promise<void>;
  onExportLibrary?: () => Promise<void>;
  onImportLibraryBackup?: (jsonString: string) => Promise<number>;
  onSelectTrack?: (id: string) => void;
}

export function GpxDatabaseModal({
  isOpen,
  onClose,
  onImportMultiple,
  totalOfficialCount,
  bikeCount,
  hikeCount,
  activity,
  userTracks = [],
  tripsList = [],
  onDeleteTrack,
  onMarkTrackSynced,
  onExportLibrary,
  onImportLibraryBackup,
  onSelectTrack,
}: GpxDatabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'myTracks' | 'upload' | 'overview' | 'github'>('myTracks');
  const [dragActive, setDragActive] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carnet de voyage lors de l'import
  const [targetTripName, setTargetTripName] = useState<string>('');

  // Recherche dans les traces importées
  const [userTrackSearch, setUserTrackSearch] = useState<string>('');
  const [filterUserTrip, setFilterUserTrip] = useState<string>('ALL');

  // État GitHub Sync (Option B)
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(getGitHubConfig());
  const [showGhToken, setShowGhToken] = useState(false);
  const [isTestingGh, setIsTestingGh] = useState(false);
  const [ghTestResult, setGhTestResult] = useState<ConnectionTestResult | null>(null);
  const [pushToGitHubOnImport, setPushToGitHubOnImport] = useState(ghConfig.autoSync);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);
  const [ghSyncStatus, setGhSyncStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const conf = getGitHubConfig();
      setGhConfig(conf);
      setPushToGitHubOnImport(conf.autoSync);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveGhConfig = (newConf: Partial<GitHubConfig>) => {
    const saved = saveGitHubConfig(newConf);
    setGhConfig(saved);
    setGhTestResult(null);
  };

  const handleTestGh = async () => {
    setIsTestingGh(true);
    setGhTestResult(null);
    try {
      const res = await testGitHubConnection(ghConfig);
      setGhTestResult(res);
    } finally {
      setIsTestingGh(false);
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsImporting(true);
    const gpxFiles: { name: string; content: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.toLowerCase().endsWith('.gpx')) {
        try {
          const content = await file.text();
          gpxFiles.push({ name: file.name, content });
        } catch (e) {
          console.warn('Erreur de lecture du fichier', file.name, e);
        }
      }
    }

    if (gpxFiles.length === 0) {
      setImportMessage('Aucun fichier .gpx valide détecté.');
      setIsImporting(false);
      return;
    }

    try {
      const importedCount = await onImportMultiple(gpxFiles, targetTripName || undefined);

      let githubSyncMsg = '';
      if (pushToGitHubOnImport && ghConfig.token) {
        setImportMessage(`Enregistré dans IndexedDB. Synchronisation vers GitHub en cours...`);
        const ghFiles = gpxFiles.map((f) => ({
          name: f.name,
          content: f.content,
          activity,
        }));
        const ghReport = await batchUploadGpxToGitHub(ghFiles, ghConfig);
        if (ghReport.succeeded > 0) {
          githubSyncMsg = ` et ${ghReport.succeeded} trace(s) synchronisée(s) vers GitHub !`;
        } else if (ghReport.failed > 0) {
          githubSyncMsg = ` (Échec de la synchro GitHub : vérifiez vos permissions).`;
        }
      }

      setImportMessage(
        `${importedCount} trace${importedCount > 1 ? 's' : ''} GPX enregistrée${
          importedCount > 1 ? 's' : ''
        } dans IndexedDB${githubSyncMsg}`
      );
      setTargetTripName('');
      setTimeout(() => {
        setActiveTab('myTracks');
      }, 1500);
    } catch (err: any) {
      setImportMessage(`Erreur d'import : ${err.message || 'Format invalide'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSyncSingleTrack = async (track: StoredGpxTrack) => {
    if (!track.rawGpxContent) {
      setGhSyncStatus(`Contenu GPX brut non disponible pour "${track.title}".`);
      return;
    }
    setSyncingTrackId(track.id);
    setGhSyncStatus(null);
    try {
      const res = await uploadGpxToGitHub(
        {
          name: track.fileName || `${track.title}.gpx`,
          content: track.rawGpxContent,
          activity: track.activity,
        },
        undefined,
        ghConfig
      );

      if (res.ok) {
        if (onMarkTrackSynced) {
          await onMarkTrackSynced(track.id, res.sha);
        }
        setGhSyncStatus(`✓ Trace "${track.title}" poussée avec succès sur GitHub !`);
      } else {
        setGhSyncStatus(`Erreur GitHub: ${res.error || 'Échec de transmission'}`);
      }
    } catch (err: any) {
      setGhSyncStatus(`Erreur réseau: ${err.message}`);
    } finally {
      setSyncingTrackId(null);
    }
  };

  const handleSyncAllTracks = async () => {
    const unsynced = userTracks.filter((t) => !t.syncedToGitHub && t.rawGpxContent);
    if (unsynced.length === 0) {
      setGhSyncStatus('Toutes vos traces possédant un fichier GPX sont déjà synchronisées.');
      return;
    }

    setIsSyncingAll(true);
    setGhSyncStatus(`Synchronisation de ${unsynced.length} traces vers GitHub...`);

    const filesToSync = unsynced.map((t) => ({
      name: t.fileName || `${t.title}.gpx`,
      content: t.rawGpxContent!,
      activity: t.activity,
      trackId: t.id,
    }));

    let successCount = 0;
    for (const f of filesToSync) {
      const res = await uploadGpxToGitHub(
        { name: f.name, content: f.content, activity: f.activity },
        undefined,
        ghConfig
      );
      if (res.ok) {
        successCount++;
        if (onMarkTrackSynced) {
          await onMarkTrackSynced(f.trackId, res.sha);
        }
      }
    }

    setIsSyncingAll(false);
    setGhSyncStatus(
      `Synchronisation terminée : ${successCount}/${unsynced.length} trace(s) envoyée(s) vers GitHub avec succès !`
    );
  };

  const handleBackupFile = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onImportLibraryBackup) return;
    const file = fileList[0];
    try {
      const text = await file.text();
      const count = await onImportLibraryBackup(text);
      setImportMessage(`${count} trace(s) restaurée(s) depuis la sauvegarde JSON !`);
    } catch (e: any) {
      setImportMessage(`Erreur de restauration : ${e.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const copyGithubCommand = () => {
    navigator.clipboard.writeText('npm run index-gpx');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredUserTracks = userTracks.filter((t) => {
    if (filterUserTrip !== 'ALL' && t.tripName !== filterUserTrip) return false;
    if (userTrackSearch.trim().length > 0) {
      const q = userTrackSearch.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchTrip = t.tripName?.toLowerCase().includes(q) || false;
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchTitle && !matchTrip && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  Gestionnaire de Traces GPX
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {userTracks.length + totalOfficialCount} traces
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Persistance locale IndexedDB & synchronisation GitHub directe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-100 px-4 pt-2 gap-1 sm:gap-2 text-xs font-bold bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('myTracks')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'myTracks'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Mes Traces & Voyages ({userTracks.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Importer des GPX
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'github'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            Synchro GitHub
            {ghConfig.token ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Catalogue ({totalOfficialCount})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: MES TRACES & VOYAGES */}
          {activeTab === 'myTracks' && (
            <div className="space-y-4">
              {/* Entête Actions & Sauvegardes */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700">
                    Bibliothèque locale : {userTracks.length} trace{userTracks.length > 1 ? 's' : ''}
                  </span>
                  {tripsList.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {tripsList.length} carnet{tripsList.length > 1 ? 's' : ''} de voyage
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {onExportLibrary && userTracks.length > 0 && (
                    <button
                      onClick={onExportLibrary}
                      className="px-2.5 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      title="Télécharger une sauvegarde JSON de toutes vos traces et carnets"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Exporter
                    </button>
                  )}

                  {onImportLibraryBackup && (
                    <button
                      onClick={() => backupInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      title="Restaurer une sauvegarde JSON"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      Restaurer
                    </button>
                  )}

                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleBackupFile(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>

              {ghSyncStatus && (
                <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 animate-in fade-in flex items-center justify-between">
                  <span>{ghSyncStatus}</span>
                  <button
                    onClick={() => setGhSyncStatus(null)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Filtres de recherche */}
              {userTracks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrer mes traces par mot-clé..."
                      value={userTrackSearch}
                      onChange={(e) => setUserTrackSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>

                  {tripsList.length > 0 && (
                    <select
                      value={filterUserTrip}
                      onChange={(e) => setFilterUserTrip(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-emerald-600 font-medium"
                    >
                      <option value="ALL">Tous les voyages ({userTracks.length})</option>
                      {tripsList.map((tr) => (
                        <option key={tr} value={tr}>
                          ✈️ {tr} ({userTracks.filter((t) => t.tripName === tr).length})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Liste des traces */}
              {userTracks.length === 0 ? (
                <div className="text-center py-10 px-4 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
                  <Database className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="font-bold text-stone-700 text-sm">
                    Aucune trace GPX importée pour le moment
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Glissez vos fichiers GPX pour les garder disponibles en permanence sur votre smartphone ou ordinateur sans connexion.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Importer ma première trace GPX
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredUserTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-white transition-all group"
                    >
                      <div
                        className="cursor-pointer flex-1 mr-2"
                        onClick={() => {
                          if (onSelectTrack) onSelectTrack(track.id);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1 rounded-lg bg-stone-100 text-emerald-700">
                            {track.activity === 'bike' ? (
                              <Bike className="w-3.5 h-3.5" />
                            ) : (
                              <Footprints className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-bold text-stone-900 group-hover:text-emerald-700 text-xs sm:text-sm">
                            {track.title}
                          </span>
                          {track.tripName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                              ✈️ {track.tripName}
                            </span>
                          )}
                          {track.syncedToGitHub ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> GitHub
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                          <span>{track.distanceKm} km</span>
                          <span>•</span>
                          <span>D+ {track.elevationGain}m</span>
                          <span>•</span>
                          <span>{track.coordinates.length} pts</span>
                          {track.dateAdded && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-stone-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(track.dateAdded).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {ghConfig.token && !track.syncedToGitHub && track.rawGpxContent && (
                          <button
                            onClick={() => handleSyncSingleTrack(track)}
                            disabled={syncingTrackId === track.id}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Publier sur votre dépôt GitHub"
                          >
                            <CloudUpload className="w-3 h-3" />
                            {syncingTrackId === track.id ? 'Envoi...' : 'Sync GitHub'}
                          </button>
                        )}

                        {onDeleteTrack && (
                          <button
                            onClick={() => onDeleteTrack(track.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer cette trace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IN BROWSER */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-blue-900 text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Glissez-déposez un ou plusieurs fichiers <strong>.gpx</strong>.
                  Ils sont stockés immédiatement dans votre base locale <strong>IndexedDB</strong> et restent disponibles hors connexion !
                </p>
              </div>

              {/* Champ Carnet de Voyage */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Associer à un voyage ou séjour (Optionnel) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Voyage Bretagne, Alpes VTT, Vosges 2026..."
                    value={targetTripName}
                    onChange={(e) => setTargetTripName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                  {tripsList.length > 0 && (
                    <select
                      onChange={(e) => setTargetTripName(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-xl font-medium"
                    >
                      <option value="">Sélectionner un voyage existant</option>
                      {tripsList.map((tr) => (
                        <option key={tr} value={tr}>
                          {tr}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Option Synchronisation GitHub directe */}
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Synchroniser également sur GitHub
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Pousse le fichier dans <code>{ghConfig.owner}/{ghConfig.repo}</code> et déclenche le redéploiement Pages
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushToGitHubOnImport}
                  onChange={(e) => setPushToGitHubOnImport(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-stone-200 hover:border-emerald-400 bg-stone-50/50'
                }`}
              >
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
                <h3 className="font-extrabold text-stone-900 text-sm">
                  Glissez-déposez vos traces .gpx ici
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Accepte les fichiers uniques ou des dossiers complets. Format GPX standard (Garmin, Komoot, Strava, Geoportail).
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Parcourir les fichiers GPX
                  </button>

                  <button
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isImporting}
                    className="px-3.5 py-2 bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-stone-500" />
                    Importer un dossier complet
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>

              {importMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-900 text-xs font-bold animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GITHUB DIRECT SYNC (OPTION B) */}
          {activeTab === 'github' && (
            <div className="space-y-4 text-xs">
              {/* Carte explication */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Synchronisation Directe GitHub (Option B)</strong>
                  <span>
                    Vos fichiers GPX sont enregistrés directement dans votre dépôt GitHub public via l'API REST officielle sans serveur tiers intermédiaire.
                    GitHub déclenche automatiquement GitHub Actions pour redéployer votre site avec les nouvelles traces !
                  </span>
                </div>
              </div>

              {/* Formulaire de configuration */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                <h4 className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  Configuration de votre dépôt GitHub
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Propriétaire (Owner)
                    </label>
                    <input
                      type="text"
                      value={ghConfig.owner}
                      onChange={(e) => handleSaveGhConfig({ owner: e.target.value })}
                      placeholder="gabogit8140"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Dépôt (Repository)
                    </label>
                    <input
                      type="text"
                      value={ghConfig.repo}
                      onChange={(e) => handleSaveGhConfig({ repo: e.target.value })}
                      placeholder="Trace-Outdoor"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Branche
                    </label>
                    <input
                      type="text"
                      value={ghConfig.branch}
                      onChange={(e) => handleSaveGhConfig({ branch: e.target.value })}
                      placeholder="main"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-stone-600 uppercase">
                      Token GitHub (Personal Access Token - PAT)
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Lux-Outdoor-PWA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      Générer un token gratuit <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showGhToken ? 'text' : 'password'}
                      value={ghConfig.token}
                      onChange={(e) => handleSaveGhConfig({ token: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx ou github_pat_xxxx"
                      className="w-full pl-3 pr-10 py-1.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGhToken(!showGhToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showGhToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Le token reste strictement stocké sur votre appareil (localStorage) et n'est jamais transmis à aucun tiers.
                  </p>
                </div>

                {/* Option Auto-Sync */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={ghConfig.autoSync}
                      onChange={(e) => handleSaveGhConfig({ autoSync: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span>Synchroniser automatiquement sur GitHub à chaque import de GPX</span>
                  </label>

                  <button
                    onClick={handleTestGh}
                    disabled={isTestingGh || !ghConfig.token}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingGh ? 'animate-spin' : ''}`} />
                    Tester la connexion
                  </button>
                </div>

                {/* Résultat du test */}
                {ghTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      ghTestResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {ghTestResult.ok ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {ghTestResult.ok ? (
                        <>
                          <strong className="block font-bold">Connexion réussie avec GitHub !</strong>
                          <span>
                            Dépôt validé : <code>{ghTestResult.repoFullName}</code> (branche {ghTestResult.defaultBranch}).
                            {ghTestResult.canPush
                              ? ' Vous disposez des droits d\'écriture nécessaires pour publier vos traces.'
                              : ' Attention : Le token ne dispose pas des droits d\'écriture.'}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong className="block font-bold">Échec du test de connexion</strong>
                          <span>{ghTestResult.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Synchronisation en lot des traces locales vers GitHub */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
                      Traces prêtes à être envoyées
                    </h4>
                    <span className="text-stone-500 text-[11px]">
                      {userTracks.filter((t) => !t.syncedToGitHub && t.rawGpxContent).length} trace(s) locale(s) en attente de publication sur GitHub
                    </span>
                  </div>

                  <button
                    onClick={handleSyncAllTracks}
                    disabled={isSyncingAll || !ghConfig.token || userTracks.filter((t) => !t.syncedToGitHub && t.rawGpxContent).length === 0}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    {isSyncingAll ? 'Envoi en cours...' : 'Tout pousser sur GitHub'}
                  </button>
                </div>
              </div>

              {/* Section Déploiement GitHub Actions */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                <h4 className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                  Suivre vos déploiements GitHub Pages
                </h4>
                <p className="text-stone-600">
                  Dès qu'un fichier GPX est synchronisé, GitHub Actions déclenche automatiquement la compilation et le redéploiement de votre PWA :
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`https://github.com/${ghConfig.owner}/${ghConfig.repo}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 rounded-xl font-bold text-stone-800 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    Voir l'historique des Actions <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                  <a
                    href={`https://${ghConfig.owner}.github.io/${ghConfig.repo}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    Ouvrir votre PWA sur GitHub Pages <ExternalLink className="w-3 h-3 text-white/80" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OVERVIEW CATALOG */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 text-center">
                  <div className="text-2xl font-black text-emerald-800">{totalOfficialCount}</div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-0.5">Catalogue statique</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80 text-center">
                  <div className="text-2xl font-black text-blue-800 flex items-center justify-center gap-1">
                    <Bike className="w-4 h-4 inline" /> {bikeCount}
                  </div>
                  <div className="text-[11px] font-bold text-blue-700 mt-0.5">Circuits Vélo</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100/80 text-center">
                  <div className="text-2xl font-black text-amber-800 flex items-center justify-center gap-1">
                    <Footprints className="w-4 h-4 inline" /> {hikeCount}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 mt-0.5">Randonnées Pédestres</div>
                </div>
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Réseaux et Portails Libres Intégrés
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <div className="font-bold text-stone-900">Geoportail.lu 🇱🇺</div>
                    <div className="text-[10px] text-stone-500">Pistes Cyclables Nationales PC 1 à 23</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <div className="font-bold text-stone-900">Mullerthal & Éislek 🇱🇺</div>
                    <div className="text-[10px] text-stone-500">Mullerthal Trail, Lee Trail & Eislek Trail</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <div className="font-bold text-stone-900">Visit Wallonia 🇧🇪</div>
                    <div className="text-[10px] text-stone-500">RAVeL, Fagnes & Boucles de la Semois</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <div className="font-bold text-stone-900">Voie Bleue V50 🇫🇷</div>
                    <div className="text-[10px] text-stone-500">Véloroute Moselle Thionville-Metz</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
