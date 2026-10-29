import type { CyclewayCategory, RouteSuggestions } from '../../types';

export interface CyclewayWebReference {
  sourceUrl: string;
  sourceLabel: string;
  geoportailUrl?: string;
  portalBadge?: string;
}

const LU_PC_OFFICIAL_PAGES: Record<string, { url: string; label: string }> = {
  PC0: {
    url: 'https://travaux.public.lu/fr/reseau-cyclable/pistes-cyclables-nationales.html',
    label: 'Portail Travaux Publics (PCH) — Liaison Urbaine Luxembourg',
  },
  PC1: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-centre-pc1',
    label: 'Visit Luxembourg & PCH — PC1 Piste cyclable du Centre',
  },
  PC2: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-echternach-pc-2',
    label: 'Visit Luxembourg & PCH — PC2 Piste cyclable d’Echternach',
  },
  PC3: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-des-trois-rivieres-pc-3',
    label: 'Visit Luxembourg & PCH — PC3 Piste cyclable des Trois Rivières',
  },
  PC4: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-syre-pc4',
    label: 'Visit Luxembourg & PCH — PC4 Piste cyclable de la Syre',
  },
  PC5: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-l-ernz-blanche-pc-5',
    label: 'Visit Luxembourg & PCH — PC5 Piste cyclable de l’Ernz Blanche',
  },
  PC6: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cylable-des-trois-cantons-pc-6',
    label: 'Visit Luxembourg & PCH — PC6 Piste cyclable des Trois Cantons',
  },
  PC7: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-jangeli-pc-7',
    label: 'Visit Luxembourg & PCH — PC7 Piste cyclable Jangeli',
  },
  PC8: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-terre-rouge-pc8',
    label: 'Visit Luxembourg & PCH — PC8 Piste cyclable de la Terre Rouge',
  },
  PC9: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-faubourg-minier-pc-9',
    label: 'Visit Luxembourg & PCH — PC9 Piste cyclable du Faubourg Minier',
  },
  PC10: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-francois-faber-pc-10',
    label: 'Visit Luxembourg & PCH — PC10 Piste cyclable François Faber',
  },
  PC11: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-charly-gaul-pc-11',
    label: 'Visit Luxembourg & PCH — PC11 Piste cyclable Charly Gaul',
  },
  PC12: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-attert-pc-12',
    label: 'Visit Luxembourg & PCH — PC12 Piste cyclable de l’Attert',
  },
  PC13: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-nicolas-franz-pc-13',
    label: 'Visit Luxembourg & PCH — PC13 Piste cyclable Nicolas Frantz',
  },
  PC14: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-eisch-mamer-pc14',
    label: 'Visit Luxembourg & PCH — PC14 Piste cyclable de l’Eisch',
  },
  PC15: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-alzette-pc-15',
    label: 'Visit Luxembourg & PCH — PC15 Piste cyclable de l’Alzette',
  },
  PC16: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-moyenne-sure-pc-16',
    label: 'Visit Luxembourg & PCH — PC16 Piste cyclable de la Moyenne Sûre',
  },
  PC17: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-ouest-pc-17',
    label: 'Visit Luxembourg & PCH — PC17 Piste cyclable de l’Ouest',
  },
  PC18: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-des-ardoisieres-heiderscheid-pc-18',
    label: 'Visit Luxembourg & PCH — PC18 Piste cyclable des Ardoisières',
  },
  PC19: {
    url: 'https://travaux.public.lu/fr/reseau-cyclable/pistes-cyclables-nationales.html',
    label: 'Portail Travaux Publics (PCH) — PC19 Lac de la Haute-Sûre',
  },
  PC20: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-de-la-wiltz-pc-20',
    label: 'Visit Luxembourg & PCH — PC20 Piste cyclable de la Wiltz',
  },
  PC21: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-nord-pc-21',
    label: 'Visit Luxembourg & PCH — PC21 Piste cyclable du Nord',
  },
  PC22: {
    url: 'https://www.visitluxembourg.com/fr/tour/piste-cyclable-ardennes-pc-22',
    label: 'Visit Luxembourg & PCH — PC22 Piste cyclable des Ardennes',
  },
  PC23: {
    url: 'https://travaux.public.lu/fr/reseau-cyclable/pistes-cyclables-nationales.html',
    label: 'Portail Travaux Publics (PCH) — PC23 Piste cyclable Benny',
  },
};

