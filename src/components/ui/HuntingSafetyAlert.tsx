import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { HuntingRifleIcon } from './HuntingRifleIcon';
import { getHuntingSafetyInfo } from '../../lib/safety/huntingService';

interface HuntingSafetyAlertProps {
  country?: 'LU' | 'BE' | 'FR' | 'DE' | 'NL';
  coords?: [number, number][];
  regionName?: string;
  isCompact?: boolean;
  showHuntingBattues?: boolean;
  onToggleHuntingBattues?: () => void;
}

export function HuntingSafetyAlert({
  country = 'LU',
  coords,
  regionName,
  isCompact = false,
  showHuntingBattues = false,
  onToggleHuntingBattues,
}: HuntingSafetyAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const info = getHuntingSafetyInfo({ country, coords, regionName });
  const isLuxembourg = country === 'LU';

  return (
    <section className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-2.5 transition-all">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <HuntingRifleIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                Vigilance Chasse & Battues
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  info.isHuntingSeason
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {info.seasonStatus === 'active' ? 'Saison active' : 'Période calme'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
              {isLuxembourg ? (
                <>
                  Dates officielles disponibles sur{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Geoportail.lu
                  </span>
                </>
              ) : country === 'BE' ? (
                <>
                  Fermetures de sentiers sur{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    ChasseOnWeb (SPW)
                  </span>
                </>
              ) : country === 'FR' ? (
                <>
                  Calendriers de chasse sur{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    l'ONF (Forêts domaniales)
                  </span>
                </>
              ) : (
                <>Consignes forestières & battues locales</>
              )}
            </p>
          </div>
        </div>

        {/* Expand / Collapse guidelines toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 p-1 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer shrink-0"
          title={isExpanded ? 'Réduire' : 'Détails & consignes'}
          aria-label="Détails vigilance chasse"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Description contextualized */}
      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
        {info.riskDescription}
      </p>

      {/* Action Buttons: Direct in-app WMS Layer toggle + Official External Geoportail */}
      <div className="pt-1 flex flex-col items-stretch gap-2 min-w-0">
        {isLuxembourg && info.isHuntingSeason && onToggleHuntingBattues && (
          <button
            onClick={onToggleHuntingBattues}
            className={`w-full min-w-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              showHuntingBattues
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-white/90 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
            title="Activer/Désactiver l'affichage direct de la couche WMS des battues (couche 444) sur la carte de l'application"
          >
            <HuntingRifleIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {showHuntingBattues ? 'Battues sur la carte : actives ✓' : 'Afficher les battues sur la carte'}
            </span>
          </button>
        )}

        <a
          href={info.officialMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-w-0 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
          title={info.officialMapLabel}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isLuxembourg ? 'Ouvrir sur Geoportail.lu' : info.officialMapLabel}
          </span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
        </a>

        {info.secondaryPortalUrl && (
          <a
            href={info.secondaryPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-w-0 px-2.5 py-1.5 bg-white/80 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title={info.secondaryPortalLabel}
          >
            <span className="truncate">{info.secondaryPortalLabel}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
          </a>
        )}
      </div>

      {/* Expandable Safety Guidelines & Legal framework */}
      {isExpanded && (
        <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Période de battues :</span>
            <span className="font-normal text-slate-600 dark:text-slate-300 ml-1">
              {info.seasonPeriod}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
              Consignes essentielles de sécurité :
            </span>
            <ul className="space-y-1">
              {info.safetyGuidelines.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-1.5 text-[10px] text-amber-900/90 dark:text-amber-300/90 leading-tight">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
            <span>{info.legalNotice}</span>
          </div>
        </div>
      )}
    </section>
  );
}
