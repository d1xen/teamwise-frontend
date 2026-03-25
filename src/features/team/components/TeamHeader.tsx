import type { Team } from '@/contexts/team/team.types';
import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/design-system';
import { TeamAvatar } from '@/shared/components/TeamAvatar';
import FaceitIcon from '@/shared/components/FaceitIcon';
import hltvLogo from '@/shared/assets/hltv.png';

interface TeamHeaderProps {
  team: Team;
  actions?: ReactNode;
  children?: ReactNode;
}

const GAME_BADGE: Record<string, { label: string; style: string }> = {
  CS2:      { label: 'CS2',      style: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  VALORANT: { label: 'VALORANT', style: 'bg-red-500/10 text-red-300 border-red-500/20' },
};

function XIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function HltvIcon({ className }: { className?: string | undefined }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <img src={hltvLogo} alt="HLTV" className="max-w-full max-h-full object-contain" />
    </span>
  );
}

function LinkIcon({ type, className }: { type: string; className?: string | undefined }) {
  switch (type) {
    case 'TWITTER': return <XIcon className={className} />;
    case 'HLTV': return <HltvIcon className={className} />;
    case 'FACEIT': return <FaceitIcon className={className} />;
    default: return <Globe className={className} />;
  }
}

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
                  {externalLinks.map((link) => (
                    <a
                      key={link.type}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.type}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
                    >
                      <LinkIcon type={link.type} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

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