const BE_RAVEL_PAGES: Record<string, { url: string; label: string }> = {
  L38: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-38.html',
    label: 'RAVeL Wallonie Officiel — Ligne 38 (Pays de Herve)',
  },
  L45: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-45.html',
    label: 'RAVeL Wallonie Officiel — Ligne 45 (Trois-Ponts - Stavelot - Malmedy - Waimes)',
  },
  L47: {
    url: 'https://www.vennbahn.eu/fr/trajet/',
    label: 'Site Officiel Vennbahn (RAVeL Ligne 47 / L48)',
  },
  VENN: {
    url: 'https://www.vennbahn.eu/fr/trajet/',
    label: 'Site Officiel Vennbahn (Aix-la-Chapelle - Saint-Vith - Troisvierges)',
  },
  L126: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-126.html',
    label: 'RAVeL Wallonie Officiel — Ligne 126 La Traversine (Ciney - Huy)',
  },
  L150: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-150b.html',
    label: 'RAVeL Wallonie Officiel — Ligne 150 (Houyet - Rochefort - Jemelle)',
  },
  L162: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-162.html',
    label: 'RAVeL Wallonie Officiel — Ligne 162 (Libramont - Neufchâteau)',
  },
  L163: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-163.html',
    label: 'RAVeL Wallonie Officiel — Ligne 163 (Bastogne - Gouvy)',
  },
  L163A: {
    url: 'https://ravel.wallonie.be/home/itineraires/local/ligne-163a.html',
    label: 'RAVeL Wallonie Officiel — Ligne 163A (Vallée de la Semois / Bertrix)',
  },
  L165: {
    url: 'https://ravel.wallonie.be/home/itineraires/local.html',
    label: 'RAVeL Wallonie Officiel — Réseau Gaume & Pays d’Arlon',
  },
};

function sanitizeOsmWebsite(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.split(';')[0].trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return undefined;
}

/**
 * Résout les sites web officiels de référence (portails nationaux, fiches dédiées RAVeL / PCH /
 * Voie Bleue / France Vélo Tourisme / EuroVelo / Radwege et cartes cadastrales / Waymarked)
 * pour toute piste cyclable du catalogue ou sélectionnée en direct sur la couche vélo.
 */
