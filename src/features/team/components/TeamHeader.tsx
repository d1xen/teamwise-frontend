import type { Team } from '@/contexts/team/team.types';
import type { ReactNode } from 'react';
import { Globe, Twitter } from 'lucide-react';
import { cn } from '@/design-system';
import { TeamAvatar } from '@/shared/components/TeamAvatar';

interface TeamHeaderProps {
  team: Team;
  actions?: ReactNode;
  children?: ReactNode;
}

const GAME_BADGE: Record<string, { label: string; style: string }> = {
  CS2:      { label: 'CS2',      style: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  VALORANT: { label: 'VALORANT', style: 'bg-red-500/10 text-red-300 border-red-500/20' },
};

const LINK_ICONS: Record<string, typeof Globe> = {
  TWITTER: Twitter,
  HLTV:    Globe,
  FACEIT:  Globe,
};

export function TeamHeader({ team, actions, children }: TeamHeaderProps) {
  const externalLinks = (team.links ?? []).filter((l) => l.url);
  const gameBadge = team.game ? GAME_BADGE[team.game] : null;
  const hasActions = Boolean(actions || children);

  return (
    <div className="relative border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <div className="relative max-w-7xl mx-auto px-8 h-[132px] flex items-stretch gap-4">

        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <TeamAvatar
            logoUrl={team.logoUrl}
            name={team.name}
            tag={team.tag}
            size={64}
            className="ring-1 ring-neutral-800"
          />
        </div>

        {/* Main info */}
        <div className={cn('flex-1 min-w-0 flex flex-col py-4', hasActions ? 'justify-between' : 'justify-center gap-1')}>

          {/* Top: name + tag + game + links */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
                {team.name}
              </h1>

              {team.tag && (
                <span className="px-2.5 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-sm font-bold border border-neutral-700 flex-shrink-0">
                  {team.tag}
                </span>
              )}

              {gameBadge && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border flex-shrink-0 ${gameBadge.style}`}>
                  {gameBadge.label}
                </span>
              )}

              {externalLinks.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  {externalLinks.map((link) => {
                    const Icon = LINK_ICONS[link.type] ?? Globe;
                    return (
                      <a
                        key={link.type}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.type}
                        className="flex items-center gap-1 h-6 px-2 rounded text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{link.type}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            {team.description && (
              <p className="mt-1.5 text-sm text-neutral-500 leading-snug max-w-xl truncate">
                {team.description}
              </p>
            )}
          </div>

          {/* Bottom: tabs / actions */}
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
