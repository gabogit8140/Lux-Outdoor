/**
 * Constantes et tokens de dimensionnement ergonomique pour interfaces tactiles (iPad, iPhone, Android).
 * Conforme aux directives Apple Human Interface Guidelines (44x44pt recommandé, 40px min)
 * et Google Material Design Touch Targets (48x48dp recommandé).
 */

/** Largeur minimale de la cible d'impact invisible sur les tracés GPX (au doigt) */
export const TOUCH_POLYLINE_HIT_WEIGHT = 32;

/** Classes CSS de base pour tous les boutons d'action cartographiques flottants */
export const TOUCH_MAP_BUTTON_CLASS =
  'w-10 h-10 rounded-2xl shadow-lg backdrop-blur-xl flex items-center justify-center transition-all border cursor-pointer select-none touch-manipulation';

/** Classes CSS de base pour les boutons de dock de commande */
export const TOUCH_DOCK_BUTTON_CLASS =
  'w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation';