export function resolveCyclewayWebReference(params: {
  id?: string;
  title: string;
  cyclewayRef?: string;
  cyclewayCategory?: CyclewayCategory;
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  coords?: [number, number][];
  osmWebsite?: string;
  osmRelationId?: number;
  existingSourceUrl?: string;
  existingSourceLabel?: string;
}): CyclewayWebReference {
  const {
    id = '',
    title,
    cyclewayRef,
    country = 'LU',
    coords,
    osmWebsite,
    osmRelationId,
  } = params;

  const lowerId = id.toLowerCase();
  const combined = `${id} ${cyclewayRef || ''} ${title}`;
  const refUpper = (cyclewayRef || '').toUpperCase().replace(/\s+/g, '');

  // Carte topographique / réseau cyclable interactif dédié
  let geoportailUrl: string | undefined;
  if (coords && coords.length > 0) {
    const mid = coords[Math.floor(coords.length / 2)] || coords[0];
    const [lon, lat] = mid;
    if (country === 'LU') {
      // Couche officielle 552 = Pistes cyclables nationales (Administration des Ponts et Chaussées sur Geoportail.lu)
      geoportailUrl = `https://map.geoportail.lu/theme/tourisme?lang=fr&zoom=13&X=${Math.round(
        lon * 111320
      )}&lon=${lon.toFixed(5)}&lat=${lat.toFixed(5)}&layers=552&opacities=1`;
    } else if (osmRelationId) {
      geoportailUrl = `https://cycling.waymarkedtrails.org/#route?id=${osmRelationId}`;
    } else {
      geoportailUrl = `https://cycling.waymarkedtrails.org/#?map=13/${lat.toFixed(5)}/${lon.toFixed(5)}`;
    }
  } else if (osmRelationId) {
    geoportailUrl = `https://cycling.waymarkedtrails.org/#route?id=${osmRelationId}`;
  }

  // 0. Site officiel directement renseigné dans la relation OpenStreetMap (ex: vennbahn.eu, lavoiebleue.com...)
  const cleanOsmUrl = sanitizeOsmWebsite(osmWebsite);
  if (cleanOsmUrl) {
    let hostLabel = 'Site officiel de la piste cyclable';
    try {
      const host = new URL(cleanOsmUrl).hostname.replace(/^www\./, '');
      hostLabel = `Site officiel (${host}) — ${title}`;
    } catch {
      // ignore
    }
    return {
      sourceUrl: cleanOsmUrl,
      sourceLabel: hostLabel,
      geoportailUrl,
      portalBadge: 'Site officiel OSM',
    };
  }

  // 1. Pistes Cyclables Nationales du Luxembourg (PC0 à PC38)
  const pcMatch = refUpper.match(/^PC(\d{1,2})/) || combined.match(/\bPC\s*-?\s*(\d{1,2})\b/i);
  if (pcMatch || lowerId.startsWith('lu-pc-')) {
    const pcCode = pcMatch ? `PC${pcMatch[1]}` : refUpper;
    if (pcCode && LU_PC_OFFICIAL_PAGES[pcCode]) {
      return {
        sourceUrl: LU_PC_OFFICIAL_PAGES[pcCode].url,
        sourceLabel: LU_PC_OFFICIAL_PAGES[pcCode].label,
        geoportailUrl,
        portalBadge: 'VisitLuxembourg / PCH',
      };
    }
    return {
      sourceUrl:
        'https://travaux.public.lu/fr/reseau-cyclable/pistes-cyclables-nationales.html',
      sourceLabel: `Portail Officiel Pistes Cyclables Nationales (PCH) — ${title}`,
      geoportailUrl,
      portalBadge: 'Travaux Publics LU',
    };
  }

  // 2. La Voie Bleue — Moselle-Saône à vélo (V50)
  if (
    refUpper === 'V50' ||
    lowerId.includes('voie-bleue') ||
    /\b(voie bleue|v50)\b/i.test(combined)
  ) {
    let stageUrl = 'https://www.lavoiebleue.com/itineraire/l-itineraire/';
    if (/apach|sierck/i.test(combined)) {
      stageUrl = 'https://www.lavoiebleue.com/itineraire/apach-thionville/';
    } else if (/uckange|thionville.*metz/i.test(combined)) {
      stageUrl = 'https://www.lavoiebleue.com/itineraire/thionville-metz/';
    } else if (/pont-à-mousson|pont-a-mousson|nancy/i.test(combined)) {
      stageUrl = 'https://www.lavoiebleue.com/itineraire/metz-pont-a-mousson/';
    }
    return {
      sourceUrl: stageUrl,
      sourceLabel: `Site Officiel La Voie Bleue (V50) — ${title}`,
      geoportailUrl,
      portalBadge: 'LaVoieBleue.com',
    };
  }

  // 3. Vennbahn (LU / BE / DE)
  if (refUpper === 'VENN' || /\bvennbahn\b/i.test(combined)) {
    return {
      sourceUrl: 'https://www.vennbahn.eu/fr/trajet/',
      sourceLabel: `Site Officiel Vennbahn — ${title}`,
      geoportailUrl,
      portalBadge: 'Vennbahn.eu',
    };
  }

  // 4. EuroVelo (EV5, EV19 Meuse à Vélo, EV15 Rhin, EV3...)
  const evMatch = refUpper.match(/^EV(\d{1,2})$/) || combined.match(/\b(?:EuroVelo\s*|EV\s*)(\d{1,2})\b/i);
  if (evMatch || /\bmeuse à vélo\b/i.test(combined)) {
    const evNum = evMatch ? evMatch[1] : '19';
    if (evNum === '19' || /\bmeuse à vélo\b/i.test(combined)) {
      return {
        sourceUrl:
          'https://www.francevelotourisme.com/itineraire/la-meuse-a-velo-eurovelo-19',
        sourceLabel: `France Vélo Tourisme / EuroVelo 19 — La Meuse à Vélo`,
        geoportailUrl,
        portalBadge: 'EuroVelo 19',
      };
    }
    if (evNum === '5' && country === 'FR') {
      return {
        sourceUrl:
          'https://www.francevelotourisme.com/itineraire/eurovelo-5-via-romea-francigena',
        sourceLabel: `France Vélo Tourisme — EuroVelo 5 Via Romea Francigena`,
        geoportailUrl,
        portalBadge: 'EuroVelo 5',
      };
    }
    return {
      sourceUrl: `https://fr.eurovelo.com/ev${evNum}`,
      sourceLabel: `Portail Officiel EuroVelo ${evNum} — ${title}`,
      geoportailUrl,
      portalBadge: `EuroVelo ${evNum}`,
    };
  }

  // 5. Lignes RAVeL Wallonie (Belgique)
  if (country === 'BE' || /\bravel\b/i.test(combined)) {
    if (refUpper && BE_RAVEL_PAGES[refUpper]) {
      return {
        sourceUrl: BE_RAVEL_PAGES[refUpper].url,
        sourceLabel: BE_RAVEL_PAGES[refUpper].label,
        geoportailUrl,
        portalBadge: 'RAVeL Wallonie',
      };
    }
    const lineMatch = combined.match(/\b(?:ligne\s*|l)(\d{2,3}[a-z]?)\b/i);
    if (lineMatch) {
      const code = `L${lineMatch[1].toUpperCase()}`;
      if (BE_RAVEL_PAGES[code]) {
        return {
          sourceUrl: BE_RAVEL_PAGES[code].url,
          sourceLabel: BE_RAVEL_PAGES[code].label,
          geoportailUrl,
          portalBadge: 'RAVeL Wallonie',
        };
      }
      return {
        sourceUrl: `https://ravel.wallonie.be/home/itineraires/local/ligne-${lineMatch[1].toLowerCase()}.html`,
        sourceLabel: `RAVeL Wallonie Officiel — Ligne ${lineMatch[1].toUpperCase()}`,
        geoportailUrl,
        portalBadge: 'RAVeL Wallonie',
      };
    }
    return {
      sourceUrl: 'https://ravel.wallonie.be/home/itineraires/carte-interactive.html',
      sourceLabel: `Portail Officiel RAVeL Wallonie — ${title}`,
      geoportailUrl,
      portalBadge: 'RAVeL Wallonie',
    };
  }

  // 6. Véloroutes & Radwege d'Allemagne (Moselle, Sarre, Eifel)
  if (country === 'DE' || /\bradweg\b/i.test(combined)) {
    if (/maare[-\s]*mosel/i.test(combined)) {
      return {
        sourceUrl: 'https://www.maare-moselradweg.de/strecke/',
        sourceLabel: 'Site Officiel Maare-Mosel-Radweg (Daun - Wittlich)',
        geoportailUrl,
        portalBadge: 'Maare-Mosel-Radweg',
      };
    }
    if (/ruwer[-\s]*hochwald/i.test(combined)) {
      return {
        sourceUrl: 'https://www.ruwer-hochwald-radweg.de/streckenverlauf/',
        sourceLabel: 'Site Officiel Ruwer-Hochwald-Radweg (Trèves - Hermeskeil)',
        geoportailUrl,
        portalBadge: 'Ruwer-Hochwald',
      };
    }
    if (/mosel[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.visitmosel.de/radfahren/mosel-radweg',
        sourceLabel: 'Portail Officiel Mosel-Radweg (VisitMosel)',
        geoportailUrl,
        portalBadge: 'Mosel-Radweg',
      };
    }
    if (/saar[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.urlaub.saarland/Media/Touren/Saar-Radweg',
        sourceLabel: 'Portail Officiel Saar-Radweg (Tourismus Saarland)',
        geoportailUrl,
        portalBadge: 'Saar-Radweg',
      };
    }
    if (/kyll[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.eifel.info/radfahren/radwege-in-der-eifel/kyll-radweg',
        sourceLabel: 'Eifel Tourismus — Kyll-Radweg Officiel',
        geoportailUrl,
        portalBadge: 'Eifel Radwege',
      };
    }
    if (/sauertal[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.eifel.info/radfahren/radwege-in-der-eifel/sauertal-radweg',
        sourceLabel: 'Eifel Tourismus — Sauertal-Radweg (Vallée de la Sûre)',
        geoportailUrl,
        portalBadge: 'Eifel Radwege',
      };
    }
    if (/pr[üu]mtal[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.eifel.info/radfahren/radwege-in-der-eifel/pruemtal-radweg',
        sourceLabel: 'Eifel Tourismus — Prümtal-Radweg Officiel',
        geoportailUrl,
        portalBadge: 'Eifel Radwege',
      };
    }
    if (/enztal[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.eifel.info/radfahren/radwege-in-der-eifel/enztal-radweg',
        sourceLabel: 'Eifel Tourismus — Enztal-Radweg Officiel',
        geoportailUrl,
        portalBadge: 'Eifel Radwege',
      };
    }
    if (/rurufer[-\s]*radweg/i.test(combined)) {
      return {
        sourceUrl: 'https://www.rurufer-radweg.de/streckenverlauf/',
        sourceLabel: 'Site Officiel Rurufer-Radweg (Hautes Fagnes - Eifel)',
        geoportailUrl,
        portalBadge: 'Rurufer-Radweg',
      };
    }
    return {
      sourceUrl: 'https://www.radwanderland.de/radwege',
      sourceLabel: `Radwanderland Officiel (Rhénanie-Palatinat / Eifel) — ${title}`,
      geoportailUrl,
      portalBadge: 'Radwanderland.de',
    };
  }

  // 7. Voies Vertes & Véloroutes de France (AF3V / France Vélo Tourisme)
  if (country === 'FR') {
    if (/houill[èe]res|canal.*sarre/i.test(combined)) {
      return {
        sourceUrl:
          'https://www.af3v.org/les-voies-vertes/voies/182-veloroute-du-canal-des-houilleres-de-la-sarre-ev5/',
        sourceLabel: 'AF3V Voies Vertes — Véloroute du Canal des Houillères de la Sarre',
        geoportailUrl,
        portalBadge: 'AF3V / France Vélo',
      };
    }
    if (/canner/i.test(combined)) {
      return {
        sourceUrl:
          'https://www.mosl.fr/je-visite/balades-et-randonnees/a-velo/',
        sourceLabel: 'Moselle Sans Limite — Voie Verte de la Vallée de la Canner',
        geoportailUrl,
        portalBadge: 'Voies Vertes Moselle',
      };
    }
    if (/fil bleu|orne/i.test(combined)) {
      return {
        sourceUrl:
          'https://www.mosl.fr/je-visite/balades-et-randonnees/a-velo/',
        sourceLabel: 'Moselle Sans Limite — Fil Bleu de la Vallée de l’Orne',
        geoportailUrl,
        portalBadge: 'Voies Vertes Moselle',
      };
    }
    return {
      sourceUrl:
        'https://www.francevelotourisme.com/destinations/grand-est-a-velo',
      sourceLabel: `France Vélo Tourisme & AF3V — ${title}`,
      geoportailUrl,
      portalBadge: 'France Vélo Tourisme',
    };
  }

  // 8. Pays-Bas (Zuid-Limburg / LF Routes)
  if (country === 'NL') {
    return {
      sourceUrl:
        'https://www.visitzuidlimburg.nl/te-doen-in-zuid-limburg/fietsen/fietsroutes/',
      sourceLabel: `Visit Zuid-Limburg Fietsnetwerk — ${title}`,
      geoportailUrl,
      portalBadge: 'Fietsnetwerk NL',
    };
  }

  // 9. Luxembourg piste cyclable communale / locale par défaut
  if (osmRelationId) {
    return {
      sourceUrl: `https://cycling.waymarkedtrails.org/#route?id=${osmRelationId}`,
      sourceLabel: `Waymarked Trails Cycling (Fiche OSM #${osmRelationId}) — ${title}`,
      geoportailUrl,
      portalBadge: 'Waymarked Cycling',
    };
  }

  return {
    sourceUrl:
      'https://travaux.public.lu/fr/reseau-cyclable/pistes-cyclables-nationales.html',
    sourceLabel: `Portail National du Réseau Cyclable (PCH) — ${title}`,
    geoportailUrl,
    portalBadge: 'Réseau Cyclable LU',
  };
}

/**
 * Applique les références web officielles sur un `RouteSuggestions` de type piste cyclable.
 */
export function applyCyclewayWebReferences(
  route: RouteSuggestions,
  coords?: [number, number][],
  osmWebsite?: string,
  osmRelationId?: number
): RouteSuggestions {
  if (route.routeKind !== 'cycleway') return route;
  const webRef = resolveCyclewayWebReference({
    id: route.id,
    title: route.title,
    cyclewayRef: route.cyclewayRef,
    cyclewayCategory: route.cyclewayCategory,
    country: route.country,
    coords,
    osmWebsite,
    osmRelationId,
    existingSourceUrl: route.sourceUrl,
    existingSourceLabel: route.sourceLabel,
  });

  return {
    ...route,
    sourceUrl: webRef.sourceUrl,
    sourceLabel: webRef.sourceLabel,
    geoportailUrl: webRef.geoportailUrl || route.geoportailUrl,
  };
}
