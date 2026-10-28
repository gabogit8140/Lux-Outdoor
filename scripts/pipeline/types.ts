/**
 * types.ts
 * Types for the Lux Outdoor dataset ingestion and processing pipeline.
 */

export interface DatasetCategory {
  id: string;
  dir: string;
  categoryId?: string;
  activity: 'bike' | 'hike';
  prefix: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface PipelineSyncOptions {
  categories?: string[];
  forceRedownload?: boolean;
  skipIndexing?: boolean;
}

export interface ParsedTrackData {
  coords: [number, number][]; // [lon, lat]
  elevations: number[];
  foundEleInFile: boolean;
  rawTitle: string;
}

export interface ProcessedTrackResult {
  slug: string;
  cleanName: string;
  totalDistKm: number;
  activity: 'bike' | 'hike';
  outPath: string;
}
