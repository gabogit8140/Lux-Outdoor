/**
 * routeSourceResolver.ts
 * Resolves dedicated, specific official website URLs and cadastral Geoportail.lu links
 * for official hiking and cycling routes across Luxembourg and the Greater Region.
 */

export interface RouteSourceResolution {
  sourceUrl: string;
  sourceLabel: string;
  geoportailUrl?: string;
  isSpecificPage: boolean;
}

// 1. All 18 Éislek Pied tracks (official portal: visit-eislek.lu)
const EISLEK_SLUGS: Record<string, string> = {
  asselborn: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-asselborn-1',
  bavigne: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-bavigne-1',
  bettendorf: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-bettendorf-1',
  boulaide: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-boulaide-1',
  bourscheid: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-bourscheid-1',
  clervaux: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-clervaux-1',
  diekirch: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-diekirch-1',
  'esch-sur-sure': 'https://www.visit-eislek.lu/fr/tour/eislek-pad-esch-sur-sure-1',
  gilsdorf: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-gilsdorf-1',
  heinerscheid: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-heinerscheid-1',
  hoscheid: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-hoscheid-1',
  insenborn: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-insenborn-1',
  kalborn: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-kalborn-1',
  kautenbach: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-kautenbach-1',
  lellingen: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-lellingen-1',
  tadler: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-tadler-1',
  troisvierges: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-troisvierges-1',
  vianden: 'https://www.visit-eislek.lu/fr/tour/eislek-pad-vianden-1',
};

// 2. All 11 Guttland Trails (official portal: visitguttland.lu)
const GUTTLAND_SLUGS: Record<string, string> = {
  aarnescht: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-aarnescht',
  'biisser-weier': 'https://www.visitguttland.lu/fr/tour/guttlandtrail-biisser-weier',
  bildchen: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-bildchen',
  'deck-lee': 'https://www.visitguttland.lu/fr/tour/guttlandtrail-deck-lee',
  fautelfiels: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-fautelfiels',
  fuussepad: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-fuussepad',
  mamerleeen: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-mamerleeen',
  raschpetzer: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-raschpetzer',
  riedergrenn: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-riedergrenn',
  scheiferei: 'https://www.visitguttland.lu/fr/tour/guttlandtrail-scheiferei',
  'siwe-brecke-wee': 'https://www.visitguttland.lu/fr/tour/guttland-trail-siwe-brecke-wee',
};

// 3. Mullerthal Trail (official portal: mullerthal-trail.lu)
const MULLERTHAL_SLUGS: Record<string, string> = {
  'route-1': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthal-trail-route-1',
  'route-2': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthal-trail-route-2',
  'route-3': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthal-trail-route-3',
  'extratour-a': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthaltrail-extratour-a',
  'extratour-b': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthal-trail-extratour-b',
  'extratour-c': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-extratour-c',
  'extratour-d': 'https://www.mullerthal-trail.lu/fr/fiche/walking/sentier-pedestre-en-etapes-mullerthaltrail-extratour-d',
  'extratour-e': 'https://www.mullerthal-trail.lu/fr/fiche/walking/mullerthal-trail-extratour-e',
};

// 4. Traumschleifen (official portal: saar-hunsrueck-steig.de)
const TRAUMSCHLEIFEN_SLUGS: Record<string, string> = {
  'manternacher-fiels': 'https://www.saar-hunsrueck-steig.de/traumschleifen/manternacher-fiels',
  palmberg: 'https://www.saar-hunsrueck-steig.de/traumschleifen/wein-und-naturpfad-palmberg',
  'wein-und-naturpfad-palmberg': 'https://www.saar-hunsrueck-steig.de/traumschleifen/wein-und-naturpfad-palmberg',
};

// 5. Komfort-Wanderwege (Accessible / Comfort trails)
const CONFORT_SLUGS: Record<string, string> = {
  'redange-attert': 'https://www.visitluxembourg.com/fr/tour/confort-wanderwee-redange-attert',
  bissen: 'https://www.visitluxembourg.com/fr/tour/komfort-wanderweg-bissen',
  'echternach-see': 'https://www.visitluxembourg.com/fr/tour/sentier-de-randonnee-echternach-lac',
  'eschweiler-op-der-deckt': 'https://www.visitluxembourg.com/fr/tour/sentier-de-randonnee-confort-eschweiler-junglinster',
  grevenmacher: 'https://www.visitluxembourg.com/fr/tour/sentier-de-randonnee-confort-grevenmacher',
  remich: 'https://www.visitluxembourg.com/fr/tour/sentier-de-randonnee-confort-remich',
};

