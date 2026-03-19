import { useTranslation } from 'react-i18next';
import type { TeamMember } from '@/contexts/team/team.types';
import { calculateAge } from '@/shared/utils/dateUtils';
import { Crown } from 'lucide-react';
import Flag from 'react-world-flags';
import { IN_GAME_ROLE_LABELS } from '@/shared/config/gameConfig';

interface PlayerCardProps {
  member: TeamMember;
}

const ROLE_ACCENT: Record<string, string> = {
  IGL:     'text-amber-300',
  RIFLER:  'text-blue-300',
  SNIPER:  'text-emerald-300',
  DUELIST: 'text-red-300',
  CONTROLLER: 'text-purple-300',
  INITIATOR: 'text-orange-300',
  SENTINEL: 'text-cyan-300',
  FLEX: 'text-indigo-300',
};

export function PlayerCard({ member }: PlayerCardProps) {
  const { t } = useTranslation();

  const age = calculateAge(member.birthDate);
  const displayName = member.customUsername || member.nickname;
  const hasFullName = member.firstName || member.lastName;
  const fullName = hasFullName
    ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
    : null;

  const inGameRoleLabel = member.inGameRole
    ? (IN_GAME_ROLE_LABELS[member.inGameRole] ?? member.inGameRole)
    : null;

  const roleAccent = member.inGameRole ? (ROLE_ACCENT[member.inGameRole] ?? 'text-neutral-400') : 'text-neutral-400';

  return (
    <div className="group relative flex flex-col">
      {/* Card */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all duration-200 flex flex-col h-72">

        {/* Avatar — top 60% */}
        <div className="relative flex-shrink-0 h-[60%] bg-neutral-950 overflow-hidden">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black text-neutral-700 select-none">
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-neutral-900 to-transparent" />

          {/* Flag top-right */}
          {member.countryCode && (
            <div className="absolute top-2.5 right-2.5 drop-shadow-md">
              <Flag code={member.countryCode} className="w-6 h-4 rounded-[3px] shadow" />
            </div>
          )}

          {/* Owner crown top-left */}
          {member.isOwner && (
            <div className="absolute top-2.5 left-2.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded backdrop-blur-sm">
                <Crown className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          )}
        </div>

        {/* Info — bottom 40% */}
        <div className="flex flex-col justify-between px-3 pt-2 pb-3 flex-1 min-h-0">
          {/* Role */}
          <div>
            {inGameRoleLabel ? (
              <p className={`text-[11px] font-bold uppercase tracking-widest ${roleAccent} mb-0.5`}>
                {inGameRoleLabel}
              </p>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 mb-0.5">
                {t('roles.PLAYER')}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-h-0">
            <h3 className="text-base font-black text-white leading-tight truncate">
              {displayName}
            </h3>
            {fullName && (
              <p className="text-[11px] text-neutral-500 leading-tight truncate mt-0.5">
                {fullName}
              </p>
            )}
          </div>

          {/* Age */}
          {age && (
            <p className="text-[10px] text-neutral-600 mt-1">
              {age} {t('common.years')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
