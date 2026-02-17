import type { Team } from '@/contexts/team/team.types';
import { ExternalLink, Globe, Twitter } from 'lucide-react';

interface TeamHeaderProps {
  team: Team;
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
export function TeamHeader({ team }: TeamHeaderProps) {
  const externalLinks = [
    { url: team.hltvUrl, label: 'HLTV', icon: Globe },
    { url: team.faceitUrl, label: 'FACEIT', icon: Globe },
    { url: team.twitterUrl, label: 'Twitter', icon: Twitter },
  ].filter(link => link.url);

  return (
    <div className="relative border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">

      <div className="relative max-w-7xl mx-auto px-8 py-4 h-[152px] flex flex-col justify-between">
        {/* Top: Logo + Info principale */}
        <div className="flex items-start gap-5 mb-3">

          {/* Logo */}
          {team.logoUrl ? (
            <div className="relative flex-shrink-0">
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-16 h-16 rounded-xl object-cover ring-1 ring-neutral-800 shadow-lg"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center ring-1 ring-neutral-700 shadow-lg flex-shrink-0">
              <span className="text-2xl font-bold text-neutral-400">
                {team.name[0]}
              </span>
            </div>
          )}

          {/* Team info */}
          <div className="flex-1 min-w-0 pt-0.5">

            {/* Title + Tag - AGRANDI */}
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl font-bold text-white truncate">
                {team.name}
              </h1>

              {team.tag && (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-base font-bold border border-neutral-700 flex-shrink-0">
                  {team.tag}
                </span>
              )}
            </div>

            {/* Game */}
            {team.game && (
              <div className="text-sm text-neutral-500">
                {team.game}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: External links seulement */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <div className="flex items-center gap-2 flex-nowrap">
            {/* External links */}
            {externalLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
