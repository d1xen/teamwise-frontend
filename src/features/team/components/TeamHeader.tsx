import type { Team } from '@/contexts/team/team.types';
import type { ReactNode } from 'react';
import { Globe, Twitter } from 'lucide-react';
import { cn } from '@/design-system';

interface TeamHeaderProps {
  team: Team;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * TeamHeader Premium - Hero header épuré et professionnel
 *
 * Design:
 * - Layout horizontal : Logo + Info principale + Actions verticales
 * - Pas de stats redondantes (visibles dans les sections)
 * - Established à côté du game
 * - Links + Management en colonne à droite
 */
export function TeamHeader({ team, actions, children }: TeamHeaderProps) {
  const externalLinks = (team.links || [])
    .map(link => {
      const iconMap = {
        HLTV: Globe,
        FACEIT: Globe,
        TWITTER: Twitter,
      };
      return {
        url: link.url,
        label: link.type,
        icon: iconMap[link.type]
      };
    })
    .filter(link => link.url);

  const hasActions = Boolean(actions || children);

  return (
    <div className="relative border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">

      <div className="relative max-w-7xl mx-auto px-8 py-3 h-[140px] flex items-stretch">
        {/* Logo */}
        <div className="mr-5">
          {team.logoUrl ? (
            <div className="h-full aspect-square">
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-full w-full rounded-xl object-cover ring-1 ring-neutral-800 shadow-lg"
              />
            </div>
          ) : (
            <div className="h-full aspect-square rounded-xl bg-neutral-800 flex items-center justify-center ring-1 ring-neutral-700 shadow-lg">
              <span className="text-3xl font-bold text-neutral-400">
                {team.name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Team info + actions */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className={cn('flex-1 min-w-0', hasActions ? 'flex flex-col justify-center' : 'flex items-center')}>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-bold text-white truncate">
                {team.name}
              </h1>

              {team.tag && (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-base font-bold border border-neutral-700 flex-shrink-0">
                  {team.tag}
                </span>
              )}

              {externalLinks.length > 0 && (
                <div className="flex items-center gap-2 ml-3 flex-wrap">
                  {externalLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium text-neutral-500/60 hover:text-neutral-300 transition-all"
                    >
                      <link.icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {hasActions && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              <div className="flex items-center gap-2 flex-nowrap">
                {actions}
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