// 6. National Cycle Paths (PC1 - PC23)
const PC_SLUGS: Record<string, string> = {
  pc0: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-centre-pc1',
  pc1: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-centre-pc1',
  pc2: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-echternach-pc-2',
  pc3: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-des-trois-rivieres-pc-3',
  pc4: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-syre-pc4',
  pc5: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-l-ernz-blanche-pc-5',
  pc6: 'https://www.visitluxembourg.com/fr/tour/piste-cylable-des-trois-cantons-pc-6',
  pc7: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-jangeli-pc-7',
  pc8: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-terre-rouge-pc8',
  pc9: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-faubourg-minier-pc-9',
  pc10: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-francois-faber-pc-10',
  pc11: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-charly-gaul-pc-11',
  pc12: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-attert-pc-12',
  pc13: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-nicolas-franz-pc-13',
  pc14: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-eisch-mamer-pc14',
  pc15: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-alzette-pc-15',
  pc16: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-moyenne-sure-pc-16',
  pc17: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-ouest-pc-17',
  pc18: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-des-ardoisieres-heiderscheid-pc-18',
  pc20: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-wiltz-pc-20',
  pc21: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-nord-pc-21',
  pc22: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-ardennes-pc-22',
};

// 7. Mountain Bike / VTT Routes
const VTT_SLUGS: Record<string, string> = {
  'lieler': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-lieler',
  'clervaux': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-lieler',
  'hosingen-lellingen': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-hosingen-lellingen',
  'hosingen': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-hosingen-lellingen',
  'winseler': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-winseler',
  'wiltz-1': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-wiltz-2',
  'wiltz-2': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-wiltz-2',
  'hoscheid': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-hoscheid',
  'goesdorf': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-goesdorf',
  'vianden': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-vianden',
  'vianden-vtt': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-vianden',
  'bavigne': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-bavigne',
  'erpeldange': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-erpeldange-sur-sure',
  'bettendorf-reisdorf': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-bettendorf-reisdorf',
  'ingeldorf-ettelbruck': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-ingeldorf-ettelbruck',
  'preizerdaul': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-preizerdaul',
  'rambrouch': 'https://www.visitluxembourg.com/fr/tour/mountainbike-tour-rambrouch',
  'bech': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-bech',
  'beckerich-12-km': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-beckerich-12-km',
  'beckerich-18-km': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-beckerich-18-km',
  'belvaux': 'https://www.visitluxembourg.com/fr/tour/redrock-mountain-bike-trail-belvaux',
  'berdorf-beaufort': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-berdorf-beaufort',
  'dalheim': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-dalheim',
  'echternach': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-berdorf-beaufort',
  'greiveldange': 'https://www.visitluxembourg.com/fr/tour/mountainbike-trail-greiveldange',
  'grevenmacher': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-grevenmacher',
  'larochette': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-larochette',
  'manternach': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-manternach',
  'weiler-la-tour': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-weiler-la-tour',
  'wormeldange': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-wormeldange',
  'grengewald': 'https://www.visitluxembourg.com/fr/tour/circuit-vtt-grengewald',
};

// 8. Road Cycling / Courses
const COURSE_SLUGS: Record<string, string> = {
  'l1-for-beginners': 'https://www.visitluxembourg.com/fr/tour/l1-pour-debutants',
  'l2-panorama-tour': 'https://www.visitluxembourg.com/fr/tour/l2-panorama-tour',
  'l3-mullerthal-light': 'https://www.visitluxembourg.com/fr/tour/l3-mullerthal-light',
  'm2-up-and-down': 'https://www.visitluxembourg.com/fr/tour/m2-up-and-down',
  's1-highlight-tour': 'https://www.visitluxembourg.com/fr/tour/s1-highlight-tour',
  's2-mullerthal-classics': 'https://www.visitluxembourg.com/fr/tour/s2-mullerthal-classics',
  's3-the-valley-of-the-sure': 'https://www.visitluxembourg.com/fr/tour/s3-the-valley-of-the-s-re',
  's4-mullerthal-x-treme': 'https://www.visitluxembourg.com/fr/tour/s4-mullerthal-x-treme',
  's5-charly-gaul-b': 'https://www.visitluxembourg.com/fr/tour/s5-charly-gaul-b',
  's6-charly-gaul-a': 'https://www.visitluxembourg.com/fr/tour/s6-charly-gaul-a',
};

