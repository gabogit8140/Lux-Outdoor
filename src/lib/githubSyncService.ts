/**
 * Service de synchronisation direct avec GitHub REST API (Option B)
 * Permet d'envoyer des fichiers GPX directement dans le dépôt GitHub sans aucun serveur tiers.
 * Déclenche automatiquement GitHub Actions pour redéployer GitHub Pages.
 */

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  autoSync: boolean;
}

const GITHUB_CONFIG_STORAGE_KEY = 'trace_outdoor_github_config';

const DEFAULT_CONFIG: GitHubConfig = {
  owner: 'gabogit8140',
  repo: 'Trace-Outdoor',
  branch: 'main',
  token: '',
  autoSync: false,
};

/**
 * Récupère la configuration GitHub stockée dans localStorage
 */
export function getGitHubConfig(): GitHubConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = window.localStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      owner: (parsed.owner || DEFAULT_CONFIG.owner).trim(),
      repo: (parsed.repo || DEFAULT_CONFIG.repo).trim(),
      branch: (parsed.branch || DEFAULT_CONFIG.branch).trim(),
      token: (parsed.token || '').trim(),
      autoSync: Boolean(parsed.autoSync),
    };
  } catch (e) {
    console.warn('Erreur de lecture de la configuration GitHub:', e);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Enregistre la configuration GitHub dans localStorage
 */
export function saveGitHubConfig(config: Partial<GitHubConfig>): GitHubConfig {
  const current = getGitHubConfig();
  const updated: GitHubConfig = {
    owner: (config.owner ?? current.owner).trim(),
    repo: (config.repo ?? current.repo).trim(),
    branch: (config.branch ?? current.branch).trim(),
    token: (config.token ?? current.token).trim(),
    autoSync: config.autoSync ?? current.autoSync,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

/**
 * Encode une chaîne Unicode (XML/GPX) en Base64 sans altération
 */
function utf8ToBase64(str: string): string {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Nettoie et normalise le nom de fichier pour le stockage GitHub
 */
export function sanitizeGpxFileName(name: string): string {
  let clean = name.trim().toLowerCase();
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Enlever accents
  clean = clean.replace(/[^a-z0-9_.-]/g, '-'); // Remplacer espaces et caractères spéciaux
  clean = clean.replace(/-+/g, '-'); // Éviter doubles tirets
  if (!clean.endsWith('.gpx')) {
    clean += '.gpx';
  }
  return clean;
}

export interface ConnectionTestResult {
  ok: boolean;
  repoFullName?: string;
  defaultBranch?: string;
  isPrivate?: boolean;
  canPush?: boolean;
  error?: string;
}

/**
 * Teste la connexion à l'API GitHub avec les paramètres fournis
 */
export async function testGitHubConnection(configOverride?: Partial<GitHubConfig>): Promise<ConnectionTestResult> {
  const config = { ...getGitHubConfig(), ...configOverride };

  if (!config.owner || !config.repo) {
    return { ok: false, error: 'Propriétaire ou dépôt non spécifié' };
  }

  if (!config.token) {
    return { ok: false, error: 'Token GitHub (PAT) manquant. Créez un token avec droit "contents: write".' };
  }

  try {
    const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.status === 401) {
      return { ok: false, error: 'Token GitHub invalide ou expiré (Erreur 401 Unauthorized)' };
    }
    if (res.status === 404) {
      return { ok: false, error: `Dépôt "${config.owner}/${config.repo}" introuvable ou accès refusé (Erreur 404)` };
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.message || `Erreur GitHub HTTP ${res.status}` };
    }

    const data = await res.json();
    const canPush = Boolean(data.permissions?.push || data.permissions?.admin);

    return {
      ok: true,
      repoFullName: data.full_name,
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      canPush,
      error: canPush ? undefined : 'Attention: Le token ne possède pas les permissions d\'écriture (push) sur ce dépôt.',
    };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Erreur réseau lors de la communication avec GitHub' };
  }
}

export interface UploadResult {
  ok: boolean;
  path: string;
  sha?: string;
  commitUrl?: string;
  error?: string;
}

/**
 * Pousse un fichier GPX directement dans le dépôt GitHub via l'API REST Contents
 * Emplacement cible : public/gpx/{bike|hike}/{nom-du-fichier}.gpx
 */
export async function uploadGpxToGitHub(
  file: { name: string; content: string; activity: 'bike' | 'hike' },
  customCommitMessage?: string,
  configOverride?: Partial<GitHubConfig>
): Promise<UploadResult> {
  const config = { ...getGitHubConfig(), ...configOverride };

  if (!config.token) {
    return {
      ok: false,
      path: '',
      error: 'Token GitHub absent. Veuillez configurer votre token dans l\'onglet GitHub.',
    };
  }

  const cleanName = sanitizeGpxFileName(file.name);
  const targetPath = `public/gpx/${file.activity}/${cleanName}`;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${targetPath}`;

  try {
    // 1. Vérifier si le fichier existe déjà pour récupérer son SHA (nécessaire pour la mise à jour)
    let existingSha: string | undefined;
    const checkRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(config.branch)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (checkRes.ok) {
      const fileData = await checkRes.json();
      existingSha = fileData.sha;
    }

    // 2. Encoder le contenu GPX en Base64 UTF-8
    const contentBase64 = utf8ToBase64(file.content);

    // 3. Effectuer la requête PUT pour créer ou écraser le fichier
    const commitMsg =
      customCommitMessage ||
      `feat(gpx): add ${cleanName} [${file.activity === 'bike' ? 'Vélo' : 'Randonnée'}]`;

    const putPayload: Record<string, any> = {
      message: commitMsg,
      content: contentBase64,
      branch: config.branch,
    };

    if (existingSha) {
      putPayload.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(putPayload),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        ok: false,
        path: targetPath,
        error: errData.message || `Erreur HTTP ${putRes.status}`,
      };
    }

    const data = await putRes.json();
    return {
      ok: true,
      path: targetPath,
      sha: data.content?.sha,
      commitUrl: data.commit?.html_url,
    };
  } catch (err: any) {
    return {
      ok: false,
      path: targetPath,
      error: err.message || 'Erreur réseau lors de l\'envoi vers GitHub',
    };
  }
}

export interface BatchUploadReport {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ name: string; ok: boolean; path: string; error?: string; commitUrl?: string }>;
}

/**
 * Pousse une liste de fichiers GPX séquentiellement vers GitHub
 */
export async function batchUploadGpxToGitHub(
  files: Array<{ name: string; content: string; activity: 'bike' | 'hike' }>,
  configOverride?: Partial<GitHubConfig>,
  onProgress?: (index: number, total: number, fileName: string) => void
): Promise<BatchUploadReport> {
  const report: BatchUploadReport = {
    total: files.length,
    succeeded: 0,
    failed: 0,
    results: [],
  };

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (onProgress) {
      onProgress(i + 1, files.length, f.name);
    }

    const res = await uploadGpxToGitHub(f, undefined, configOverride);
    if (res.ok) {
      report.succeeded++;
      report.results.push({ name: f.name, ok: true, path: res.path, commitUrl: res.commitUrl });
    } else {
      report.failed++;
      report.results.push({ name: f.name, ok: false, path: res.path, error: res.error });
    }
  }

  return report;
}
