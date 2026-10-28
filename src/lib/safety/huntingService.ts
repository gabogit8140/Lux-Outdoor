/**
 * huntingService.ts
 * Modular hunting and battue safety service for Luxembourg and the Greater Region (BE, FR, DE).
 * Provides cross-border official map links (including Geoportail.lu layer 444 for Luxembourg),
 * seasonal activity periods, legal guidelines, and safety alerts.
 */

export interface HuntingSafetyInfo {
  country: 'LU' | 'BE' | 'FR' | 'DE' | 'NL';
  isHuntingSeason: boolean;
  seasonStatus: 'active' | 'approaching' | 'off_season';
  seasonLabel: string;
  seasonPeriod: string;
  riskLevel: 'caution' | 'moderate' | 'low';
  riskDescription: string;
  officialMapUrl: string;
  officialMapLabel: string;
  officialMapBadge: string;
  secondaryPortalUrl?: string;
  secondaryPortalLabel?: string;
  safetyGuidelines: string[];
  legalNotice: string;
}

/**
 * Calculates whether the current date falls within the general driven hunt (battue) season.
 * In the Greater Region (LU, BE, FR, DE), big game driven hunts predominantly occur
 * between mid-October and late February.
 */
export function checkHuntingSeason(date: Date = new Date()): {
  isHuntingSeason: boolean;
  status: 'active' | 'approaching' | 'off_season';
  label: string;
} {
  const month = date.getMonth(); // 0 = Jan, 9 = Oct, 11 = Dec

  // Peak battue period: October 1st to end of February
  const isPeak = month === 9 || month === 10 || month === 11 || month === 0 || month === 1;

  // Approaching period: September
  const isApproaching = month === 8;

  if (isPeak) {
    return {
      isHuntingSeason: true,
      status: 'active',
      label: 'Saison de battues en cours (Automne - Hiver)',
    };
  }

  if (isApproaching) {
    return {
      isHuntingSeason: false,
      status: 'approaching',
      label: 'Ouverture imminente de la saison de chasse',
    };
  }

  return {
    isHuntingSeason: false,
    status: 'off_season',
    label: 'Hors saison générale de battues (Printemps - Été)',
  };
}

/**
 * Resolves localized official battue maps, cadastral layers and regulations
 * based on route coordinates and national borders.
 */
