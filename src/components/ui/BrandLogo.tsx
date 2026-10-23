import React from 'react';
import { APP_CONFIG } from '../../lib/config/appConfig';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-5 h-5 rounded-md',
  sm: 'w-6 h-6 rounded-lg',
  md: 'w-9 h-9 rounded-2xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-16 h-16 rounded-3xl',
};

/**
 * Emblème officiel "Lux Outdoor" — Roude Léiw du Luxembourg sur carte topographique.
 * Représente fidèlement le lion rouge officiel couronné d'or, armé et lampassé d'or,
 * avec sa double queue fourchée sur fond vert forêt émeraude et ruban de sentier GPX.
 */
export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none shadow-lg shadow-emerald-950/35 ring-1 ring-emerald-400/35 ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden="true"
    >
      <img
        src="./pwa-192x192.png"
        alt={`${APP_CONFIG.name} — Roude Léiw`}
        className="w-full h-full object-cover block"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
