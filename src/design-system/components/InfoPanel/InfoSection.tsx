import React from 'react';

interface InfoSectionProps {
  title?: string | undefined;
  subtitle?: string | undefined;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

/**
 * InfoSection - Conteneur pour une section d'informations
 * Affiche titre optionnel + contenu
 *
 * Usage:
 * <InfoSection title="Informations personnelles">
 *   <InfoField label="Prénom" value="John" />
 * </InfoSection>
 */
export function InfoSection({
  title,
  subtitle,
  children,
  className = '',
  bordered = true,
}: InfoSectionProps) {
  return (
    <div className={`${bordered ? 'bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6' : ''} space-y-4 ${className}`}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}


