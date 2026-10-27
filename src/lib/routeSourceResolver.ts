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
  consdorf: 'https://www.visitluxembourg.com/fr/tour/circuit-auto-pedestre-consdorf',
  'consdorf-mullerthal': 'https://www.visitluxembourg.com/fr/tour/circuit-auto-pedestre-consdorf',
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
// Helper to detect generic homepage URLs
export function isGenericHomepageUrl(url?: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/\/+$/, '');
    if (!pathname || pathname === '' || pathname === '/fr' || pathname === '/de' || pathname === '/en' || pathname === '/nl') return true;
    if (['/fr/decouvrir-la-nature/eislek-pied', '/te-doen-in-zuid-limburg/fietsen-wandelen', '/fr/3/j-aime/nature-et-grand-air', '/aktivitaeten/radfahren-wandern', '/wandern-und-radfahren', '/preparer-mon-sejour/a-voir-a-faire/nature-et-randonnees', '/decouvrir/nature/randonnees-en-lorraine', '/fr/velo'].includes(pathname)) return true;
    return false;
  } catch { return true; }
}

// Dedicated verified deep-link fiches for cross-border routes
export const ROUTE_DEEP_LINKS: Record<string, { url: string; label: string }> = {
  // BELGIQUE - CYCLISME & RAVEL
  'be-bike-arlon-attert-boucle': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Circuit Cyclable Pays d’Arlon & Attert' },
  'be-bike-arlon-sesselich-loop': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Boucle Vélo Sources de la Semois (Arlon)' },
  'be-bike-arlon-sesselich-sport': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Cyclosportif Arlon - Attert - Anlier' },
  'be-bike-bastogne-foy-loop': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-163', label: 'RAVeL Ligne 163 Bastogne - Bizory' },
  'be-bike-bastogne-foy-sport': { url: 'https://www.paysdebastogne.be/itineraires/', label: 'Boucle Cyclosportive Pays de Bastogne' },
  'be-bike-bastogne-sainte-ode-ravel': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-163', label: 'RAVeL 163 Bastogne & Sainte-Ode' },
  'be-bike-bouillon-rochehaut-vresse': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Crêtes de la Semois Bouillon - Rochehaut' },
  'be-bike-bouillon-semois-loop': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Boucle Vélo Semois & Bouillon' },
  'be-bike-bouillon-semois-sport': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Parcours Sportif Ardenne & Semois' },
  'be-bike-burg-reuland-saint-vith-vennbahn': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/vennbahn', label: 'Vennbahn Burg-Reuland - Saint-Vith' },
  'be-bike-chiny-herbeumont-viaduc': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-163a', label: 'RAVeL Ligne 163A Forêt de Chiny - Herbeumont' },
  'be-bike-dinant-ciney-condroz-ravel': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-126', label: 'RAVeL Ligne 126 Dinant - Ciney' },
  'be-bike-durbuy-ourthe-boucle': { url: 'https://durbuytourisme.be/balades-et-randonnees/', label: 'Boucle Cyclable Durbuy & Vallée de l’Ourthe' },
  'be-bike-florenville-semois-loop': { url: 'https://www.visitgaume.be/randonnees/', label: 'Boucle Vélo Florenville & Semois' },
  'be-bike-florenville-semois-sport': { url: 'https://www.visitgaume.be/randonnees/', label: 'Gravel & Vélo Florenville Épioux' },
  'be-bike-gouvy-vielsalm-glain': { url: 'https://www.haute-ardenne.be/fr/a-voir-a-faire/itineraires', label: 'Boucle Vélo Haute-Ardenne Gouvy - Vielsalm' },
  'be-bike-habay-for-t-anlier-gravel': { url: 'https://visitwallonia.be/fr-be/content/parc-naturel-haute-sure-foret-danlier', label: 'Gravel Grande Forêt d’Anlier' },
  'be-bike-houffalize-nisramont-vtt': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Raid VTT Houffalize - Lac de Nisramont' },
  'be-bike-houffalize-ourthe-loop': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Boucle Cyclable Houffalize & Ourthe' },
  'be-bike-houffalize-ourthe-sport': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'VTT Crêtes de l’Ourthe Houffalize' },
  'be-bike-la-roche-ardenne-loop': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Boucle Vélo La Roche-en-Ardenne' },
  'be-bike-la-roche-ardenne-sport': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'La Chouffe Classic La Roche-en-Ardenne' },
  'be-bike-la-roche-col-haussire': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Classique Ardennaise Col de Haussire' },
  'be-bike-malmedy-warche-loop': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-45', label: 'RAVeL Ligne 45 Malmedy - Stavelot' },
  'be-bike-malmedy-warche-sport': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/ligne-45', label: 'Parcours Cyclosportif Hautes Fagnes' },
  'be-bike-marche-rochefort-lesse': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-150', label: 'RAVeL Famenne Marche - Rochefort' },
  'be-bike-messancy-aubange-trois-frontieres': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Circuit Cyclable Lac de Messancy' },
  'be-bike-neufchateau-libramont-lac': { url: 'https://visitwallonia.be/fr-be/content/maison-du-tourisme-de-la-foret-d-anlier', label: 'Boucle Cyclable Vallée du Lac de Neufchâteau' },
  'be-bike-orval-florenville-semois': { url: 'https://www.orval.be/fr/page/373-visite-des-ruines', label: 'Circuit Cyclable Abbaye d’Orval & Semois' },
  'be-bike-saint-hubert-grande-foret': { url: 'https://www.foretdesainthubert-tourisme.be/balades/', label: 'Tour Cyclable Forêt de Saint-Hubert' },
  'be-bike-saint-vith-our-loop': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/vennbahn', label: 'Boucle Cyclable Vallée de l’Our (Saint-Vith)' },
  'be-bike-saint-vith-our-sport': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/vennbahn', label: 'Cyclosportif Cantons de l’Est Saint-Vith' },
  'be-bike-spa-stoumont-ambeleve': { url: 'https://www.spatourisme.be/fr/balades-et-randonnees', label: 'Circuit Vélo Sources de Spa & Amblève' },
  'be-bike-stavelot-malmedy-stockeu': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/ligne-45', label: 'Classique Ardennaise Côte de Stockeu' },
  'be-bike-virton-gaume-torgny': { url: 'https://www.visitgaume.be/randonnees/', label: 'Circuit Vélo de la Gaume (Virton - Torgny)' },
  'be-bike-virton-rabais-loop': { url: 'https://www.visitgaume.be/randonnees/', label: 'Boucle Cyclable Vallée de Rabais (Virton)' },
  'be-bike-virton-rabais-sport': { url: 'https://www.visitgaume.be/randonnees/', label: 'Raid Vélo Trois Côtes de Gaume' },
  'be-bike-waimes-botrange-robertville': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/vennbahn', label: 'Tour des Lacs des Hautes Fagnes' },
  'be-cyclo-ravel-l126': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-126', label: 'RAVeL Ligne 126 Ciney - Statte' },
  'be-cyclo-semois': { url: 'https://visitwallonia.be/fr-be/content/vallee-de-la-semois', label: 'Itinéraire Cyclable de la Semois' },
  'be-cyclo-vtt-houffalize': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Circuit VTT Houffalize Coupe du Monde' },
  'be-ravel-l150': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-150', label: 'RAVeL L150 Houyet - Rochefort - Ciney' },
  'be-ravel-l163': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-163', label: 'RAVeL L163 Bastogne - Gouvy' },
  'be-ravel-l45': { url: 'https://ravel.wallonie.be/fr/lignes/ligne-45', label: 'RAVeL L45 Trois-Ponts - Stavelot - Malmedy' },
  'be-ravel-vennbahn': { url: 'https://www.ostbelgien.eu/fr/fiche/cycling/vennbahn', label: 'RAVeL L47 Vennbahn Voie Verte' },

  // BELGIQUE - RANDONNEE
  'be-hike-arlon-bois-du-chat-guirsch': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Sentier d’Arlon à Guirsch & Heckbous' },
  'be-hike-arlon-saint-donat-beynert': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Belvédère de Saint-Donat & Beynert (Arlon)' },
  'be-hike-arlon-sesselich-loop': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Boucle Pédestre Saint-Donat & Beynert' },
  'be-hike-arlon-sesselich-ridge': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Traversée Forestière Arlon - Guirsch' },
  'be-hike-arlon-sources-semois-clairefontaine': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Sentier Abbaye de Clairefontaine & Eischen' },
  'be-hike-bastogne-bois-de-la-paix': { url: 'https://www.paysdebastogne.be/itineraires/', label: 'Sentier du Bois de la Paix (Bastogne)' },
  'be-hike-bastogne-foy-loop': { url: 'https://www.paysdebastogne.be/itineraires/', label: 'Boucle Pédestre Pays de Bastogne' },
  'be-hike-bastogne-foy-ridge': { url: 'https://www.paysdebastogne.be/itineraires/', label: 'Grande Randonnée de la Mémoire Bastogne' },
  'be-hike-bouillon-belvedere-cordemois': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Belvédère de Bouillon & Cordemois' },
  'be-hike-bouillon-semois-loop': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Boucle Pédestre Semois & Bouillon' },
  'be-hike-bouillon-semois-ridge': { url: 'https://www.bouillon-tourisme.be/activites/randonnees/', label: 'Crêtes Sauvages de Bouillon' },
  'be-hike-burg-reuland-our-vallee': { url: 'https://www.ostbelgien.eu/fr/fiche/attraction/burg-reuland', label: 'Sentier Château de Burg-Reuland & Our' },
  'be-hike-chassepierre-florenville-cuesta': { url: 'https://www.visitgaume.be/randonnees/', label: 'Boucle de Chassepierre & Crêtes de Florenville' },
  'be-hike-chiny-rocher-du-hat-passeurs': { url: 'https://www.visitgaume.be/randonnees/', label: 'Pont Saint-Nicolas & Rocher du Hat (Chiny)' },
  'be-hike-chiny-rocher-falizes-semois': { url: 'https://visitwallonia.be/fr-be/content/vallee-de-la-semois', label: 'Rocher des Falizes & Forêt de Chiny' },
  'be-hike-dinant-citadelle-rocher-bayard': { url: 'https://www.citadellededinant.be/visite/', label: 'Citadelle de Dinant & Rocher Bayard' },
  'be-hike-durbuy-dolmens-weris': { url: 'https://durbuytourisme.be/balades-et-randonnees/', label: 'Sentier des Mégalithes de Wéris & Durbuy' },
  'be-hike-florenville-semois-loop': { url: 'https://www.visitgaume.be/randonnees/', label: 'Boucle Pédestre Florenville & Semois' },
  'be-hike-florenville-semois-ridge': { url: 'https://www.visitgaume.be/randonnees/', label: 'Sentier des Crêtes de Florenville' },
  'be-hike-habay-etangs-chatelet': { url: 'https://visitwallonia.be/fr-be/content/parc-naturel-haute-sure-foret-danlier', label: 'Sentier des Étangs du Châtelet (Habay)' },
  'be-hike-han-sur-lesse-gouffre-belvaux': { url: 'https://grotte-de-han.be/la-grotte', label: 'Sentier du Gouffre de Belvaux (Han)' },
  'be-hike-herbeumont-chateau-tombeau-chevalier': { url: 'https://visitwallonia.be/fr-be/content/ruines-du-chateau-feodal-dherbeumont', label: 'Ruines Château d’Herbeumont & Semois' },
  'be-hike-houffalize-ourthe-loop': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Boucle Pédestre Houffalize & Ourthe' },
  'be-hike-houffalize-ourthe-ridge': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Crêtes Boisées d’Houffalize' },
  'be-hike-la-roche-ardenne-loop': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Boucle Pédestre La Roche-en-Ardenne' },
  'be-hike-la-roche-ardenne-ridge': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Crêtes & Forêts de La Roche-en-Ardenne' },
  'be-hike-la-roche-deister-corumont': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Crêtes du Deister & Corumont La Roche' },
  'be-hike-malmedy-warche-loop': { url: 'https://www.ostbelgien.eu/fr/randonnee', label: 'Boucle Pédestre Vallée de la Warche' },
  'be-hike-malmedy-warche-ridge': { url: 'https://www.ostbelgien.eu/fr/randonnee', label: 'Crêtes des Hautes Fagnes Malmedy' },
  'be-hike-martelange-ardoisiere-sure': { url: 'https://visitwallonia.be/fr-be/content/parc-naturel-haute-sure-foret-danlier', label: 'Ardoisières & Méandres de la Sûre Martelange' },
  'be-hike-nadrin-rocher-du-herou-ollomont': { url: 'https://www.coeurdelardenne.be/nature/le-site-du-herou', label: 'Rocher du Hérou & Cheslé Nadrin' },
  'be-hike-ninglinspo-fonds-de-quarreux': { url: 'https://walloniebelgiquetourisme.be/fr-be/content/promenade-du-ninglinspo-la-seule-riviere-de-montagne-de-belgique', label: 'Ninglinspo & Fonds de Quarreux' },
  'be-hike-nobressart-attert-heusling': { url: 'https://www.visitarlon.be/balades-et-randonnees/', label: 'Nobressart & Vallée de l’Attert' },
  'be-hike-orval-abbaye-clairefontaine': { url: 'https://www.orval.be/fr/page/373-visite-des-ruines', label: 'Sentier Monastique de l’Abbaye d’Orval' },
  'be-hike-orval-bois-le-bon-lieu': { url: 'https://www.orval.be/fr/page/373-visite-des-ruines', label: 'Bois d’Orval & Chapelle Notre-Dame' },
  'be-hike-rochefort-abbaye-saint-remy-lomme': { url: 'https://visitwallonia.be/fr-be/content/rochefort', label: 'Sentier Abbaye Saint-Remy & Lomme' },
  'be-hike-rochehaut-echelles-frahan': { url: 'https://visitwallonia.be/fr-be/content/promenade-des-echelles-de-rochehaut', label: 'Échelles de Rochehaut & Frahan' },
  'be-hike-saint-hubert-fagne-mochamps': { url: 'https://www.foretdesainthubert-tourisme.be/balades/', label: 'Tourbière de la Fagne de Mochamps' },
  'be-hike-saint-vith-our-loop': { url: 'https://www.ostbelgien.eu/fr/randonnee', label: 'Boucle Pédestre Saint-Vith & Vallée de l’Our' },
  'be-hike-saint-vith-our-ridge': { url: 'https://www.ostbelgien.eu/fr/randonnee', label: 'Crêtes Sauvages des Cantons de l’Est' },
  'be-hike-torgny-reserve-raymond-mayne': { url: 'https://www.visitgaume.be/randonnees/', label: 'Réserve Raymond Mayné (Torgny)' },
  'be-hike-vielsalm-bec-du-corbeau-doyards': { url: 'https://www.haute-ardenne.be/fr/a-voir-a-faire/itineraires', label: 'Bec du Corbeau & Lac des Doyards' },
  'be-hike-virton-rabais-loop': { url: 'https://www.visitgaume.be/randonnees/', label: 'Trou des Fées & Lac de Rabais' },
  'be-hike-virton-rabais-ridge': { url: 'https://www.visitgaume.be/randonnees/', label: 'Crêtes de Montquintin & Forêt de Bonlieu' },
  'be-rando-durbuy': { url: 'https://durbuytourisme.be/balades-et-randonnees/', label: 'Circuit Pédestre Cité de Durbuy' },
  'be-rando-echelles-rochehaut': { url: 'https://visitwallonia.be/fr-be/content/promenade-des-echelles-de-rochehaut', label: 'Promenade des Échelles de Rochehaut' },
  'be-rando-hautes-fagnes': { url: 'https://hautesfagnes.be/signal-de-botrange/', label: 'Sentier du Signal de Botrange & Fagnes' },
  'be-rando-herou-nadrin': { url: 'https://www.coeurdelardenne.be/nature/le-site-du-herou', label: 'Sentier du Site du Hérou & Ourthe' },
  'be-rando-la-roche-cretes': { url: 'https://www.coeurdelardenne.be/nature/randonnees', label: 'Crêtes & Château de La Roche' },
  'be-rando-ninglinspo': { url: 'https://walloniebelgiquetourisme.be/fr-be/content/promenade-du-ninglinspo-la-seule-riviere-de-montagne-de-belgique', label: 'Promenade Officielle du Ninglinspo' },
  'be-rando-orval-gaume': { url: 'https://www.orval.be/fr/page/373-visite-des-ruines', label: 'Circuit de l’Abbaye d’Orval & Gaume' },
  'be-rando-saint-hubert-poix': { url: 'https://www.foretdesainthubert-tourisme.be/balades/', label: 'Grande Forêt de Saint-Hubert' },
  'be-rando-spa-malchamps': { url: 'https://www.spatourisme.be/fr/balades-et-randonnees', label: 'Sentier de la Fagne de Malchamps' },
  'be-rando-tombeau-geant': { url: 'https://visitwallonia.be/fr-be/content/point-de-vue-du-tombeau-du-geant-a-botassart', label: 'Belvédère & Sentier du Tombeau du Géant' },
  'be-rando-virton-rabais': { url: 'https://www.visitgaume.be/randonnees/', label: 'Vallée de Rabais & Trou des Fées' },

  // ALLEMAGNE - CYCLISME & RADWEGE
  'de-bike-bernkastel-cochem-loop': { url: 'https://www.visitmosel.de/radfahren/mosel-radweg', label: 'Mosel-Radweg Bernkastel-Kues' },
  'de-bike-bernkastel-cochem-sport': { url: 'https://www.bernkastel.de/aktiv-natur/wandern-an-der-mosel/', label: 'Vignobles & Crêtes de la Moselle' },
  'de-bike-bitburg-biersdorf-loop': { url: 'https://www.eifel.info/wandern/wanderwege/bitburger-land', label: 'Lac de Biersdorf & Südeifel' },
  'de-bike-bitburg-biersdorf-sport': { url: 'https://www.eifel.info/wandern/wanderwege/bitburger-land', label: 'Parcours Cyclosportif Bitburger Land' },
  'de-bike-bollendorf-irrel-loop': { url: 'https://www.eifel.info/radfahren/radwege/sauertal-radweg', label: 'Sauertal-Radweg Bollendorf - Wallendorf' },
  'de-bike-bollendorf-irrel-sport': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Cyclosportif Ferschweiler Plateau' },
  'de-bike-cochem-beilstein-moselkern': { url: 'https://reichsburg-cochem.de/besichtigung/', label: 'Mosel-Radweg Château de Cochem & Beilstein' },
  'de-bike-daun-manderscheid-loop': { url: 'https://www.eifel.info/radfahren/radwege/maare-mosel-radweg', label: 'Maare-Mosel-Radweg Daun - Manderscheid' },
  'de-bike-daun-manderscheid-sport': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Vulkaneifel-Radweg Dauner Maare' },
  'de-bike-daun-wittlich-maare-mosel-integral': { url: 'https://www.eifel.info/radfahren/radwege/maare-mosel-radweg', label: 'Maare-Mosel-Radweg Intégral' },
  'de-bike-gerolstein-daun-kalk-vulkaneifel': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Kalkeifel & Vulkaneifel-Radweg' },
  'de-bike-kell-hermeskeil-ruwer-hochwald': { url: 'https://www.ruwer-hochwald-radweg.de/strecke/', label: 'Ruwer-Hochwald-Radweg Kell am See' },
  'de-bike-losheim-bostalsee-wendelinus': { url: 'https://www.urlaub.saarland/reisefuehrer/saar-radweg', label: 'Tour des Lacs de la Sarre Losheim' },
  'de-bike-merzig-losheim-loop': { url: 'https://www.urlaub.saarland/reisefuehrer/saar-radweg', label: 'Boucle Cyclable Saar Merzig - Losheim' },
  'de-bike-merzig-losheim-sport': { url: 'https://www.urlaub.saarland/aktivitaeten/wandern', label: 'Cyclosportif Hunsrück-Saar Merzig' },
  'de-bike-orscholz-mettlach-loop': { url: 'https://www.tourismus.saarland.de/reisefuehrer/saarschleife', label: 'Boucle Cyclable Saarschleife Mettlach' },
  'de-bike-orscholz-mettlach-sport': { url: 'https://www.tourismus.saarland.de/reisefuehrer/saarschleife', label: 'Tour Cyclosportif Saarschleife Cloef' },
  'de-bike-perl-saarschleife-mettlach-merzig': { url: 'https://www.urlaub.saarland/reisefuehrer/saar-radweg', label: 'Boucle Transfrontalière Perl - Mettlach' },
  'de-bike-pruem-schneifel-loop': { url: 'https://www.eifel.info/wandern/wanderwege/pruemer-land', label: 'Boucle Vélo Prümer Land & Schneifel' },
  'de-bike-pruem-schneifel-sport': { url: 'https://www.eifel.info/wandern/wanderwege/pruemer-land', label: 'Cyclosportif Massif de la Schneifel' },
  'de-bike-saarlouis-voelklingen-saarbruecken': { url: 'https://voelklinger-huette.org/de/ausstellungen-besuch/', label: 'Saar-Radweg Saarlouis - Völklingen' },
  'de-bike-trier-saarburg-loop': { url: 'https://www.saar-obermosel.de/poi/saarburger-wasserfall', label: 'Saar-Mosel-Radweg Trier - Saarburg' },
  'de-bike-trier-saarburg-sport': { url: 'https://www.trier-info.de/aktiv/wandern', label: 'Cyclosportif Vignobles de la Sarre & Moselle' },
  'de-kylltalradweg': { url: 'https://www.eifel.info/radfahren/radwege/kyll-radweg', label: 'Kyll-Radweg Gerolstein - Trier' },
  'de-maare-mosel-radweg': { url: 'https://www.eifel.info/radfahren/radwege/maare-mosel-radweg', label: 'Maare-Mosel-Radweg Daun - Bernkastel' },
  'de-mosel-radweg-bernkastel': { url: 'https://www.visitmosel.de/radfahren/mosel-radweg', label: 'Mosel-Radweg Trier - Bernkastel' },
  'de-mosel-radweg-trier': { url: 'https://www.visitmosel.de/radfahren/mosel-radweg', label: 'Mosel-Radweg Perl - Trier' },
  'de-ruwer-hochwald-radweg': { url: 'https://www.ruwer-hochwald-radweg.de/strecke/', label: 'Ruwer-Hochwald-Radweg Voie Verte' },
  'de-saar-radweg': { url: 'https://www.urlaub.saarland/reisefuehrer/saar-radweg', label: 'Saar-Radweg Sarrebruck - Konz' },
  'de-saar-radweg-sud': { url: 'https://www.urlaub.saarland/reisefuehrer/saar-radweg', label: 'Saar-Radweg Section Sud' },

  // ALLEMAGNE - RANDONNEE & STEIGE
  'de-eifelsteig-etape-14': { url: 'https://www.eifelsteig.de/etappen/etappe-14', label: 'Eifelsteig Etappe 14 Kordel - Trier' },
  'de-eifelsteig-manderscheid': { url: 'https://www.eifelsteig.de/etappen/etappe-11', label: 'Eifelsteig Etappe 11 Daun - Manderscheid' },
  'de-felsenpfad-kastel': { url: 'https://www.saar-obermosel.de/poi/felsenpfad-kastel-staadt', label: 'Traumschleife Felsenpfad Kastel-Staadt' },
  'de-hike-bernkastel-cochem-loop': { url: 'https://www.visitmosel.de/wandern/moselsteig/moselsteig-etappen', label: 'Moselsteig Boucle Bernkastel-Kues' },
  'de-hike-bernkastel-cochem-ridge': { url: 'https://www.bernkastel.de/aktiv-natur/wandern-an-der-mosel/', label: 'Crêtes Panoramiques de la Moselle' },
  'de-hike-bitburg-biersdorf-loop': { url: 'https://www.eifel.info/wandern/wanderwege/bitburger-land', label: 'Boucle Pédestre Lac de Biersdorf' },
  'de-hike-bitburg-biersdorf-ridge': { url: 'https://www.eifel.info/wandern/wanderwege/bitburger-land', label: 'Crêtes Boisées du Bitburger Land' },
  'de-hike-bollendorf-fraubillenkreuz-ferschweiler': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Gorges de Bollendorf & Fraubillenkreuz' },
  'de-hike-bollendorf-irrel-loop': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Sentier du NaturWanderPark delux Südeifel' },
  'de-hike-bollendorf-irrel-ridge': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Plateau du Ferschweiler & Südeifel' },
  'de-hike-daun-drei-maare-gemuendener': { url: 'https://www.eifel.info/a-dauner-maare', label: 'Circuit des Trois Maare de Daun' },
  'de-hike-daun-manderscheid-loop': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Boucle Pédestre Dauner Maare' },
  'de-hike-daun-manderscheid-ridge': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Crêtes Volcaniques de la Vulkaneifel' },
  'de-hike-gerolstein-dolomiten-buchenloch': { url: 'https://www.eifel.info/wandern/wanderwege/gerolsteiner-land', label: 'Eifelsteig Dolomites de Gerolstein' },
  'de-hike-irrel-pruemzurlay-pruemtal-felsen': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Felsenweg 6 Falaises de Prümzurlay & Irrel' },
  'de-hike-kordel-butzerbachtal-genovevahoehle': { url: 'https://www.eifelsteig.de/etappen/etappe-14', label: 'Römerpfad Butzerbachtal & Genovevahöhle' },
  'de-hike-manderscheid-lieserpfad-burgenstieg': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Manderscheider Burgenstieg & Lieserpfad' },
  'de-hike-merzig-losheim-loop': { url: 'https://www.urlaub.saarland/aktivitaeten/wandern', label: 'Boucle Pédestre Merzig & Losheim' },
  'de-hike-merzig-losheim-ridge': { url: 'https://www.urlaub.saarland/aktivitaeten/wandern', label: 'Crêtes Boisées de Merzig-Wadern' },
  'de-hike-monschau-perlenbach-narzissenroute': { url: 'https://www.eifel.info/a-historische-altstadt-monschau', label: 'Eifelsteig Jonquilles du Perlenbach & Monschau' },
  'de-hike-neuerburg-beilsbach-schloss': { url: 'https://www.naturwanderpark.eu/rundwanderwege', label: 'Neuerburger Kopf & Vallée de l’Enz' },
  'de-hike-orscholz-mettlach-loop': { url: 'https://www.tourismus.saarland.de/reisefuehrer/saarschleife', label: 'Boucle Pédestre Cloef Saarschleife' },
  'de-hike-orscholz-mettlach-ridge': { url: 'https://www.tourismus.saarland.de/reisefuehrer/saarschleife', label: 'Crêtes & Falaises de la Saarschleife' },
  'de-hike-pruem-schneifel-loop': { url: 'https://www.eifel.info/wandern/wanderwege/pruemer-land', label: 'Boucle Pédestre Prümer Land' },
  'de-hike-pruem-schneifel-ridge': { url: 'https://www.eifel.info/wandern/wanderwege/pruemer-land', label: 'Crêtes Sauvages de la Schneifel' },
  'de-hike-saarburg-warsberg-leukbach-cascade': { url: 'https://www.saar-obermosel.de/poi/saarburger-wasserfall', label: 'Cascade Urbaine & Château de Saarburg' },
  'de-hike-trier-saarburg-loop': { url: 'https://www.trier-info.de/aktiv/wandern', label: 'Boucle Pédestre Trier & Moselle' },
  'de-hike-trier-saarburg-ridge': { url: 'https://www.trier-info.de/aktiv/wandern', label: 'Crêtes Panoramiques du Trierer Land' },
  'de-lieserpfad': { url: 'https://www.eifel.info/wandern/wanderwege/lieserpfad', label: 'Lieserpfad Daun - Wittlich' },
  'de-moselsteig-nittel-konz': { url: 'https://www.visitmosel.de/wandern/moselsteig/moselsteig-etappe-03', label: 'Moselsteig Nittel - Konz' },
  'de-moselsteig-trier-schweich': { url: 'https://www.visitmosel.de/wandern/moselsteig/moselsteig-etappe-05', label: 'Moselsteig Trier - Schweich' },
  'de-rando-dreiborn-eifel': { url: 'https://www.nationalpark-eifel.de/de/nationalpark-erleben/unterwegs-im-nationalpark/', label: 'Plateau Dreiborn & Wollseifen' },
  'de-rando-teufelsschlucht': { url: 'https://www.eifel.info/a-teufelsschlucht', label: 'Teufelsschlucht & Irreler Wasserfälle' },
  'de-traumschleife-saarschleife': { url: 'https://www.saar-hunsrueck-steig.de/traumschleifen/cloef-pfad', label: 'Traumschleife Cloef-Pfad Saarschleife' },
  'de-vulkanpfad-daun': { url: 'https://www.gesundland-vulkaneifel.de/wandern/', label: 'Vulkanpfad Daun & Lacs de Maare' },

  // FRANCE - CYCLISME & VOIE BLEUE
  'fr-bike-apach-schengen-sierck-stromberg': { url: 'https://www.lavoiebleue.com/itineraire/apach-thionville', label: 'La Voie Bleue Apach - Sierck-les-Bains' },
  'fr-bike-audun-villerupt-alzet-gravel': { url: 'https://www.mosl-tourisme.fr/fr/bouger/randonnee-pedestre.html', label: 'Gravel Terres Rouges Villerupt' },
  'fr-bike-briey-orne-amneville-voie-verte': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Fil Bleu Vallée de l’Orne Briey - Amnéville' },
  'fr-bike-cattenom-hettange-kanfen-vtt': { url: 'https://www.thionvilletourisme.fr/a-faire/randonnees/', label: 'Circuit VTT Pays de Cattenom & Hettange' },
  'fr-bike-longuyon-marville-othain-citadelle': { url: 'https://www.tourisme-paysdemontmedy.fr/randonnees/', label: 'Boucle Renaissance Marville & Longuyon' },
  'fr-bike-longwy-mont-saint-martin-loop': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Boucle Vélo Pays de Longwy' },
  'fr-bike-longwy-mont-saint-martin-sport': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Cyclosportif Pays Haut & Vauban' },
  'fr-bike-longwy-vauban-chiers-transfrontalier': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Boucle Vélo Remparts Vauban Longwy' },
  'fr-bike-metz-gorze-cotes-de-moselle': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Boucle Metz, Jouy & Gorze' },
  'fr-bike-metz-scye-chazelles-loop': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Boucle Cyclable Metz & Moselle' },
  'fr-bike-metz-scye-chazelles-sport': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Cyclosportif Côtes de Moselle & Scy' },
  'fr-bike-montmedy-avioth-stenay-meuse': { url: 'https://www.tourisme-paysdemontmedy.fr/randonnees/', label: 'Citadelle de Montmédy, Avioth & Stenay' },
  'fr-bike-nancy-boucle--de-la-moselle-toul': { url: 'https://www.boucledelamoselle.fr/le-circuit/', label: 'La Boucle de la Moselle Nancy - Toul' },
  'fr-bike-pont-a-mousson-lac-madine-hattonchatel': { url: 'https://lacdemadine.com/activites/randonnee/', label: 'Lac de Madine & Hattonchâtel' },
  'fr-bike-rodemack-cattenom-lac-mirgenbach': { url: 'https://www.mairie-rodemack.fr/tourisme/', label: 'Rodemack & Lac du Mirgenbach' },
  'fr-bike-sarreguemines-bitche-canal-sarre': { url: 'https://www.sarreguemines-tourisme.com/a-voir-a-faire/balades-et-randonnees/', label: 'Canal des Houillères de la Sarre' },
  'fr-bike-sierck-manderen-malbrouck-trois-frontieres': { url: 'https://www.chateau-malbrouck.com/visiter/', label: 'Châteaux des 3 Frontières Sierck & Malbrouck' },
  'fr-bike-thionville-sierck-loop': { url: 'https://www.lavoiebleue.com/itineraire/thionville-metz', label: 'La Voie Bleue Thionville - Sierck' },
  'fr-bike-thionville-sierck-sport': { url: 'https://www.thionvilletourisme.fr/a-faire/randonnees/', label: 'Cyclosportif Pays des Trois Frontières' },
  'fr-bike-thionville-vigy-canner-voie-verte': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Voie Verte Vallée de la Canner Vigy' },
  'fr-bike-verdun-meuse-douaumont-champs-bataille': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'EuroVelo 19 La Meuse à Vélo Verdun' },
  'fr-bike-verdun-montmedy-loop': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'Boucle Cyclable Verdun & Meuse' },
  'fr-bike-verdun-montmedy-sport': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'Cyclosportif Champs de Bataille de Verdun' },
  'fr-cyclo-cotes-meuse': { url: 'https://www.tourisme-meuse.com/decouvrir/les-incontournables/cotes-de-meuse/', label: 'Boucle Cyclable Côtes de Meuse' },
  'fr-cyclo-foret-haye': { url: 'https://www.nancy-tourisme.fr/decouvrir-nancy/nature-et-parcs/', label: 'Circuit VTT Forêt de Haye (Nancy)' },
  'fr-cyclo-lac-madine': { url: 'https://lacdemadine.com/activites/randonnee/', label: 'Tour du Lac de Madine à Vélo' },
  'fr-cyclo-vallee-canner': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Voie Verte de la Vallée de la Canner' },
  'fr-voie-bleue-v50-metz': { url: 'https://www.lavoiebleue.com/itineraire/thionville-metz', label: 'La Voie Bleue V50 Thionville - Metz' },
  'fr-voie-bleue-v50-nord': { url: 'https://www.lavoiebleue.com/itineraire/apach-thionville', label: 'La Voie Bleue V50 Apach - Thionville' },
  'fr-voie-bleue-v50-sud': { url: 'https://www.lavoiebleue.com/itineraire/metz-pont-a-mousson', label: 'La Voie Bleue V50 Metz - Pont-à-Mousson' },

  // FRANCE - RANDONNEE
  'fr-hike-apach-three-borders-stromberg': { url: 'https://www.mosl-tourisme.fr/fr/fiche/sitlor/reserve-naturelle-du-stromberg_924000302.html', label: 'Sentier des 3 Frontières & Réserve Stromberg' },
  'fr-hike-audun-le-tiche-sentier-des-carrieres': { url: 'https://www.mosl-tourisme.fr/fr/bouger/randonnee-pedestre.html', label: 'Sentier des Carrières d’Audun-le-Tiche' },
  'fr-hike-bitche-etang-de-hasselfurth-citadelle': { url: 'https://www.citadelle-bitche.com/fr/decouvrir-la-citadelle/', label: 'Étang de Hasselfurth & Citadelle de Bitche' },
  'fr-hike-gorze-cirque-rocheux-parfond-val': { url: 'https://www.pnr-lorraine.com/decouvrir-le-parc/patrimoine-naturel/', label: 'Cirque de Parfond Val & Crêtes de Gorze' },
  'fr-hike-lac-madine-sentier-ornithologique-nonsard': { url: 'https://lacdemadine.com/activites/randonnee/', label: 'Sentier Ornithologique du Lac de Madine' },
  'fr-hike-longwy-mont-saint-martin-loop': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Boucle Pédestre Pays de Longwy' },
  'fr-hike-longwy-mont-saint-martin-ridge': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Crêtes Fortifiées du Pays Haut Longwy' },
  'fr-hike-longwy-remparts-vauban-bois-du-chat': { url: 'https://www.longwy-tourisme.com/randonnees/', label: 'Fortifications Vauban UNESCO Longwy' },
  'fr-hike-manderen-malbrouck-gorges-meinsberg': { url: 'https://www.chateau-malbrouck.com/visiter/', label: 'Sentier Orchidées Château de Malbrouck' },
  'fr-hike-metz-mont-saint-quentin-lessy': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Tour du Mont Saint-Quentin & Plappeville' },
  'fr-hike-metz-scye-chazelles-loop': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Boucle Pédestre Metz & Moselle' },
  'fr-hike-metz-scye-chazelles-ridge': { url: 'https://www.tourisme-metz.com/fr/que-faire/nature-et-balades', label: 'Crêtes du Pays Messin & Mont Saint-Quentin' },
  'fr-hike-montmedy-remparts-citadelle-fresnois': { url: 'https://www.tourisme-paysdemontmedy.fr/randonnees/', label: 'Remparts de la Citadelle de Montmédy' },
  'fr-hike-rodemack-sentier-des-remparts-faulbach': { url: 'https://www.mairie-rodemack.fr/tourisme/', label: 'Remparts Médiévaux de Rodemack & Faulbach' },
  'fr-hike-saint-avold-gorges-oderfang-longeville': { url: 'https://www.tourisme-saint-avold.fr/randonnees/', label: 'Crêtes de Grès Rose d’Oderfang' },
  'fr-hike-sierck-stromberg-pelouses-calcaires': { url: 'https://www.mosl-tourisme.fr/fr/fiche/sitlor/reserve-naturelle-du-stromberg_924000302.html', label: 'Pelouses Calcaires du Stromberg Sierck' },
  'fr-hike-thionville-sierck-loop': { url: 'https://www.thionvilletourisme.fr/a-faire/randonnees/', label: 'Boucle Pédestre Thionville & Sierck' },
  'fr-hike-thionville-sierck-ridge': { url: 'https://www.thionvilletourisme.fr/a-faire/randonnees/', label: 'Crêtes Mosellanes du Pays des 3 Frontières' },
  'fr-hike-veckring-hackenberg-mont-des-welsches': { url: 'https://maginot-hackenberg.com/visite/', label: 'Ouvrage du Hackenberg & Mont des Welsches' },
  'fr-hike-verdun-douaumont-villages-detruits': { url: 'https://www.verdun-douaumont.com/le-fort-de-douaumont/', label: 'Forêt de Douaumont & Fort de Vaux' },
  'fr-hike-verdun-montmedy-loop': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'Boucle Pédestre Verdun & Meuse' },
  'fr-hike-verdun-montmedy-ridge': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'Crêtes Héroïques de Verdun & Douaumont' },
  'fr-rando-ballon-alsace': { url: 'https://www.massif-des-vosges.com/randonnees/', label: 'Boucle du Ballon d’Alsace' },
  'fr-rando-cretes-vosges': { url: 'https://www.massif-des-vosges.com/randonnees/', label: 'Sentier des Crêtes Vosgiennes' },
  'fr-rando-gerardmer': { url: 'https://www.gerardmer.net/randonnees.php', label: 'Tour du Lac de Gérardmer & Mérelle' },
  'fr-rando-malbrouck': { url: 'https://www.chateau-malbrouck.com/visiter/', label: 'Circuit Pédestre Château de Malbrouck' },
  'fr-rando-roches-hohneck': { url: 'https://www.club-vosgien.eu/randonner/itineraires/', label: 'Sentier des Roches du Hohneck' },
  'fr-rando-roches-saint-mihiel': { url: 'https://www.tourisme-meuse.com/randonnees/', label: 'Sentier des Roches de Saint-Mihiel' },
  'fr-rando-sion-vaudemont': { url: 'https://www.tourisme-lorraine.fr/decouvrir/patrimoine/colline-de-sion/', label: 'Colline Inspirée de Sion-Vaudémont' },
  'fr-rando-stromberg-sierck': { url: 'https://www.mosl-tourisme.fr/fr/fiche/sitlor/reserve-naturelle-du-stromberg_924000302.html', label: 'Falaises de Sierck & Réserve du Stromberg' },
  'fr-rando-verdun-memoire': { url: 'https://www.tourisme-verdun.com/a-voir-a-faire/activites-de-pleine-nature/balades-et-randonnees/', label: 'Circuit de Mémoire de Verdun' },

  // PAYS-BAS - CYCLISME & RANDONNEE
  'nl-bike-gulpen-epen-vaals-drielandenpunt': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Tour du Heuvelland & Drielandenpunt' },
  'nl-bike-maastricht-eijsden-meuse-mergelland': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Véloroute de la Meuse Maastricht - Eijsden' },
  'nl-bike-maastricht-valkenburg-loop': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Boucle Cyclable Maastricht & Valkenburg' },
  'nl-bike-maastricht-valkenburg-sport': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Cyclosportif Mergelland & Cauberg' },
  'nl-bike-valkenburg-cauberg-amstel-gold-loop': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/detail/amstel-gold-race-lus-1/70868/', label: 'Amstel Gold Race Loop Valkenburg' },
  'nl-cyclo-amstel-gold': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/detail/amstel-gold-race-lus-1/70868/', label: 'Amstel Gold Race Fietslus' },
  'nl-hike-epen-geuldal-vijlenerbos-cottessen': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Dutch Mountain Trail Vallée de la Gueule' },
  'nl-hike-maastricht-valkenburg-loop': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Boucle Pédestre Maastricht & Valkenburg' },
  'nl-hike-maastricht-valkenburg-ridge': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Crêtes Panoramiques du Zuid-Limburg' },
  'nl-hike-sint-pietersberg-encigroeve-maastricht': { url: 'https://www.natuurmonumenten.nl/natuurgebieden/sint-pietersberg/route', label: 'Sint-Pietersberg Wandelroute Maastricht' },
  'nl-hike-vaals-drielandenpunt-heuvelland': { url: 'https://www.drielandenpunt.nl/attracties/', label: 'Sommet des Pays-Bas & Drielandenpunt' },
  'nl-hike-valkenburg-gerendal-schin-op-geul': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Château de Valkenburg & Vallée du Gerendal' },
  'nl-rando-mergelland': { url: 'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/routes-in-zuid-limburg/', label: 'Sentier du Mergelland Valkenburg' },

  // LUXEMBOURG
  'lu-ap-consdorf-mullerthal': { url: 'https://www.visitluxembourg.com/fr/tour/circuit-auto-pedestre-consdorf', label: 'Circuit Auto-Pédestre Consdorf' }
};


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

  // 0. Priority: Verified specific deep link
  if (ROUTE_DEEP_LINKS[lowerId]) {
    const deep = ROUTE_DEEP_LINKS[lowerId];
    return {
      sourceUrl: deep.url,
      sourceLabel: deep.label,
      geoportailUrl,
      isSpecificPage: true,
    };
  }

  // Non-LU countries or explicit custom source links from GPX metadata
  if (country !== 'LU') {
    if (customUrl && !customUrl.includes('visitluxembourg.com') && !isGenericHomepageUrl(customUrl)) {
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
    if (lowerId.includes('consdorf')) {
      return {
        sourceUrl: 'https://www.visitluxembourg.com/fr/tour/circuit-auto-pedestre-consdorf',
        sourceLabel: `Auto-Pédestre : ${title}`,
        geoportailUrl,
        isSpecificPage: true,
      };
    }
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

  // 2.9 Sentiers Locaux & Circuits Communaux (category 19 Geoportail)
  if (lowerId.startsWith('lu-local') || lowerTitle.includes('circuit local') || lowerTitle.includes('sentier local')) {
    return {
      sourceUrl: geoportailUrl || 'https://map.geoportail.lu/theme/tourisme?lang=fr',
      sourceLabel: `Sentier Local Communal : ${title}`,
      geoportailUrl,
      isSpecificPage: Boolean(geoportailUrl),
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
