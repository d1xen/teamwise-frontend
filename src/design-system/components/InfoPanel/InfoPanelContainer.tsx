import React from 'react';

interface InfoPanelContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * InfoPanelContainer - Wrapper principal pour affichage unifié d'informations
 * Utilisé pour: Équipe, Profil, Membres, etc.
 *
 * Style: background sombre avec border, espacement uniforme
 */
export function InfoPanelContainer({ children, className = '' }: InfoPanelContainerProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {children}
    </div>
  );
}

