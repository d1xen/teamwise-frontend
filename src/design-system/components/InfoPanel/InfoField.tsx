import React from 'react';

interface InfoFieldProps {
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * InfoField - Affichage d'un champ en mode lecture seule
 *
 * Usage:
 * <InfoField label="Email" value="john@example.com" />
 * <InfoField label="Website">
 *   <a href={url} target="_blank">{url}</a>
 * </InfoField>
 */
export function InfoField({ label, value, children, className = '' }: InfoFieldProps) {
  return (
    <div className={className}>
      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="text-sm text-neutral-200 break-all">
        {children || value || '-'}
      </p>
    </div>
  );
}

interface InfoFieldGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * InfoFieldGroup - Groupe de champs en grille
 *
 * Usage:
 * <InfoFieldGroup columns={2}>
 *   <InfoField label="Prénom" value="John" />
 *   <InfoField label="Nom" value="Doe" />
 * </InfoFieldGroup>
 */
export function InfoFieldGroup({ children, columns = 2, className = '' }: InfoFieldGroupProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {children}
    </div>
  );
}

