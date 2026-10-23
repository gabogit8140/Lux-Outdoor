/**
 * categories.ts
 * Central registry of all Luxembourg official trail datasets and formatting rules.
 */

import path from 'path';
import type { DatasetCategory } from './types';

export const PC_NAMES: Record<string, string> = {
  pc0: 'PC0 Liaison Urbaine Luxembourg',
  pc1: 'PC1 Piste cyclable du Centre (Luxembourg - Hesperange - Kockelscheuer)',
  pc2: 'PC2 Piste cyclable d’Echternach (Luxembourg - Junglinster - Echternach)',
  pc3: 'PC3 Piste cyclable des Trois Cantons (Schengen - Mondorf - Pétange)',
  pc4: 'PC4 Piste cyclable de la Syre (Ernster - Mertert - Wasserbillig)',
  pc5: 'PC5 Piste cyclable de l’Alzette (Luxembourg - Mersch - Ettelbruck)',
  pc6: 'PC6 Piste cyclable des Trois Vallées (Schengen - Remich - Wasserbillig)',
  pc7: 'PC7 Piste cyclable Jangeli (Remich - Mondorf-les-Bains)',
  pc8: 'PC8 Piste cyclable de la Terre Rouge (Bettembourg - Esch - Sanem)',
  pc9: 'PC9 Piste cyclable du Faubourg Minier (Sanem - Differdange - Pétange)',
  pc10: 'PC10 Piste cyclable François Faber (Leudelange - Schifflange)',
  pc11: 'PC11 Piste cyclable Charly Gaul (Fentange - Huncherange)',
  pc12: 'PC12 Piste cyclable de l’Attert (Pétange - Steinfort - Colmar-Berg)',
  pc13: 'PC13 Piste cyclable Nicolas Frantz (Strassen - Mamer - Kahler)',
  pc14: 'PC14 Piste cyclable de l’Eisch (Mamer - Koerich - Steinfort)',
  pc15: 'PC15 Piste cyclable de l’Our (Vianden - Stolzembourg - Dasburg)',
  pc16: 'PC16 Piste cyclable de la Moyenne Sûre (Reisdorf - Diekirch - Ettelbruck)',
  pc17: 'PC17 Piste cyclable de l’Ouest (Noerdange - Arsdorf - Martelange)',
  pc18: 'PC18 Piste cyclable des Ardoisières (Koetschette - Martelange)',
  pc19: 'PC19 Piste cyclable du Lac de la Haute-Sûre (Lultzhausen - Bavigne)',
  pc20: 'PC20 Piste cyclable de la Wiltz (Wiltz - Kautenbach - Bastogne)',
  pc21: 'PC21 Piste cyclable du Nord (Kautenbach - Clervaux - Troisvierges)',
  pc22: 'PC22 Piste cyclable de l’Ardenne (Troisvierges - Huldange - Gouvy)',
  pc23: 'PC23 Piste cyclable de Beckerich (Beckerich - Hovelange)',
};

