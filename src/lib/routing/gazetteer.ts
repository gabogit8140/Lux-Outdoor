export interface RegionalZone {
  id: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  name: string;
  flag: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const REGIONAL_ZONES: RegionalZone[] = [
  { id: 'ALL', name: 'Luxembourg & Alentours (200 km)', flag: '🇱🇺', center: [6.13, 49.78], zoom: 9 },
  { id: 'LU', name: 'Luxembourg', flag: '🇱🇺', center: [6.13, 49.78], zoom: 10 },
  { id: 'BE', name: 'Ardennes & Gaume (Belgique)', flag: '🇧🇪', center: [5.7890, 50.1320], zoom: 9 },
  { id: 'DE', name: 'Eifel & Mosel (Allemagne)', flag: '🇩🇪', center: [6.6420, 49.7580], zoom: 9 },
  { id: 'NL', name: 'Zuid-Limburg (Pays-Bas)', flag: '🇳🇱', center: [5.8650, 50.8250], zoom: 10 },
  { id: 'FR', name: 'Lorraine & Vosges (France)', flag: '🇫🇷', center: [6.1757, 49.2500], zoom: 9 },
];

export type PlaceCategory = 'city' | 'poi' | 'nature' | 'castle' | 'viewpoint' | 'heritage' | 'lake';

export interface PlaceEntry {
  key: string;
  name: string;
  country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  region: string;
  coords: [number, number]; // [lon, lat]
  category?: PlaceCategory;
  categoryLabel?: string;
  description?: string;
  url?: string;
  urlLabel?: string;
  aliases?: string[];
}
export const GAZETTEER: PlaceEntry[] = [
  {
    "key": "vianden-chateau",
    "name": "Château de Vianden",
    "country": "LU",
    "region": "Vallée de l’Our (Éislek)",
    "coords": [
      6.2028,
      49.9353
    ],
    "category": "castle",
    "categoryLabel": "Château fort féodal",
    "description": "L’un des plus majestueux châteaux forts d’Europe, perché sur un promontoire rocheux dominant l’Our.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-vianden",
    "urlLabel": "Fiche Officielle Château de Vianden"
  },
  {
    "key": "bourscheid-chateau",
    "name": "Château de Bourscheid",
    "country": "LU",
    "region": "Haute-Sûre / Ardennes",
    "coords": [
      6.0792,
      49.9056
    ],
    "category": "castle",
    "categoryLabel": "Château fort médiéval",
    "description": "Imposante forteresse médiévale ceinturée de 11 tours dominant la boucle de la Sûre à 150 mètres de haut.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-bourscheid",
    "urlLabel": "Fiche Officielle Château de Bourscheid"
  },
  {
    "key": "beaufort-chateaux",
    "name": "Châteaux de Beaufort (Médiéval & Renaissance)",
    "country": "LU",
    "region": "Petite Suisse / Mullerthal",
    "coords": [
      6.2869,
      49.8336
    ],
    "category": "castle",
    "categoryLabel": "Châteaux & Ruines",
    "description": "Ruines romantiques du château médiéval du XIe siècle bordées d’un étang et château Renaissance meublé.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-beaufort",
    "urlLabel": "Guide Officiel Châteaux de Beaufort"
  },
  {
    "key": "larochette-chateau",
    "name": "Château de Larochette",
    "country": "LU",
    "region": "Vallée de l’Ernz Blanche",
    "coords": [
      6.2208,
      49.7847
    ],
    "category": "castle",
    "categoryLabel": "Forteresse médiévale",
    "description": "Forteresse perchée sur un éperon de grès dominant le bourg médiéval de Larochette.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-larochette",
    "urlLabel": "Guide Officiel Château de Larochette"
  },
  {
    "key": "clervaux-chateau",
    "name": "Château de Clervaux & The Family of Man",
    "country": "LU",
    "region": "Ardennes luxembourgeoises (Éislek)",
    "coords": [
      6.0289,
      50.0544
    ],
    "category": "castle",
    "categoryLabel": "Château & Patrimoine UNESCO",
    "description": "Château féodal du XIIe siècle abritant la célèbre collection photo UNESCO d’Edward Steichen.",
    "url": "https://www.clervauximage.lu/the-family-of-man",
    "urlLabel": "Château & The Family of Man"
  },
  {
    "key": "vallee-sept-chateaux",
    "name": "Vallée des Sept Châteaux (Guttland)",
    "country": "LU",
    "region": "Vallée de l’Eisch (Guttland)",
    "coords": [
      6.0417,
      49.6972
    ],
    "category": "castle",
    "categoryLabel": "Circuit des Châteaux",
    "description": "Vallée verdoyante de l’Eisch jalonnée de 7 forteresses féodales (Mersch, Schoenfels, Hollenfels, Ansembourg, Septfontaines, Koerich)."
  },
  {
    "key": "casemates-bock",
    "name": "Casemates du Bock & UNESCO Luxembourg",
    "country": "LU",
    "region": "Vieille Ville de Luxembourg",
    "coords": [
      6.1364,
      49.6111
    ],
    "category": "heritage",
    "categoryLabel": "Forteresse & Patrimoine UNESCO",
    "description": "Réseau souterrain de défense militaire taillé dans la roche de la falaise du Bock, classé UNESCO.",
    "url": "https://www.visitluxembourg.com/fr/attraction/casemates-du-bock",
    "urlLabel": "Fiche Officielle Casemates du Bock"
  },
  {
    "key": "schiessentuempel-cascade",
    "name": "Cascade du Schiessentümpel",
    "country": "LU",
    "region": "Petite Suisse / Mullerthal Trail",
    "coords": [
      6.2872,
      49.7892
    ],
    "category": "lake",
    "categoryLabel": "Cascade pittoresque",
    "description": "Pont romantique en pierre enjambant les trois cascades de l’Ernz Noire, emblème du Mullerthal.",
    "url": "https://www.mullerthal.lu/place/schiessentumpel-waterfalls",
    "urlLabel": "Guide Officiel Cascade du Schiessentümpel"
  },
  {
    "key": "wolfsschlucht-echternach",
    "name": "Gorges de la Wolfsschlucht (Gorge du Loup)",
    "country": "LU",
    "region": "Mullerthal Trail Route 2",
    "coords": [
      6.4089,
      49.8167
    ],
    "category": "nature",
    "categoryLabel": "Canyon de grès spectaculaire",
    "description": "Canyon de grès impressionnant aux parois vertigineuses de 50 mètres de haut sculptées par l’érosion."
  },
  {
    "key": "kuelscheier-consdorf",
    "name": "Labyrinthe rocheux de Kuelscheier",
    "country": "LU",
    "region": "Mullerthal / Consdorf",
    "coords": [
      6.3533,
      49.7878
    ],
    "category": "nature",
    "categoryLabel": "Fissure rocheuse sombre",
    "description": "Faille rocheuse étroite et sombre de 100 mètres de long à traverser à la lampe de poche."
  },
  {
    "key": "hohllay-berdorf",
    "name": "Grotte Hohllay & Amphithéâtre de Berdorf",
    "country": "LU",
    "region": "Mullerthal / Berdorf",
    "coords": [
      6.3542,
      49.8197
    ],
    "category": "nature",
    "categoryLabel": "Grotte taillée & Théâtre de verdure",
    "description": "Vaste caverne de grès d’où étaient extraites les meules de moulin depuis l’époque romaine."
  },
  {
    "key": "lac-haute-sure-burfelt",
    "name": "Lac de la Haute-Sûre & Belvédère de Burfelt",
    "country": "LU",
    "region": "Parc Naturel de la Haute-Sûre",
    "coords": [
      5.875,
      49.9056
    ],
    "category": "lake",
    "categoryLabel": "Grand lac & Belvédère panoramique",
    "description": "Plus grand plan d’eau du Luxembourg avec passerelle panoramique suspendue à 70 m au-dessus des eaux.",
    "url": "https://www.visit-eislek.lu/fr/stausei",
    "urlLabel": "Guide Officiel Lac de la Haute-Sûre"
  },
  {
    "key": "fond-de-gras-minett",
    "name": "Minett Park Fond-de-Gras & Train 1900",
    "country": "LU",
    "region": "Terres Rouges (Minett UNESCO)",
    "coords": [
      5.8611,
      49.5347
    ],
    "category": "heritage",
    "categoryLabel": "Patrimoine minier & Train à vapeur",
    "description": "Vallée industrielle historique avec train à vapeur 1900, train minier Minièresbunn et galeries souterraines.",
    "url": "https://minettpark.lu/?lang=fr",
    "urlLabel": "Minett Park & Train 1900"
  },
  {
    "key": "belval-hauts-fourneaux",
    "name": "Hauts Fourneaux de Belval",
    "country": "LU",
    "region": "Esch-Belval / Terres Rouges",
    "coords": [
      5.9525,
      49.5008
    ],
    "category": "heritage",
    "categoryLabel": "Patrimoine sidérurgique",
    "description": "Ascension sur les passerelles des anciens géants d’acier à 40 m de haut avec vue à 360° sur le sud.",
    "url": "https://www.fonds-belval.lu/index.php?lang=fr&page=1&sub=1",
    "urlLabel": "Visite des Hauts Fourneaux de Belval"
  },
  {
    "key": "haard-dudelange",
    "name": "Réserve Naturelle de la Haard",
    "country": "LU",
    "region": "Terres Rouges (Dudelange)",
    "coords": [
      6.075,
      49.4694
    ],
    "category": "nature",
    "categoryLabel": "Réserve naturelle UNESCO Biosphère",
    "description": "Ancien bassin minier à ciel ouvert reconquis par la nature avec falaises de minerai rouge et orchidées sauvages."
  },
  {
    "key": "haff-reimech-schengen",
    "name": "Réserve Naturelle Haff Réimech & Biodiversum",
    "country": "LU",
    "region": "Remerschen / Vallée de la Moselle",
    "coords": [
      6.36,
      49.5042
    ],
    "category": "nature",
    "categoryLabel": "Zone humide & Réserve ornithologique",
    "description": "Plus importante zone humide du Grand-Duché, paradis des oiseaux migrateurs avec sentiers sur pilotis.",
    "url": "https://naturemwelt.lu/",
    "urlLabel": "Site officiel Biodiversum"
  },
  {
    "key": "abbaye-echternach",
    "name": "Basilique & Abbaye Saint-Willibrord d’Echternach",
    "country": "LU",
    "region": "Echternach / Vallée de la Sûre",
    "coords": [
      6.4214,
      49.8131
    ],
    "category": "heritage",
    "categoryLabel": "Basilique & Abbaye historique",
    "description": "Berceau de la plus ancienne ville du Luxembourg, célèbre pour sa crypte du VIIIe siècle et sa Procession Dansante UNESCO."
  },
  {
    "key": "ascenseur-pfaffenthal",
    "name": "Ascenseur panoramique du Pfaffenthal",
    "country": "LU",
    "region": "Luxembourg-Ville (Vallée de l’Alzette)",
    "coords": [
      6.1328,
      49.615
    ],
    "category": "viewpoint",
    "categoryLabel": "Belvédère en verre suspendu",
    "description": "Cabine de verre suspendue reliant la Ville Haute au quartier historique du Pfaffenthal à 60 m du sol.",
    "url": "https://www.luxembourg-city.com/fr/adresse/poi/ascenseur-panoramique-du-pfaffenthal",
    "urlLabel": "Fiche Ville de Luxembourg"
  },
  {
    "key": "americancemetery-hamm",
    "name": "Cimetière Militaire Américain de Hamm",
    "country": "LU",
    "region": "Hamm / Luxembourg-Est",
    "coords": [
      6.1858,
      49.6128
    ],
    "category": "heritage",
    "categoryLabel": "Mémorial Bataille des Ardennes",
    "description": "Lieu de sépulture émouvant de plus de 5 000 soldats alliés dont le Général George S. Patton.",
    "url": "https://www.abmc.gov/Luxembourg",
    "urlLabel": "Site American Battle Monuments"
  },
  {
    "key": "luxembourg",
    "name": "Luxembourg-Ville",
    "country": "LU",
    "region": "Capitale / Alzette & Pétrusse",
    "coords": [
      6.1319,
      49.6116
    ],
    "category": "city",
    "categoryLabel": "Capitale & Forteresse UNESCO",
    "url": "https://www.vdl.lu/fr",
    "urlLabel": "Ville de Luxembourg (Site Officiel)"
  },
  {
    "key": "echternach",
    "name": "Echternach",
    "country": "LU",
    "region": "Petite Suisse / Sûre",
    "coords": [
      6.418,
      49.812
    ],
    "category": "city",
    "categoryLabel": "Cité abbatiale historique",
    "url": "https://echternach.lu/",
    "urlLabel": "Ville d’Echternach (Site Officiel)"
  },
  {
    "key": "vianden",
    "name": "Vianden",
    "country": "LU",
    "region": "Vallée de l’Our",
    "coords": [
      6.208,
      49.934
    ],
    "category": "city",
    "categoryLabel": "Cité médiévale de l’Our",
    "url": "https://vianden.lu/",
    "urlLabel": "Ville de Vianden (Site Officiel)"
  },
  {
    "key": "clervaux",
    "name": "Clervaux",
    "country": "LU",
    "region": "Ardennes luxembourgeoises (Éislek)",
    "coords": [
      6.03,
      50.054
    ],
    "category": "city",
    "categoryLabel": "Cité ardennaise",
    "url": "https://clervaux.lu/",
    "urlLabel": "Commune de Clervaux (Site Officiel)"
  },
  {
    "key": "esch-sur-alzette",
    "name": "Esch-sur-Alzette",
    "country": "LU",
    "region": "Terres Rouges (Minett)",
    "coords": [
      5.981,
      49.496
    ],
    "category": "city",
    "categoryLabel": "Métropole du Sud",
    "url": "https://esch.lu/",
    "urlLabel": "Ville d’Esch-sur-Alzette (Site Officiel)"
  },
  {
    "key": "differdange",
    "name": "Differdange",
    "country": "LU",
    "region": "Terres Rouges (Minett)",
    "coords": [
      5.891,
      49.524
    ],
    "category": "city",
    "categoryLabel": "Cité du Fer & Fond-de-Gras",
    "url": "https://differdange.lu/",
    "urlLabel": "Ville de Differdange (Site Officiel)"
  },
  {
    "key": "dudelange",
    "name": "Dudelange",
    "country": "LU",
    "region": "Haard / Terres Rouges",
    "coords": [
      6.084,
      49.48
    ],
    "category": "city",
    "categoryLabel": "Cité de la Forge",
    "url": "https://www.dudelange.lu/",
    "urlLabel": "Ville de Dudelange (Site Officiel)"
  },
  {
    "key": "petange",
    "name": "Pétange",
    "country": "LU",
    "region": "3 Frontières / Fond-de-Gras",
    "coords": [
      5.875,
      49.5583
    ],
    "category": "city",
    "categoryLabel": "Commune des 3 Frontières"
  },
  {
    "key": "sanem",
    "name": "Sanem",
    "country": "LU",
    "region": "Terres Rouges / Belval",
    "coords": [
      5.9306,
      49.5472
    ],
    "category": "city"
  },
  {
    "key": "bettembourg",
    "name": "Bettembourg",
    "country": "LU",
    "region": "Canton Esch",
    "coords": [
      6.1028,
      49.5186
    ],
    "category": "city"
  },
  {
    "key": "schifflange",
    "name": "Schifflange",
    "country": "LU",
    "region": "Terres Rouges",
    "coords": [
      6.0125,
      49.5069
    ],
    "category": "city"
  },
  {
    "key": "hesperange",
    "name": "Hesperange",
    "country": "LU",
    "region": "Banlieue Sud / Alzette",
    "coords": [
      6.1528,
      49.5728
    ],
    "category": "city"
  },
  {
    "key": "strassen",
    "name": "Strassen",
    "country": "LU",
    "region": "Banlieue Ouest",
    "coords": [
      6.0667,
      49.6206
    ],
    "category": "city"
  },
  {
    "key": "bertrange",
    "name": "Bertrange",
    "country": "LU",
    "region": "Canton Luxembourg",
    "coords": [
      6.05,
      49.6111
    ],
    "category": "city"
  },
  {
    "key": "mamer",
    "name": "Mamer",
    "country": "LU",
    "region": "Vallée de la Mamer",
    "coords": [
      6.024,
      49.628
    ],
    "category": "city"
  },
  {
    "key": "walferdange",
    "name": "Walferdange",
    "country": "LU",
    "region": "Vallée de l’Alzette",
    "coords": [
      6.1333,
      49.6606
    ],
    "category": "city"
  },
  {
    "key": "steinsel",
    "name": "Steinsel",
    "country": "LU",
    "region": "Vallée de l’Alzette",
    "coords": [
      6.1236,
      49.6769
    ],
    "category": "city"
  },
  {
    "key": "niederanven",
    "name": "Niederanven",
    "country": "LU",
    "region": "Plateau Grünewald",
    "coords": [
      6.2625,
      49.6517
    ],
    "category": "city"
  },
  {
    "key": "sandweiler",
    "name": "Sandweiler",
    "country": "LU",
    "region": "Canton Luxembourg",
    "coords": [
      6.2181,
      49.6167
    ],
    "category": "city"
  },
  {
    "key": "contern",
    "name": "Contern",
    "country": "LU",
    "region": "Canton Luxembourg",
    "coords": [
      6.2272,
      49.5847
    ],
    "category": "city"
  },
  {
    "key": "schuttrange",
    "name": "Schuttrange",
    "country": "LU",
    "region": "Vallée de la Syr",
    "coords": [
      6.2694,
      49.6208
    ],
    "category": "city"
  },
  {
    "key": "roeser",
    "name": "Roeser",
    "country": "LU",
    "region": "Canton Esch",
    "coords": [
      6.1444,
      49.5375
    ],
    "category": "city"
  },
  {
    "key": "kayl",
    "name": "Kayl / Tétange",
    "country": "LU",
    "region": "Terres Rouges",
    "coords": [
      6.0389,
      49.4917
    ],
    "category": "city"
  },
  {
    "key": "rumelange",
    "name": "Rumelange",
    "country": "LU",
    "region": "Terres Rouges / Mines",
    "coords": [
      6.0306,
      49.4611
    ],
    "category": "city",
    "categoryLabel": "Musée National des Mines"
  },
  {
    "key": "mondercange",
    "name": "Mondercange",
    "country": "LU",
    "region": "Canton Esch",
    "coords": [
      5.9889,
      49.5333
    ],
    "category": "city"
  },
  {
    "key": "kaerjeng",
    "name": "Käerjeng (Bascharage)",
    "country": "LU",
    "region": "Canton Capellen",
    "coords": [
      5.9083,
      49.5667
    ],
    "category": "city"
  },
  {
    "key": "steinfort",
    "name": "Steinfort",
    "country": "LU",
    "region": "Vallée de l’Eisch",
    "coords": [
      5.915,
      49.66
    ],
    "category": "city"
  },
  {
    "key": "kehlen",
    "name": "Kehlen",
    "country": "LU",
    "region": "Canton Capellen",
    "coords": [
      6.0333,
      49.6694
    ],
    "category": "city"
  },
  {
    "key": "kopstal",
    "name": "Kopstal / Bridel",
    "country": "LU",
    "region": "Vallée de la Mamer",
    "coords": [
      6.0722,
      49.6653
    ],
    "category": "city"
  },
  {
    "key": "koerich",
    "name": "Koerich",
    "country": "LU",
    "region": "Vallée des 7 Châteaux",
    "coords": [
      5.95,
      49.6694
    ],
    "category": "city"
  },
  {
    "key": "habscht",
    "name": "Habscht (Hobscheid)",
    "country": "LU",
    "region": "Vallée de l’Eisch",
    "coords": [
      5.9167,
      49.6833
    ],
    "category": "city"
  },
  {
    "key": "garnich",
    "name": "Garnich",
    "country": "LU",
    "region": "Canton Capellen",
    "coords": [
      5.95,
      49.6167
    ],
    "category": "city"
  },
  {
    "key": "dippach",
    "name": "Dippach / Schouweiler",
    "country": "LU",
    "region": "Canton Capellen",
    "coords": [
      5.9833,
      49.5833
    ],
    "category": "city"
  },
  {
    "key": "reckange-mess",
    "name": "Reckange-sur-Mess",
    "country": "LU",
    "region": "Vallée de la Mess",
    "coords": [
      6.0083,
      49.5639
    ],
    "category": "city"
  },
  {
    "key": "leudelange",
    "name": "Leudelange",
    "country": "LU",
    "region": "Canton Esch",
    "coords": [
      6.0639,
      49.5681
    ],
    "category": "city"
  },
  {
    "key": "weiler-la-tour",
    "name": "Weiler-la-Tour",
    "country": "LU",
    "region": "Canton Luxembourg",
    "coords": [
      6.2,
      49.5417
    ],
    "category": "city"
  },
  {
    "key": "frisange",
    "name": "Frisange",
    "country": "LU",
    "region": "Frontière Lorraine",
    "coords": [
      6.1889,
      49.5167
    ],
    "category": "city"
  },
  {
    "key": "mondorf",
    "name": "Mondorf-les-Bains",
    "country": "LU",
    "region": "Domaine Thermal",
    "coords": [
      6.281,
      49.504
    ],
    "category": "city",
    "categoryLabel": "Station thermale"
  },
  {
    "key": "dalheim",
    "name": "Dalheim (Ricciacus)",
    "country": "LU",
    "region": "Canton Remich",
    "coords": [
      6.2583,
      49.5417
    ],
    "category": "city",
    "categoryLabel": "Théâtre gallo-romain"
  },
  {
    "key": "bous-waldbredimus",
    "name": "Bous-Waldbredimus",
    "country": "LU",
    "region": "Canton Remich",
    "coords": [
      6.3278,
      49.5556
    ],
    "category": "city"
  },
  {
    "key": "remich",
    "name": "Remich",
    "country": "LU",
    "region": "Perle de la Moselle",
    "coords": [
      6.368,
      49.544
    ],
    "category": "city",
    "categoryLabel": "Porte de la Moselle",
    "url": "https://remich.lu/",
    "urlLabel": "Ville de Remich (Site Officiel)"
  },
  {
    "key": "stadtbredimus",
    "name": "Stadtbredimus",
    "country": "LU",
    "region": "Vignobles de Moselle",
    "coords": [
      6.3639,
      49.5639
    ],
    "category": "city"
  },
  {
    "key": "schengen",
    "name": "Schengen",
    "country": "LU",
    "region": "3 Frontières / Moselle",
    "coords": [
      6.365,
      49.471
    ],
    "category": "city",
    "categoryLabel": "Symbole européen de la libre circulation"
  },
  {
    "key": "wormeldange",
    "name": "Wormeldange",
    "country": "LU",
    "region": "Coteaux Moselle / Riesling",
    "coords": [
      6.4056,
      49.6111
    ],
    "category": "city",
    "categoryLabel": "Capitale du Riesling"
  },
  {
    "key": "lenningen",
    "name": "Lenningen",
    "country": "LU",
    "region": "Canton Remich",
    "coords": [
      6.3667,
      49.6
    ],
    "category": "city"
  },
  {
    "key": "grevenmacher",
    "name": "Grevenmacher",
    "country": "LU",
    "region": "Moselle luxembourgeoise",
    "coords": [
      6.441,
      49.68
    ],
    "category": "city",
    "categoryLabel": "Chef-lieu mosellan",
    "url": "https://grevenmacher.lu/",
    "urlLabel": "Ville de Grevenmacher (Site Officiel)"
  },
  {
    "key": "mertert",
    "name": "Mertert / Wasserbillig",
    "country": "LU",
    "region": "Confluent Moselle & Sûre",
    "coords": [
      6.48,
      49.7167
    ],
    "category": "city",
    "categoryLabel": "Point le plus bas du pays (130m)"
  },
  {
    "key": "biwer",
    "name": "Biwer",
    "country": "LU",
    "region": "Canton Grevenmacher",
    "coords": [
      6.3667,
      49.7
    ],
    "category": "city"
  },
  {
    "key": "manternach",
    "name": "Manternach (Manternacher Fiels)",
    "country": "LU",
    "region": "Vallée de la Syr",
    "coords": [
      6.425,
      49.7083
    ],
    "category": "city",
    "categoryLabel": "Réserve forestière de ravin"
  },
  {
    "key": "flaxweiler",
    "name": "Flaxweiler",
    "country": "LU",
    "region": "Canton Grevenmacher",
    "coords": [
      6.3417,
      49.6667
    ],
    "category": "city"
  },
  {
    "key": "betzdorf",
    "name": "Betzdorf / Berg",
    "country": "LU",
    "region": "Vallée de la Syr",
    "coords": [
      6.35,
      49.6833
    ],
    "category": "city"
  },
  {
    "key": "junglinster",
    "name": "Junglinster",
    "country": "LU",
    "region": "Plateau du Grès",
    "coords": [
      6.251,
      49.712
    ],
    "category": "city"
  },
  {
    "key": "bech",
    "name": "Bech",
    "country": "LU",
    "region": "Canton Echternach",
    "coords": [
      6.3611,
      49.7528
    ],
    "category": "city"
  },
  {
    "key": "consdorf",
    "name": "Consdorf",
    "country": "LU",
    "region": "Petite Suisse / Mullerthal",
    "coords": [
      6.3389,
      49.7778
    ],
    "category": "city",
    "categoryLabel": "Coeur du Mullerthal"
  },
  {
    "key": "berdorf",
    "name": "Berdorf",
    "country": "LU",
    "region": "Plateau des Roches / Mullerthal",
    "coords": [
      6.35,
      49.8222
    ],
    "category": "city",
    "categoryLabel": "Paradis de l’escalade & grès"
  },
  {
    "key": "beaufort",
    "name": "Beaufort",
    "country": "LU",
    "region": "Petite Suisse / Mullerthal",
    "coords": [
      6.2917,
      49.8333
    ],
    "category": "city",
    "categoryLabel": "Châteaux médiéval & Renaissance"
  },
  {
    "key": "waldbillig",
    "name": "Waldbillig",
    "country": "LU",
    "region": "Mullerthal",
    "coords": [
      6.2833,
      49.7972
    ],
    "category": "city"
  },
  {
    "key": "mullerthal-village",
    "name": "Mullerthal (Vallée)",
    "country": "LU",
    "region": "Petite Suisse luxembourgeoise",
    "coords": [
      6.289,
      49.791
    ],
    "category": "nature",
    "categoryLabel": "Centre névralgique de la Petite Suisse"
  },
  {
    "key": "rosport-mompach",
    "name": "Rosport-Mompach",
    "country": "LU",
    "region": "Basse-Sûre",
    "coords": [
      6.5028,
      49.7972
    ],
    "category": "city",
    "categoryLabel": "Sources d’eau minérale"
  },
  {
    "key": "reisdorf",
    "name": "Reisdorf",
    "country": "LU",
    "region": "Confluent Sûre & Our",
    "coords": [
      6.2667,
      49.8667
    ],
    "category": "city"
  },
  {
    "key": "bettendorf",
    "name": "Bettendorf",
    "country": "LU",
    "region": "Vallée de la Sûre",
    "coords": [
      6.2167,
      49.8778
    ],
    "category": "city"
  },
  {
    "key": "dieckirch",
    "name": "Diekirch",
    "country": "LU",
    "region": "Vallée de la Sûre",
    "coords": [
      6.16,
      49.868
    ],
    "category": "city",
    "categoryLabel": "Musée Militaire & Cité de la Sûre"
  },
  {
    "key": "ettelbruck",
    "name": "Ettelbruck",
    "country": "LU",
    "region": "Porte des Ardennes",
    "coords": [
      6.1,
      49.847
    ],
    "category": "city",
    "categoryLabel": "Patton Town",
    "url": "https://ettelbruck.lu/",
    "urlLabel": "Ville d’Ettelbruck (Site Officiel)"
  },
  {
    "key": "erpeldange-sure",
    "name": "Erpeldange-sur-Sûre",
    "country": "LU",
    "region": "Nordstad / Sûre",
    "coords": [
      6.1139,
      49.8611
    ],
    "category": "city"
  },
  {
    "key": "schieren",
    "name": "Schieren",
    "country": "LU",
    "region": "Nordstad / Alzette",
    "coords": [
      6.0972,
      49.8306
    ],
    "category": "city"
  },
  {
    "key": "colmar-berg",
    "name": "Colmar-Berg",
    "country": "LU",
    "region": "Château Grand-Ducal",
    "coords": [
      6.096,
      49.811
    ],
    "category": "city",
    "categoryLabel": "Résidence Grand-Ducale"
  },
  {
    "key": "bissen",
    "name": "Bissen",
    "country": "LU",
    "region": "Vallée de l’Attert",
    "coords": [
      6.0667,
      49.7889
    ],
    "category": "city"
  },
  {
    "key": "mersch",
    "name": "Mersch",
    "country": "LU",
    "region": "Centre Géographique / Alzette",
    "coords": [
      6.104,
      49.749
    ],
    "category": "city",
    "categoryLabel": "Coeur géographique du pays",
    "url": "https://mersch.lu/",
    "urlLabel": "Commune de Mersch (Site Officiel)"
  },
  {
    "key": "lintgen",
    "name": "Lintgen",
    "country": "LU",
    "region": "Vallée de l’Alzette",
    "coords": [
      6.1278,
      49.7222
    ],
    "category": "city"
  },
  {
    "key": "lorentzweiler",
    "name": "Lorentzweiler",
    "country": "LU",
    "region": "Vallée de l’Alzette",
    "coords": [
      6.1417,
      49.7
    ],
    "category": "city"
  },
  {
    "key": "helperknapp",
    "name": "Helperknapp (Boevange / Ansembourg)",
    "country": "LU",
    "region": "Vallée de l’Attert",
    "coords": [
      6.0139,
      49.7722
    ],
    "category": "city"
  },
  {
    "key": "fischbach",
    "name": "Fischbach",
    "country": "LU",
    "region": "Canton Mersch",
    "coords": [
      6.1861,
      49.7417
    ],
    "category": "city"
  },
  {
    "key": "larochette",
    "name": "Larochette",
    "country": "LU",
    "region": "Vallée de l’Ernz Blanche",
    "coords": [
      6.219,
      49.784
    ],
    "category": "city",
    "categoryLabel": "Bourg castral",
    "url": "https://larochette.lu/",
    "urlLabel": "Commune de Larochette (Site Officiel)"
  },
  {
    "key": "nommern",
    "name": "Nommern (Nommerlayen)",
    "country": "LU",
    "region": "Plateau de grès / Felsen",
    "coords": [
      6.175,
      49.7944
    ],
    "category": "nature",
    "categoryLabel": "Labyrinthe de rochers de Nommerlayen"
  },
  {
    "key": "heffingen",
    "name": "Heffingen",
    "country": "LU",
    "region": "Canton Mersch",
    "coords": [
      6.2417,
      49.7694
    ],
    "category": "city"
  },
  {
    "key": "vallee-ernz",
    "name": "Vallée de l’Ernz (Medernach)",
    "country": "LU",
    "region": "Canton Diekirch",
    "coords": [
      6.2167,
      49.8083
    ],
    "category": "city"
  },
  {
    "key": "feulen",
    "name": "Feulen",
    "country": "LU",
    "region": "Canton Diekirch",
    "coords": [
      6.0444,
      49.8556
    ],
    "category": "city"
  },
  {
    "key": "mertzig",
    "name": "Mertzig",
    "country": "LU",
    "region": "Canton Diekirch",
    "coords": [
      6.0028,
      49.8333
    ],
    "category": "city"
  },
  {
    "key": "grosbous-wal",
    "name": "Grosbous-Wal",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      5.9667,
      49.8278
    ],
    "category": "city"
  },
  {
    "key": "vichten",
    "name": "Vichten",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      6,
      49.8028
    ],
    "category": "city",
    "categoryLabel": "Célèbre mosaïque romaine des Muses"
  },
  {
    "key": "preizerdaul",
    "name": "Préizerdaul (Bettborn)",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      5.9333,
      49.7944
    ],
    "category": "city"
  },
  {
    "key": "redange",
    "name": "Redange-sur-Attert",
    "country": "LU",
    "region": "Vallée de l’Attert",
    "coords": [
      5.89,
      49.765
    ],
    "category": "city",
    "categoryLabel": "Chef-lieu du canton de Redange"
  },
  {
    "key": "beckerich",
    "name": "Beckerich",
    "country": "LU",
    "region": "Vallée de l’Attert",
    "coords": [
      5.8833,
      49.7333
    ],
    "category": "city",
    "categoryLabel": "Moulin historique & Source",
    "url": "https://beckerich.lu/",
    "urlLabel": "Commune de Beckerich (Site Officiel)"
  },
  {
    "key": "ell",
    "name": "Ell",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      5.8528,
      49.7639
    ],
    "category": "city"
  },
  {
    "key": "rambrouch",
    "name": "Rambrouch",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      5.85,
      49.8306
    ],
    "category": "city"
  },
  {
    "key": "saeul",
    "name": "Saeul",
    "country": "LU",
    "region": "Canton Redange",
    "coords": [
      5.9861,
      49.7278
    ],
    "category": "city"
  },
  {
    "key": "useldange",
    "name": "Useldange",
    "country": "LU",
    "region": "Vallée de l’Attert / Château",
    "coords": [
      5.9806,
      49.7681
    ],
    "category": "city",
    "categoryLabel": "Château fort & Sentier pédagogique"
  },
  {
    "key": "wiltz",
    "name": "Wiltz",
    "country": "LU",
    "region": "Capitale des Ardennes (Éislek)",
    "coords": [
      5.932,
      49.966
    ],
    "category": "city",
    "categoryLabel": "Cité du Genêt & Château de Wiltz",
    "url": "https://wiltz.lu/",
    "urlLabel": "Ville de Wiltz (Site Officiel)"
  },
  {
    "key": "winseler",
    "name": "Winseler",
    "country": "LU",
    "region": "Vallée de la Wiltz",
    "coords": [
      5.8889,
      49.9667
    ],
    "category": "city"
  },
  {
    "key": "kiischpelt",
    "name": "Kiischpelt (Wilwerwiltz)",
    "country": "LU",
    "region": "Vallée de la Clerve",
    "coords": [
      6.0028,
      49.9889
    ],
    "category": "city"
  },
  {
    "key": "goesdorf",
    "name": "Goesdorf",
    "country": "LU",
    "region": "Ardennes luxembourgeoises",
    "coords": [
      5.9694,
      49.9222
    ],
    "category": "city",
    "categoryLabel": "Ancienne mine d’antimoine"
  },
  {
    "key": "bourscheid",
    "name": "Bourscheid",
    "country": "LU",
    "region": "Haute-Sûre / Ardennes",
    "coords": [
      6.0667,
      49.9111
    ],
    "category": "city",
    "categoryLabel": "Château fort médiéval"
  },
  {
    "key": "esch-sur-sure",
    "name": "Esch-sur-Sûre",
    "country": "LU",
    "region": "Parc Naturel Haute-Sûre",
    "coords": [
      5.935,
      49.911
    ],
    "category": "city",
    "categoryLabel": "Cité médiévale dans le méandre"
  },
  {
    "key": "lac-haute-sure-commune",
    "name": "Lac de la Haute-Sûre (Bavigne / Kaundorf)",
    "country": "LU",
    "region": "Parc Naturel Haute-Sûre",
    "coords": [
      5.85,
      49.9167
    ],
    "category": "lake",
    "categoryLabel": "Plages & activités nautiques"
  },
  {
    "key": "boulaide",
    "name": "Boulaide",
    "country": "LU",
    "region": "Haute-Sûre",
    "coords": [
      5.8167,
      49.8861
    ],
    "category": "city"
  },
  {
    "key": "tandel",
    "name": "Tandel / Bastendorf",
    "country": "LU",
    "region": "Vallée de la Blees",
    "coords": [
      6.1833,
      49.8972
    ],
    "category": "city"
  },
  {
    "key": "putscheid",
    "name": "Putscheid",
    "country": "LU",
    "region": "Canton Vianden",
    "coords": [
      6.1444,
      49.9611
    ],
    "category": "city"
  },
  {
    "key": "parc-hosingen",
    "name": "Parc Hosingen",
    "country": "LU",
    "region": "Parc Naturel de l’Our",
    "coords": [
      6.1417,
      50.0139
    ],
    "category": "city",
    "categoryLabel": "Centre écologique de l’Our"
  },
  {
    "key": "wincrange",
    "name": "Wincrange",
    "country": "LU",
    "region": "Plateau Ardennais",
    "coords": [
      5.9194,
      50.0528
    ],
    "category": "city"
  },
  {
    "key": "troisvierges",
    "name": "Troisvierges",
    "country": "LU",
    "region": "Nord Éislek / Sentier des Passeurs",
    "coords": [
      6,
      50.119
    ],
    "category": "city",
    "categoryLabel": "Départ de la Vennbahn"
  },
  {
    "key": "weiswampach",
    "name": "Weiswampach",
    "country": "LU",
    "region": "Lacs & Plateau Ardennais",
    "coords": [
      6.073,
      50.138
    ],
    "category": "city",
    "categoryLabel": "Lacs de loisirs de Weiswampach"
  },
  {
    "key": "bouillon-chateau",
    "name": "Château fort de Bouillon",
    "country": "BE",
    "region": "Vallée de la Semois (Ardenne)",
    "coords": [
      5.0667,
      49.7917
    ],
    "category": "castle",
    "categoryLabel": "Forteresse de Godefroy de Bouillon",
    "description": "Le plus ancien et le plus fascinant vestige de féodalité en Belgique surplombant la Semois.",
    "url": "https://www.chateaudebouillon.com/",
    "urlLabel": "Site officiel Château de Bouillon"
  },
  {
    "key": "tombeau-du-geant",
    "name": "Belvédère du Tombeau du Géant (Botassart)",
    "country": "BE",
    "region": "Vallée de la Semois (Bouillon)",
    "coords": [
      5.0889,
      49.825
    ],
    "category": "viewpoint",
    "categoryLabel": "Panorama classé patrimoine exceptionnel",
    "description": "L’un des panoramas les plus célèbres et photographiés de Belgique, ceinturé par un méandre parfait de la Semois.",
    "url": "https://www.visitbouillon-ardenne.be/touristic_sheet/le-point-de-vue-du-tombeau-du-geant-botassart-bouillon-fr-6496617/",
    "urlLabel": "Guide Officiel Panorama du Tombeau du Géant"
  },
  {
    "key": "bastogne-war-museum",
    "name": "Bastogne War Museum & Mémorial du Mardasson",
    "country": "BE",
    "region": "Ardenne belge (Bastogne)",
    "coords": [
      5.7392,
      50.0094
    ],
    "category": "heritage",
    "categoryLabel": "Mémorial Bataille des Ardennes",
    "description": "Centre de mémoire de référence sur la Seconde Guerre mondiale et la célèbre Bataille des Ardennes de l’hiver 1944.",
    "url": "https://www.bastognewarmuseum.be/",
    "urlLabel": "Visite Bastogne War Museum"
  },
  {
    "key": "abbaye-orval",
    "name": "Abbaye Notre-Dame d’Orval",
    "country": "BE",
    "region": "Gaume (Florenville)",
    "coords": [
      5.3489,
      49.6386
    ],
    "category": "heritage",
    "categoryLabel": "Abbaye cistercienne & Bière Trappiste",
    "description": "Ruines médiévales grandioses dans un vallon préservé, célèbre pour son fromage et sa bière trappiste authentique.",
    "url": "https://www.orval.be/",
    "urlLabel": "Visite Ruines de l’Abbaye d’Orval"
  },
  {
    "key": "herou-nisramont",
    "name": "Rocher du Hérou & Lac de Nisramont",
    "country": "BE",
    "region": "Vallée de l’Ourthe (Nadrin / Houffalize)",
    "coords": [
      5.6472,
      50.1444
    ],
    "category": "nature",
    "categoryLabel": "Crête rocheuse vertigineuse & Confluent",
    "description": "Éperon rocheux sauvage de 1 000 m de long plongeant à pic sur l’Ourthe et barrage-lac de Nisramont.",
    "url": "https://visitwallonia.be/fr-be/content/randonnee-incontournable-le-herou-l-echine-d-un-rocher",
    "urlLabel": "Guide Officiel Le Hérou (VisitWallonia)"
  },
  {
    "key": "signal-botrange-fagnes",
    "name": "Signal de Botrange & Hautes Fagnes",
    "country": "BE",
    "region": "Parc Naturel Hautes Fagnes - Eifel",
    "coords": [
      6.0928,
      50.5019
    ],
    "category": "nature",
    "categoryLabel": "Toit de la Belgique (694 m) & Tourbières",
    "description": "Point culminant de la Belgique à 694 m au milieu d’immenses étendues sauvages de tourbières et de caillebotis.",
    "url": "https://hautesfagnes.be/signal-de-botrange/",
    "urlLabel": "Fiche Signal de Botrange & Hautes Fagnes"
  },
  {
    "key": "ninglinspo-aywaille",
    "name": "Vallon du Ninglinspo",
    "country": "BE",
    "region": "Ardenne liégeoise (Aywaille)",
    "coords": [
      5.7722,
      50.4689
    ],
    "category": "lake",
    "categoryLabel": "Seule rivière de montagne de Belgique",
    "description": "Torrent tumultueux créant de splendides vasques d’eau (bains de Diane et de Vénus) et passerelles en bois.",
    "url": "https://visitwallonia.be/fr-be/content/randonnee-pedestre-incontournable-le-ruisseau-enchante",
    "urlLabel": "Guide Officiel Randonnée du Ninglinspo"
  },
  {
    "key": "dinant-citadelle",
    "name": "Citadelle de Dinant & Rocher Bayard",
    "country": "BE",
    "region": "Vallée de la Meuse",
    "coords": [
      4.9133,
      50.2611
    ],
    "category": "castle",
    "categoryLabel": "Forteresse sur la falaise de la Meuse",
    "description": "Citadelle perchée à 100 m au-dessus de la Meuse et de la collégiale aux toits en bulbe, patrie d’Adolphe Sax.",
    "url": "https://www.citadellededinant.be/visite/",
    "urlLabel": "Visite Citadelle de Dinant"
  },
  {
    "key": "grottes-de-han",
    "name": "Grottes de Han-sur-Lesse & Parc Animalier",
    "country": "BE",
    "region": "Géoparc mondial UNESCO Famenne-Ardenne",
    "coords": [
      5.1889,
      50.125
    ],
    "category": "nature",
    "categoryLabel": "Grottes monumentales & Gouffre de Belvaux",
    "description": "Une des plus belles grottes d’Europe où la Lesse disparaît sous terre, avec spectacle son et lumière Origin.",
    "url": "https://grotte-de-han.be/",
    "urlLabel": "Visite Domaine des Grottes de Han"
  },
  {
    "key": "la-roche-chateau",
    "name": "Château féodal de La Roche-en-Ardenne",
    "country": "BE",
    "region": "Coeur de l’Ardenne / Ourthe",
    "coords": [
      5.575,
      50.1833
    ],
    "category": "castle",
    "categoryLabel": "Ruines féodales & Légende de Berthe",
    "description": "Ruines imposantes de schiste noir du IXe siècle surplombant les méandres de l’Ourthe et les forêts ardennaises.",
    "url": "https://www.chateaudelaroche.be/visite/",
    "urlLabel": "Visite Château féodal de La Roche"
  },
  {
    "key": "durbuy-vieille-ville",
    "name": "Durbuy (La Plus Petite Ville du Monde)",
    "country": "BE",
    "region": "Vallée de l’Ourthe",
    "coords": [
      5.456,
      50.352
    ],
    "category": "city",
    "categoryLabel": "Cité médiévale & Rocher d’Homalius",
    "description": "Magnifique bourg médiéval aux ruelles pavées du XVIIe siècle et anticlinal rocheux en U.",
    "url": "https://www.durbuy.be/",
    "urlLabel": "Site Officiel Ville de Durbuy"
  },
  {
    "key": "chateau-veves",
    "name": "Château de Vêves (Celles)",
    "country": "BE",
    "region": "Vallée de la Lesse / Houyet",
    "coords": [
      4.9819,
      50.2214
    ],
    "category": "castle",
    "categoryLabel": "Château de conte de fées",
    "description": "Véritable château de la Belle au Bois Dormant avec ses cinq tours effilées parfaitement préservées.",
    "url": "https://chateau-de-veves.be/",
    "urlLabel": "Visite Château de Vêves"
  },
  {
    "key": "reinhardstein-chateau",
    "name": "Château de Reinhardstein (Burg Metternich)",
    "country": "BE",
    "region": "Hautes Fagnes (Ovifat / Robertville)",
    "coords": [
      6.0806,
      50.4486
    ],
    "category": "castle",
    "categoryLabel": "Château perché le plus haut de Belgique",
    "description": "Forteresse médiévale nichée dans un ravin escarpé au-dessus de la cascade du Warche (la plus haute de Belgique).",
    "url": "https://www.reinhardstein.net/",
    "urlLabel": "Visite Château de Reinhardstein"
  },
  {
    "key": "arlon",
    "name": "Arlon",
    "country": "BE",
    "region": "Pays d’Arlon / Gaume",
    "coords": [
      5.813,
      49.683
    ],
    "category": "city",
    "categoryLabel": "Cité romaine la plus ancienne de Belgique",
    "url": "https://www.arlon.be/",
    "urlLabel": "Site Officiel Ville d’Arlon"
  },
  {
    "key": "bastogne",
    "name": "Bastogne",
    "country": "BE",
    "region": "Ardenne belge",
    "coords": [
      5.718,
      50.003
    ],
    "category": "city",
    "categoryLabel": "Capitale historique de la Bataille des Ardennes",
    "url": "https://bastogne.be/",
    "urlLabel": "Ville de Bastogne (Site Officiel)"
  },
  {
    "key": "houffalize",
    "name": "Houffalize",
    "country": "BE",
    "region": "Vallée des Deux Ourthes",
    "coords": [
      5.789,
      50.132
    ],
    "category": "city",
    "categoryLabel": "Capitale du VTT en Belgique",
    "url": "https://www.coeurdelardenne.be/decouvrir/houffalize",
    "urlLabel": "Découvrir Houffalize & l’Ourthe"
  },
  {
    "key": "bouillon",
    "name": "Bouillon",
    "country": "BE",
    "region": "Vallée de la Semois",
    "coords": [
      5.067,
      49.795
    ],
    "category": "city",
    "categoryLabel": "Cité de Godefroy de Bouillon",
    "url": "https://www.bouillon.be/",
    "urlLabel": "Ville de Bouillon (Site Officiel)"
  },
  {
    "key": "saint-hubert",
    "name": "Saint-Hubert",
    "country": "BE",
    "region": "Grande Forêt de Saint-Hubert",
    "coords": [
      5.374,
      50.026
    ],
    "category": "city",
    "categoryLabel": "Capitale européenne de la chasse & Basilique"
  },
  {
    "key": "florenville",
    "name": "Florenville",
    "country": "BE",
    "region": "Gaume & Semois",
    "coords": [
      5.311,
      49.698
    ],
    "category": "city",
    "categoryLabel": "Porte de la Gaume"
  },
  {
    "key": "virton",
    "name": "Virton",
    "country": "BE",
    "region": "Vallée du Ton (Gaume)",
    "coords": [
      5.532,
      49.567
    ],
    "category": "city",
    "categoryLabel": "Capitale de la Gaume",
    "url": "https://virton.be/",
    "urlLabel": "Ville de Virton (Site Officiel)"
  },
  {
    "key": "neufchateau",
    "name": "Neufchâteau",
    "country": "BE",
    "region": "Ardenne centrale",
    "coords": [
      5.435,
      49.84
    ],
    "category": "city",
    "categoryLabel": "Vallée du Lac de Neufchâteau"
  },
  {
    "key": "spa",
    "name": "Spa",
    "country": "BE",
    "region": "Ardenne bleue / Fagnes",
    "coords": [
      5.865,
      50.492
    ],
    "category": "city",
    "categoryLabel": "Ville thermale historique UNESCO"
  },
  {
    "key": "malmedy",
    "name": "Malmedy",
    "country": "BE",
    "region": "Pied des Hautes Fagnes",
    "coords": [
      6.028,
      50.426
    ],
    "category": "city",
    "categoryLabel": "Cité du Malmundarium"
  },
  {
    "key": "stavelot",
    "name": "Stavelot",
    "country": "BE",
    "region": "Vallée de l’Amblève",
    "coords": [
      5.931,
      50.394
    ],
    "category": "city",
    "categoryLabel": "Abbaye princière & Circuit Spa-Francorchamps"
  },
  {
    "key": "burg-eltz",
    "name": "Burg Eltz (Château d’Eltz)",
    "country": "DE",
    "region": "Vallée de l’Elzbach / Moselle",
    "coords": [
      7.3364,
      50.205
    ],
    "category": "castle",
    "categoryLabel": "Perle des châteaux médiévaux allemands",
    "description": "Joyau architectural féodal caché dans une combe forestière, préservé intact depuis plus de 850 ans.",
    "url": "https://burg-eltz.de/",
    "urlLabel": "Besichtigung Burg Eltz"
  },
  {
    "key": "saarschleife-cloef",
    "name": "Boucle de la Sarre (Saarschleife) & Belvédère Cloef",
    "country": "DE",
    "region": "Mettlach / Saargau",
    "coords": [
      6.5397,
      49.5008
    ],
    "category": "viewpoint",
    "categoryLabel": "Merveille naturelle & Sentier des Cimes",
    "description": "Le méandre le plus spectaculaire d’Allemagne avec passerelle en bois au sommet des arbres et belvédère Cloef.",
    "url": "https://www.urlaub.saarland/aktivitaeten-erlebnisse/ausflugsziele-im-saarland/saarschleife",
    "urlLabel": "Guide Officiel Saarschleife (Cloef)"
  },
  {
    "key": "porta-nigra-trier",
    "name": "Porta Nigra & Monuments Romains de Trèves (Trier)",
    "country": "DE",
    "region": "Vallée de la Moselle (Trier)",
    "coords": [
      6.6442,
      49.7597
    ],
    "category": "heritage",
    "categoryLabel": "Porte romaine antique (UNESCO)",
    "description": "La porte de ville romaine la mieux conservée du monde antique au coeur de la plus ancienne ville d’Allemagne.",
    "url": "https://www.trier-info.de/sehenswuerdigkeiten/porta-nigra",
    "urlLabel": "Guide Porta Nigra & Trier Romaine"
  },
  {
    "key": "teufelsschlucht-eifel",
    "name": "Gorges de la Teufelsschlucht (Gorges du Diable)",
    "country": "DE",
    "region": "Naturpark Südeifel (Ernzen / Irrel)",
    "coords": [
      6.4356,
      49.845
    ],
    "category": "nature",
    "categoryLabel": "Canyon de grès & Dinosaurierpark",
    "description": "Failles vertigineuses nées de l’effondrement des plateaux de grès il y a 12 000 ans, aux portes du Mullerthal.",
    "url": "https://www.eifel.info/a-teufelsschlucht",
    "urlLabel": "Guide Gorges de la Teufelsschlucht"
  },
  {
    "key": "saarburg-cascade",
    "name": "Château & Cascade de Saarburg",
    "country": "DE",
    "region": "Saar-Obermosel",
    "coords": [
      6.5511,
      49.6083
    ],
    "category": "lake",
    "categoryLabel": "Chute d’eau urbaine & Forteresse",
    "description": "Impressionnante chute d’eau naturelle de 20 m en plein centre historique actionnant des moulins à eau médiévaux."
  },
  {
    "key": "cochem-reichsburg",
    "name": "Reichsburg Cochem",
    "country": "DE",
    "region": "Vallée de la Moselle",
    "coords": [
      7.1664,
      50.1422
    ],
    "category": "castle",
    "categoryLabel": "Château impérial au-dessus du vignoble",
    "description": "Forteresse néogothique dominant de plus de 100 m les méandres de la Moselle et ses vignobles escarpés.",
    "url": "https://reichsburg-cochem.de/",
    "urlLabel": "Besichtigung Reichsburg Cochem"
  },
  {
    "key": "geierlay-haengebruecke",
    "name": "Pont suspendu Geierlay (Mörsdorf)",
    "country": "DE",
    "region": "Hunsrück / Kastellaun",
    "coords": [
      7.34,
      50.0911
    ],
    "category": "viewpoint",
    "categoryLabel": "Pont suspendu vertigineux (360 m)",
    "description": "Spectaculaire passerelle suspendue de 360 m de long oscillant à 100 m de haut au-dessus de la vallée boisée.",
    "url": "https://geierlay.de/",
    "urlLabel": "Guide Hängebrücke Geierlay"
  },
  {
    "key": "dauner-maare-vulkaneifel",
    "name": "Maare de Daun (Vulkaneifel)",
    "country": "DE",
    "region": "UNESCO Geopark Vulkaneifel",
    "coords": [
      6.8522,
      50.17
    ],
    "category": "lake",
    "categoryLabel": "Lacs volcaniques & Yeux bleus de l’Eifel",
    "description": "Cratères volcaniques d’explosion remplis d’eau turquoise pure (Gemündener, Weinfelder et Schalkenmehrener Maar)."
  },
  {
    "key": "monschau-altstadt",
    "name": "Monschau (Cité historique de l’Eifel)",
    "country": "DE",
    "region": "Nationalpark Eifel / Rurtal",
    "coords": [
      6.2417,
      50.5542
    ],
    "category": "city",
    "categoryLabel": "Cité à colombages & Vallée de la Rur",
    "description": "Bijou d’architecture médiévale avec plus de 300 maisons à colombages préservées le long de la rivière tumultueuse.",
    "url": "https://www.eifel.info/a-historische-altstadt-monschau",
    "urlLabel": "Guide Historische Altstadt Monschau"
  },
  {
    "key": "trier",
    "name": "Trèves (Trier)",
    "country": "DE",
    "region": "Moyenne-Moselle",
    "coords": [
      6.642,
      49.758
    ],
    "category": "city",
    "categoryLabel": "Capitale romaine de la Gaule",
    "url": "https://www.trier-info.de/sehenswuerdigkeiten",
    "urlLabel": "Sehenswürdigkeiten Trier"
  },
  {
    "key": "saarbruecken",
    "name": "Sarrebruck (Saarbrücken)",
    "country": "DE",
    "region": "Vallée de la Sarre",
    "coords": [
      6.996,
      49.233
    ],
    "category": "city",
    "categoryLabel": "Capitale de la Sarre"
  },
  {
    "key": "mettlach",
    "name": "Mettlach",
    "country": "DE",
    "region": "Saarschleife / Villeroy & Boch",
    "coords": [
      6.596,
      49.494
    ],
    "category": "city",
    "categoryLabel": "Siège historique Villeroy & Boch"
  },
  {
    "key": "saarburg",
    "name": "Saarburg",
    "country": "DE",
    "region": "Saar-Obermosel",
    "coords": [
      6.55,
      49.608
    ],
    "category": "city",
    "categoryLabel": "Petite Venise de la Sarre",
    "url": "https://saarburg.de/",
    "urlLabel": "Stadt Saarburg (Offizielle Seite)"
  },
  {
    "key": "bitburg",
    "name": "Bitburg",
    "country": "DE",
    "region": "Eifel centrale / Kylltal",
    "coords": [
      6.526,
      49.974
    ],
    "category": "city",
    "categoryLabel": "Cité de la bière de l’Eifel"
  },
  {
    "key": "bernkastel-kues",
    "name": "Bernkastel-Kues",
    "country": "DE",
    "region": "Moyenne-Moselle viticole",
    "coords": [
      7.075,
      49.917
    ],
    "category": "city",
    "categoryLabel": "Capitale viticole du Riesling mosellan",
    "url": "https://www.bernkastel.de/bernkastel-kues/",
    "urlLabel": "Entdecken Bernkastel-Kues"
  },
  {
    "key": "cochem",
    "name": "Cochem",
    "country": "DE",
    "region": "Vallée de la Moselle",
    "coords": [
      7.167,
      50.147
    ],
    "category": "city",
    "categoryLabel": "Cité touristique de la Moselle",
    "url": "https://www.ferienland-cochem.de/de/orte/cochem",
    "urlLabel": "Entdecken Cochem an der Mosel"
  },
  {
    "key": "pruem",
    "name": "Prüm",
    "country": "DE",
    "region": "Prümtal / Eifel",
    "coords": [
      6.425,
      50.207
    ],
    "category": "city",
    "categoryLabel": "Basilique impériale Saint-Sauveur"
  },
  {
    "key": "gerolstein",
    "name": "Gerolstein",
    "country": "DE",
    "region": "Vulkaneifel / Kyll",
    "coords": [
      6.663,
      50.224
    ],
    "category": "city",
    "categoryLabel": "Falaises de dolomie & Sources minérales"
  },
  {
    "key": "daun",
    "name": "Daun",
    "country": "DE",
    "region": "Coeur de la Vulkaneifel",
    "coords": [
      6.832,
      50.198
    ],
    "category": "city",
    "categoryLabel": "Capitale des Maare volcaniques"
  },
  {
    "key": "chateau-malbrouck",
    "name": "Château de Malbrouck (Manderen)",
    "country": "FR",
    "region": "Pays des Trois Frontières (Moselle)",
    "coords": [
      6.4442,
      49.4589
    ],
    "category": "castle",
    "categoryLabel": "Forteresse des 3 Frontières (XVe s.)",
    "description": "Château fort restauré du XVe siècle dressé sur les hauteurs du pays des 3 frontières avec expositions d’art.",
    "url": "https://www.chateau-malbrouck.com/",
    "urlLabel": "Visiter le Château de Malbrouck"
  },
  {
    "key": "citadelle-bitche",
    "name": "Citadelle de Bitche & Jardin pour la Paix",
    "country": "FR",
    "region": "Parc Naturel des Vosges du Nord",
    "coords": [
      7.4322,
      49.0531
    ],
    "category": "castle",
    "categoryLabel": "Chef d’oeuvre de fortification Vauban",
    "description": "Vaisseau de grès rose imprenable juché sur un piton rocheux ayant héroïquement résisté au siège de 1870.",
    "url": "https://www.citadelle-bitche.com/",
    "urlLabel": "Découvrir la Citadelle de Bitche"
  },
  {
    "key": "citadelle-montmedy",
    "name": "Citadelle de Montmédy",
    "country": "FR",
    "region": "Pays de Montmédy / Meuse",
    "coords": [
      5.3619,
      49.5186
    ],
    "category": "castle",
    "categoryLabel": "Place forte espagnole & Vauban",
    "description": "Forteresse spectaculaire ceinturée de remparts vertigineux offrant un tour des chemins de ronde unique."
  },
  {
    "key": "verdun-douaumont",
    "name": "Fort de Douaumont & Ossuaire de Verdun",
    "country": "FR",
    "region": "Champ de bataille de Verdun (Meuse)",
    "coords": [
      5.4389,
      49.2167
    ],
    "category": "heritage",
    "categoryLabel": "Mémorial mondial 1914-1918",
    "description": "Haut lieu de la Grande Guerre, ossuaire monumental et fort blindé souterrain au coeur des forêts meurtries.",
    "url": "https://www.verdun-douaumont.com/",
    "urlLabel": "Visite Fort de Douaumont & Ossuaire"
  },
  {
    "key": "place-stanislas-nancy",
    "name": "Place Stanislas & Palais Ducal de Nancy",
    "country": "FR",
    "region": "Nancy / Capitale des Ducs de Lorraine",
    "coords": [
      6.1831,
      48.6936
    ],
    "category": "heritage",
    "categoryLabel": "Patrimoine mondial de l’UNESCO",
    "description": "Considérée comme l’une des plus belles places royales du monde avec ses grilles dorées de Jean Lamour."
  },
  {
    "key": "pompidou-metz",
    "name": "Centre Pompidou-Metz & Cathédrale St-Étienne",
    "country": "FR",
    "region": "Metz / Bords de Moselle",
    "coords": [
      6.1814,
      49.1144
    ],
    "category": "heritage",
    "categoryLabel": "Art contemporain & Lanterne du Bon Dieu",
    "description": "Audacieux musée d’art contemporain à la toiture inspirée d’un chapeau chinois et cathédrale aux 6 500 m² de vitraux.",
    "url": "https://www.centrepompidou-metz.fr/",
    "urlLabel": "Expositions Centre Pompidou-Metz"
  },
  {
    "key": "rodemack-cite",
    "name": "Cité médiévale fortifiée de Rodemack",
    "country": "FR",
    "region": "Pays Thionvillois (Moselle)",
    "coords": [
      6.2361,
      49.4678
    ],
    "category": "heritage",
    "categoryLabel": "Plus Beaux Villages de France",
    "description": "Surnommée « La Petite Carcassonne Lorraine », ceinte de 700 m de remparts médiévaux et pavillons d’époque.",
    "url": "https://mairie-rodemack.fr/",
    "urlLabel": "Fiche Touristique Rodemack"
  },
  {
    "key": "hackenberg-maginot",
    "name": "Ouvrage Maginot du Hackenberg (Veckring)",
    "country": "FR",
    "region": "Ligne Maginot (Moselle)",
    "coords": [
      6.3683,
      49.3411
    ],
    "category": "heritage",
    "categoryLabel": "Le monstre de la Ligne Maginot",
    "description": "Le plus puissant fort de la Ligne Maginot avec 10 km de galeries souterraines et train électrique d’époque en service.",
    "url": "https://maginot-hackenberg.com/",
    "urlLabel": "Visite Ouvrage Maginot Hackenberg"
  },
  {
    "key": "lac-de-madine",
    "name": "Lac de Madine & Butte de Montsec",
    "country": "FR",
    "region": "Parc Naturel Régional de Lorraine (Meuse)",
    "coords": [
      5.7361,
      48.9417
    ],
    "category": "lake",
    "categoryLabel": "Grand lac de loisirs & Mémorial américain",
    "description": "Vaste lac de 1 100 hectares niché au pied des Côtes de Meuse avec plages, voile et observatoires ornithologiques.",
    "url": "https://lacmadine.com/",
    "urlLabel": "Activités & Nature Lac de Madine"
  },
  {
    "key": "rocher-de-dabo",
    "name": "Rocher de Dabo (Massif des Vosges)",
    "country": "FR",
    "region": "Vosges Mosellanes",
    "coords": [
      7.2417,
      48.65
    ],
    "category": "viewpoint",
    "categoryLabel": "Pitonnage de grès rose & Chapelle St-Léon",
    "description": "Spectaculaire rocher de grès rose s’élevant à 664 m au-dessus des forêts vosgiennes, couronné par une chapelle romane."
  },
  {
    "key": "thionville",
    "name": "Thionville",
    "country": "FR",
    "region": "Pays Thionvillois / Moselle",
    "coords": [
      6.168,
      49.358
    ],
    "category": "city",
    "categoryLabel": "Porte de la Moselle française",
    "url": "https://www.thionville.fr/",
    "urlLabel": "Site Officiel Ville de Thionville"
  },
  {
    "key": "metz",
    "name": "Metz",
    "country": "FR",
    "region": "Boucles de la Moselle & Mont St-Quentin",
    "coords": [
      6.1757,
      49.1193
    ],
    "category": "city",
    "categoryLabel": "Cité d’art et d’histoire",
    "url": "https://metz.fr/",
    "urlLabel": "Ville de Metz (Site Officiel)"
  },
  {
    "key": "nancy",
    "name": "Nancy",
    "country": "FR",
    "region": "Plateau de Haye & Meurthe",
    "coords": [
      6.1844,
      48.6921
    ],
    "category": "city",
    "categoryLabel": "Capitale de l’Art Nouveau",
    "url": "https://www.nancy-tourisme.fr/decouvrir-nancy/",
    "urlLabel": "Découvrir Nancy & Place Stanislas"
  },
  {
    "key": "sierck-les-bains",
    "name": "Sierck-les-Bains",
    "country": "FR",
    "region": "Pays des 3 Frontières / Stromberg",
    "coords": [
      6.355,
      49.442
    ],
    "category": "city",
    "categoryLabel": "Château des Ducs de Lorraine"
  },
  {
    "key": "longwy",
    "name": "Longwy",
    "country": "FR",
    "region": "Remparts Vauban (UNESCO) & Pays Haut",
    "coords": [
      5.762,
      49.52
    ],
    "category": "city",
    "categoryLabel": "Place forte Vauban UNESCO"
  },
  {
    "key": "verdun",
    "name": "Verdun",
    "country": "FR",
    "region": "Vallée de la Meuse",
    "coords": [
      5.385,
      49.16
    ],
    "category": "city",
    "categoryLabel": "Capitale mondiale de la Paix",
    "url": "https://www.tourisme-verdun.com/decouvrir/",
    "urlLabel": "Découvrir Verdun & Champs de Bataille"
  },
  {
    "key": "montmedy",
    "name": "Montmédy",
    "country": "FR",
    "region": "Citadelle de Montmédy",
    "coords": [
      5.361,
      49.518
    ],
    "category": "city",
    "categoryLabel": "Cité fortifiée de la Meuse"
  },
  {
    "key": "bitche",
    "name": "Bitche",
    "country": "FR",
    "region": "Parc Naturel des Vosges du Nord",
    "coords": [
      7.425,
      49.052
    ],
    "category": "city",
    "categoryLabel": "Cité de la Citadelle"
  },
  {
    "key": "sarreguemines",
    "name": "Sarreguemines",
    "country": "FR",
    "region": "Confluent Sarre & Blies",
    "coords": [
      7.069,
      49.11
    ],
    "category": "city",
    "categoryLabel": "Cité de la faïence"
  },
  {
    "key": "pont-a-mousson",
    "name": "Pont-à-Mousson",
    "country": "FR",
    "region": "Abbaye des Prémontrés / Moselle",
    "coords": [
      6.055,
      48.905
    ],
    "category": "city"
  },
  {
    "key": "drielandenpunt-vaals",
    "name": "Drielandenpunt & Sommet des Pays-Bas (Vaalserberg)",
    "country": "NL",
    "region": "Vaals (Frontière NL-BE-LU)",
    "coords": [
      6.0211,
      50.7544
    ],
    "category": "viewpoint",
    "categoryLabel": "Point des 3 Frontières & Sommet des Pays-Bas (322 m)",
    "description": "Point de rencontre de 3 pays et toit des Pays-Bas avec tour panoramique Wilhelminatoren et labyrinthe.",
    "url": "https://www.drielandenpunt.nl/",
    "urlLabel": "Attracties Drielandenpunt Vaals"
  },
  {
    "key": "valkenburg-kasteel",
    "name": "Château fort de Valkenburg & Grottes de velours",
    "country": "NL",
    "region": "Zuid-Limburg / Geuldal",
    "coords": [
      5.8311,
      50.8631
    ],
    "category": "castle",
    "categoryLabel": "Seul château en ruine de hauteur des Pays-Bas",
    "description": "Ruines féodales dominant Valkenburg et galeries souterraines de carrières de marne jaune Fluweelengrot.",
    "url": "https://www.kasteelvalkenburg.nl/",
    "urlLabel": "Bezoekersinfo Kasteel Valkenburg"
  },
  {
    "key": "sint-pietersberg-maastricht",
    "name": "Montagne Saint-Pierre (Sint-Pietersberg)",
    "country": "NL",
    "region": "Maastricht (Vallée de la Meuse)",
    "coords": [
      5.6889,
      50.835
    ],
    "category": "nature",
    "categoryLabel": "Carrières de marne & Fort Sint Pieter",
    "description": "Promontoire calcaire naturel dominant la Meuse avec forteresse historique et dédale de 20 000 galeries souterraines.",
    "url": "https://www.natuurmonumenten.nl/natuurgebieden/sint-pietersberg",
    "urlLabel": "Guide Natuurmonumenten"
  },
  {
    "key": "cauberg-valkenburg",
    "name": "Colline du Cauberg (Mecque du Cyclisme)",
    "country": "NL",
    "region": "Valkenburg aan de Geul",
    "coords": [
      5.8236,
      50.86
    ],
    "category": "viewpoint",
    "categoryLabel": "Haut lieu de l’Amstel Gold Race",
    "description": "Célèbre côte cycliste des championnats du monde, thermes de Thermae 2000 et panorama sur la vallée de la Geul."
  },
  {
    "key": "maastricht",
    "name": "Maastricht",
    "country": "NL",
    "region": "Bord de Meuse / Montagne St-Pierre",
    "coords": [
      5.691,
      50.8514
    ],
    "category": "city",
    "categoryLabel": "Plus ancienne ville des Pays-Bas & Vrijthof"
  },
  {
    "key": "valkenburg",
    "name": "Valkenburg aan de Geul",
    "country": "NL",
    "region": "Cauberg / Carrières de marne",
    "coords": [
      5.831,
      50.865
    ],
    "category": "city",
    "categoryLabel": "Cité thermale & Grottes de marne"
  },
  {
    "key": "vaals",
    "name": "Vaals",
    "country": "NL",
    "region": "Zuid-Limburg / 3 Frontières",
    "coords": [
      6.021,
      50.771
    ],
    "category": "city"
  },
  {
    "key": "gulpen",
    "name": "Gulpen-Wittem",
    "country": "NL",
    "region": "Vallée de la Gulp",
    "coords": [
      5.895,
      50.812
    ],
    "category": "city",
    "categoryLabel": "Coeur des collines du Limbourg"
  },
  {
    "key": "epen",
    "name": "Epen",
    "country": "NL",
    "region": "Bocages et sources du Geuldal",
    "coords": [
      5.915,
      50.775
    ],
    "category": "city",
    "categoryLabel": "Paradis de la randonnée bocagère"
  },
  {
    "key": "heerlen",
    "name": "Heerlen",
    "country": "NL",
    "region": "Brunssummerheide",
    "coords": [
      5.979,
      50.888
    ],
    "category": "city",
    "categoryLabel": "Musée des Thermes Romains"
  },
  {
    "key": "turelbaach-chateau",
    "name": "Château de Turelbaach",
    "country": "LU",
    "region": "Mertzig / Guttland",
    "coords": [
      6.0081,
      49.8331
    ],
    "category": "castle",
    "categoryLabel": "Château de conte de fées & île",
    "description": "Véritable château de conte de fées édifié pierre par pierre sur 40 ans par Pol Gilson sur une île au cœur des étangs et forêts de Mertzig. Visible depuis l'Auto-Pédestre Mertzig.",
    "aliases": [
      "chateau de tuchelbach",
      "tuchelbach",
      "chateau tuchelbach",
      "turelbaach",
      "schloss turelbaach",
      "pol gilson",
      "mertzig",
      "chateau de mertzig"
    ]
  },
  {
    "key": "beaufort-chateau",
    "name": "Châteaux de Beaufort",
    "country": "LU",
    "region": "Mullerthal / Petite Suisse",
    "coords": [
      6.2872,
      49.8347
    ],
    "category": "castle",
    "categoryLabel": "Forteresse médiévale & Château Renaissance",
    "description": "Impressionnant ensemble castral : ruines imposantes du château fort du XIe siècle bordant l'étang et splendide château Renaissance préservé avec sa célèbre liqueur de cassis Cassero.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-beaufort",
    "urlLabel": "Guide Officiel Châteaux de Beaufort",
    "aliases": [
      "beaufort",
      "burg beaufort",
      "chateau beaufort",
      "cassero"
    ]
  },
  {
    "key": "meysembourg-chateau",
    "name": "Château de Meysembourg",
    "country": "LU",
    "region": "Vallée du Manzebaach (Larochette)",
    "coords": [
      6.1883,
      49.7719
    ],
    "category": "castle",
    "categoryLabel": "Château néo-renaissance & Vallée secrète",
    "description": "Splendide château de style néo-renaissance niché au creux d'une vallée verdoyante et paisible, point de passage incontournable du Mullerthal Trail et de l'Auto-Pédestre.",
    "aliases": [
      "meysembourg",
      "meisemburg",
      "manzebaach"
    ]
  },
  {
    "key": "ansembourg-grand-chateau",
    "name": "Grand Château d'Ansembourg & Jardins",
    "country": "LU",
    "region": "Vallée des Sept Châteaux (Eisch)",
    "coords": [
      6.0489,
      49.7025
    ],
    "category": "castle",
    "categoryLabel": "Palais baroque & Jardins à la française",
    "description": "Joyau de la Vallée des Sept Châteaux avec ses terrasses ornées de statues mythologiques, fontaines, allée des charmes et jardins baroquaux du XVIIIe siècle classés.",
    "url": "https://gcansembourg.eu/",
    "urlLabel": "Visite Jardins Grand Château d’Ansembourg",
    "aliases": [
      "ansembourg",
      "grand chateau ansembourg",
      "sept chateaux",
      "vallee des sept chateaux"
    ]
  },
  {
    "key": "ansembourg-vieux-chateau",
    "name": "Vieux Château d'Ansembourg",
    "country": "LU",
    "region": "Vallée des Sept Châteaux (Eisch)",
    "coords": [
      6.0436,
      49.7003
    ],
    "category": "castle",
    "categoryLabel": "Château fort médiéval",
    "description": "Nid d'aigle médiéval du XIIe siècle surplombant la rivière de l'Eisch, berceau de la seigneurie d'Ansembourg.",
    "aliases": [
      "vieux chateau ansembourg",
      "ansembourg medieval"
    ]
  },
  {
    "key": "hollenfels-chateau",
    "name": "Château de Hollenfels",
    "country": "LU",
    "region": "Vallée des Sept Châteaux (Eisch)",
    "coords": [
      6.0506,
      49.7139
    ],
    "category": "castle",
    "categoryLabel": "Donjon médiéval & Grotte",
    "description": "Imposant donjon de 40 m de haut dominant la vallée encaissée de l'Eisch et sa falaise de grès percée de cavités et grottes légendaires.",
    "aliases": [
      "hollenfels",
      "chateau hollenfels",
      "donjon hollenfels"
    ]
  },
  {
    "key": "schoenfels-chateau",
    "name": "Château de Schoenfels",
    "country": "LU",
    "region": "Vallée des Sept Châteaux (Mersch)",
    "coords": [
      6.0919,
      49.7189
    ],
    "category": "castle",
    "categoryLabel": "Donjon féodal & Centre Nature",
    "description": "Superbe donjon résidentiel du XIIIe siècle entouré d'un parc paysager au bord de la Mamer, porte d'entrée de la Vallée des Sept Châteaux.",
    "aliases": [
      "schoenfels",
      "schonfels",
      "chateau schonfels"
    ]
  },
  {
    "key": "septfontaines-chateau",
    "name": "Château de Septfontaines (Simmern)",
    "country": "LU",
    "region": "Vallée de l’Eisch (Guttland)",
    "coords": [
      5.9664,
      49.7006
    ],
    "category": "castle",
    "categoryLabel": "Ruines du château fort de Simmern",
    "description": "Château fort des XIIe-XVIe siècles dominant le ravissant village fleuri de Septfontaines au cœur de la Vallée des Sept Châteaux.",
    "aliases": [
      "septfontaines",
      "simmern",
      "chateau de simmern"
    ]
  },
  {
    "key": "koerich-greiweschlass",
    "name": "Château de Koerich (Gréiweschlass)",
    "country": "LU",
    "region": "Vallée du Goeblange / Guttland",
    "coords": [
      5.9497,
      49.6703
    ],
    "category": "castle",
    "categoryLabel": "Château de plaine & Tour Saint-Michel",
    "description": "Château de plaine médiéval exceptionnel au Luxembourg, doté d'une tour résidentielle de style roman tardif et de douves aménagées pour la promenade.",
    "aliases": [
      "koerich",
      "greiweschlass",
      "chateau de koerich"
    ]
  },
  {
    "key": "brandenbourg-chateau",
    "name": "Château de Brandenbourg",
    "country": "LU",
    "region": "Éislek / Vallée de la Blees",
    "coords": [
      6.1408,
      49.9075
    ],
    "category": "castle",
    "categoryLabel": "Forteresse en nid d’aigle",
    "description": "Ruines romantiques d'un puissant château fort du Xe siècle juché sur une arête rocheuse escarpée au-dessus du village de Brandenbourg.",
    "aliases": [
      "brandenbourg",
      "brandenburg",
      "chateau brandenbourg"
    ]
  },
  {
    "key": "wiltz-chateau",
    "name": "Château de Wiltz",
    "country": "LU",
    "region": "Éislek / Capitale des Ardennes",
    "coords": [
      5.9328,
      49.9678
    ],
    "category": "castle",
    "categoryLabel": "Château Renaissance & Festival",
    "description": "Ancienne résidence des comtes de Wiltz avec son splendide amphithéâtre en plein air, musée de la bière et mémorial national de la Grève générale de 1942.",
    "aliases": [
      "wiltz",
      "chateau wiltz"
    ]
  },
  {
    "key": "bourglinster-chateau",
    "name": "Château de Bourglinster (Buerglënster)",
    "country": "LU",
    "region": "Canton de Grevenmacher / Guttland",
    "coords": [
      6.2164,
      49.7028
    ],
    "category": "castle",
    "categoryLabel": "Château médiéval & Gastronomie étoilée",
    "description": "Ensemble féodal des XIIe-XVe siècles admirablement restauré avec ses cours pavées, galeries d'art et restaurant gastronomique étoilé Michelin.",
    "url": "https://www.visitluxembourg.com/fr/attraction/chateau-bourglinster",
    "urlLabel": "Guide Officiel Château de Bourglinster",
    "aliases": [
      "bourglinster",
      "buerglenser",
      "chateau bourglinster"
    ]
  },
  {
    "key": "pettingen-chateau",
    "name": "Château de Pettingen (Waasserbuerg Pëtten)",
    "country": "LU",
    "region": "Mersch / Vallée de l’Alzette",
    "coords": [
      6.1089,
      49.7719
    ],
    "category": "castle",
    "categoryLabel": "Château fort aquatique à douves",
    "description": "Rare exemple de château fort de plaine à douves entouré d'eau du XIIIe siècle, doté de quatre tours d'angle circulaires impressionnantes.",
    "aliases": [
      "pettingen",
      "petten",
      "waasserbuerg",
      "chateau pettingen"
    ]
  },
  {
    "key": "esch-sure-chateau",
    "name": "Château féodal d'Esch-sur-Sûre",
    "country": "LU",
    "region": "Parc Naturel de la Haute-Sûre",
    "coords": [
      5.9356,
      49.9114
    ],
    "category": "castle",
    "categoryLabel": "Ruines féodales & Méandre de la Sûre",
    "description": "Ruines du château fort de 927 dominant le méandre spectaculaire de la rivière de la Sûre enserrant le village pittoresque d'Esch-sur-Sûre.",
    "aliases": [
      "esch sur sure",
      "esch sauer",
      "chateau esch sur sure"
    ]
  },
  {
    "key": "perekop-berdorf",
    "name": "Rocher du Perekop (Berdorf)",
    "country": "LU",
    "region": "Mullerthal / Petite Suisse luxembourgeoise",
    "coords": [
      6.3533,
      49.8228
    ],
    "category": "nature",
    "categoryLabel": "Monolithe de grès & Échelles vertigineuses",
    "description": "Immense monolithe de grès surplombant la gorge avec des escaliers vertigineux taillés dans la roche menant à un belvédère panoramique.",
    "aliases": [
      "perekop",
      "berdorf perekop",
      "rocher perekop"
    ]
  },
  {
    "key": "noumerleeen-nommern",
    "name": "Falaises des Noumerleeën (Nommern)",
    "country": "LU",
    "region": "Mullerthal / Nommern",
    "coords": [
      6.1772,
      49.7892
    ],
    "category": "nature",
    "categoryLabel": "Labyrinthe géologique & Camp romain",
    "description": "Extraordinaire labyrinthe de blocs de grès érodés aux formes sculptées, ravins étroits et vestiges d'un ancien camp romain sur les hauteurs.",
    "aliases": [
      "noumerleeen",
      "noumerleeën",
      "nommern"
    ]
  },
  {
    "key": "modave-chateau",
    "name": "Château de Modave",
    "country": "BE",
    "region": "Vallée du Hoyoux / Condroz (BE)",
    "coords": [
      5.2978,
      50.4417
    ],
    "category": "castle",
    "categoryLabel": "Château princier & Réserve naturelle",
    "description": "Splendide résidence seigneuriale du XVIIe siècle juchée sur un piton rocheux dominant la réserve naturelle du Hoyoux de 60 mètres.",
    "url": "https://www.modave-castle.be/",
    "urlLabel": "Visite Château de Modave",
    "aliases": [
      "modave",
      "chateau modave",
      "hoyoux"
    ]
  },
  {
    "key": "walzin-chateau",
    "name": "Château de Walzin & Falaises de la Lesse",
    "country": "BE",
    "region": "Dinant / Vallée de la Lesse (BE)",
    "coords": [
      4.9272,
      50.2197
    ],
    "category": "castle",
    "categoryLabel": "Château perché sur falaise à pic de 50 m",
    "description": "L'une des vues les plus emblématiques de Belgique : château néo-gothique dressé au sommet d'une falaise vertigineuse surplombant la Lesse.",
    "aliases": [
      "walzin",
      "chateau de walzin",
      "lesse"
    ]
  },
  {
    "key": "freyr-chateau",
    "name": "Château & Jardins de Freÿr",
    "country": "BE",
    "region": "Hastière / Meuse namuroise (BE)",
    "coords": [
      4.8892,
      50.2267
    ],
    "category": "castle",
    "categoryLabel": "Petit Versailles meusan & Falaises d'escalade",
    "description": "Ancienne résidence ducale Renaissance avec jardins classiques à la Le Nôtre, orangers tricenténaires et vue magistrale sur les falaises de Freÿr dominant la Meuse.",
    "url": "https://www.freyr.be/",
    "urlLabel": "Visite Château & Jardins de Freÿr",
    "aliases": [
      "freyr",
      "chateau freyr",
      "rochers de freyr"
    ]
  },
  {
    "key": "franchimont-chateau",
    "name": "Château de Franchimont",
    "country": "BE",
    "region": "Theux / Pays de Spa (BE)",
    "coords": [
      5.8242,
      50.5283
    ],
    "category": "castle",
    "categoryLabel": "Forteresse de la Principauté de Liège",
    "description": "Ruines grandioses de la forteresse médiévale des princes-évêques de Liège du XIe siècle avec d'immenses remparts d'artillerie renaissance.",
    "url": "https://www.chateau-franchimont.be/visite/",
    "urlLabel": "Visite Ruines Château de Franchimont",
    "aliases": [
      "franchimont",
      "chateau franchimont",
      "theux"
    ]
  },
  {
    "key": "citadelle-dinant",
    "name": "Citadelle de Dinant",
    "country": "BE",
    "region": "Dinant / Vallée de la Meuse (BE)",
    "coords": [
      4.9133,
      50.2608
    ],
    "category": "heritage",
    "categoryLabel": "Forteresse perchée à 100 m au-dessus de la Meuse",
    "description": "Citadelle fortifiée dominant la collégiale Notre-Dame et la Meuse de 100 m de haut, accessible par un téléphérique ou 408 marches.",
    "url": "https://www.citadellededinant.be/visite/",
    "urlLabel": "Visite Citadelle de Dinant",
    "aliases": [
      "dinant",
      "citadelle dinant"
    ]
  },
  {
    "key": "cascade-coo",
    "name": "Cascade de Coo (Stavelot)",
    "country": "BE",
    "region": "Hautes Fagnes / Vallée de l’Amblève (BE)",
    "coords": [
      5.8767,
      50.3936
    ],
    "category": "lake",
    "categoryLabel": "Plus haute chute d’eau naturelle de Belgique (15 m)",
    "description": "Spectaculaire chute d'eau de 15 m aménagée au XVIIIe siècle par les moines de l'abbaye de Stavelot sur un méandre recoupé de l'Amblève.",
    "aliases": [
      "cascade de coo",
      "coo",
      "stavelot coo"
    ]
  },
  {
    "key": "signal-botrange",
    "name": "Signal de Botrange (Hautes Fagnes)",
    "country": "BE",
    "region": "Parc Naturel Hautes Fagnes - Eifel (BE)",
    "coords": [
      6.0928,
      50.5019
    ],
    "category": "nature",
    "categoryLabel": "Point culminant de la Belgique (694 m / 700 m)",
    "description": "Toit de la Belgique culminant à 694 m (700 m au sommet de la butte Baltia), au cœur de la plus vaste réserve naturelle de tourbières et landes sauvages.",
    "url": "https://hautesfagnes.be/signal-de-botrange/",
    "urlLabel": "Fiche Signal de Botrange & Hautes Fagnes",
    "aliases": [
      "botrange",
      "signal de botrange",
      "hautes fagnes"
    ]
  },
  {
    "key": "malbrouck-chateau",
    "name": "Château de Malbrouck (Manderen)",
    "country": "FR",
    "region": "Pays des Trois Frontières (Moselle / FR)",
    "coords": [
      6.4389,
      49.4589
    ],
    "category": "castle",
    "categoryLabel": "Forteresse des Ducs de Lorraine du XVe siècle",
    "description": "Forteresse entièrement restaurée aux 4 tours d'angle dominant la vallée de la Moselle aux confins de la France, du Luxembourg et de l'Allemagne.",
    "url": "https://www.chateau-malbrouck.com/",
    "urlLabel": "Visiter le Château de Malbrouck",
    "aliases": [
      "malbrouck",
      "manderen",
      "chateau de malbrouck"
    ]
  },
  {
    "key": "sierck-chateau",
    "name": "Château des Ducs de Lorraine de Sierck-les-Bains",
    "country": "FR",
    "region": "Vallée de la Moselle (Moselle / FR)",
    "coords": [
      6.3578,
      49.4419
    ],
    "category": "castle",
    "categoryLabel": "Forteresse féodale sur promontoire rocheux",
    "description": "Imposante forteresse médiévale des XIe-XVe siècles juchée sur un éperon rocheux surveillant la boucle de la Moselle aux Trois Frontières.",
    "url": "https://www.chateau-sierck.com/",
    "urlLabel": "Visiter Château des Ducs de Lorraine",
    "aliases": [
      "sierck",
      "sierck les bains",
      "chateau de sierck"
    ]
  },
  {
    "key": "haut-koenigsbourg",
    "name": "Château du Haut-Kœnigsbourg (Orschwiller)",
    "country": "FR",
    "region": "Alsace / Massif des Vosges (FR)",
    "coords": [
      7.3444,
      48.2494
    ],
    "category": "castle",
    "categoryLabel": "Château fort de montagne impérial (757 m)",
    "description": "Château fort légendaire dominant la plaine d'Alsace à 757 m d'altitude, reconstruit au début du XXe siècle pour l'empereur Guillaume II.",
    "url": "https://www.haut-koenigsbourg.fr/fr/visites/",
    "urlLabel": "Visites Château du Haut-Kœnigsbourg",
    "aliases": [
      "haut koenigsbourg",
      "koenigsbourg",
      "chateau du haut koenigsbourg"
    ]
  },
  {
    "key": "luneville-chateau",
    "name": "Château de Lunéville",
    "country": "FR",
    "region": "Meurthe-et-Moselle / Lorraine (FR)",
    "coords": [
      6.4917,
      48.5908
    ],
    "category": "heritage",
    "categoryLabel": "Le Versailles Lorrain & Palais de Stanislas",
    "description": "Splendide palais des Ducs de Lorraine et du Roi Stanislas Leszczynski du XVIIIe siècle, entouré de ses jardins réguliers des Bosquets.",
    "aliases": [
      "luneville",
      "chateau de luneville",
      "versailles lorrain"
    ]
  },
  {
    "key": "fort-douaumont",
    "name": "Fort & Ossuaire de Douaumont (Verdun)",
    "country": "FR",
    "region": "Verdun / Meuse (FR)",
    "coords": [
      5.4389,
      49.2167
    ],
    "category": "heritage",
    "categoryLabel": "Mémorial mondial de la Bataille de Verdun 1916",
    "description": "Plus puissant ouvrage fortifié de la place de Verdun et nécropole nationale commémorant les combats héroïques de la Première Guerre mondiale.",
    "url": "https://www.verdun-douaumont.com/",
    "urlLabel": "Visite Fort de Douaumont & Ossuaire",
    "aliases": [
      "douaumont",
      "fort de douaumont",
      "verdun",
      "ossuaire douaumont"
    ]
  },
  {
    "key": "fort-hackenberg",
    "name": "Fort du Hackenberg (Ligne Maginot)",
    "country": "FR",
    "region": "Veckring / Moselle (FR)",
    "coords": [
      6.3683,
      49.3417
    ],
    "category": "heritage",
    "categoryLabel": "Le monstre de la Ligne Maginot",
    "description": "Le plus grand ouvrage fortifié de toute la Ligne Maginot avec ses 19 blocs de combat, 10 km de galeries souterraines et son train électrique d'époque.",
    "url": "https://maginot-hackenberg.com/",
    "urlLabel": "Visite Ouvrage Maginot Hackenberg",
    "aliases": [
      "hackenberg",
      "fort hackenberg",
      "ligne maginot"
    ]
  },
  {
    "key": "burg-thurant",
    "name": "Burg Thurant (Alken)",
    "country": "DE",
    "region": "Basse Moselle (Rhénanie-Palatinat / DE)",
    "coords": [
      7.4528,
      50.2483
    ],
    "category": "castle",
    "categoryLabel": "Forteresse aux deux donjons jumeaux",
    "description": "Impressionnant château fort du XIIe siècle surplombant la Moselle, doté de deux donjons distincts construits par l'archevêque de Trèves et celui de Cologne.",
    "url": "https://thurant.de/",
    "urlLabel": "Burgführung Burg Thurant",
    "aliases": [
      "thurant",
      "burg thurant",
      "alken"
    ]
  },
  {
    "key": "burg-rheinfels",
    "name": "Burg Rheinfels (Sankt Goar)",
    "country": "DE",
    "region": "Vallée du Haut-Rhin moyen UNESCO (DE)",
    "coords": [
      7.7039,
      50.1539
    ],
    "category": "castle",
    "categoryLabel": "Plus grande ruine de forteresse de la vallée du Rhin",
    "description": "Gigantesque complexe fortifié fondé en 1245 au sommet des falaises du Rhin en face du rocher de la Lorelei, avec labyrinthe de mines souterraines.",
    "url": "https://www.burg-rheinfels.com/",
    "urlLabel": "Besichtigung Burg Rheinfels",
    "aliases": [
      "rheinfels",
      "burg rheinfels",
      "sankt goar",
      "lorelei"
    ]
  },
  {
    "key": "marksburg-braubach",
    "name": "Marksburg (Braubach)",
    "country": "DE",
    "region": "Vallée du Rhin moyen UNESCO (DE)",
    "coords": [
      7.6492,
      50.2725
    ],
    "category": "castle",
    "categoryLabel": "Seul château fort du Rhin jamais détruit",
    "description": "Le seul château de hauteur de toute la vallée du Rhin moyen à avoir traversé le Moyen Âge sans jamais avoir été détruit, siège de l'Association des Châteaux Allemands.",
    "url": "https://www.marksburg.de/",
    "urlLabel": "Besichtigung Marksburg Braubach",
    "aliases": [
      "marksburg",
      "burg marksburg",
      "braubach"
    ]
  },
  {
    "key": "saarburg-chateau-cascade",
    "name": "Château & Cascade de Saarburg",
    "country": "DE",
    "region": "Vallée de la Sarre / Trèves (DE)",
    "coords": [
      6.5511,
      49.6083
    ],
    "category": "castle",
    "categoryLabel": "Château fort des Comtes de Luxembourg & Cascade urbaine",
    "description": "Ruines du château fondé en 964 par Siegfried de Luxembourg dominant la magnifique cascade de 18 m en plein cœur historique de la vieille ville.",
    "aliases": [
      "saarburg",
      "chateau de saarburg",
      "cascade saarburg"
    ]
  },
  {
    "key": "geierlay-pont-suspendu",
    "name": "Pont suspendu de la Geierlay (Mörsdorf)",
    "country": "DE",
    "region": "Hunsrück (Rhénanie-Palatinat / DE)",
    "coords": [
      7.3408,
      50.0911
    ],
    "category": "nature",
    "categoryLabel": "Passerelle suspendue himalayenne de 360 m",
    "description": "Spectaculaire pont de singe piétonnier suspendu à 100 m au-dessus du ravin forestier, long de 360 m au cœur des sentiers de randonnée du Saar-Hunsrück-Steig.",
    "url": "https://geierlay.de/",
    "urlLabel": "Guide Hängebrücke Geierlay",
    "aliases": [
      "geierlay",
      "pont suspendu geierlay",
      "morsdorf"
    ]
  },
  {
    "key": "dreimuehlen-wasserfall",
    "name": "Cascade de Dreimühlen (Üxheim)",
    "country": "DE",
    "region": "Vulkaneifel / Collines volcaniques (DE)",
    "coords": [
      6.7867,
      50.3408
    ],
    "category": "lake",
    "categoryLabel": "Cascade pétrifiante vivante en tuf calcaire",
    "description": "Curiosité géologique fascinante : cascade pétrifiante qui avance de plusieurs centimètres par an grâce au dépôt continu de carbonate de calcium sur les mousses.",
    "aliases": [
      "dreimuhlen",
      "dreimuehlen",
      "cascade dreimuhlen",
      "uxheim"
    ]
  },
  {
    "key": "voelklinger-huette",
    "name": "Völklinger Hütte (Usine sidérurgique UNESCO)",
    "country": "DE",
    "region": "Sarre / Völklingen (DE)",
    "coords": [
      6.8525,
      49.2503
    ],
    "category": "heritage",
    "categoryLabel": "Patrimoine mondial de l’humanité UNESCO",
    "description": "Unique usine sidérurgique au monde conservée dans son intégralité depuis l'âge d'or de l'industrie du fer, inscrite au patrimoine mondial UNESCO.",
    "url": "https://voelklinger-huette.org/",
    "urlLabel": "Besuch Weltkulturerbe Völklinger Hütte",
    "aliases": [
      "volklinger hutte",
      "voelklinger huette",
      "volklingen"
    ]
  }
];
export const LOCAL_PLACES: Record<string, [number, number]> = GAZETTEER.reduce(
  (acc, item) => {
    acc[item.key] = item.coords;
    return acc;
  },
  {} as Record<string, [number, number]>
);

