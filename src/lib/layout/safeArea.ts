/**
 * Constantes de positionnement sécurisées pour les zones d'écran protégées (Safe Area).
 * Conçu spécifiquement pour dégager les encoches et la Dynamic Island sur iPhone tout en garantissant
 * un affichage réactif et harmonieux sur iPad, Android et ordinateurs de bureau.
 */

/** Décalage supérieur unifié pour dégager la Dynamic Island et le flou translucide iOS */
export const SAFE_AREA_TOP_BAR = 'calc(env(safe-area-inset-top, 0px) + 1.4rem)';

/** Décalage pour les fenêtres popovers déroulantes s'ouvrant sous la barre de filtres */
export const SAFE_AREA_TOP_POPOVER = 'calc(env(safe-area-inset-top, 0px) + 5rem)';

/** Décalage pour le bandeau secondaire flottant « Explorer cette zone » */
export const SAFE_AREA_SEARCH_BANNER = 'calc(env(safe-area-inset-top, 0px) + 7.2rem)';

/** Décalage latéral gauche pour le dock de commande */
export const SAFE_AREA_LEFT_DOCK = 'calc(env(safe-area-inset-left, 0px) + 0.65rem)';

/** Décalage latéral droit pour les commandes cartographiques */
export const SAFE_AREA_RIGHT_DOCK = 'calc(env(safe-area-inset-right, 0px) + 0.65rem)';

/** Décalage inférieur pour le bandeau cockpit et les docks d'action de bas d'écran */
export const SAFE_AREA_BOTTOM_DOCK = 'calc(env(safe-area-inset-bottom, 0px) + 0.65rem)';
