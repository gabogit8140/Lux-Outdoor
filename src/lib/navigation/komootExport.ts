import { generateGPXString, type ElevationPoint } from '../gpx';

export interface KomootExportResult {
  success: boolean;
  method: 'share' | 'desktop_upload' | 'aborted' | 'error';
  message?: string;
}

/**
 * Exporte un parcours GPX directement vers Komoot avec le strict minimum d'actions :
 *
 * - Sur iPhone / iPad / Android : Ouvre la feuille de partage native iOS/Android pré-alimentée
 *   avec le fichier GPX complet. L'utilisateur touche simplement "Komoot" dans la liste des apps,
 *   ce qui importe le tracé immédiatement et le synchronise sur l'Apple Watch en 1 tap.
 *
 * - Sur ordinateur (Desktop) : Télécharge le fichier GPX et ouvre automatiquement la page
 *   d'importation web officielle de Komoot (komoot.com/upload) dans un nouvel onglet.
 */
export async function exportToKomoot(
  title: string,
  coordinates: [number, number][] | [number, number][][],
  elevationProfile?: ElevationPoint[]
): Promise<KomootExportResult> {
  const cleanTitle = title.trim() || 'Circuit Lux Outdoor';
  const gpxContent = generateGPXString(cleanTitle, coordinates, elevationProfile);
  const safeFilename = `${cleanTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.gpx`;

  if (typeof window === 'undefined') {
    return { success: false, method: 'error' };
  }

  // 1. Détection Web Share API Level 2 (Partage natif de fichier sous iOS 15+ / Safari / Android)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const file = new File([blob], safeFilename, {
        type: 'application/gpx+xml',
        lastModified: Date.now(),
      });

      if (navigator.canShare({ files: [file] })) {
        // IMPORTANT pour iOS : Ne JAMAIS passer 'text' ou 'title' avec un fichier GPX.
        // Si 'text' est fourni, iOS filtre les apps de documents (comme Komoot, Garmin, WorkOutDoors)
        // et n'affiche que les messageries (SMS, WhatsApp, Mail).
        await navigator.share({
          files: [file],
        });
        return { success: true, method: 'share' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, method: 'aborted' };
      }
      console.warn('Web Share file failed, switching to desktop download fallback', err);
    }
  }

  // 2. Fallback Desktop : Téléchargement direct + ouverture de la page d'import Komoot
  try {
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);

    // Ouvre la page d'import Komoot officielle
    window.open('https://www.komoot.com/upload', '_blank', 'noopener,noreferrer');
    return { success: true, method: 'desktop_upload' };
  } catch (fallbackErr) {
    console.error('Failed to trigger Komoot export', fallbackErr);
    return {
      success: false,
      method: 'error',
      message: 'Erreur lors de la génération du fichier GPX pour Komoot',
    };
  }
}
