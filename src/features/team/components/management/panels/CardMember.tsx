import type { TeamMember } from "@/contexts/team/team.types";
import { IN_GAME_ROLE_LABELS } from "@/shared/utils/inGameRoles";
import { getCountryName } from "@/shared/utils/countryUtils";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";

interface CardMemberProps {
  member: TeamMember;
  isSelected: boolean;
  onSelect: () => void;
  isStaffView: boolean;
}

export default function CardMember({
  member,
  isSelected,
  onSelect,
  isStaffView,
}: CardMemberProps) {
  const countryName = member.countryCode ? getCountryName(member.countryCode) : null;

  const getAge = () => {
    if (!member.birthDate) return null;
    const birthDate = new Date(member.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge();

  return (
    <button
      onClick={onSelect}
      className={`
        relative rounded-lg border overflow-hidden transition-all duration-200 flex gap-0 p-0 min-h-32 text-left
        ${
          isSelected
            ? "bg-indigo-500/20 border-indigo-500/50"
            : "bg-neutral-900/30 border-neutral-700/40 hover:bg-neutral-900/50 hover:border-neutral-600/50"
        }
      `}
    >
      {/* Left: Photo */}
      <div className="relative w-28 h-32 rounded-l-lg overflow-hidden flex-shrink-0 bg-neutral-800">
        <img
          src={member.avatarUrl}
          alt={member.nickname}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Middle: Info - Directly attached to photo */}
      <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white truncate">
            {member.nickname}
          </h3>

          {member.firstName && (
            <p className="text-xs text-neutral-500 truncate">
              {member.firstName}
            </p>
          )}

          {member.lastName && (
            <p className="text-xs text-neutral-500 truncate">
              {member.lastName}
            </p>
          )}

          {countryName && (
            <p className="text-xs text-neutral-600 truncate">
              {countryName}
            </p>
          )}

          {age && (
            <p className="text-xs text-neutral-600">
              {age}y
            </p>
          )}
        </div>
      </div>

      {/* Right: Badges - Top Right Corner - Vertical Stack */}
      <div className="flex flex-col gap-0.5 justify-start items-end p-2 h-full">
        {member.isOwner && (
          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-bold bg-amber-500/25 text-amber-300 border border-amber-500/30 whitespace-nowrap">
            Owner
          </span>
        )}

        {!isStaffView && member.inGameRole && (
          <span className="inline-flex px-1 py-0.5 rounded bg-blue-500/10 text-blue-300 text-xs font-medium border border-blue-500/20 whitespace-nowrap">
            {IN_GAME_ROLE_LABELS[member.inGameRole]}
          </span>
        )}

        {isStaffView && (
          <span className={`inline-flex px-1 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${ROLE_BADGE_STYLES[member.role]}`}>
            {member.role}
          </span>
        )}
      </div>
    </button>
  );
}
