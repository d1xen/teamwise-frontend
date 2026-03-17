import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/contexts/team/team.types";
import { Search, Users, Shield } from "lucide-react";
import CardMember from "./CardMember";

interface MembersPanelProps {
  members: TeamMember[];
  staffMembers: TeamMember[];
  playerMembers: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  selectedMemberId?: string | undefined;
}

export default function MembersPanel({
  members,
  staffMembers,
  playerMembers,
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

  const title = isStaffView ? t("management.staff") : t("management.players");
  const Icon = isStaffView ? Shield : Users;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-neutral-400" />
        <h1 className="text-lg font-semibold text-white">
          {title} <span className="text-neutral-500 font-normal text-sm">({filteredMembers.length})</span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input
          type="text"
          placeholder={t("management.search_members")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-800/20 border border-neutral-700/40 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
        />
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-10 h-10 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">{t("management.no_members_found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member) => (
            <CardMember
              key={member.steamId}
              member={member}
              isSelected={member.steamId === selectedMemberId}
              onSelect={() => onSelectMember(member)}
              isStaffView={isStaffView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

