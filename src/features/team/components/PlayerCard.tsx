import { useTranslation } from 'react-i18next';
import type { TeamMember } from '@/contexts/team/team.types';
import { calculateAge } from '@/shared/utils/dateUtils';
import { Calendar } from 'lucide-react';
import Flag from 'react-world-flags';

interface PlayerCardProps {
  member: TeamMember;
}

/**
 * PlayerCard Premium - Design sobre et professionnel
 *
 * Style:
 * - Design épuré, moderne
 * - Pas de glow multicolore (sobre)
 * - Hover subtil sans scale
 * - Drapeau non encadré
 * - Badges minimalistes
 */
export function PlayerCard({ member }: PlayerCardProps) {
  const { t } = useTranslation();

  const age = calculateAge(member.birthDate);
  const displayName = member.customUsername || member.nickname;
  const hasFullName = member.firstName || member.lastName;
  const fullName = hasFullName
    ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
    : null;

  return (
    <div className="group relative">
      <div className="relative bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:bg-neutral-900/70 hover:border-neutral-700 transition-all duration-200 h-[300px] w-full max-w-[210px] mx-auto flex flex-col">
        {/* Visuel haut (buste) */}
        <div className="relative h-40 bg-neutral-950">
          <img
            src={member.avatarUrl}
            alt={displayName}
            className="h-full w-full object-contain object-top"
          />
        </div>

        {/* Infos */}
        <div className="relative p-3 flex-1 overflow-hidden flex flex-col">
          {member.countryCode && (
            <div className="absolute top-2.5 right-2.5">
              <Flag
                code={member.countryCode}
                className="w-6 h-4 rounded-sm shadow-lg"
              />
            </div>
          )}
          <div className="min-w-0 min-h-[44px]">
            <h3 className="text-lg font-bold text-white truncate leading-tight">
              {displayName}
            </h3>
            {fullName && (
              <p className="text-sm text-neutral-400 truncate leading-tight">
                {fullName}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-center gap-2 flex-nowrap overflow-hidden">
            {age && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-800/50 rounded-lg border border-neutral-700/30 shrink-0">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-300 whitespace-nowrap">
                  {age} {t('common.years')}
                </span>
              </div>
            )}

            {member.role !== 'PLAYER' && (
              <span className="px-2 py-1 bg-neutral-800 text-neutral-500 rounded text-[11px] font-medium uppercase whitespace-nowrap truncate max-w-[110px]">
                {t(`roles.${member.role}`)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
