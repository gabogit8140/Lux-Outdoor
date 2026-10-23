import React from 'react';

/**
 * Icône officielle et emblème de Komoot (Cible topographique vert lime & olive).
 */
export function KomootIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#7DB434" />
      <circle cx="12" cy="12" r="6.5" fill="#588523" />
      <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="1.3" fill="#7DB434" />
    </svg>
  );
}
