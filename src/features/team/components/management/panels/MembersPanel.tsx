import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/contexts/team/team.types";
import { Search, Users } from "lucide-react";
import { cn } from "@/design-system";
import CardMember from "./CardMember";

type FilterId = "all" | "players" | "staff";

interface MembersPanelProps {
  members: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  selectedMemberId?: string | undefined;
}

export default function MembersPanel({
  members,
  onSelectMember,
  selectedMemberId,
}: MembersPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const staffMembers = members.filter((m) => m.role !== "PLAYER");
  const playerMembers = members.filter((m) => m.role === "PLAYER");

  const baseList: TeamMember[] =
    activeFilter === "players"
      ? playerMembers
      : activeFilter === "staff"
      ? staffMembers
      : members;

  const filteredMembers = searchQuery
    ? baseList.filter((m) => {
        const q = searchQuery.toLowerCase();
        return (
          m.nickname.toLowerCase().includes(q) ||
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q)
        );
      })
    : baseList;

  const filters: { id: FilterId; label: string; count: number }[] = [
    { id: "all", label: t("team.members"), count: members.length },
    { id: "players", label: t("team.players"), count: playerMembers.length },
    { id: "staff", label: t("team.staff"), count: staffMembers.length },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-neutral-400" />
        <h1 className="text-lg font-semibold text-white">
          {t("management.members")}{" "}
          <span className="text-neutral-500 font-normal text-sm">
            ({filteredMembers.length})
          </span>
        </h1>
      </div>

      {/* Filter chips + Search bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeFilter === f.id
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              )}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder={t("management.search_members")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800/20 border border-neutral-700/40 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
          />
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-10 h-10 text-neutral-700 mb-3" />
          <p className="text-sm text-neutral-500">{t("management.no_members_found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredMembers.map((member) => (
            <CardMember
              key={member.steamId}
              member={member}
              isSelected={member.steamId === selectedMemberId}
              onSelect={() => onSelectMember(member)}
              isStaffView={member.role !== "PLAYER"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
