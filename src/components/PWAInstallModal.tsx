import React from 'react';
import { X, Share, PlusSquare, CheckCircle2, Download } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onInstall: () => void;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  onInstall,
}: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-100 dark:border-slate-800 flex flex-col p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Installer l'application
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Lux Outdoor sur votre écran d'accueil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs text-stone-700">
          {/* iOS Safari Guide */}
          {isIOS ? (
            <div className="space-y-3.5">
              <p className="text-stone-600 leading-relaxed font-medium">
                Sur iPhone & iPad (Safari), vous pouvez installer Lux Outdoor comme une vraie application native sans passer par l'App Store :
              </p>

              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      Touchez Partager <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      En bas de l'écran Safari (le carré avec la flèche vers le haut).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      "Sur l'écran d'accueil" <PlusSquare className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Faites défiler le menu d'actions vers le bas et touchez cette option.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      Touchez "Ajouter"
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      En haut à droite de l'écran de confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  L'icône verte apparaîtra sur votre iPhone et s'ouvrira en plein écran hors-ligne !
                </span>
              </div>
            </div>
          ) : isInstallable ? (
            /* Android / Chrome Native Flow */
            <div className="space-y-4 text-center py-2">
              <p className="text-stone-600">
                Installez l'application en un clic pour l'utiliser en plein écran avec accès hors-ligne rapide.
              </p>
              <button
                onClick={() => {
                  onInstall();
                  onClose();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Installer l'application
              </button>
            </div>
          ) : (
            /* Other browsers instructions */
            <div className="space-y-3">
              <p className="text-stone-600">
                Pour ajouter l'application sur votre écran d'accueil, utilisez le menu de votre navigateur (trois points ou menu Partager) et sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
