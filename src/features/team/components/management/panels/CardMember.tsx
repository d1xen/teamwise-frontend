import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/contexts/team/team.types";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Crown } from "lucide-react";
import { cn } from "@/design-system";
import Flag from "react-world-flags";
import { UserAvatar } from "@/shared/components/UserAvatar";
import FaceitIcon from "@/shared/components/FaceitIcon";

interface CardMemberProps {
  member: TeamMember;
  isSelected: boolean;
  onSelect: () => void;
  isStaffView: boolean;
}

export default function CardMember({ member, isSelected, onSelect, isStaffView }: CardMemberProps) {
  const { t } = useTranslation();
  const displayName = member.customUsername || member.nickname;
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full text-left flex items-start gap-3.5 px-4 py-3.5 rounded-xl border transition-all duration-150",
        isSelected
          ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/15"
          : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/70 hover:border-neutral-700/80"
      )}
    >
      {/* Avatar */}
      <UserAvatar
        profileImageUrl={member.profileImageUrl}
        avatarUrl={member.avatarUrl}
        nickname={displayName}
        size={40}
        className="ring-1 ring-neutral-700/50 mt-0.5"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-white truncate leading-tight">
            {displayName}
          </span>
          {member.countryCode && (
            <Flag code={member.countryCode} className="w-3.5 h-2.5 rounded-none opacity-60 shrink-0" />
          )}
          {member.isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          {member.faceitNickname && (
            <a
              href={`https://www.faceit.com/en/players/${member.faceitNickname}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title={`FACEIT · ${member.faceitNickname}`}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <FaceitIcon className="w-3 h-3 text-orange-400" />
            </a>
          )}
        </div>
        {fullName && (
          <p className="text-[11px] text-neutral-500 truncate leading-tight">{fullName}</p>
        )}
      </div>

      {/* Top-right badges */}
      <div className="shrink-0 flex items-center gap-1.5">
        {isStaffView ? (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide",
            ROLE_BADGE_STYLES[member.role]
          )}>
            {t(`roles.${member.role}`)}
          </span>
        ) : (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide",
            member.activePlayer !== false
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-neutral-800 text-neutral-600 border-neutral-700"
          )}>
            {member.activePlayer !== false ? t("management.player_active") : t("management.player_inactive")}
          </span>
        )}
      </div>
    </button>
  );
}
