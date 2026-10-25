import L from 'leaflet';

export interface DirectionalConeOptions {
  heading: number;
  color?: string;
  glowColor?: string;
  isOffTrack?: boolean;
}

/**
 * Génère une icône Leaflet avec faisceau lumineux d'orientation (cône directionnel de boussole).
 * Utilisé à la fois en guidage actif et lors de l'exploration de la carte au niveau de zoom sentier.
 */
export const createDirectionalUserIcon = ({
  heading,
  color = '#059669',
  glowColor = 'rgba(5, 150, 105, 0.45)',
  isOffTrack = false,
}: DirectionalConeOptions) => {
  const actualColor = isOffTrack ? '#f59e0b' : color;
  const actualGlow = isOffTrack ? 'rgba(245, 158, 11, 0.4)' : glowColor;
  const gradId = `dirConeGrad_${actualColor.replace('#', '')}_${isOffTrack ? 'warn' : 'ok'}`;

  return L.divIcon({
    className: 'directional-user-location-marker',
    html: `
      <div style="position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <!-- Cône directionnel d'orientation (faisceau lumineux de boussole) -->
        <svg width="120" height="120" viewBox="0 0 120 120" style="position: absolute; top: 0; left: 0; transform: rotate(${heading}deg); transform-origin: 60px 60px; pointer-events: none; transition: transform 0.16s ease-out;">
          <defs>
            <radialGradient id="${gradId}" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${actualColor}" stop-opacity="0.65" />
              <stop offset="35%" stop-color="${actualColor}" stop-opacity="0.38" />
              <stop offset="70%" stop-color="${actualColor}" stop-opacity="0.12" />
              <stop offset="100%" stop-color="${actualColor}" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- Cône triangulaire arrondi (ouverture 55°) projeté vers l'avant -->
          <path d="M 60 60 L 35 14 A 54 54 0 0 1 85 14 Z" fill="url(#${gradId})" />

          <!-- Flèche de visée fine au sommet du cône -->
          <line x1="60" y1="48" x2="60" y2="18" stroke="${actualColor}" stroke-width="2" stroke-linecap="round" opacity="0.85" />
          <polygon points="60,11 56,20 64,20" fill="${actualColor}" opacity="0.95" />
        </svg>

        <!-- Halo d'impulsion GPS -->
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${actualGlow}; animation: pulse 2s infinite;"></div>

        <!-- Pastille centrale marcheur avec contour blanc net -->
        <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; background: #ffffff; border: 3.5px solid ${actualColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 2;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${actualColor};"></div>
        </div>
      </div>
    `,
    iconSize: [120, 120],
    iconAnchor: [60, 60],
  });
};
