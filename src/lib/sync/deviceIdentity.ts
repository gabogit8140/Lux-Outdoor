export interface ConnectedDevice {
  id: string;
  name: string;
  deviceType: 'phone' | 'tablet' | 'desktop';
  userAgent?: string;
  connectedAt: string;
  lastSeen: string;
  status: 'allowed' | 'blocked';
}

const DEVICE_ID_STORAGE_KEY = 'luxoutdoor_device_id';
const VALID_DEVICE_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

/**
 * Obtient ou génère un identifiant unique, robuste et stable pour cet appareil
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!id || !VALID_DEVICE_ID_REGEX.test(id)) {
      const rand = Math.random().toString(36).substring(2, 10);
      id = `dev_${Date.now().toString(36)}_${rand}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 8);
  }
}

/**
 * Détecte le modèle convivial et le type d'appareil de l'utilisateur avec assainissement
 */
export function getDeviceProfile(): {
  id: string;
  name: string;
  deviceType: 'phone' | 'tablet' | 'desktop';
  userAgent: string;
} {
  const id = getDeviceId();
  const rawUa = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const ua = rawUa.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100);

  let name = 'Appareil Web';
  let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';

  const isIPad = /iPad/i.test(ua) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 2 && /Macintosh/i.test(ua));
  const isIPhone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIPad) {
    name = 'iPad';
    deviceType = 'tablet';
  } else if (isIPhone) {
    name = 'iPhone';
    deviceType = 'phone';
  } else if (isAndroid) {
    name = /Mobile/i.test(ua) ? 'Smartphone Android' : 'Tablette Android';
    deviceType = /Mobile/i.test(ua) ? 'phone' : 'tablet';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    name = 'Mac';
    deviceType = 'desktop';
  } else if (/Windows/i.test(ua)) {
    name = 'PC Windows';
    deviceType = 'desktop';
  } else if (/Linux/i.test(ua)) {
    name = 'Linux';
    deviceType = 'desktop';
  }

  // Précise le navigateur de façon sécurisée
  if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) {
    name += ' · Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    name += ' · Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    name += ' · Firefox';
  } else if (/Edg/i.test(ua)) {
    name += ' · Edge';
  }

  return {
    id,
    name: name.slice(0, 60),
    deviceType,
    userAgent: ua,
  };
}
