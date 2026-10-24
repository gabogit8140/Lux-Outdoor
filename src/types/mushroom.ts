export interface MushroomSpot {
  id: string;
  name: string;
  variety: string;
  coordinates: [number, number]; // [lat, lng]
  dateAdded: string;
  notes?: string;
  season?: string;
}

export const COMMON_MUSHROOM_VARIETIES = [
  { label: 'Cèpes & Bolets', emoji: '🍄', color: '#b45309' },
  { label: 'Girolles & Chanterelles', emoji: '💛', color: '#d97706' },
  { label: 'Trompettes de la mort', emoji: '🖤', color: '#475569' },
  { label: 'Morilles', emoji: '🤎', color: '#78350f' },
  { label: 'Pieds de mouton', emoji: '🧡', color: '#ea580c' },
  { label: 'Autre variété', emoji: '🌿', color: '#059669' },
] as const;
