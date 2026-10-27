import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  CheckCheck,
  Copy,
  Check,
  Unlink,
  Cloud,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UserX,
  Users,
  Zap,
} from 'lucide-react';
import type { ConnectedDevice } from '../../lib/sync/deviceIdentity';
import { getDeviceId } from '../../lib/sync/deviceIdentity';

interface FavoritesSyncTabProps {
  pairingCode?: string | null;
  isSyncing?: boolean;
  totalFavorites: number;
  connectedDevices?: ConnectedDevice[];
  onRefuseDevice?: (deviceId: string) => Promise<boolean>;
  onConnectPairingCode?: (code?: string) => Promise<{ success: boolean; message: string }>;
  onDisconnectPairing?: () => void;
}

export function FavoritesSyncTab({
  pairingCode,
  isSyncing,
  totalFavorites,
  connectedDevices = [],
  onRefuseDevice,
  onConnectPairingCode,
  onDisconnectPairing,
}: FavoritesSyncTabProps) {
  const [codeSuffix, setCodeSuffix] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [refusingDeviceId, setRefusingDeviceId] = useState<string | null>(null);

  const currentDeviceId = getDeviceId();

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoinCode = async () => {
    const cleanSuffix = codeSuffix.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanSuffix || !onConnectPairingCode) return;

    // Construction stricte du code avec préfixe obligatoire LUX-
    const fullCode = `LUX-${cleanSuffix}`;
    const res = await onConnectPairingCode(fullCode);
    setSyncFeedback(res.message);
    if (res.success) {
      setCodeSuffix('');
    }
  };

  const handleGenerateCode = async () => {
    if (!onConnectPairingCode) return;
    const res = await onConnectPairingCode();
    setSyncFeedback(res.message);
  };

  const handleRefuseDevice = async (device: ConnectedDevice) => {
    if (!onRefuseDevice) return;
    const confirmRefusal = window.confirm(
      `Voulez-vous vraiment refuser et couper la synchronisation pour "${device.name}" ?`
    );
    if (!confirmRefusal) return;

    setRefusingDeviceId(device.id);
    const success = await onRefuseDevice(device.id);
    setRefusingDeviceId(null);

    if (success) {
      setSyncFeedback(`Accès révoqué pour l'appareil "${device.name}". Sa synchronisation est coupée.`);
    } else {
      setSyncFeedback(`Impossible de refuser cet appareil.`);
    }
  };

  const allowedDevices = connectedDevices.filter((d) => d.status !== 'blocked');
  const blockedDevices = connectedDevices.filter((d) => d.status === 'blocked');

  return (
    <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
      {/* Bannière explicative */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-start gap-3">
        <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
            Synchronisation sécurisée LUX-
          </h3>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
            Synchronisez vos circuits classés (Top, Bien, À éviter) et vos coins à champignons entre votre iPhone, iPad et ordinateur via votre code unique au format <span className="font-mono font-bold">LUX-XXXX</span>.
          </p>
        </div>
      </div>

      {pairingCode ? (
        /* Coffre jumelé */
        <div className="space-y-4">
          {/* Carte Principale du Code */}
          <div className="bg-white dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCheck className="w-5 h-5" />
                <span>Synchronisation active</span>
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
                <span>Votre code de jumelage :</span>
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
                  Pour connecter votre iPhone ou iPad, saisissez ce code sur votre second appareil.
                </span>
              </div>
            </div>

            {/* Indicateur Éco-Énergie & Déconnexion */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-stone-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pause éco-batterie automatique après 3 min d&apos;inactivité</span>
              </div>

              <button
                type="button"
                onClick={onDisconnectPairing}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                Dissocier cet appareil
              </button>
            </div>
          </div>

          {/* Section Gestion & Contrôle des Connexions LUX- */}
          <div className="bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Appareils connectés ({allowedDevices.length})
                </h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {allowedDevices.length > 1 ? `${allowedDevices.length} instances synchronisées` : '1 instance active'}
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
              Consultez les appareils synchronisés à ce code. Vous pouvez refuser l&apos;accès à tout moment pour bloquer un appareil et stopper sa synchronisation.
            </p>

            {/* Liste des appareils */}
            <div className="space-y-2 pt-1">
              {allowedDevices.map((device) => {
                const isCurrent = device.id === currentDeviceId;
                const isRefusing = refusingDeviceId === device.id;

                return (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-stone-200 dark:border-slate-700 shadow-2xs">
                        {device.deviceType === 'tablet' ? (
                          <Tablet className="w-4 h-4 text-indigo-600" />
                        ) : device.deviceType === 'phone' ? (
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Laptop className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                            {device.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white shrink-0">
                              Cet appareil
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400 dark:text-slate-500 block truncate">
                          {isCurrent ? 'Session active locale' : 'Connecté au coffre'}
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={isRefusing}
                        onClick={() => handleRefuseDevice(device)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Refuser et déconnecter cet appareil"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{isRefusing ? 'Refus...' : 'Refuser l’accès'}</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Appareils bloqués */}
              {blockedDevices.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    Appareils refusés ({blockedDevices.length})
                  </span>
                  <div className="space-y-1.5 mt-1.5">
                    {blockedDevices.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span className="font-semibold">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600">Bloqué</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                Option A : C&apos;est mon premier appareil
              </h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mt-2">
                Générez un code officiel LUX- et sauvegardez automatiquement vos {totalFavorites} trace(s) et vos coins à champignons dans votre coffre Cloud.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateCode}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Générer mon code LUX-</span>
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
                Saisissez le code affiché sur votre premier appareil. Le préfixe obligatoire <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">LUX-</span> est pré-renseigné.
              </p>

              {/* Champ avec préfixe LUX- forcé */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400 select-none">
                  LUX-
                </span>
                <input
                  type="text"
                  value={codeSuffix}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/\s+/g, '');
                    if (val.startsWith('LUX-')) val = val.slice(4);
                    else if (val.startsWith('LUX')) val = val.slice(3);
                    setCodeSuffix(val.replace(/[^A-Z0-9]/g, ''));
                  }}
                  placeholder="9482 ou ABCD"
                  maxLength={6}
                  className="w-full pl-14 pr-3 py-2.5 text-xs font-mono uppercase bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-stone-900 dark:text-stone-100 font-bold tracking-wider"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={codeSuffix.trim().length < 3}
              onClick={handleJoinCode}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Valider le code LUX-{codeSuffix || '...'}</span>
            </button>
          </div>
        </div>
      )}

      {syncFeedback && (
        <p className="text-xs font-semibold text-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
          {syncFeedback}
        </p>
      )}
    </div>
  );
}
