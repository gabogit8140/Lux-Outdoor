import DOMPurify from 'isomorphic-dompurify';

/**
 * Assainit une chaîne HTML ou texte brut provenant d'un fichier GPX utilisateur ou d'un flux externe.
 * Neutralise 100% des attaques XSS (balises <script>, onerror=, javascript:...).
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  });
}

/**
 * Nettoie une chaîne pour ne conserver strictement aucun tag HTML (texte pur sécurisé).
 * Idéal pour les noms de traces, les titres de waypoints et les POI.
 */
export function sanitizePlainText(dirty: string | undefined | null): string {
  if (!dirty) return '';
  const sanitized = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
  return sanitized.trim();
}

/**
 * Assainit les métadonnées d'une trace importée.
 */
export function sanitizeTrackMetadata(meta: {
  title?: string;
  description?: string;
  creator?: string;
}): {
  title: string;
  description: string;
  creator: string;
} {
  return {
    title: sanitizePlainText(meta.title) || 'Trace sans titre',
    description: sanitizeHtml(meta.description) || '',
    creator: sanitizePlainText(meta.creator) || 'Lux Outdoor',
  };
}
