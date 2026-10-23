/**
 * Configuration et déclencheurs d'URL schemes pour les applications mobiles tierces
 * (Komoot, Apple Shortcuts, Waze, etc.)
 */

export const MOBILE_SCHEMES = {
  KOMOOT_APP: 'komoot://',
  KOMOOT_WEB_UPLOAD: 'https://www.komoot.com/upload',
  SHORTCUTS_RUN_PREFIX: 'shortcuts://run-shortcut?name=',
  DEFAULT_KOMOOT_SHORTCUT_NAME: 'Importer dans Komoot',
} as const;

/**
 * Construit l'URL native pour exécuter un Raccourci Apple sur iOS
 */
export function buildAppleShortcutUrl(shortcutName: string = MOBILE_SCHEMES.DEFAULT_KOMOOT_SHORTCUT_NAME): string {
  return `${MOBILE_SCHEMES.SHORTCUTS_RUN_PREFIX}${encodeURIComponent(shortcutName)}`;
}

/**
 * Tente d'exécuter un raccourci Apple natif sur iOS
 */
export function launchAppleShortcut(shortcutName: string = MOBILE_SCHEMES.DEFAULT_KOMOOT_SHORTCUT_NAME): void {
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
