import React from 'react';

interface HuntingRifleIconProps {
  className?: string;
  size?: number;
}

/**
 * Icône vectorielle professionnelle d'un fusil de chasse (Hunting Rifle / Fusil de battue)
 * Dessinée selon les normes visuelles Lucide (24x24, stroke 2, round joins) :
 * - Canon long en diagonale (de la culasse à la bouche de feu)
 * - Mire de visée (guidon)
 * - Fût en bois sous le canon
 * - Pontet et queue de détente (gâchette)
 * - Crosse ergonomique biseautée
 */
export function HuntingRifleIcon({ className = 'w-4 h-4', size }: HuntingRifleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Canon long du fusil */}
      <line x1="9" y1="11" x2="21" y2="3" />
      {/* Mire / Guidon avant au bout du canon */}
      <line x1="20" y1="2" x2="21" y2="3" />
      {/* Fût sous le canon */}
      <line x1="10" y1="13" x2="16.5" y2="8.5" />
      {/* Culasse */}
      <line x1="8" y1="12" x2="10" y2="13" />
      {/* Pontet et queue de détente (gâchette) */}
      <path d="M9 13.5 C9.5 15.5 11.5 15.5 11.5 14" />
      {/* Crosse ergonomique en bois */}
      <path d="M8 12 L5 16.5 C3.8 18.2 3.8 20.5 5 21 C6.2 21.5 8 20 9.2 18.5 L10 14" />
    </svg>
  );
}
