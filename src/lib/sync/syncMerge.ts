/**
 * Utilitaires modulaires de fusion pour la synchronisation Cloud multi-appareils.
 * Assure une fusion sans perte et dédupliquée des collections (favoris, spots champignons).
 */

export function mergeItemsById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  local.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  remote.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}
