import type { RouteSuggestions, RouteTrace, ElevationPoint } from '../types';
import { CURATED_TRACKS } from './curatedTracksData';
import {
  catmullRomSpline,
  calculatePathDistance,
  computeElevationProfile,
  generateTurnInstructions,
  calculateRouteDifficulty,
  computeRoadBreakdown,
  generateTrackSegments,
  haversineDistance,
} from './geoUtils';

import { GENERATED_GPX_CATALOG } from './generatedGpxCatalog';
import { resolveRouteSource } from './routeSourceResolver';

export interface CatalogItem {
  route: RouteSuggestions;
  trace: RouteTrace;
  tags: string[];
  region: string;
  country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
}

function getDefaultSourceUrl(country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR'): string {
  switch (country) {
    case 'LU':
      return 'https://www.visitluxembourg.com';
    case 'BE':
      return 'https://www.visitwallonia.be';
    case 'DE':
      return 'https://www.eifel.info';
    case 'NL':
      return 'https://www.visitzuidlimburg.nl';
    case 'FR':
      return 'https://www.tourisme-meuse.com';
  }
}

function getDefaultSourceLabel(country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR'): string {
  switch (country) {
    case 'LU':
      return 'Visit Luxembourg Officiel';
    case 'BE':
      return 'Visit Wallonia Officiel';
    case 'DE':
      return 'Eifel & Mosel Tourismus';
    case 'NL':
      return 'Visit Zuid-Limburg Officieel';
    case 'FR':
      return 'Tourisme Meuse & Lorraine';
  }
}

function buildCuratedRoute(params: {
  id: string;
  title: string;
  description: string;
  activity: 'bike' | 'hike';
  country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  region: string;
  tags: string[];
  surfaceType: string;
  surfaceDistribution: { type: string; percentage: number }[];
  highlights: string[];
  rating?: number;
  reviews?: number;
  baseGain: number;
  anchors: [number, number][]; // [lon, lat]
  targetDistanceKm?: number;
  sourceUrl?: string;
  sourceLabel?: string;
}): CatalogItem {
  const curated = CURATED_TRACKS[params.id];
  let finalCoords: [number, number][];
  let totalMeters: number;
  let elevProfile: ElevationPoint[];
  let actualGain: number;

  if (curated && curated.coords && curated.coords.length > 0) {
    // 100% authentic GPS points directly following OpenStreetMap trails and ways
    finalCoords = curated.coords.map(([lon, lat]) => [lon, lat] as [number, number]);
    totalMeters = curated.length;
    actualGain = curated.ascent;

    elevProfile = [];
    let cumDistM = 0;
    for (let i = 0; i < curated.coords.length; i++) {
      if (i > 0) {
        cumDistM += haversineDistance(
          [finalCoords[i - 1][0], finalCoords[i - 1][1]],
          [finalCoords[i][0], finalCoords[i][1]]
        );
      }
      elevProfile.push({
        distance: Number((cumDistM / 1000).toFixed(1)),
        elevation: curated.coords[i][2],
      });
    }
  } else {
    finalCoords = params.anchors;
    totalMeters = calculatePathDistance(params.anchors);
    const elev = computeElevationProfile(params.anchors, params.baseGain);
    elevProfile = elev.profile;
    actualGain = elev.gain;
  }

  const distKm = totalMeters / 1000;
  const speedKmH = params.activity === 'bike' ? 20 : 4.5;
  const durationSec = Math.round((distKm / speedKmH) * 3600 + (actualGain / 400) * 1800);

  const minElev = elevProfile.length > 0 ? Math.min(...elevProfile.map((p) => p.elevation)) : 100;
  const maxElev = elevProfile.length > 0 ? Math.max(...elevProfile.map((p) => p.elevation)) : 400;

  const instructions = generateTurnInstructions(finalCoords, params.activity);
  const difficulty = calculateRouteDifficulty(distKm, actualGain, params.activity);
  const roadBreakdown = computeRoadBreakdown(distKm, params.surfaceDistribution, params.activity);
  const segments = generateTrackSegments(finalCoords, roadBreakdown.carFreePercentage);

  const route: RouteSuggestions = {
    id: params.id,
    type: 'public',
    title: params.title,
    description: params.description,
    highlights: params.highlights,
    surfaceType: params.surfaceType,
    difficulty,
    elevationGain: actualGain,
    elevationLoss: actualGain,
    minElevation: minElev,
    maxElevation: maxElev,
    activity: params.activity,
    country: params.country,
    regionName: params.region,
    surfaceDistribution: params.surfaceDistribution,
    waypoints:
      finalCoords.length >= 2
        ? [finalCoords[0], finalCoords[Math.floor(finalCoords.length / 2)], finalCoords[finalCoords.length - 1]]
        : params.anchors,
    tags: params.tags,
    sourceUrl:
      params.sourceUrl ||
      resolveRouteSource({
        id: params.id,
        title: params.title,
        activity: params.activity,
        country: params.country,
        coords: finalCoords,
      }).sourceUrl,
    sourceLabel:
      params.sourceLabel ||
      resolveRouteSource({
        id: params.id,
        title: params.title,
        activity: params.activity,
        country: params.country,
        coords: finalCoords,
      }).sourceLabel,
    geoportailUrl: resolveRouteSource({
      id: params.id,
      title: params.title,
      activity: params.activity,
      country: params.country,
      coords: finalCoords,
    }).geoportailUrl,
  };

  const trace: RouteTrace = {
    distance: Math.round(totalMeters),
    duration: durationSec,
    coordinates: finalCoords,
    elevationProfile: elevProfile,
    segments,
  };

  return {
    route,
    trace,
    tags: params.tags,
    region: params.region,
    country: params.country,
  };
}

