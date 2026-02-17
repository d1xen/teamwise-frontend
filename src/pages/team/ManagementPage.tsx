import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { useTeam } from "@/contexts/team/useTeam";
import type { TeamMember } from "@/contexts/team/team.types";
import { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { useTeamActions } from "@/features/team/hooks/useTeamActions";
import { LayoutDashboard, Users, Settings, Shield } from "lucide-react";
import { cn } from "@/design-system";

// Premium components
import TeamOverviewPanel from "@/features/team/components/management/panels/TeamOverviewPanel";
import MembersPanel from "@/features/team/components/management/panels/MembersPanel";
import TeamSettingsPanel from "@/features/team/components/management/panels/TeamSettingsPanel";
import MemberDetailPanel from "@/features/team/components/management/panels/MemberDetailPanel";
import FeatureHeader from '@/shared/components/FeatureHeader';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';

type View = "overview" | "staff" | "players" | "settings";

/**
 * ManagementPage – Intégré dans TeamLayout
 * Navigation par tabs + detail panel
 */
export default function ManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { team, membership, members, isLoading } = useTeam();
  const showLoader = useMinimumLoader(isLoading || !team || !membership || !user, 800);

  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Appeler les hooks de manière inconditionnelle (règle React)
  const permissions = useManagementPermissions({
    currentSteamId: user?.steamId ?? "",
    membership: membership ?? { role: 'PLAYER', isOwner: false },
  });

  const actions = useTeamActions({
    teamId: team?.id ?? "",
    currentUserSteamId: user?.steamId ?? "",
    isOwner: membership?.isOwner ?? false,
  });

  // Vérifier après les hooks
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-neutral-400">{t("common.loading")}</div>
      </div>
    );
  }

  const staffMembers = members.filter((m) => m.role !== "PLAYER");
  const playerMembers = members.filter((m) => m.role === "PLAYER");

  const tabs = [
    { id: "overview" as View, label: t("management.overview"), icon: LayoutDashboard },
    { id: "staff" as View, label: t("management.staff"), icon: Shield, count: staffMembers.length },
    { id: "players" as View, label: t("management.players"), icon: Users, count: playerMembers.length },
    { id: "settings" as View, label: t("management.settings"), icon: Settings },
  ];

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header avec navigation tabs */}
      <FeatureHeader
        title={t("nav.management")}
      >
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeView === tab.id
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs",
                    activeView === tab.id
                      ? "bg-neutral-700 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FeatureHeader>

      {/* Main content + Detail panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content */}
        <div
          className={cn(
            "transition-all duration-300 ease-out overflow-y-auto custom-scrollbar scrollbar-gutter-stable",
            selectedMember ? 'flex-1' : 'w-full'
          )}
        >
          <FeatureBody className="max-w-5xl">
            {activeView === "overview" && (
              <TeamOverviewPanel
                team={team}
                membership={membership}
                members={members}
                staffCount={staffMembers.length}
                playerCount={playerMembers.length}
              />
            )}

            {activeView === "staff" && (
              <MembersPanel
                members={staffMembers}
                staffMembers={staffMembers}
                playerMembers={[]}
                permissions={permissions}
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMember?.steamId}
              />
            )}

            {activeView === "players" && (
              <MembersPanel
                members={playerMembers}
                staffMembers={[]}
                playerMembers={playerMembers}
                permissions={permissions}
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMember?.steamId}
              />
            )}

            {activeView === "settings" && (
              <TeamSettingsPanel
                team={team}
                canEdit={permissions.canEditTeam()}
                canInvite={permissions.canInvite()}
              />
            )}
          </FeatureBody>
        </div>

        {/* Detail Panel */}
        <div
          className={cn(
            "transition-all duration-300 ease-out border-l border-neutral-800 bg-neutral-900 overflow-hidden",
            selectedMember ? 'w-96' : 'w-0'
          )}
        >
          {selectedMember && (
            <MemberDetailPanel
              member={selectedMember}
              teamId={team.id}
              permissions={permissions}
              actions={actions}
              onClose={handleCloseDetail}
            />
          )}
        </div>
      </div>
    </div>
  );
}