export const DATASET_CATEGORIES: DatasetCategory[] = [
  {
    id: 'autopedestres',
    dir: 'autopedestres',
    categoryId: '11',
    activity: 'hike',
    prefix: 'lu-ap',
    sourceLabel: 'Auto-Pédestres Officiels du Luxembourg (Visit Luxembourg & Geoportail)',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/randonnees/auto-pedestres',
  },
  {
    id: 'sentiers_locaux',
    dir: 'sentiers_locaux',
    categoryId: '19',
    activity: 'hike',
    prefix: 'lu-local',
    sourceLabel: 'Sentiers Pédestres Locaux & Circuits Communaux du Luxembourg',
    sourceUrl: 'https://map.geoportail.lu/theme/tourisme',
  },
  {
    id: 'pistes_cyclables_nationales',
    dir: 'pistes_cyclables_nationales',
    categoryId: '105',
    activity: 'bike',
    prefix: 'lu-pc',
    sourceLabel: 'Réseau National des Pistes Cyclables (PC) du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo/pistes-cyclables',
  },
  {
    id: 'pistes_vtt',
    dir: 'pistes_vtt',
    categoryId: '8',
    activity: 'bike',
    prefix: 'lu-vtt',
    sourceLabel: 'Circuits VTT & Mountainbike Officiels du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo/vtt',
  },
  {
    id: 'velo_rando',
    dir: 'velo_rando',
    categoryId: '117',
    activity: 'bike',
    prefix: 'lu-velo',
    sourceLabel: 'Randonnées et Boucles Cyclables Touristiques Visit Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo',
  },
  {
    id: 'velo_course',
    dir: 'velo_course',
    categoryId: '107',
    activity: 'bike',
    prefix: 'lu-course',
    sourceLabel: 'Circuits Vélo de Course sur Route du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo',
  },
  {
    id: 'mullerthal',
    dir: 'mullerthal',
    categoryId: '12',
    activity: 'hike',
    prefix: 'lu-mullerthal',
    sourceLabel: 'Mullerthal Trail & Sentiers Régionaux de la Petite Suisse',
    sourceUrl: 'https://www.mullerthal-trail.lu',
  },
  {
    id: 'eislek_pied',
    dir: 'eislek_pied',
    categoryId: '152',
    activity: 'hike',
    prefix: 'lu-eislek',
    sourceLabel: 'Éislek Pied - Circuits Pédestres de l’Ardenne Luxembourgeoise',
    sourceUrl: 'https://www.visit-eislek.lu',
  },
  {
    id: 'guttland_trails',
    dir: 'guttland_trails',
    categoryId: '121',
    activity: 'hike',
    prefix: 'lu-guttland',
    sourceLabel: 'Guttland.Trails - Sentiers Randonnée du Centre & Vallée des Sept Châteaux',
    sourceUrl: 'https://www.visitguttland.lu',
  },
  {
    id: 'escapardenne',
    dir: 'escapardenne',
    categoryId: '13',
    activity: 'hike',
    prefix: 'lu-escapardenne',
    sourceLabel: 'Escapardenne Eislek Trail & Lee Trail (Leading Quality Trails)',
    sourceUrl: 'https://www.escapardenne.eu',
  },
  {
    id: 'sentiers_nationaux',
    dir: 'sentiers_nationaux',
    categoryId: '9',
    activity: 'hike',
    prefix: 'lu-national',
    sourceLabel: 'Sentiers Pédestres Nationaux & GR du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/randonnees',
  },
  {
    id: 'cfl',
    dir: 'cfl',
    categoryId: '10',
    activity: 'hike',
    prefix: 'lu-cfl',
    sourceLabel: 'Sentiers Pédestres CFL (Randonnées de Gare en Gare)',
    sourceUrl: 'https://www.cfl.lu/fr-fr/leisure/detail/randonnees-en-train',
  },
  {
    id: 'sentiers_confort',
    dir: 'sentiers_confort',
    categoryId: '191',
    activity: 'hike',
    prefix: 'lu-confort',
    sourceLabel: 'Sentiers Pédestres Confort & Accessibilité Facile',
    sourceUrl: 'https://www.visitluxembourg.com',
  },
  {
    id: 'sentier_adrien_ries',
    dir: 'sentier_adrien_ries',
    categoryId: '25',
    activity: 'hike',
    prefix: 'lu-adrien-ries',
    sourceLabel: 'Sentier Culturel et Naturel Adrien Ries',
    sourceUrl: 'https://www.nordstad.lu',
  },
  {
    id: 'circuit_du_lac',
    dir: 'circuit_du_lac',
    categoryId: '700',
    activity: 'hike',
    prefix: 'lu-lac',
    sourceLabel: 'Circuit du Lac de la Haute-Sûre',
    sourceUrl: 'https://www.naturpark-sure.lu',
  },
  {
    id: 'traumschleifen',
    dir: 'traumschleifen',
    categoryId: '22',
    activity: 'hike',
    prefix: 'lu-traum',
    sourceLabel: 'Traumschleifen - Boucles de Rêve Sarre-Hunsrück / Luxembourg',
    sourceUrl: 'https://www.saar-hunsrueck-steig.de',
  },
];

export function cleanTrackTitle(raw: string, category: DatasetCategory, filename: string): string {
  let title = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Strip generic clutter
  title = title.replace(/\s*<\s*>\s*/g, '');
  title = title.replace(/^Autopedestres\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pedestre\s+/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pédestre\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/^Pistes_VTT\s*:\s*/i, 'Circuit VTT ');
  title = title.replace(/\s*VTTMTB/gi, '');
  title = title.replace(/\s*VTT\/MTB/gi, '');
  title = title.replace(/^Velo_rando\s*:\s*/i, 'Boucle Cyclable ');
  title = title.replace(/\s*_NEW\b/gi, '');
  title = title.replace(/_+/g, ' ');

  if (category.dir === 'pistes_cyclables_nationales') {
    const base = path.basename(filename, '.gpx').toLowerCase();
    const pcKey = base.split('_')[0];
    if (PC_NAMES[pcKey]) {
      return PC_NAMES[pcKey] + (base.includes('_') ? ` (Tronçon ${base.split('_')[1]})` : '');
    }
    return `Piste Cyclable Nationale ${title}`;
  }

  if (category.dir === 'autopedestres') {
    if (!title.toLowerCase().startsWith('auto-pédestre')) {
      title = `Auto-Pédestre ${title}`;
    }
  }

  if (category.dir === 'sentiers_locaux') {
    if (!title.toLowerCase().startsWith('circuit local') && !title.toLowerCase().startsWith('sentier local')) {
      title = `Circuit Local ${title}`;
    }
  }

  if (category.dir === 'pistes_vtt') {
    if (!title.toLowerCase().includes('vtt') && !title.toLowerCase().includes('mtb')) {
      title = `Circuit VTT ${title}`;
    }
  }

  if (category.dir === 'cfl') {
    if (!title.toLowerCase().startsWith('sentier cfl') && !title.toLowerCase().startsWith('cfl')) {
      title = `Sentier CFL ${title}`;
    }
  }

  if (category.dir === 'eislek_pied') {
    if (!title.toLowerCase().startsWith('éislek pied') && !title.toLowerCase().startsWith('eislek pied')) {
      title = `Éislek Pied ${title}`;
    }
  }

  if (category.dir === 'guttland_trails') {
    if (!title.toLowerCase().startsWith('guttland')) {
      title = `Guttland.Trail ${title}`;
    }
  }

  return title;
}
