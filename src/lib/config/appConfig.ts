/**
 * Configuration centrale et source de vérité de l'application Lux Outdoor.
 * Évite la duplication de chaînes magiques à travers les composants, hooks et services.
 */

export const APP_CONFIG = {
  name: 'Lux Outdoor',
  shortName: 'Lux Outdoor',
  version: '1.0.0',
  description: "Tracés GPX, randonnée et vélo au Luxembourg et Grande Région. Guidage GPS hors-ligne.",
  creatorTag: 'Lux Outdoor',
  gpxCatalogCreator: 'Lux Outdoor - Greater Region Official GPX',
} as const;

export const APP_STORAGE_KEYS = {
  favorites: 'luxoutdoor-favorites',
  legacyFavorites: 'traceoutdoor-favorites',
  githubConfig: 'lux_outdoor_github_config',
  legacyGithubConfig: 'trace_outdoor_github_config',
} as const;
