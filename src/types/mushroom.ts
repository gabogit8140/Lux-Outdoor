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

/**
 * Détermine si la date correspond à la saison de cueillette des champignons au Luxembourg.
 * - Saison principale d'automne : Août à Novembre (mois 8 à 11)
 * - Période printanière des morilles : Avril à Mai (mois 4 à 5)
 */
export function isMushroomSeasonInLuxembourg(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1; // 1 = Janvier, 12 = Décembre
  return (month >= 8 && month <= 11) || (month >= 4 && month <= 5);
}

export interface KnownMushroomSpot {
  id: string;
  name: string;
  forest: string;
  region: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  varieties: string[];
}

/**
 * Spots et massifs forestiers réputés au Luxembourg pour la découverte mycologique
 * (sources : Groupe de Recherche Mycologique SNL, natur&ëmwelt, parcs naturels).
 */
export const KNOWN_LUXEMBOURG_MUSHROOM_SPOTS: KnownMushroomSpot[] = [
  {
    id: 'reckenerwald',
    name: 'Reckenerwald',
    forest: 'Forêt de Reckange-sur-Mess / Mersch',
    region: 'Centre',
    description: 'Massif de feuillus très réputé accueillant régulièrement des sorties mycologiques d’initiation.',
    coordinates: [49.7542, 6.0955],
    varieties: ['Bolets', 'Girolles', 'Chanterelles'],
  },
  {
    id: 'harebesch',
    name: 'Härebësch',
    forest: 'Massif forestier de Koerich / Habscht',
    region: 'Ouest (Vallée des 7 Châteaux)',
    description: 'Biotopes de chênes et hêtres sur sols humides, propice après les pluies d’automne.',
    coordinates: [49.6738, 5.9520],
    varieties: ['Cèpes de Bordeaux', 'Trompettes de la mort'],
  },
  {
    id: 'mullerthal_ravins',
    name: 'Forêts du Mullerthal',
    forest: 'Forêt domaniale de Berdorf / Consdorf',
    region: 'Petite Suisse Luxembourgeoise',
    description: 'Fonds de vallons humides et sols gréseux (cueillette strictement interdite en réserve intégrale).',
    coordinates: [49.7820, 6.3400],
    varieties: ['Pieds de mouton', 'Girolles', 'Bolets bai'],
  },
  {
    id: 'bambesch',
    name: 'Bambësch',
    forest: 'Forêt municipale de Luxembourg-Ville',
    region: 'Centre',
    description: 'Vaste forêt de hêtres centenaires accessible en lisière de ville, idéale pour les premières cueillettes.',
    coordinates: [49.6385, 6.1085],
    varieties: ['Bolets', 'Coulemelles', 'Lactaires'],
  },
  {
    id: 'eislek_clervaux',
    name: 'Massif de l’Éislek',
    forest: 'Plateau ardennais de Clervaux & Munshausen',
    region: 'Nord (Ardennes luxembourgeoises)',
    description: 'Grands bois mixtes (épicéas et feuillus) offrant un terrain privilégié pour les cèpes.',
    coordinates: [50.0550, 5.9980],
    varieties: ['Cèpes de Bordeaux', 'Lactaires délicieux', 'Chanterelles'],
  },
];

/**
 * Législation officielle grand-ducale sur la cueillette des champignons
 */
export const LUXEMBOURG_MUSHROOM_REGULATIONS = {
  maxPerPersonKg: 1, // 1 kg par personne et par jour
  maxPerGroupKg: 3,  // 3 kg maximum par groupe de 3 personnes et plus
  rules: [
    'Limite légale : 1 kg par personne et par jour (max 3 kg pour un groupe de 3 personnes et plus).',
    'Cueillette formellement interdite dans les réserves naturelles intégrales protégées.',
    'Ne prélevez que les spécimens que vous connaissez à 100% sans aucun doute.',
    'Utilisez un panier en osier ou un sac aéré (interdisez les sacs plastiques).',
  ],
};
