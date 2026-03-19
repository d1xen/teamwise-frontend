import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/contexts/team/team.types";
import { IN_GAME_ROLE_LABELS } from "@/shared/utils/inGameRoles";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Crown } from "lucide-react";
import { cn } from "@/design-system";
import Flag from "react-world-flags";

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
        "group w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all duration-150",
        isSelected
          ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/15"
          : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/70 hover:border-neutral-700/80"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 ring-1 ring-neutral-700/50">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-base font-bold text-neutral-500">
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-white truncate leading-tight">
            {displayName}
          </span>
          {member.isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          {member.countryCode && (
            <Flag code={member.countryCode} className="w-3.5 h-2.5 rounded-[2px] opacity-60 shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-neutral-500 truncate leading-tight">
          {fullName || t(`roles.${member.role}`)}
        </p>
      </div>

      {/* Right badges */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        {isStaffView ? (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide",
            ROLE_BADGE_STYLES[member.role]
          )}>
            {t(`roles.${member.role}`)}
          </span>
        ) : (
          <>
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide",
              member.activePlayer !== false
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-neutral-800 text-neutral-600 border-neutral-700"
            )}>
              {member.activePlayer !== false ? t("management.roster_active") : t("management.roster_inactive")}
            </span>
            {member.inGameRole && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400 border border-neutral-700/50">
                {IN_GAME_ROLE_LABELS[member.inGameRole]}
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
}