// 9. Verified Auto-Pédestres (visitluxembourg.com)
const AUTO_PEDESTRE_SPECIAL: Record<string, string> = {
  arsdorf: 'https://www.visitluxembourg.com/fr/tour/autopedestre-arsdorf',
  baschleiden: 'https://www.visitluxembourg.com/fr/tour/autopedestre-baschleiden',
  berle: 'https://www.visitluxembourg.com/fr/tour/autopedestre-berle',
  bettel: 'https://www.visitluxembourg.com/fr/tour/autopedestre-bettel',
  bettendorf: 'https://www.visitluxembourg.com/fr/tour/autopedestre-bettendorf',
  bigonville: 'https://www.visitluxembourg.com/fr/tour/autopedestre-bigonville',
  binsfeld: 'https://www.visitluxembourg.com/fr/tour/autopedestre-binsfeld',
  boevange: 'https://www.visitluxembourg.com/fr/tour/autopedestre-boevange',
  boulaide: 'https://www.visitluxembourg.com/fr/tour/autopedestre-boulaide',
  bourscheid: 'https://www.visitluxembourg.com/fr/tour/autopedestre-bourscheid',
  boxhorn: 'https://www.visitluxembourg.com/fr/tour/autopedestre-boxhorn',
  buderscheid: 'https://www.visitluxembourg.com/fr/tour/autopedestre-buderscheid',
  burden: 'https://www.visitluxembourg.com/fr/tour/autopedestre-buerden',
  'colmar-berg': 'https://www.visitluxembourg.com/fr/tour/autopedestre-colmar-berg',
  consthum: 'https://www.visitluxembourg.com/fr/tour/autopedestre-consthum',
  dahl: 'https://www.visitluxembourg.com/fr/tour/autopedestre-dahl',
  derenbach: 'https://www.visitluxembourg.com/fr/tour/autopedestre-derenbach',
  eschweiler: 'https://www.visitluxembourg.com/fr/tour/autopedestre-eschweiler',
  'esch-sur-sure': 'https://www.visitluxembourg.com/fr/tour/autopedestre-esch-sur-sure',
  ettelbruck: 'https://www.visitluxembourg.com/fr/tour/autopedestre-ettelbruck',
  harlange: 'https://www.visitluxembourg.com/fr/tour/autopedestre-harlange',
  heiderscheid: 'https://www.visitluxembourg.com/fr/tour/autopedestre-heiderscheid',
  heispelt: 'https://www.visitluxembourg.com/fr/tour/autopedestre-heispelt',
  hoscheid: 'https://www.visitluxembourg.com/fr/tour/autopedestre-hoscheid',
  kaundorf: 'https://www.visitluxembourg.com/fr/tour/autopedestre-kaundorf',
  kautenbach: 'https://www.visitluxembourg.com/fr/tour/autopedestre-kautenbach',
  lellingen: 'https://www.visitluxembourg.com/fr/tour/autopedestre-lellingen',
  lieler: 'https://www.visitluxembourg.com/fr/tour/autopedestre-lieler',
  'lieler-ex-weiswampach-1': 'https://www.visitluxembourg.com/fr/tour/autopedestre-lieler',
  munshausen: 'https://www.visitluxembourg.com/fr/tour/autopedestre-munshausen',
  mertzig: 'https://www.visitluxembourg.com/fr/tour/autopedestre-mertzig',
  roder: 'https://www.visitluxembourg.com/fr/tour/autopedestre-roder',
  stolzembeurg: 'https://www.visitluxembourg.com/fr/tour/autopedestre-stolzembourg',
  stolzembourg: 'https://www.visitluxembourg.com/fr/tour/autopedestre-stolzembourg',
  tadler: 'https://www.visitluxembourg.com/fr/tour/autopedestre-tadler',
  troisvierges: 'https://www.visitluxembourg.com/fr/tour/autopedestre-troisvierges',
  vianden: 'https://www.visitluxembourg.com/fr/tour/autopedestre-vianden',
  wahlshausen: 'https://www.visitluxembourg.com/fr/tour/autopedestre-wahlshausen',
  weiswampach: 'https://www.visitluxembourg.com/fr/tour/autopedestre-weiswampach',
  wiltz: 'https://www.visitluxembourg.com/fr/tour/autopedestre-wiltz',
  wilwerwiltz: 'https://www.visitluxembourg.com/fr/tour/autopedestre-wilwerwiltz',
  bonnevoie: 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-bonnevoie-luxembourg-ville',
  'differdange-lasauvage': 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-lasauvage',
  'echternach-centre': 'https://www.visitluxembourg.com/fr/tour/circuit-auto-pedestre-echternach-centre',
  'echternach-lac': 'https://www.visitluxembourg.com/fr/tour/sentier-de-randonnee-echternach-lac',
  eischen: 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-eischen-i',
  'kockelscheier-ancien-cessange': 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-kockelscheuer',
  'luxembourg-centre': 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-luxembourg-ville',
  'roodt-syre': 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-roodt-sur-syre',
  schwebsingen: 'https://www.visitluxembourg.com/fr/tour/circuit-pedestre-schwebsange',
};

