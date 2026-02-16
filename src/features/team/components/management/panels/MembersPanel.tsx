import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { Search, Users, Shield, Crown, MoreVertical } from "lucide-react";

interface MembersPanelProps {
  members: TeamMember[];
  staffMembers: TeamMember[];
  playerMembers: TeamMember[];
  permissions: ReturnType<typeof useManagementPermissions>;
  onSelectMember: (member: TeamMember) => void;
  selectedMemberId?: string | undefined;
}

const ROLE_COLORS: Record<TeamRole, string> = {
  PLAYER: "text-green-400 bg-green-500/10 border-green-500/20",
  COACH: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ANALYST: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  MANAGER: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export default function MembersPanel({
  members,
  staffMembers,
  playerMembers,
  permissions,
  onSelectMember,
  selectedMemberId,
}: MembersPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filterMembers = (membersList: TeamMember[]) => {
    if (!searchQuery) return membersList;
    const query = searchQuery.toLowerCase();
    return membersList.filter(
      (m) =>
        m.nickname.toLowerCase().includes(query) ||
        m.firstName?.toLowerCase().includes(query) ||
        m.lastName?.toLowerCase().includes(query)
    );
  };

  const filteredMembers = filterMembers(members);
  const isStaffView = staffMembers.length > 0 && playerMembers.length === 0;
  const isPlayersView = playerMembers.length > 0 && staffMembers.length === 0;

  // Déterminer le titre et l'icône
  let title = t("management.members");
  let Icon = Users;

  if (isStaffView) {
    title = t("management.staff");
    Icon = Shield;
  } else if (isPlayersView) {
    title = t("management.players");
    Icon = Users;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 text-neutral-400" />
            <h1 className="text-2xl font-semibold text-white">
              {title} ({filteredMembers.length})
            </h1>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder={t("management.search_members")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-neutral-700 mb-4" />
          <p className="text-sm text-neutral-500">
            {t("management.no_members_found")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.steamId}
              member={member}
              isSelected={member.steamId === selectedMemberId}
              onSelect={() => onSelectMember(member)}
              canInteract={
                permissions.canEditMemberProfile(member) ||
                permissions.canEditMemberRole() ||
                permissions.canKickMember(member)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// MemberCard Component
function MemberCard({
  member,
  isSelected,
  onSelect,
  canInteract,
}: {
  member: TeamMember;
  isSelected: boolean;
  onSelect: () => void;
  canInteract: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!canInteract}
      className={`
        relative w-full text-left p-4 rounded-xl border transition-all duration-200
        ${
          isSelected
            ? "bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/20"
            : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
        }
        ${canInteract ? "cursor-pointer hover:scale-[1.02]" : "cursor-default opacity-75"}
      `}
    >
      {/* Avatar & Name */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={member.avatarUrl}
          alt={member.nickname}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {member.nickname}
          </h3>
          {(member.firstName || member.lastName) && (
            <p className="text-xs text-neutral-500 truncate">
              {member.firstName} {member.lastName}
            </p>
          )}
        </div>
        {canInteract && (
          <MoreVertical className="w-4 h-4 text-neutral-500 flex-shrink-0" />
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {member.isOwner && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        )}
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${ROLE_COLORS[member.role]}`}
        >
          {member.role}
        </span>
      </div>
    </button>
  );
}

