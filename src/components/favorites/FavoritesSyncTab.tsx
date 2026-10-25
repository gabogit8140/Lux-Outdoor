import React, { useState } from 'react';
import {
  Smartphone,
  CheckCheck,
  Copy,
  Check,
  Unlink,
  Cloud,
  KeyRound,
  ShieldCheck,
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

  return (
    <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-start gap-3">
        <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
            Synchronisation par code sécurisé
          </h3>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
            Partagez vos circuits notés (🏆 Top, 👍 Bien, ⛔ À éviter) et vos coins à champignons (🍄) entre votre iPhone, iPad et Mac simplement en saisissant le même code.
          </p>
        </div>
      </div>

      {pairingCode ? (
        /* Déjà jumelé : affichage direct et épuré du code de jumelage */
        <div className="bg-white dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCheck className="w-5 h-5" />
              <span>Synchronisation en temps réel active</span>
            </div>
            {isSyncing && (
              <span className="text-xs text-stone-400 animate-pulse">
                Synchronisation...
              </span>
            )}
          </div>

          <div className="p-5 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Votre code de jumelage unique :</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-indigo-700 dark:text-indigo-300 px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                {pairingCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(pairingCode)}
                className="px-4 py-3 text-xs font-bold rounded-2xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Copier le code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 max-w-md pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Pour synchroniser un autre appareil (iPhone ou iPad), ouvrez cette fenêtre dessus et saisissez ce code.
              </span>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onDisconnectPairing}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              Dissocier cet appareil (conserve vos traces locales)
            </button>
          </div>
        </div>
      ) : (
        /* Non jumelé : Choix entre générer ou rejoindre */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A : Premier appareil -> Générer code */}
          <div className="bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Option A : C'est mon premier appareil
              </h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mt-2">
                Générez un code unique et sauvegardez automatiquement vos {totalFavorites} trace(s) et vos coins à champignons dans votre coffre sécurisé.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateCode}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Générer mon code</span>
            </button>
          </div>

          {/* Option B : Saisie manuelle du code */}
          <div className="bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Option B : Rejoindre avec un code
              </h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mt-2 mb-3">
                Saisissez le code affiché sur votre premier appareil (ex. <code>LUX-9482</code>) pour fusionner instantanément vos données.
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
              <span>Valider le code</span>
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