export function normalizeSearchText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function haversineDistanceKm(c1: [number, number], c2: [number, number]): number {
  const [lon1, lat1] = c1;
  const [lon2, lat2] = c2;
  const R = 6371;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function searchPlaces(
  query: string,
  limit = 50,
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR' | 'ALL',
  category?: PlaceCategory | 'ALL',
  userCoords?: [number, number] | null,
  sortByDistance = false
): PlaceEntry[] {
  let pool = GAZETTEER;
  if (country && country !== 'ALL') {
    pool = pool.filter((p) => p.country === country);
  }
  if (category && category !== 'ALL') {
    pool = pool.filter((p) => p.category === category);
  }

  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    if (userCoords && sortByDistance) {
      const sorted = [...pool].sort((a, b) => {
        const dA = haversineDistanceKm(userCoords, a.coords);
        const dB = haversineDistanceKm(userCoords, b.coords);
        return dA - dB;
      });
      return sorted.slice(0, limit);
    }
    return pool.slice(0, limit);
  }

  const queryTokens = normQuery.split(' ').filter(Boolean);

  const scored = pool
    .map((place) => {
      const normName = normalizeSearchText(place.name);
      const normRegion = normalizeSearchText(place.region);
      const normDesc = place.description ? normalizeSearchText(place.description) : '';
      const normCat = place.categoryLabel ? normalizeSearchText(place.categoryLabel) : '';
      let score = 0;

      // Check aliases if present
      if (place.aliases && place.aliases.length > 0) {
        for (const alias of place.aliases) {
          const normAlias = normalizeSearchText(alias);
          if (normAlias === normQuery) {
            score = Math.max(score, 140);
          } else if (normAlias.startsWith(normQuery) || normQuery.startsWith(normAlias)) {
            score = Math.max(score, 115);
          } else if (normAlias.includes(normQuery)) {
            score = Math.max(score, 95);
          }
        }
      }

      if (normName === normQuery) {
        score = Math.max(score, 150);
      } else if (normName.startsWith(normQuery)) {
        score = 110;
      } else if (normName.split(' ').some((w) => w.startsWith(normQuery))) {
        score = 90;
      } else if (normName.includes(normQuery)) {
        score = 70;
      } else if (normCat.includes(normQuery)) {
        score = 50;
      } else if (normRegion.includes(normQuery)) {
        score = 40;
      } else if (normDesc.includes(normQuery)) {
        score = 30;
      }

      if (score === 0 && queryTokens.length > 1) {
        const fullHaystack = normName + ' ' + normRegion + ' ' + normCat + ' ' + normDesc;
        const allTokensFound = queryTokens.every((tok) => fullHaystack.includes(tok));
        if (allTokensFound) {
          score = 35;
        }
      }

      const dist = userCoords ? haversineDistanceKm(userCoords, place.coords) : 0;
      return { place, score, dist };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (userCoords && sortByDistance) {
        if (Math.abs(b.score - a.score) <= 30) {
          return a.dist - b.dist;
        }
      }
      return b.score - a.score || a.place.name.localeCompare(b.place.name);
    });

  return scored.slice(0, limit).map((s) => s.place);
}

export function getCountryFlag(country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR'): string {
  switch (country) {
    case 'LU':
      return '🇱🇺';
    case 'BE':
      return '🇧🇪';
    case 'DE':
      return '🇩🇪';
    case 'NL':
      return '🇳🇱';
    case 'FR':
      return '🇫🇷';
    default:
      return '📍';
  }
}

export function getCountryLabel(country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR'): string {
  switch (country) {
    case 'LU':
      return 'Luxembourg';
    case 'BE':
      return 'Belgique';
    case 'DE':
      return 'Allemagne';
    case 'NL':
      return 'Pays-Bas';
    case 'FR':
      return 'France';
    default:
      return '';
  }
}
