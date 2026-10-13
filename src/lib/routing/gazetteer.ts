export interface RegionalZone {
  id: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  name: string;
  flag: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const REGIONAL_ZONES: RegionalZone[] = [
  { id: 'ALL', name: 'Grande Région (200 km)', flag: '🇪🇺', center: [6.1319, 49.6116], zoom: 8 },
  { id: 'LU', name: 'Luxembourg', flag: '🇱🇺', center: [6.1319, 49.6116], zoom: 10 },
  { id: 'BE', name: 'Ardennes (Belgique)', flag: '🇧🇪', center: [5.7890, 50.1320], zoom: 9 },
  { id: 'DE', name: 'Eifel & Mosel (Allemagne)', flag: '🇩🇪', center: [6.6420, 49.7580], zoom: 9 },
  { id: 'NL', name: 'Zuid-Limburg (Pays-Bas)', flag: '🇳🇱', center: [5.8650, 50.8250], zoom: 10 },
  { id: 'FR', name: 'Lorraine (France)', flag: '🇫🇷', center: [6.1757, 49.2500], zoom: 9 },
];

export interface PlaceEntry {
  key: string;
  name: string;
  country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  region: string;
  coords: [number, number]; // [lon, lat]
}

// Référentiel géographique de points d'intérêt dans un rayon de 200 km
export const GAZETTEER: PlaceEntry[] = [
  // 🇱🇺 LUXEMBOURG
  { key: 'luxembourg', name: 'Luxembourg-Ville', country: 'LU', region: 'Centre / Alzette', coords: [6.1319, 49.6116] },
  { key: 'mullerthal', name: 'Mullerthal', country: 'LU', region: 'Petite Suisse luxembourgeoise', coords: [6.2890, 49.7910] },
  { key: 'echternach', name: 'Echternach', country: 'LU', region: 'Vallée de la Sûre', coords: [6.4180, 49.8120] },
  { key: 'vianden', name: 'Vianden', country: 'LU', region: 'Vallée de l’Our', coords: [6.2080, 49.9340] },
  { key: 'clervaux', name: 'Clervaux', country: 'LU', region: 'Ardennes luxembourgeoises (Éislek)', coords: [6.0300, 50.0540] },
  { key: 'esch-sur-alzette', name: 'Esch-sur-Alzette', country: 'LU', region: 'Terres Rouges', coords: [5.9810, 49.4960] },
  { key: 'esch-sur-sure', name: 'Esch-sur-Sûre', country: 'LU', region: 'Lac de la Haute-Sûre', coords: [5.9350, 49.9110] },
  { key: 'remich', name: 'Remich', country: 'LU', region: 'Moselle luxembourgeoise', coords: [6.3680, 49.5440] },
  { key: 'schengen', name: 'Schengen', country: 'LU', region: '3 Frontières / Moselle', coords: [6.3650, 49.4710] },
  { key: 'beaufort', name: 'Beaufort', country: 'LU', region: 'Petite Suisse / Mullerthal', coords: [6.2910, 49.8350] },
  { key: 'larochette', name: 'Larochette', country: 'LU', region: 'Vallée de l’Ernz Blanche', coords: [6.2200, 49.7850] },
  { key: 'diekirch', name: 'Diekirch', country: 'LU', region: 'Vallée de la Sûre', coords: [6.1550, 49.8680] },
  { key: 'mamer', name: 'Mamer', country: 'LU', region: 'Vallée de la Mamer', coords: [6.0240, 49.6280] },
  { key: 'mersch', name: 'Mersch', country: 'LU', region: 'Vallée des 7 Châteaux', coords: [6.1060, 49.7490] },
  { key: 'wiltz', name: 'Wiltz', country: 'LU', region: 'Ardennes luxembourgeoises', coords: [5.9320, 49.9670] },
  { key: 'ettelbruck', name: 'Ettelbruck', country: 'LU', region: 'Cœur du Nord', coords: [6.1040, 49.8470] },
  { key: 'grevenmacher', name: 'Grevenmacher', country: 'LU', region: 'Moselle luxembourgeoise', coords: [6.4410, 49.6800] },
  { key: 'dudelange', name: 'Dudelange', country: 'LU', region: 'Haard / Terres Rouges', coords: [6.0840, 49.4800] },
  { key: 'differdange', name: 'Differdange', country: 'LU', region: 'Terres Rouges', coords: [5.8910, 49.5240] },
  { key: 'mondorf', name: 'Mondorf-les-Bains', country: 'LU', region: 'Domaine Thermal', coords: [6.2810, 49.5040] },
  { key: 'hollenfels', name: 'Hollenfels', country: 'LU', region: 'Vallée de l’Eisch', coords: [6.0510, 49.7120] },
  { key: 'troisvierges', name: 'Troisvierges', country: 'LU', region: 'Nord Éislek / Vennbahn', coords: [5.9900, 50.1200] },
  { key: 'redange', name: 'Redange-sur-Attert', country: 'LU', region: 'Vallée de l’Attert', coords: [5.8900, 49.7650] },
  { key: 'junglinster', name: 'Junglinster', country: 'LU', region: 'Plateau du Grès', coords: [6.2510, 49.7120] },

  // 🇧🇪 BELGIQUE
  { key: 'arlon', name: 'Arlon', country: 'BE', region: 'Pays d’Arlon / Gaume', coords: [5.8130, 49.6830] },
  { key: 'bastogne', name: 'Bastogne', country: 'BE', region: 'Ardenne centrale', coords: [5.7180, 50.0030] },
  { key: 'bouillon', name: 'Bouillon', country: 'BE', region: 'Vallée de la Semois', coords: [5.0680, 49.7950] },
  { key: 'houffalize', name: 'Houffalize', country: 'BE', region: 'Vallée des Deux Ourthes', coords: [5.7890, 50.1320] },
  { key: 'saint-vith', name: 'Saint-Vith', country: 'BE', region: 'Cantons de l’Est / Vennbahn', coords: [6.1250, 50.2850] },
  { key: 'malmedy', name: 'Malmedy', country: 'BE', region: 'Pied des Hautes Fagnes', coords: [6.0250, 50.4250] },
  { key: 'spa', name: 'Spa', country: 'BE', region: 'Pays des Sources', coords: [5.8650, 50.4920] },
  { key: 'hautes-fagnes', name: 'Hautes Fagnes', country: 'BE', region: 'Signal de Botrange', coords: [6.0950, 50.5010] },
  { key: 'durbuy', name: 'Durbuy', country: 'BE', region: 'Vallée de l’Ourthe', coords: [5.4560, 50.3520] },
  { key: 'la-roche', name: 'La Roche-en-Ardenne', country: 'BE', region: 'Cœur de l’Ourthe', coords: [5.5750, 50.1820] },
  { key: 'dinant', name: 'Dinant', country: 'BE', region: 'Vallée de la Haute Meuse', coords: [4.9120, 50.2610] },
  { key: 'namur', name: 'Namur', country: 'BE', region: 'Confluent Meuse et Sambre', coords: [4.8675, 50.4674] },
  { key: 'liege', name: 'Liège', country: 'BE', region: 'Bassin mosan', coords: [5.5797, 50.6326] },
  { key: 'neufchateau', name: 'Neufchâteau', country: 'BE', region: 'Ardenne méridionale', coords: [5.4350, 49.8400] },
  { key: 'virton', name: 'Virton', country: 'BE', region: 'Gaume', coords: [5.5320, 49.5680] },
  { key: 'ciney', name: 'Ciney', country: 'BE', region: 'Condroz', coords: [5.1010, 50.2950] },
  { key: 'stavelot', name: 'Stavelot', country: 'BE', region: 'Vallée de l’Amblève', coords: [5.9310, 50.3950] },
  { key: 'vielsalm', name: 'Vielsalm', country: 'BE', region: 'Val de Salm', coords: [5.9180, 50.2850] },
  { key: 'florenville', name: 'Florenville', country: 'BE', region: 'Gaume / Chassepierre', coords: [5.3120, 49.7020] },
  { key: 'vresse', name: 'Vresse-sur-Semois', country: 'BE', region: 'Basse Semois', coords: [4.9350, 49.8730] },
  { key: 'rochefort', name: 'Rochefort', country: 'BE', region: 'Famenne', coords: [5.2210, 50.1550] },
  { key: 'marche', name: 'Marche-en-Famenne', country: 'BE', region: 'Famenne', coords: [5.3440, 50.2270] },
  { key: 'verviers', name: 'Verviers', country: 'BE', region: 'Pays de Vesdre', coords: [5.8660, 50.5930] },
  { key: 'eupen', name: 'Eupen', country: 'BE', region: 'Barrage de la Vesdre / Fagnes', coords: [6.0330, 50.6300] },
  { key: 'aywaille', name: 'Aywaille', country: 'BE', region: 'Vallée de l’Amblève & Ninglinspo', coords: [5.6740, 50.4730] },
  { key: 'theux', name: 'Theux', country: 'BE', region: 'Franchimont', coords: [5.8120, 50.5330] },

  // 🇩🇪 ALLEMAGNE
  { key: 'trier', name: 'Trier (Trèves)', country: 'DE', region: 'Vallée de la Moselle', coords: [6.6420, 49.7580] },
  { key: 'saarschleife', name: 'Saarschleife / Mettlach', country: 'DE', region: 'Boucle de la Sarre & Cloef', coords: [6.5920, 49.4950] },
  { key: 'saarbrucken', name: 'Saarbrücken', country: 'DE', region: 'Bassin sarrois', coords: [6.9969, 49.2354] },
  { key: 'bitburg', name: 'Bitburg', country: 'DE', region: 'Bitburger Gutland', coords: [6.5250, 49.9740] },
  { key: 'prum', name: 'Prüm', country: 'DE', region: 'Prümer Kalkmulde / Schneifel', coords: [6.4250, 50.2080] },
  { key: 'daun', name: 'Daun (Vulkaneifel)', country: 'DE', region: 'Lacs volcaniques des Maare', coords: [6.8350, 50.1980] },
  { key: 'gerolstein', name: 'Gerolstein', country: 'DE', region: 'Falaises dolomitiques de l’Eifel', coords: [6.6620, 50.2240] },
  { key: 'bernkastel', name: 'Bernkastel-Kues', country: 'DE', region: 'Moyenne-Moselle viticole', coords: [7.0750, 49.9150] },
  { key: 'cochem', name: 'Cochem', country: 'DE', region: 'Canyon de la Moselle', coords: [7.1680, 50.1470] },
  { key: 'monschau', name: 'Monschau', country: 'DE', region: 'Hautes Fagnes / Rur', coords: [6.2420, 50.5540] },
  { key: 'rursee', name: 'Rursee / Simmerath', country: 'DE', region: 'Nationalpark Eifel', coords: [6.3850, 50.5980] },
  { key: 'aachen', name: 'Aachen (Aix-la-Chapelle)', country: 'DE', region: 'Nord-Eifel / 3 Frontières', coords: [6.0839, 50.7753] },
  { key: 'koblenz', name: 'Koblenz', country: 'DE', region: 'Confluent Rhin & Moselle', coords: [7.5978, 50.3569] },
  { key: 'saarburg', name: 'Saarburg', country: 'DE', region: 'Cascades de la Sarre', coords: [6.5500, 49.6080] },
  { key: 'merzig', name: 'Merzig', country: 'DE', region: 'Sarre verte', coords: [6.6350, 49.4440] },
  { key: 'perl', name: 'Perl', country: 'DE', region: '3 Frontières / Moselle', coords: [6.3850, 49.4730] },
  { key: 'hermeskeil', name: 'Hermeskeil', country: 'DE', region: 'Hunsrück / Hochwald', coords: [6.9500, 49.6580] },
  { key: 'idar-oberstein', name: 'Idar-Oberstein', country: 'DE', region: 'Nahe / Hunsrück', coords: [7.3250, 49.7050] },
  { key: 'wittlich', name: 'Wittlich', country: 'DE', region: 'Säubrennerland', coords: [6.8870, 49.9860] },
  { key: 'zell', name: 'Zell (Mosel)', country: 'DE', region: 'Zeller Schwarze Katz', coords: [7.1830, 50.0260] },
  { key: 'blieskastel', name: 'Blieskastel', country: 'DE', region: 'Réserve de Biosphère Bliesgau', coords: [7.2550, 49.2380] },
  { key: 'schleiden', name: 'Schleiden', country: 'DE', region: 'Nationalpark Eifel / Dreiborn', coords: [6.4710, 50.5280] },

  // 🇳🇱 PAYS-BAS
  { key: 'maastricht', name: 'Maastricht', country: 'NL', region: 'Bord de Meuse / Montagne St-Pierre', coords: [5.6910, 50.8514] },
  { key: 'valkenburg', name: 'Valkenburg aan de Geul', country: 'NL', region: 'Cauberg / Carrières de marne', coords: [5.8310, 50.8650] },
  { key: 'vaals', name: 'Vaals (Drielandenpunt)', country: 'NL', region: 'Point culminant des Pays-Bas (322 m)', coords: [6.0210, 50.7710] },
  { key: 'gulpen', name: 'Gulpen-Wittem', country: 'NL', region: 'Vallée de la Gulp', coords: [5.8950, 50.8120] },
  { key: 'heuvelland', name: 'Heuvelland', country: 'NL', region: 'Collines du Sud-Limbourg', coords: [5.8650, 50.8250] },
  { key: 'heerlen', name: 'Heerlen', country: 'NL', region: 'Parc des Mines & Brunssummerheide', coords: [5.9790, 50.8880] },
  { key: 'sittard', name: 'Sittard-Geleen', country: 'NL', region: 'Grensmaas', coords: [5.8680, 50.9980] },
  { key: 'mechelen-nl', name: 'Mechelen', country: 'NL', region: 'Geuldal', coords: [5.9250, 50.7960] },
  { key: 'epen', name: 'Epen', country: 'NL', region: 'Bocages et sources du Geuldal', coords: [5.9150, 50.7750] },
  { key: 'kerkrade', name: 'Kerkrade', country: 'NL', region: 'Vallée de l’Anstelvallei', coords: [6.0630, 50.8650] },

  // 🇫🇷 FRANCE
  { key: 'thionville', name: 'Thionville', country: 'FR', region: 'Pays Thionvillois / Moselle', coords: [6.1680, 49.3580] },
  { key: 'metz', name: 'Metz', country: 'FR', region: 'Boucles de la Moselle & Mont St-Quentin', coords: [6.1757, 49.1193] },
  { key: 'nancy', name: 'Nancy', country: 'FR', region: 'Plateau de Haye & Meurthe', coords: [6.1844, 48.6921] },
  { key: 'sierck', name: 'Sierck-les-Bains', country: 'FR', region: 'Pays des 3 Frontières / Stromberg', coords: [6.3550, 49.4420] },
  { key: 'rodemack', name: 'Rodemack', country: 'FR', region: 'Petite Carcassonne Lorraine', coords: [6.2350, 49.4680] },
  { key: 'longwy', name: 'Longwy', country: 'FR', region: 'Remparts Vauban & Pays Haut', coords: [5.7620, 49.5200] },
  { key: 'verdun', name: 'Verdun', country: 'FR', region: 'Vallée de la Meuse & Côtes', coords: [5.3850, 49.1600] },
  { key: 'sarreguemines', name: 'Sarreguemines', country: 'FR', region: 'Vallée de la Sarre & Blies', coords: [7.0690, 49.1100] },
  { key: 'saint-avold', name: 'Saint-Avold', country: 'FR', region: 'Forêt du Warndt', coords: [6.7050, 49.1030] },
  { key: 'cattenom', name: 'Cattenom', country: 'FR', region: 'Bords de Moselle', coords: [6.2420, 49.4070] },
  { key: 'montmedy', name: 'Montmédy', country: 'FR', region: 'Citadelle de Montmédy', coords: [5.3610, 49.5180] },
];

export const LOCAL_PLACES: Record<string, [number, number]> = GAZETTEER.reduce(
  (acc, item) => {
    acc[item.key] = item.coords;
    return acc;
  },
  {} as Record<string, [number, number]>
);
