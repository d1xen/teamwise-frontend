import type { ReactNode } from 'react';

interface FeatureBodyProps {
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
}

/**
 * FeatureBody - Conteneur harmonise pour le corps des pages.
 * Largeur commune et padding identiques pour toutes les features.
 */
export default function FeatureBody({
  children,
  className,
  maxWidthClass = 'max-w-5xl',
}: FeatureBodyProps) {
  return (
    <div className={`${maxWidthClass} mx-auto px-8 py-8 ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