const CURATED_STATIC_ROUTES: CatalogItem[] = [
  // ==========================================
  // 🇱🇺 LUXEMBOURG (Cœur de la Grande Région)
  // ==========================================
  buildCuratedRoute({
    id: 'lux_mamer_bike_34',
    title: 'Boucle de la Vallée de la Mamer & Voies Vertes',
    description: 'Une superbe boucle panoramique longeant la vallée encaissée de la Mamer, alternant chemins stabilisés et pistes cyclables boisées très peu fréquentées.',
    activity: 'bike',
    country: 'LU',
    region: 'Vallée de la Mamer / Centre',
    tags: ['water', 'forest', 'low_traffic', 'gravel'],
    surfaceType: 'Chemins stabilisés & Piste cyclable',
    surfaceDistribution: [
      { type: 'Piste cyclable PC', percentage: 55 },
      { type: 'Chemin gravillonné', percentage: 35 },
      { type: 'Petite route forestière', percentage: 10 },
    ],
    highlights: ['Vallée de la Mamer', 'Passerelles en bois', 'Château de Schoenfels', 'Forêt domaniale de Kopstal'],
    rating: 4.8,
    reviews: 86,
    baseGain: 340,
    anchors: [
      [6.1319, 49.6116],
      [6.1020, 49.6420],
      [6.0750, 49.6850],
      [6.1150, 49.7150],
      [6.1680, 49.6920],
      [6.1550, 49.6380],
      [6.1319, 49.6116],
    ],
    targetDistanceKm: 34.5,
  }),

  buildCuratedRoute({
    id: 'lux_mullerthal_hike_14',
    title: 'Mullerthal Trail — Circuit des Roches et Cascades',
    description: 'Randonnée incontournable de la Petite Suisse luxembourgeoise entre gorges rocheuses spectaculaires, cascades moussues et sentiers sauvages.',
    activity: 'hike',
    country: 'LU',
    region: 'Mullerthal / Petite Suisse',
    tags: ['forest', 'water', 'hilly'],
    surfaceType: 'Sentier forestier & Escaliers rocheux',
    surfaceDistribution: [
      { type: 'Sentier naturel moussé', percentage: 80 },
      { type: 'Chemin forestier', percentage: 15 },
      { type: 'Passerelles en bois', percentage: 5 },
    ],
    highlights: ['Cascade du Schiessentümpel', 'Failles rocheuses de Kuelscheier', 'Gorges du Loup', 'Belvédères d’Echternach'],
    rating: 4.9,
    reviews: 142,
    baseGain: 420,
    anchors: [
      [6.2890, 49.7910],
      [6.2750, 49.8120],
      [6.3120, 49.8250],
      [6.3450, 49.8050],
      [6.3210, 49.7820],
      [6.2890, 49.7910],
    ],
    targetDistanceKm: 9.2,
  }),

  buildCuratedRoute({
    id: 'lux_echternach_gorges_hike_9',
    title: 'Sentier des Gorges du Loup & Lac d’Echternach',
    description: 'Circuit pédestre incontournable au cœur de la Petite Suisse, traversant le défilé vertigineux des Gorges du Loup et les rives calmes du lac.',
    activity: 'hike',
    country: 'LU',
    region: 'Petite Suisse / Echternach',
    tags: ['forest', 'water', 'hilly', 'gravel'],
    surfaceType: 'Sentier en terre, marches taillées dans le grès & sous-bois',
    surfaceDistribution: [
      { type: 'Sentier rocheux balisé (Mullerthal Trail E1)', percentage: 75 },
      { type: 'Chemin forestier stabilisé', percentage: 25 },
    ],
    highlights: ['Passage impressionnant des Gorges du Loup (Wolfsschlucht)', 'Point de vue Trooskneppchen', 'Abbaye historique d’Echternach', 'Rives ombragées du lac'],
    rating: 4.9,
    reviews: 188,
    baseGain: 252,
    anchors: [
      [6.4180, 49.8120],
      [6.4020, 49.8180],
      [6.3880, 49.8050],
      [6.4050, 49.8010],
      [6.4180, 49.8120],
    ],
    targetDistanceKm: 9.0,
  }),

  buildCuratedRoute({
    id: 'lux_vianden_our_hike_12',
    title: 'Boucle de l’Our & Crêtes du Château de Vianden',
    description: 'Randonnée panoramique suivant les gorges de l’Our jusqu’au belvédère médiéval du château fort de Vianden.',
    activity: 'hike',
    country: 'LU',
    region: 'Vallée de l’Our / Éislek & Vianden',
    tags: ['forest', 'water', 'hilly'],
    surfaceType: 'Sentiers de crête schisteux & chemins forestiers de vallée',
    surfaceDistribution: [
      { type: 'Sentier de crête naturel (Ourdall Promenade)', percentage: 70 },
      { type: 'Chemin forestier de berge', percentage: 30 },
    ],
    highlights: ['Vue plongeante sur le château féodal de Vianden', 'Maison de Victor Hugo', 'Gorges sauvages de l’Our', 'Télésiège et forêt primitive'],
    rating: 4.8,
    reviews: 126,
    baseGain: 309,
    anchors: [
      [6.2080, 49.9340],
      [6.2250, 49.9480],
      [6.2420, 49.9380],
      [6.2200, 49.9250],
      [6.2080, 49.9340],
    ],
    targetDistanceKm: 9.5,
  }),

  buildCuratedRoute({
    id: 'lux_alzette_bike_47',
    title: 'Tour des 3 Vallées d’Alzette & Sentiers Calmes',
    description: 'Grand circuit cyclo au départ de la capitale suivant le cours sinueux de l’Alzette, avec traversées de villages historiques et segments en sous-bois.',
    activity: 'bike',
    country: 'LU',
    region: 'Alzette / Mersch',
    tags: ['paved', 'low_traffic', 'flat', 'water'],
    surfaceType: '100% Asphalte & Voie Verte PC',
    surfaceDistribution: [
      { type: 'Voie verte cyclable (PC15)', percentage: 75 },
      { type: 'Petites routes de campagne', percentage: 25 },
    ],
    highlights: ['Bords de l’Alzette canalisée', 'Remparts du Pfaffenthal', 'Château de Colmar-Berg', 'Vergers traditionnels'],
    rating: 4.7,
    reviews: 64,
    baseGain: 280,
    anchors: [
      [6.1319, 49.6116],
      [6.1550, 49.6650],
      [6.1150, 49.7420],
      [6.0650, 49.7820],
      [6.0120, 49.7210],
      [6.0580, 49.6450],
      [6.1319, 49.6116],
    ],
    targetDistanceKm: 47.0,
  }),

  buildCuratedRoute({
    id: 'lux_sure_hike_18',
    title: 'Lac de la Haute-Sûre & Crêtes d’Esch-sur-Sûre',
    description: 'Randonnée emblématique de l’Éislek ardennais surplombant le plus grand lac artificiel du Luxembourg et son méandre féodal.',
    activity: 'hike',
    country: 'LU',
    region: 'Haute-Sûre / Ardennes luxembourgeoises',
    tags: ['water', 'forest', 'hilly'],
    surfaceType: 'Sentier rocheux & Sous-bois d’ardoisières',
    surfaceDistribution: [
      { type: 'Sentier de crête schisteux', percentage: 70 },
      { type: 'Chemin de rive', percentage: 30 },
    ],
    highlights: ['Méandre et ruines du château d’Esch-sur-Sûre', 'Plages naturelles du lac', 'Points de vue panoramiques', 'Forêts de chênes'],
    rating: 4.9,
    reviews: 95,
    baseGain: 560,
    anchors: [
      [5.9350, 49.9110],
      [5.9120, 49.9250],
      [5.8750, 49.9050],
      [5.8950, 49.8850],
      [5.9450, 49.8980],
      [5.9350, 49.9110],
    ],
    targetDistanceKm: 8.8,
  }),

  buildCuratedRoute({
    id: 'lux_moselle_bike_58',
    title: 'Véloroute des Coteaux de la Moselle & Schengen',
    description: 'Parcours roulant et panoramique le long de la Moselle luxembourgeoise entre vignobles en terrasses, villages vignerons et monument de Schengen.',
    activity: 'bike',
    country: 'LU',
    region: 'Moselle luxembourgeoise / Schengen',
    tags: ['water', 'paved', 'flat', 'low_traffic'],
    surfaceType: '100% Asphalte & Piste cyclable PC3',
    surfaceDistribution: [
      { type: 'Piste cyclable de la Moselle', percentage: 80 },
      { type: 'Routes viticoles partagées', percentage: 20 },
    ],
    highlights: ['Monument de Schengen & Musée européen', 'Coteaux viticoles de Remich', 'Réserve naturelle Haff Réimech', 'Bord du fleuve'],
    rating: 4.8,
    reviews: 110,
    baseGain: 310,
    anchors: [
      [6.3650, 49.4710],
      [6.3680, 49.5440],
      [6.3890, 49.6120],
      [6.3250, 49.6350],
      [6.2950, 49.5520],
      [6.3650, 49.4710],
    ],
    targetDistanceKm: 58.0,
  }),

  // ==========================================
  // 🇧🇪 BELGIQUE (Ardennes belges, RAVeL, Fagnes <200 km)
  // ==========================================
  buildCuratedRoute({
    id: 'be_vennbahn_bike_46',
    title: 'Vennbahn — Voie Verte Mythique des Cantons de l’Est',
    description: 'Une des plus belles et longues pistes cyclables ferroviaires d’Europe (RAVeL), serpentant à travers les paysages préservés des Ardennes belges.',
    activity: 'bike',
    country: 'BE',
    region: 'Ardennes belges / Saint-Vith & Malmedy',
    tags: ['forest', 'paved', 'low_traffic', 'flat'],
    surfaceType: '100% Asphalte réservé aux mobilités douces',
    surfaceDistribution: [
      { type: 'Voie verte Vennbahn (RAVeL)', percentage: 90 },
      { type: 'Liaison cyclable balisée', percentage: 10 },
    ],
    highlights: ['Anciens viaducs ferroviaires et gares', 'Tourbières des Fagnes', 'Ambiance transfrontalière', 'Pente douce constante <2%'],
    rating: 4.9,
    reviews: 185,
    baseGain: 320,
    anchors: [
      [6.1250, 50.2850],
      [6.1550, 50.3420],
      [6.0950, 50.4150],
      [6.0250, 50.4350],
      [6.0450, 50.3320],
      [6.1250, 50.2850],
    ],
    targetDistanceKm: 46.0,
  }),

  buildCuratedRoute({
    id: 'be_semois_bouillon_hike_16',
    title: 'Boucle de la Semois Sauvage & Tombeau du Géant',
    description: 'Randonnée mythique au départ de Bouillon dans la vallée sinueuse de la Semois, célèbre pour ses méandres grandioses et ses ponts de claies.',
    activity: 'hike',
    country: 'BE',
    region: 'Ardennes / Bouillon & Vallée de la Semois',
    tags: ['water', 'forest', 'hilly'],
    surfaceType: 'Sentier forestier rocheux & Sentier de crête',
    surfaceDistribution: [
      { type: 'Sentier sauvage de berge', percentage: 75 },
      { type: 'Chemin forestier de crête', percentage: 25 },
    ],
    highlights: ['Point de vue du Tombeau du Géant', 'Château fort de Bouillon', 'Passerelle suspendue de l’Épine', 'Forêts ardennaises denses'],
    rating: 4.9,
    reviews: 160,
    baseGain: 520,
    anchors: [
      [5.0680, 49.7950],
      [5.0420, 49.8150],
      [5.0150, 49.8320],
      [5.0550, 49.8450],
      [5.0950, 49.8180],
      [5.0680, 49.7950],
    ],
    targetDistanceKm: 8.5,
  }),

  buildCuratedRoute({
    id: 'be_botrange_fagnes_hike_13',
    title: 'Tour des Hautes Fagnes & Signal de Botrange',
    description: 'Immersion sur les caillebotis au point culminant de Belgique (694m). Un paysage de toundra subalpine unique avec tourbières et landes de bruyère.',
    activity: 'hike',
    country: 'BE',
    region: 'Hautes Fagnes / Botrange & Malmedy',
    tags: ['forest', 'water', 'low_traffic', 'flat'],
    surfaceType: 'Caillebotis en bois & Sentier tourbeux',
    surfaceDistribution: [
      { type: 'Caillebotis en bois surélevés', percentage: 60 },
      { type: 'Sentier de lande en terre', percentage: 40 },
    ],
    highlights: ['Signal de Botrange (694m)', 'Vallée encaissée de la Roer', 'Plateau de la Fagne Wallonne', 'Pont de Boveire'],
    rating: 4.8,
    reviews: 130,
    baseGain: 220,
    anchors: [
      [6.0950, 50.5010],
      [6.125, 50.518],
      [6.155, 50.505],
      [6.135, 50.482],
      [6.082, 50.489],
      [6.095, 50.501],
    ],
    targetDistanceKm: 9.0,
  }),

  buildCuratedRoute({
    id: 'be_houffalize_gravel_bike_38',
    title: 'Capitale du VTT : Circuit des 2 Ourthes & Houffalize',
    description: 'Parcours gravel & VTT de premier ordre au cœur de la vallée des Deux Ourthes, entre forêts profondes, pistes forestières larges et petits gués.',
    activity: 'bike',
    country: 'BE',
    region: 'Ardennes / Houffalize & Bastogne',
    tags: ['gravel', 'forest', 'water', 'hilly'],
    surfaceType: 'Chemins de terre, gravier & pistes forestières',
    surfaceDistribution: [
      { type: 'Chemins forestiers en gravier', percentage: 65 },
      { type: 'Pistes herbeuses et sentiers', percentage: 25 },
      { type: 'Liaison asphalte', percentage: 10 },
    ],
    highlights: ['Confluence des Deux Ourthes', 'Single-tracks mythiques de Coupe du Monde', 'Étang de Nisramont', 'Hêtres centenaires'],
    rating: 4.8,
    reviews: 92,
    baseGain: 640,
    anchors: [
      [5.7890, 50.1320],
      [5.7420, 50.1550],
      [5.6950, 50.1420],
      [5.7250, 50.1050],
      [5.7750, 50.1150],
      [5.7890, 50.1320],
    ],
    targetDistanceKm: 38.0,
  }),

  // ==========================================
  // 🇩🇪 ALLEMAGNE (Eifel, Mosel, Saarschleife <200 km)
  // ==========================================
  buildCuratedRoute({
    id: 'de_saarschleife_hike_15',
    title: 'Boucle de la Saarschleife & Panoramaweg Cloef',
    description: 'La plus célèbre merveille naturelle de la Sarre : la spectaculaire boucle à 180° du fleuve, observée depuis les falaises de la Cloef.',
    activity: 'hike',
    country: 'DE',
    region: 'Sarre / Mettlach & Orscholz',
    tags: ['water', 'forest', 'hilly'],
    surfaceType: 'Sentier forestier balisé & Sentier de falaise',
    surfaceDistribution: [
      { type: 'Sentier Saar-Hunsrück-Steig', percentage: 70 },
      { type: 'Chemin de rive de la Sarre', percentage: 30 },
    ],
    highlights: ['Belvédère de la Cloef (vue plongeante)', 'Sentier des cimes (Baumwipfelpfad)', 'Château de Montclair', 'Bac à passagers'],
    rating: 4.9,
    reviews: 215,
    baseGain: 460,
    anchors: [
      [6.5350, 49.4980],
      [6.5520, 49.5080],
      [6.5780, 49.5150],
      [6.5920, 49.4950],
      [6.5620, 49.4820],
      [6.5350, 49.4980],
    ],
    targetDistanceKm: 8.4,
  }),

  buildCuratedRoute({
    id: 'de_maare_mosel_bike_52',
    title: 'Vulkaneifel & Maare-Mosel Radweg',
    description: 'Voie verte splendide sur ancienne voie ferrée traversant les lacs volcaniques (Maare) de Daun jusqu’aux méandres de la Moselle à Bernkastel.',
    activity: 'bike',
    country: 'DE',
    region: 'Eifel volcanique / Daun & Bernkastel',
    tags: ['water', 'paved', 'low_traffic', 'flat'],
    surfaceType: '100% Asphalte & Ancienne voie ferrée',
    surfaceDistribution: [
      { type: 'Voie cyclable fermée aux voitures', percentage: 85 },
      { type: 'Petites routes de vignerons', percentage: 15 },
    ],
    highlights: ['Maare (lacs de cratères volcaniques bleus)', 'Tunnels ferroviaires éclairés', 'Viaducs sur les vallées', 'Vignobles du Riesling'],
    rating: 4.8,
    reviews: 140,
    baseGain: 380,
    anchors: [
      [6.8350, 50.1980],
      [6.8920, 50.1550],
      [6.9550, 50.0820],
      [7.0120, 49.9850],
      [6.9650, 50.0250],
      [6.8950, 50.1120],
      [6.8350, 50.1980],
    ],
    targetDistanceKm: 52.0,
  }),

  buildCuratedRoute({
    id: 'de_trier_moselsteig_hike_16',
    title: 'Moselsteig & Rochers Rouges de Trèves (Trier)',
    description: 'Randonnée spectaculaire surplombant la plus ancienne ville d’Allemagne, cheminant entre falaises de grès rouge et coteaux viticoles plongeants.',
    activity: 'hike',
    country: 'DE',
    region: 'Mosel / Trèves (Trier)',
    tags: ['water', 'hilly', 'forest'],
    surfaceType: 'Sentier escarpé en grès & Chemins de vignes',
    surfaceDistribution: [
      { type: 'Sentier du Moselsteig', percentage: 70 },
      { type: 'Chemin empierré de vignerons', percentage: 30 },
    ],
    highlights: ['Vue sur la Porta Nigra et la Moselle', 'Falaises rouges de Weisshaus', 'Vallée du Biewerbach', 'Terrasses de Riesling'],
    rating: 4.8,
    reviews: 115,
    baseGain: 490,
    anchors: [
      [6.6420, 49.7580],
      [6.6250, 49.7820],
      [6.6550, 49.8050],
      [6.6850, 49.7920],
      [6.6680, 49.7650],
      [6.6420, 49.7580],
    ],
    targetDistanceKm: 9.2,
  }),

  buildCuratedRoute({
    id: 'de_rursee_eifel_bike_44',
    title: 'Tour des Fjords de l’Eifel & Lac de Rursee',
    description: 'Une grande boucle d’évasion dans le Parc National de l’Eifel le long des criques turquoise du lac de retenue du Rursee.',
    activity: 'bike',
    country: 'DE',
    region: 'Nationalpark Eifel / Rursee & Simmerath',
    tags: ['water', 'forest', 'gravel', 'low_traffic'],
    surfaceType: 'Chemins stabilisés de berge & Voie cyclable',
    surfaceDistribution: [
      { type: 'Pistes forestières stabilisées', percentage: 70 },
      { type: 'Pistes cyclables asphaltées', percentage: 30 },
    ],
    highlights: ['Barrage historique de Schwammenauel', 'Presqu’île de Kermeter', 'Village à colombages de Monschau à proximité', 'Forêt primitive protégée'],
    rating: 4.9,
    reviews: 168,
    baseGain: 510,
    anchors: [
      [6.3850, 50.5980],
      [6.4250, 50.6250],
      [6.4650, 50.6120],
      [6.4350, 50.5650],
      [6.3950, 50.5720],
      [6.3850, 50.5980],
    ],
    targetDistanceKm: 44.0,
  }),

  // ==========================================
  // 🇳🇱 PAYS-BAS (Zuid-Limburg & Heuvelland ~160-180 km)
  // ==========================================
  buildCuratedRoute({
    id: 'nl_mergelland_bike_54',
    title: 'Mergellandroute & Cauberg Cyclo (Zuid-Limburg)',
    description: 'La boucle mythique du cyclisme néerlandais (Amstel Gold Race) à travers les collines verdoyantes du Limbourg, ses maisons en marne et ses monts réputés.',
    activity: 'bike',
    country: 'NL',
    region: 'Zuid-Limburg / Valkenburg & Maastricht',
    tags: ['paved', 'hilly', 'low_traffic'],
    surfaceType: '100% Asphalte & Fietspad de qualité néerlandaise',
    surfaceDistribution: [
      { type: 'Pistes cyclables néerlandaises séparées (Fietspad)', percentage: 65 },
      { type: 'Petites routes champêtres asphaltées', percentage: 35 },
    ],
    highlights: ['Côte mythique du Cauberg', 'Château fort de Valkenburg', 'Vergers de pommiers du Limbourg', 'Maisons traditionnelles en pierre de marne'],
    rating: 4.9,
    reviews: 195,
    baseGain: 520,
    anchors: [
      [5.8310, 50.8650],
      [5.8750, 50.8420],
      [5.9120, 50.7950],
      [5.8650, 50.7750],
      [5.7950, 50.8120],
      [5.8310, 50.8650],
    ],
    targetDistanceKm: 54.0,
  }),

  buildCuratedRoute({
    id: 'nl_drielandenpunt_hike_12',
    title: 'Sentier du Drielandenpunt & Vaalserberg',
    description: 'Randonnée au point de rencontre des 3 frontières Pays-Bas, Belgique et Allemagne, culminant au sommet des Pays-Bas (322m).',
    activity: 'hike',
    country: 'NL',
    region: 'Vaals / Drielandenpunt (BE-NL-DE)',
    tags: ['forest', 'hilly', 'low_traffic'],
    surfaceType: 'Sentiers forestiers & Chemins creux du Limbourg',
    surfaceDistribution: [
      { type: 'Sentier forestier en terre', percentage: 75 },
      { type: 'Chemins de crête herbeux', percentage: 25 },
    ],
    highlights: ['Borne historique du Drielandenpunt', 'Point culminant des Pays-Bas (322,5 m)', 'Tour panoramique Baudouin', 'Chemins creux (holle wegen)'],
    rating: 4.7,
    reviews: 145,
    baseGain: 310,
    anchors: [
      [6.0210, 50.7710],
      [6.0350, 50.7550],
      [5.9980, 50.7420],
      [5.9820, 50.7650],
      [6.0210, 50.7710],
    ],
    targetDistanceKm: 8.0,
  }),

  buildCuratedRoute({
    id: 'nl_geuldal_bike_36',
    title: 'Vallée du Geuldal & Châteaux de Gulpen',
    description: 'Une boucle bucolique suivant les méandres de la rivière Geul, entre prairies verdoyantes, fermes fortifiées et brasseries artisanales.',
    activity: 'bike',
    country: 'NL',
    region: 'Heuvelland / Gulpen & Mechelen',
    tags: ['water', 'paved', 'flat', 'low_traffic'],
    surfaceType: 'Pistes cyclables asphaltées & Chemins ruraux calmes',
    surfaceDistribution: [
      { type: 'Fietspad le long de la rivière', percentage: 70 },
      { type: 'Routes agricoles très calmes', percentage: 30 },
    ],
    highlights: ['Rivière Geul aux eaux vives', 'Moulins à eau historiques de Mechelen', 'Château de Wittem', 'Collines bocagères'],
    rating: 4.8,
    reviews: 88,
    baseGain: 280,
    anchors: [
      [5.8950, 50.8120],
      [5.9350, 50.8250],
      [5.9550, 50.7950],
      [5.9120, 50.7650],
      [5.8750, 50.7850],
      [5.8950, 50.8120],
    ],
    targetDistanceKm: 36.5,
  }),

  // ==========================================
  // 🇫🇷 FRANCE (Lorraine & Frontière <150 km)
  // ==========================================
  buildCuratedRoute({
    id: 'fr_voiebleue_bike_42',
    title: 'Voie Bleue Moselle & Domaine des 3 Frontières',
    description: 'Voie verte continue au départ de Thionville remontant vers Sierck-les-Bains et le château des Ducs de Lorraine, face à Schengen.',
    activity: 'bike',
    country: 'FR',
    region: 'Lorraine / Thionville & Sierck-les-Bains',
    tags: ['water', 'paved', 'flat', 'low_traffic'],
    surfaceType: '100% Enrobé lisse & Voie verte V50',
    surfaceDistribution: [
      { type: 'Voie Bleue Moselle (V50)', percentage: 80 },
      { type: 'Voies calmes de village', percentage: 20 },
    ],
    highlights: ['Château des Ducs de Lorraine à Sierck', 'Carreau de mine réhabilité', 'Vue sur le vignoble du Stromberg', 'Berges fluviales calmes'],
    rating: 4.7,
    reviews: 75,
    baseGain: 190,
    anchors: [
      [6.1680, 49.3580],
      [6.2150, 49.4120],
      [6.3550, 49.4420],
      [6.3650, 49.4710],
      [6.2850, 49.4320],
      [6.1680, 49.3580],
    ],
    targetDistanceKm: 42.0,
  }),

  buildCuratedRoute({
    id: 'be_dinant_meuse_bike_38',
    title: 'Vallée de la Haute Meuse & Falaises de Dinant',
    description: 'Parcours splendide au départ de Dinant longeant le fleuve encaissé au pied des célèbres falaises de Freÿr et du château d’Anseremme.',
    activity: 'bike',
    country: 'BE',
    region: 'Ardennes belges / Dinant & Meuse',
    tags: ['water', 'paved', 'flat', 'low_traffic'],
    surfaceType: 'RAVeL Meuse & Petites routes de vallée',
    surfaceDistribution: [
      { type: 'RAVeL cyclable en rive de Meuse', percentage: 75 },
      { type: 'Routes secondaires calmes', percentage: 25 },
    ],
    highlights: ['Citadelle de Dinant et Collégiale', 'Rochers d’escalade de Freÿr', 'Château de Freÿr et ses jardins', 'Confluent de la Lesse et de la Meuse'],
    rating: 4.9,
    reviews: 112,
    baseGain: 260,
    anchors: [
      [4.9120, 50.2610],
      [4.8980, 50.2310],
      [4.8820, 50.1980],
      [4.8450, 50.2150],
      [4.8720, 50.2520],
      [4.9120, 50.2610],
    ],
    targetDistanceKm: 38.0,
  }),

  buildCuratedRoute({
    id: 'be_durbuy_ourthe_hike_15',
    title: 'Sentier Sauvage de l’Ourthe & Falaises de Durbuy',
    description: 'Randonnée escarpée et boisée autour de la plus petite ville du monde, grimpant sur l’anticlinal rocheux et les crêtes forestières de l’Ourthe.',
    activity: 'hike',
    country: 'BE',
    region: 'Ardenne / Durbuy & Val de l’Ourthe',
    tags: ['forest', 'water', 'hilly'],
    surfaceType: 'Sentiers forestiers & Chemins de crête',
    surfaceDistribution: [
      { type: 'Sentier naturel rocailleux', percentage: 70 },
      { type: 'Chemin forestier', percentage: 25 },
      { type: 'Pavés historiques', percentage: 5 },
    ],
    highlights: ['Rocher de l’Anticlinal en U', 'Belvédère de Durbuy', 'Sentiers sauvages en bord d’Ourthe', 'Sous-bois moussus de Barvaux'],
    rating: 4.8,
    reviews: 94,
    baseGain: 390,
    anchors: [
      [5.4560, 50.3520],
      [5.4780, 50.3650],
      [5.5020, 50.3480],
      [5.4850, 50.3280],
      [5.4480, 50.3390],
      [5.4560, 50.3520],
    ],
    targetDistanceKm: 8.6,
  }),

  buildCuratedRoute({
    id: 'de_cochem_mosel_bike_45',
    title: 'Boucle des Méandres de la Moselle & Reichsburg Cochem',
    description: 'Une somptueuse randonnée cyclable longeant les méandres les plus spectaculaires de la Moselle allemande, surplombée par le château de Cochem et le vignoble du Bremmer Calmont.',
    activity: 'bike',
    country: 'DE',
    region: 'Mosel / Cochem & Calmont',
    tags: ['water', 'paved', 'low_traffic'],
    surfaceType: 'Mosel-Radweg bitumé & Voies de vignes',
    surfaceDistribution: [
      { type: 'Mosel-Radweg en enrobé', percentage: 80 },
      { type: 'Chemins viticoles stabilisés', percentage: 20 },
    ],
    highlights: ['Château impérial Reichsburg Cochem', 'Bremmer Calmont (vignoble le plus pentu d’Europe)', 'Méandre de Beilstein', 'Villages à colombages'],
    rating: 4.9,
    reviews: 135,
    baseGain: 310,
    anchors: [
      [7.1680, 50.1470],
      [7.2150, 50.1250],
      [7.2420, 50.0980],
      [7.1950, 50.0820],
      [7.1350, 50.1150],
      [7.1680, 50.1470],
    ],
    targetDistanceKm: 45.0,
  }),

  buildCuratedRoute({
    id: 'de_monschau_rur_hike_14',
    title: 'Sentier Sauvage de la Vallée de la Rur & Monschau',
    description: 'Circuit pédestre de toute beauté traversant la cité médiévale de Monschau avant de s’élever dans les forêts sauvages surplombant les gorges de la Rur.',
    activity: 'hike',
    country: 'DE',
    region: 'Eifel / Monschau & Hautes Fagnes',
    tags: ['forest', 'water', 'hilly'],
    surfaceType: 'Sentiers en terre, racines et passerelles bois',
    surfaceDistribution: [
      { type: 'Sentier montagnard en sous-bois', percentage: 75 },
      { type: 'Chemin forestier', percentage: 20 },
      { type: 'Ruelles pavées historiques', percentage: 5 },
    ],
    highlights: ['Maisons à colombages de Monschau', 'Sentier du Rurtal', 'Belvédère Haller', 'Forêts profondes de hêtres et d’épicéas'],
    rating: 4.9,
    reviews: 168,
    baseGain: 410,
    anchors: [
      [6.2420, 50.5540],
      [6.2650, 50.5720],
      [6.2850, 50.5610],
      [6.2620, 50.5380],
      [6.2310, 50.5420],
      [6.2420, 50.5540],
    ],
    targetDistanceKm: 8.5,
  }),

  buildCuratedRoute({
    id: 'nl_maastricht_stpieter_hike_14',
    title: 'Montagne Saint-Pierre & Falaises de Marne de Maastricht',
    description: 'Une superbe boucle transfrontalière entre Maastricht (NL) et la vallée de la Meuse (BE), longeant la forteresse Sint-Pieter et les spectaculaires carrières de marne.',
    activity: 'hike',
    country: 'NL',
    region: 'Zuid-Limburg / Maastricht & Sint-Pieter',
    tags: ['forest', 'water', 'hilly'],
    surfaceType: 'Sentiers naturels sur plateau calcaire',
    surfaceDistribution: [
      { type: 'Sentier calcaire naturel', percentage: 70 },
      { type: 'Chemins de halage Meuse', percentage: 20 },
      { type: 'Ruelles pavées', percentage: 10 },
    ],
    highlights: ['Fort Sint-Pieter', 'Encaissée spectaculaire de la carrière ENCI', 'Château Neercanne (XVIIe)', 'Vue plongeante sur Maastricht et la Meuse'],
    rating: 4.8,
    reviews: 120,
    baseGain: 270,
    anchors: [
      [5.6910, 50.8514],
      [5.6820, 50.8320],
      [5.6710, 50.8120],
      [5.6950, 50.8050],
      [5.7120, 50.8350],
      [5.6910, 50.8514],
    ],
    targetDistanceKm: 8.8,
  }),

  buildCuratedRoute({
    id: 'fr_verdun_meuse_hike_16',
    title: 'Côtes de Meuse & Sentier du Patrimoine de Verdun',
    description: 'Circuit mémoriel et panoramique gravissant les collines boisées des Côtes de Meuse, entre forêts domaniales préservées et grands panoramas sur la plaine de la Woëvre.',
    activity: 'hike',
    country: 'FR',
    region: 'Lorraine / Verdun & Côtes de Meuse',
    tags: ['forest', 'hilly', 'low_traffic'],
    surfaceType: 'Chemins forestiers & Sentiers de crête',
    surfaceDistribution: [
      { type: 'Chemin forestier stabilisé', percentage: 65 },
      { type: 'Sentier naturel sous futaie', percentage: 35 },
    ],
    highlights: ['Panoramas des Côtes de Meuse', 'Forêt domaniale de Verdun', 'Faune et flore calcicoles', 'Vergers de mirabelliers de Lorraine'],
    rating: 4.7,
    reviews: 82,
    baseGain: 340,
    anchors: [
      [5.3850, 49.1600],
      [5.4120, 49.1820],
      [5.4450, 49.1950],
      [5.4320, 49.1550],
      [5.3980, 49.1420],
      [5.3850, 49.1600],
    ],
  }),
];

// Export all official GPX traces parsed from public/gpx/
export const CATALOG_ROUTES: CatalogItem[] = [
  ...GENERATED_GPX_CATALOG,
];


