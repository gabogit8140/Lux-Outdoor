/**
 * Configuration et déclencheurs d'URL schemes pour les applications mobiles tierces
 * (Komoot, Apple Shortcuts, Waze, etc.)
 */

import { generateGPXString, downloadGPX, type ElevationPoint } from '../gpx';

export const MOBILE_SCHEMES = {
  KOMOOT_APP: 'komoot://',
  KOMOOT_WEB_UPLOAD: 'https://www.komoot.com/upload',
  SHORTCUTS_RUN_PREFIX: 'shortcuts://run-shortcut?name=',
  DEFAULT_KOMOOT_SHORTCUT_NAME: 'GPX vers Komoot',
} as const;

/**
 * Construit l'URL native pour exécuter un Raccourci Apple sur iOS
 */
export function buildAppleShortcutUrl(
  shortcutName: string = MOBILE_SCHEMES.DEFAULT_KOMOOT_SHORTCUT_NAME
): string {
  return `${MOBILE_SCHEMES.SHORTCUTS_RUN_PREFIX}${encodeURIComponent(shortcutName)}`;
}

/**
 * Tente d'exécuter un raccourci Apple natif sur iOS
 */
export function launchAppleShortcut(
  shortcutName: string = MOBILE_SCHEMES.DEFAULT_KOMOOT_SHORTCUT_NAME
): void {
  if (typeof window === 'undefined') return;
  window.location.href = buildAppleShortcutUrl(shortcutName);
}

/**
 * Ouvre l'application Komoot via son URL scheme natif
 */
export function launchKomootApp(): void {
  if (typeof window === 'undefined') return;
  window.location.href = MOBILE_SCHEMES.KOMOOT_APP;
}

/**
 * Ouvre la page web officielle d'importation Komoot
 */
export function openKomootWebUpload(): void {
  if (typeof window === 'undefined') return;
  window.open(MOBILE_SCHEMES.KOMOOT_WEB_UPLOAD, '_blank', 'noopener,noreferrer');
}

/**
 * Exporte le circuit en 1 seul clic sans aucune modale :
 * 1. Sur mobile / tablette (iOS / Android) : Partage direct natif via Web Share API avec le fichier GPX en mémoire vive.
 *    -> Ouvre directement la feuille de partage système iOS avec Komoot et le raccourci Apple
 *    -> Zéro enregistrement manuel dans « Téléchargements » requis !
 * 2. Sur ordinateur de bureau ou si le partage n'est pas supporté : Téléchargement direct du fichier .gpx
 */
export async function exportGpxDirect(
  title: string,
  coordinates: [number, number][] | [number, number][][],
  elevationProfile?: ElevationPoint[],
  shortcutName: string = MOBILE_SCHEMES.DEFAULT_KOMOOT_SHORTCUT_NAME
): Promise<void> {
  const gpxString = generateGPXString(title, coordinates, elevationProfile);
  const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${cleanTitle}.gpx`;

  // 1. Sur iPhone / iPad / Android : Partage direct du fichier GPX en mémoire (évite l'étape Téléchargements)
  if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare) {
      try {
        const file = new File([gpxString], fileName, {
          type: 'application/gpx+xml',
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: title,
            files: [file],
          });
          return; // Partage direct réussi : Komoot ou le Raccourci s'ouvre sans passer par Téléchargements
        }
      } catch (err: any) {
        if (err && err.name === 'AbortError') {
          // L'utilisateur a simplement fermé la feuille de partage
          return;
        }
        console.warn('Partage natif du fichier GPX indisponible, bascule sur le téléchargement classique:', err);
      }
    }
  }

  // 2. Mode classique (Desktop ou navigateur sans Web Share File) : Téléchargement du fichier GPX
  downloadGPX(title, coordinates, elevationProfile);

  // 3. Fallback iOS si le Web Share n'était pas supporté par le navigateur
  if (typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    setTimeout(() => {
      launchAppleShortcut(shortcutName);
    }, 450);
  }
}
