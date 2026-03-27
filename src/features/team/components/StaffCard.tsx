import { useTranslation } from 'react-i18next';
import type { TeamMember } from '@/contexts/team/team.types';
import { Crown } from 'lucide-react';
import Flag from 'react-world-flags';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { ROLE_BADGE_STYLES } from '@/shared/constants/roleStyles';
import FaceitIcon from '@/shared/components/FaceitIcon';
import { cn } from '@/design-system';

interface StaffCardProps {
  member: TeamMember;
}

export function StaffCard({ member }: StaffCardProps) {
  const { t } = useTranslation();

  const displayName = member.customUsername || member.nickname;
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || null;
  const roleStyle = ROLE_BADGE_STYLES[member.role] ?? 'bg-neutral-800 text-neutral-400 border-neutral-700';

  return (
    <div className="flex items-start gap-3.5 px-4 py-3.5 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-200 group">

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <UserAvatar
          profileImageUrl={member.profileImageUrl}
          avatarUrl={member.avatarUrl}
          nickname={displayName}
          size={44}
          className="border border-neutral-700/50 mt-0.5"
        />
        {member.isOwner && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
            <Crown className="w-2.5 h-2.5 text-amber-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-bold text-white truncate">{displayName}</span>
          {member.faceitNickname && (
            <a
              href={`https://www.faceit.com/en/players/${member.faceitNickname}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title={`FACEIT · ${member.faceitNickname}`}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <FaceitIcon className="w-3.5 h-3.5 text-orange-400" />
            </a>
          )}
          {member.countryCode && (
            <Flag code={member.countryCode} className="w-4 h-2.5 rounded-none flex-shrink-0 opacity-80" />
          )}
        </div>
        {fullName && (
          <p className="text-[11px] text-neutral-500 truncate leading-tight">{fullName}</p>
        )}
      </div>

      {/* Role badge — top right */}
      <div className="shrink-0">
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide", roleStyle)}>
          {t(`roles.${member.role}`)}
        </span>
      </div>
    </div>
  );
}
