/**
 * sync-visitluxembourg.ts
 * Legacy entry point - forwards to the unified modular pipeline.
 */

import { syncPipeline } from './pipeline/syncAll';

export function syncVisitLuxembourgGpx() {
  syncPipeline();
}

if (process.argv[1]?.endsWith('sync-visitluxembourg.ts')) {
  syncVisitLuxembourgGpx();
}