export function getHuntingSafetyInfo(params: {
  country?: 'LU' | 'BE' | 'FR' | 'DE' | 'NL';
  coords?: [number, number][];
  regionName?: string;
  currentDate?: Date;
}): HuntingSafetyInfo {
  const country = params.country || 'LU';
  const coords = params.coords;
  const lon = coords && coords.length > 0 ? coords[0][0] : 6.1319;
  const lat = coords && coords.length > 0 ? coords[0][1] : 49.6116;
  const season = checkHuntingSeason(params.currentDate);

  // Common safety guidelines across Western Europe / Grande Région
  const defaultGuidelines = [
    'Restez impérativement sur les sentiers principaux balisés.',
    'Portez des vêtements aux couleurs vives (ou un gilet réfléchissant/fluo).',
    'Respectez scrupuleusement les panneaux temporaires "Chasse en cours / Battue" aux entrées de forêt.',
    'Ne pénétrez jamais dans une zone signalée avec drapeaux ou affichage officiel de battue.',
  ];

  if (country === 'LU') {
    // Geoportail.lu official layer 444: "Dates des battues / Battues de chasse"
    // Centers map directly on route starting point with hunting layer pre-activated (EPSG:3857 Web Mercator meters)
    const x = Math.round((lon * 20037508.34) / 180);
    const y = Math.round(
      (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * (20037508.34 / 180),
    );
    const geoportailBattuesUrl = `https://map.geoportail.lu/theme/main?version=3&zoom=13&X=${x}&Y=${y}&lang=fr&layers=444&opacities=1`;

    return {
      country: 'LU',
      isHuntingSeason: season.isHuntingSeason,
      seasonStatus: season.status,
      seasonLabel: season.label,
      seasonPeriod: 'Mi-octobre à fin février (pic battues)',
      riskLevel: season.isHuntingSeason ? 'caution' : 'low',
      riskDescription:
        'Au Luxembourg, les locataires des lots de chasse ont obligation légale de déclarer les dates de battues au moins 15 jours à l’avance sur Geoportail.lu.',
      officialMapUrl: geoportailBattuesUrl,
      officialMapLabel: 'Ouvrir la couche Battues sur Geoportail.lu (Couche 444)',
      officialMapBadge: 'Couche officielle Geoportail.lu',
      secondaryPortalUrl: 'https://environnement.public.lu/fr/directions_services_acteurs/anf.html',
      secondaryPortalLabel: 'Administration de la Nature et des Forêts (ANF)',
      safetyGuidelines: [
        ...defaultGuidelines,
        'Consultez la couche 444 sur Geoportail.lu avant votre départ pour vérifier les dates prévues sur le lot.',
        'Attention : les chasses avec ≤ 12 chasseurs ou traques imprévues de sangliers peuvent ne pas figurer sur la carte en ligne.',
      ],
      legalNotice:
        'Règlement grand-ducal du 13 mars 2015 : affichage obligatoire sur le terrain. L’accès aux forêts battues se fait sous votre propre responsabilité.',
    };
  }

  if (country === 'BE') {
    return {
      country: 'BE',
      isHuntingSeason: season.isHuntingSeason,
      seasonStatus: season.status,
      seasonLabel: season.label,
      seasonPeriod: '1er octobre au 31 décembre (prolongations jusqu’en février)',
      riskLevel: season.isHuntingSeason ? 'caution' : 'low',
      riskDescription:
        'En Wallonie (Ardenne, Gaume, Pays d’Arlon), le Service Public de Wallonie (SPW / DNF) et "Partageons la Nature" répertorient les fermetures de sentiers pour battues.',
      officialMapUrl: 'https://chasseonweb.wallonie.be',
      officialMapLabel: 'Consulter la carte ChasseOnWeb (Wallonie / DNF)',
      officialMapBadge: 'SPW ChasseOnWeb Officiel',
      secondaryPortalUrl: 'https://partagedelanature.be',
      secondaryPortalLabel: 'Plateforme Partageons la Nature',
      safetyGuidelines: [
        ...defaultGuidelines,
        'Les sentiers fermés pour battue sont signalés par des affiches jaunes ou rouges officielles.',
        'L’accès à un sentier marqué par une affiche rouge d’interdiction est passible d’une amende légale.',
      ],
      legalNotice:
        'Code forestier wallon : interdiction absolue de pénétrer dans les bois et chemins faisant l’objet d’un affichage d’interdiction pour cause de battue.',
    };
  }

  if (country === 'FR') {
    return {
      country: 'FR',
      isHuntingSeason: season.isHuntingSeason,
      seasonStatus: season.status,
      seasonLabel: season.label,
      seasonPeriod: 'Mi-septembre à fin février (jeudis, week-ends et fériés)',
      riskLevel: season.isHuntingSeason ? 'caution' : 'low',
      riskDescription:
        'En France (Grand Est, Moselle 57, Meurthe-et-Moselle 54, Meuse 55), l’ONF publie les calendriers de chasse des forêts domaniales et les Fédérations de Chasseurs informent le public.',
      officialMapUrl: 'https://www.onf.fr/chasse/les-calendriers-de-chasse-en-foret-domaniale',
      officialMapLabel: 'Calendrier des chasses ONF en forêt domaniale',
      officialMapBadge: 'ONF France',
      secondaryPortalUrl: 'https://www.chasseurdefrance.com',
      secondaryPortalLabel: 'Fédération Nationale des Chasseurs (FNC)',
      safetyGuidelines: [
        ...defaultGuidelines,
        'Panneaux temporaires "Chasse en cours" obligatoires le jour même aux intersections de sentiers.',
        'Vérifiez les jours de non-chasse fixés par l’arrêté préfectoral du département traversé.',
      ],
      legalNotice:
        'Arrêtés préfectoraux et dispositions ONF : respecter scrupuleusement la signalisation temporaire installée à chaque accès de la battue.',
    };
  }

  if (country === 'DE') {
    return {
      country: 'DE',
      isHuntingSeason: season.isHuntingSeason,
      seasonStatus: season.status,
      seasonLabel: season.label,
      seasonPeriod: 'Oktober bis Januar (Drückjagdsaison)',
      riskLevel: season.isHuntingSeason ? 'caution' : 'low',
      riskDescription:
        'Im Saarland und in Rheinland-Pfalz informieren die Forstämter (SaarForst, Landesforsten RLP) über Bewegungs- und Drückjagden in Waldgebieten.',
      officialMapUrl: 'https://www.saarforst.de',
      officialMapLabel: 'SaarForst Landesbetrieb (Mitteilungen & Jagd)',
      officialMapBadge: 'SaarForst / Landesforsten',
      secondaryPortalUrl: 'https://www.wald.rlp.de',
      secondaryPortalLabel: 'Landesforsten Rheinland-Pfalz',
      safetyGuidelines: [
        ...defaultGuidelines,
        'Warnschilder "Achtung Treibjagd / Drückjagd" an Waldwegen unbedingt beachten.',
        'Wanderwege in abgesperrten Revierteilen während des Jagdbetriebs meiden.',
      ],
      legalNotice:
        'Landeswaldgesetz : Sperrungen bei Drückjagden sind verbindlich und dienen dem Schutz von Mensch und Wild.',
    };
  }

  // Fallback (NL or default)
  return {
    country,
    isHuntingSeason: season.isHuntingSeason,
    seasonStatus: season.status,
    seasonLabel: season.label,
    seasonPeriod: 'Automne / Hiver',
    riskLevel: 'low',
    riskDescription: 'Consultez les affichages locaux et restez sur les chemins balisés.',
    officialMapUrl:
      'https://map.geoportail.lu/theme/main?version=3&zoom=9&X=682599&Y=6379000&lang=fr&layers=444&opacities=1',
    officialMapLabel: 'Portail Cartographique Grande Région',
    officialMapBadge: 'Info Randonnée',
    safetyGuidelines: defaultGuidelines,
    legalNotice: 'Respectez la faune et les consignes de sécurité forestière affichées sur place.',
  };
}