// 10. Nat'Our Routes & NaturWanderPark delux
const ESCAPARDENNE_SLUGS: Record<string, string> = {
  'nat-our-route-1': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-circuit-pedestre-natour-route-1',
  'nat-our-route-2': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-circuit-pedestre-natour-route-2',
  'nat-our-route-4': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-circuit-pedestre-natour-route-4',
  'nat-our-route-5': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-circuit-pedestre-natour-route-5',
  'nat-our-route-6': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-circuit-pedestre-natour-route-6',
  'felsenweg1-weilerbach-houllay': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-felsenweg-1-weilerbach-houllay',
  'felsenweg2-bollendorf-beaufort': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-felsenweg-2-d-bollendorfl-beaufort',
  'felsenweg3-ferschweiler-berdorf': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-felsenweg-3-ferschweiler-berdorf',
  'felsenweg4-ralingen-rosport': 'https://www.visitluxembourg.com/fr/tour/naturwanderpark-delux-felsenweg-4-ralingen-rosport',
};

/**
 * Resolves the specific official source webpage and cadastral Geoportail link
 * for any given route.
 */
export function resolveRouteSource(params: {
  id: string;
  title: string;
  activity: 'bike' | 'hike';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  coords?: [number, number][];
  customUrl?: string;
  customLabel?: string;
}): RouteSourceResolution {
  const { id, title, activity, country = 'LU', coords, customUrl, customLabel } = params;
  const lowerId = id.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Interactive trail map link (Geoportail.lu for LU, Waymarked Trails for BE/DE/FR/NL)
  let geoportailUrl: string | undefined;
  if (coords && coords.length > 0) {
    const [lon, lat] = coords[0];
    if (country === 'LU') {
      geoportailUrl = `https://map.geoportail.lu/theme/tourisme?lang=fr&zoom=14&lon=${lon.toFixed(5)}&lat=${lat.toFixed(5)}`;
    } else {
      const subDomain = activity === 'bike' ? 'cycling' : 'hiking';
      geoportailUrl = `https://${subDomain}.waymarkedtrails.org/#?map=14/${lat.toFixed(5)}/${lon.toFixed(5)}`;
    }
  }

  // Non-LU countries or explicit custom source links from GPX metadata
  if (country !== 'LU') {
    if (customUrl && !customUrl.includes('visitluxembourg.com')) {
      return {
        sourceUrl: customUrl,
        sourceLabel: customLabel || `Portail Officiel (${country}) : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    if (country === 'BE') {
      const isRavel = lowerId.includes('ravel') || lowerTitle.includes('ravel') || lowerTitle.includes('vennbahn');
      return {
        sourceUrl: isRavel ? 'https://ravel.wallonie.be' : 'https://visitwallonia.be/fr/3/j-aime/nature-et-grand-air',
        sourceLabel: isRavel ? `RAVeL Wallonie Officiel : ${title}` : `Visit Wallonia & Ardenne : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    if (country === 'DE') {
      const isSaar = lowerId.includes('saar') || lowerId.includes('merzig') || lowerId.includes('losheim') || lowerId.includes('orscholz') || lowerId.includes('mettlach');
      const isMosel = lowerId.includes('mosel') || lowerId.includes('trier') || lowerId.includes('bernkastel') || lowerId.includes('saarburg') || lowerId.includes('cochem');
      return {
        sourceUrl: isSaar
          ? 'https://www.urlaub.saarland/aktivitaeten/radfahren-wandern'
          : isMosel
          ? 'https://www.visitmosel.de'
          : 'https://www.eifel.info/wandern-und-radfahren',
        sourceLabel: isSaar
          ? `Tourismus Zentrale Saarland : ${title}`
          : isMosel
          ? `Moselland & Saar-Hunsrück : ${title}`
          : `Eifel Tourismus Officiel : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    if (country === 'FR') {
      const isMeuse = lowerId.includes('verdun') || lowerId.includes('meuse') || lowerId.includes('montmedy') || lowerId.includes('madine') || lowerId.includes('stenay');
      return {
        sourceUrl: isMeuse
          ? 'https://www.lameuse.fr/preparer-mon-sejour/a-voir-a-faire/nature-et-randonnees'
          : activity === 'bike'
          ? 'https://www.lavoiebleue.com'
          : 'https://www.tourisme-lorraine.fr/decouvrir/nature/randonnees-en-lorraine/',
        sourceLabel: isMeuse
          ? `Meuse Attractivité & Lorraine : ${title}`
          : activity === 'bike'
          ? `La Voie Bleue & Véloroutes Grand Est : ${title}`
          : `Tourisme Lorraine & Moselle : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    if (country === 'NL') {
      return {
        sourceUrl: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/fietsen-wandelen/',
        sourceLabel: `Visit Zuid-Limburg Officieel : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
  }

  // 1. BIKE ACTIVITIES (LUXEMBOURG)
  if (activity === 'bike') {
    // 1.1 National Cycle Paths (PC)
    if (lowerId.startsWith('lu-pc') || lowerId.includes('piste-cyclable')) {
      const pcMatch = lowerId.match(/pc-?(\d+)/i) || lowerTitle.match(/pc-?\s*(\d+)/i);
      if (pcMatch) {
        const pcKey = `pc${pcMatch[1]}`;
        if (PC_SLUGS[pcKey]) {
          return {
            sourceUrl: PC_SLUGS[pcKey],
            sourceLabel: `Piste Cyclable PC${pcMatch[1]} (Visit Luxembourg)`,
            geoportailUrl,
            isSpecificPage: true,
          };
        }
      }
      return {
        sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/velo?query=${encodeURIComponent(title)}#c1124`,
        sourceLabel: `Piste Cyclable : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }

    // 1.2 Road Racing Courses
    if (lowerId.startsWith('lu-course') || lowerTitle.includes('course')) {
      for (const [key, url] of Object.entries(COURSE_SLUGS)) {
        if (lowerId.includes(key)) {
          return {
            sourceUrl: url,
            sourceLabel: `Circuit Vélo Course : ${title}`,
            geoportailUrl,
            isSpecificPage: true,
          };
        }
      }
      return {
        sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/velo?query=${encodeURIComponent(title)}#c1124`,
        sourceLabel: `Circuit Vélo Course : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }

    // 1.3 VTT Circuits
    if (lowerId.startsWith('lu-vtt') || lowerTitle.includes('vtt') || lowerTitle.includes('mountainbike')) {
      for (const [key, url] of Object.entries(VTT_SLUGS)) {
        if (lowerId.includes(key) || lowerTitle.includes(key)) {
          return {
            sourceUrl: url,
            sourceLabel: `Circuit VTT : ${title}`,
            geoportailUrl,
            isSpecificPage: true,
          };
        }
      }
      const cleanVtt = title.replace(/^circuit\s+vtt\s+\d*/i, '').trim();
      return {
        sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/velo?query=${encodeURIComponent(cleanVtt || title)}#c1124`,
        sourceLabel: `Circuit VTT : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }

    // 1.4 Other Touring Bike Trails (Velo)
    return {
      sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/velo?query=${encodeURIComponent(title)}#c1124`,
      sourceLabel: `Itinéraire Cyclable : ${title}`,
      geoportailUrl,
      isSpecificPage: true,
    };
  }

  // 2. HIKE ACTIVITIES
  // 2.1 Éislek Pied
  if (lowerId.includes('eislek')) {
    for (const [key, url] of Object.entries(EISLEK_SLUGS)) {
      if (lowerId.includes(key) || lowerTitle.includes(key)) {
        return {
          sourceUrl: url,
          sourceLabel: `Éislek Pad : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
    return {
      sourceUrl: 'https://www.visit-eislek.lu/fr/decouvrir-la-nature/eislek-pied',
      sourceLabel: 'Visit Éislek (Pied & Nature)',
      geoportailUrl,
      isSpecificPage: false,
    };
  }

  // 2.2 Guttland Trails
  if (lowerId.includes('guttland') || lowerTitle.includes('guttland')) {
    for (const [key, url] of Object.entries(GUTTLAND_SLUGS)) {
      if (lowerId.includes(key) || lowerTitle.includes(key)) {
        return {
          sourceUrl: url,
          sourceLabel: `Guttland.Trail : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
    return {
      sourceUrl: 'https://www.visitguttland.lu/fr/guttland-highlights/guttlandtrails',
      sourceLabel: 'Visit Guttland Trails',
      geoportailUrl,
      isSpecificPage: false,
    };
  }

  // 2.3 Mullerthal Trail & ExtraTours
  if (lowerId.includes('mullerthal') || lowerTitle.includes('mullerthal')) {
    for (const [key, url] of Object.entries(MULLERTHAL_SLUGS)) {
      if (lowerId.includes(key) || lowerTitle.includes(key.replace('-', ' '))) {
        return {
          sourceUrl: url,
          sourceLabel: `Mullerthal Trail : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
    // Mullerthal local trails or CFL
    if (lowerId.includes('cfl') || lowerTitle.includes('cfl')) {
      return {
        sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/randonnees?query=${encodeURIComponent(title)}#c1124`,
        sourceLabel: `Sentier CFL : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    return {
      sourceUrl: 'https://www.mullerthal-trail.lu/fr',
      sourceLabel: 'Mullerthal Trail',
      geoportailUrl,
      isSpecificPage: false,
    };
  }

  // 2.4 Traumschleifen
  if (lowerId.includes('traum') || lowerTitle.includes('traumschleife')) {
    for (const [key, url] of Object.entries(TRAUMSCHLEIFEN_SLUGS)) {
      if (lowerId.includes(key) || lowerTitle.includes(key)) {
        return {
          sourceUrl: url,
          sourceLabel: `Traumschleife : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
  }

  // 2.5 Komfort-Wanderwege
  if (lowerId.includes('confort') || lowerTitle.includes('confort') || lowerTitle.includes('komfort')) {
    for (const [key, url] of Object.entries(CONFORT_SLUGS)) {
      if (lowerId.includes(key) || lowerTitle.includes(key)) {
        return {
          sourceUrl: url,
          sourceLabel: `Sentier Confort : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
  }

  // 2.6 Escapardenne & Nat'Our Routes
  if (lowerId.includes('escapardenne') || lowerId.includes('nat-our')) {
    for (const [key, url] of Object.entries(ESCAPARDENNE_SLUGS)) {
      if (lowerId.includes(key)) {
        return {
          sourceUrl: url,
          sourceLabel: `Nat'Our / WanderPark : ${title}`,
          geoportailUrl,
          isSpecificPage: true,
        };
      }
    }
  }

  // 2.7 Auto-Pédestres (154 trails)
  if (lowerId.startsWith('lu-ap') || lowerTitle.includes('auto-pédestre') || lowerTitle.includes('auto-pedestre')) {
    const rawTown = lowerId.replace(/^lu-ap-/, '').replace(/\.gpx$/, '');
    if (AUTO_PEDESTRE_SPECIAL[rawTown]) {
      return {
        sourceUrl: AUTO_PEDESTRE_SPECIAL[rawTown],
        sourceLabel: `Auto-Pédestre : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    const cleanTown = rawTown.split('-')[0];
    if (AUTO_PEDESTRE_SPECIAL[cleanTown]) {
      return {
        sourceUrl: AUTO_PEDESTRE_SPECIAL[cleanTown],
        sourceLabel: `Auto-Pédestre : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
    return {
      sourceUrl: `https://www.visitluxembourg.com/fr/tour/circuit-pedestre-${rawTown}`,
      sourceLabel: `Auto-Pédestre : ${title}`,
      geoportailUrl,
      isSpecificPage: true,
    };
  }

  // 2.8 CFL Randonnées en train
  if (lowerId.includes('cfl') || lowerTitle.includes('cfl')) {
    return {
      sourceUrl: 'https://www.cfl.lu/fr-fr/leisure/detail/randonnees-en-train',
      sourceLabel: `CFL Gare-à-Gare : ${title}`,
      geoportailUrl,
      isSpecificPage: true,
    };
  }

  // Default fallback for general Luxembourg itineraries
  return {
    sourceUrl: `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/randonnees?query=${encodeURIComponent(title)}#c1124`,
    sourceLabel: `Visit Luxembourg Officiel : ${title}`,
    geoportailUrl,
    isSpecificPage: true,
  };
}
