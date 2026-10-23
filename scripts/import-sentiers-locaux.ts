/**
 * import-sentiers-locaux.ts
 * Convenience entry point to sync local communal trails via the modular pipeline.
 */

import { syncPipeline } from './pipeline/syncAll';

export function importSentiersLocaux() {
  syncPipeline({ categories: ['sentiers_locaux'] });
}

if (process.argv[1]?.endsWith('import-sentiers-locaux.ts')) {
  importSentiersLocaux();
}
