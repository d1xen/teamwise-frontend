import type { ReactNode } from 'react';

interface FeatureHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  meta?: ReactNode;
  side?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  maxWidthClass?: string;
}

/**
 * FeatureHeader - En-tete harmonise pour les pages features.
 * Meme gabarit que TeamPage (hauteur, largeur, padding) pour y inserer des infos plus tard.
 */
export default function FeatureHeader({
  title,
  subtitle,
  tag,
  meta,
  side,
  actions,
  children,
  maxWidthClass = 'max-w-7xl',
}: FeatureHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <div className={`${maxWidthClass} mx-auto px-8 py-4 h-[152px] flex flex-col justify-between`}>
        <div className="flex items-start gap-5">
          <div className="flex-1 min-w-0 pt-0.5 overflow-hidden">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl font-bold text-white truncate">{title}</h1>
              {tag && (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-base font-bold border border-neutral-700 flex-shrink-0">
                  {tag}
                </span>
              )}
              {meta && (
                <span className="text-sm text-neutral-400 truncate">
                  {meta}
                </span>
              )}
            </div>
            {subtitle && (
              <div className="text-sm text-neutral-400 truncate">
                {subtitle}
              </div>
            )}
          </div>
          {side && <div className="flex-shrink-0">{side}</div>}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <div className="flex items-center gap-2 flex-nowrap">
            {actions}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
