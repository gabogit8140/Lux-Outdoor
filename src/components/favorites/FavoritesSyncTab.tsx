import React, { useState } from 'react';
import {
  Smartphone,
  CheckCheck,
  QrCode,
  Copy,
  Check,
  Unlink,
  Cloud,
} from 'lucide-react';

interface FavoritesSyncTabProps {
  pairingCode?: string | null;
  isSyncing?: boolean;
  totalFavorites: number;
  onConnectPairingCode?: (code?: string) => Promise<{ success: boolean; message: string }>;
  onDisconnectPairing?: () => void;
}

export function FavoritesSyncTab({
  pairingCode,
  isSyncing,
  totalFavorites,
  onConnectPairingCode,
  onDisconnectPairing,
}: FavoritesSyncTabProps) {
  const [inputPairingCode, setInputPairingCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?sync=${pairingCode}`
      : `https://gabogit8140.github.io/Trace-Outdoor/?sync=${pairingCode}`
  )}&margin=8`;

  return (
    <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-start gap-3">
        <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
            Synchronisation automatique en temps réel
          </h3>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
            Vos favoris, appréciations (🏆 Top, 👍 Bien, ⛔ À éviter) et coins à champignons (🍄) sont partagés instantanément entre votre iPhone, iPad et Mac dès qu'ils utilisent le même code.
          </p>
        </div>
      </div>

      {pairingCode ? (
        /* Déjà jumelé avec affichage complet du QR Code scannable */
        <div className="bg-white dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCheck className="w-5 h-5" />
              <span>Synchronisation Cloud en temps réel active</span>
            </div>
            {isSyncing && (
              <span className="text-xs text-stone-400 animate-pulse">
                Synchronisation...
              </span>
            )}
          </div>

          {/* QR Code Scannable et Code texte */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-stone-200 shrink-0 text-center">
              <img
                src={qrCodeUrl}
                alt={`QR Code de synchronisation ${pairingCode}`}
                className="w-40 h-40 mx-auto rounded-lg"
                loading="lazy"
              />
              <span className="text-[10px] text-stone-500 font-bold mt-2 flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Scanner avec la caméra
              </span>
            </div>

            <div className="space-y-3 text-left flex-1 min-w-0">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Jumelage instantané par QR Code</span>
                </h4>
                <p className="text-xs text-stone-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Pointez l'appareil photo de votre <strong>iPhone</strong> ou <strong>iPad</strong> vers ce QR code pour ouvrir l'application et synchroniser immédiatement tous vos favoris et vos coins à champignons.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 block font-semibold truncate">
                    Ou saisissez ce code sur votre autre appareil :
                  </span>
                  <span className="text-xl font-black font-mono tracking-widest text-indigo-700 dark:text-indigo-300">
                    {pairingCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(pairingCode)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>
          </div>

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
                Crée un nouveau code de jumelage unique et téléverse automatiquement vos {totalFavorites} trace(s) enregistrée(s) dans votre coffre Cloud sécurisé.
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
  );
}
