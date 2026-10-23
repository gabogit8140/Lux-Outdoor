import React, { useId } from 'react';

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
 * Premium "Trace Outdoor PRO" Emblem — matches the exact Home Screen (Écran d'accueil) PWA icon.
 * Combines a deep alpine obsidian-emerald squircle, etched topographic contours,
 * 3D faceted dual alpine peaks, a golden alpine sun, and a luminous GPX trail ribbon
 * connecting the valley start node to the summit finish beacon.
 */
export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none shadow-lg shadow-emerald-950/35 ring-1 ring-emerald-400/35 ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <defs>
          {/* Deep Alpine Obsidian-Emerald Background Gradient */}
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="48%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Subtle Radial Summit Glow */}
          <radialGradient id={`glow-${uid}`} cx="275" cy="175" r="245" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#059669" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
          </radialGradient>

          {/* Sunlit Left Mountain Facet */}
          <linearGradient id={`peak-lit-${uid}`} x1="160" y1="115" x2="290" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>

          {/* Shaded Right Mountain Facet */}
          <linearGradient id={`peak-shade-${uid}`} x1="275" y1="115" x2="405" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Secondary Left Peak Facet */}
          <linearGradient id={`peak-sec-${uid}`} x1="110" y1="185" x2="225" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.80" />
          </linearGradient>

          {/* Luminous GPX Trail Ribbon (Warm Gold to Emerald) */}
          <linearGradient id={`trail-${uid}`} x1="125" y1="430" x2="295" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="52%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Ultra-Fine Inner Glass Rim */}
          <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Full-bleed Squircle Canvas */}
        <rect width="512" height="512" rx="116" fill={`url(#bg-${uid})`} />
        <rect width="512" height="512" rx="116" fill={`url(#glow-${uid})`} />

        {/* Etched Topographic Contour Rings */}
        <circle cx="275" cy="210" r="196" stroke="#34d399" strokeOpacity="0.12" strokeWidth="2.5" strokeDasharray="10 8" />
        <circle cx="275" cy="210" r="152" stroke="#34d399" strokeOpacity="0.16" strokeWidth="2.5" />
        <circle cx="275" cy="210" r="108" stroke="#6ee7b7" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="6 6" />

        {/* Golden Alpine Sun & Halo (Upper Right Sky) */}
        <circle cx="372" cy="126" r="34" fill="#fbbf24" fillOpacity="0.18" />
        <circle cx="372" cy="126" r="20" fill="#fbbf24" />
        <circle cx="372" cy="126" r="9" fill="#fef3c7" />

        {/* Secondary Left Alpine Peak */}
        <path d="M88 344 L176 196 L252 344 Z" fill={`url(#peak-sec-${uid})`} />
        <path d="M176 196 L212 344 L252 344 Z" fill="#047857" fillOpacity="0.55" />

        {/* Primary Main Summit — Sunlit Left Facet */}
        <path d="M158 344 L282 118 L298 344 Z" fill={`url(#peak-lit-${uid})`} />
        {/* Primary Main Summit — Shaded Right Ridge Facet */}
        <path d="M282 118 L418 344 L298 344 Z" fill={`url(#peak-shade-${uid})`} />

        {/* Dark Valley Cutout for High-Contrast GPX Trail Separation */}
        <path
          d="M136 432 C 175 372, 346 362, 326 304 C 312 266, 234 250, 282 196"
          stroke="#022c22"
          strokeWidth="44"
          strokeLinecap="round"
          fill="none"
          opacity="0.88"
        />

        {/* Winding Luminous GPX Route Ribbon */}
        <path
          d="M136 432 C 175 372, 346 362, 326 304 C 312 266, 234 250, 282 196"
          stroke={`url(#trail-${uid})`}
          strokeWidth="26"
          strokeLinecap="round"
          fill="none"
        />

        {/* Crisp Inner Centerline on GPX Ribbon */}
        <path
          d="M136 432 C 175 372, 346 362, 326 304 C 312 266, 234 250, 282 196"
          stroke="#ffffff"
          strokeOpacity="0.65"
          strokeWidth="5"
          strokeDasharray="10 12"
          strokeLinecap="round"
          fill="none"
        />

        {/* Start Waypoint Node (Bottom Left Valley) */}
        <circle cx="136" cy="432" r="20" fill="#ffffff" />
        <circle cx="136" cy="432" r="10" fill="#059669" />

        {/* Summit Finish Waypoint Node (At Top of GPX Trace) */}
        <circle cx="282" cy="196" r="16" fill="#ffffff" />
        <circle cx="282" cy="196" r="8" fill="#f59e0b" />

        {/* Fine Luxury Squircle Glass Rim */}
        <rect
          x="3"
          y="3"
          width="506"
          height="506"
          rx="113"
          stroke={`url(#rim-${uid})`}
          strokeWidth="6"
          fill="none"
        />
      </svg>
    </div>
  );
}
