import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { useTeam } from "@/contexts/team/useTeam";
import type { TeamMember } from "@/contexts/team/team.types";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { useTeamActions } from "@/features/team/hooks/useTeamActions";
import { LayoutDashboard, Users, Shield, User, Crown } from "lucide-react";
import { cn } from "@/design-system";

// Profile & Team components
import EditableProfileSection from "@/features/profile/components/EditableProfileSection";
import TeamSettingsPanel from "@/features/team/components/management/panels/TeamSettingsPanel";
import { useProfilePermissions } from "@/features/profile/hooks/useProfilePermissions";
import { getMyProfile } from "@/api/endpoints/profile.api";

import TeamOverviewPanel from "@/features/team/components/management/panels/TeamOverviewPanel";
import MembersPanel from "@/features/team/components/management/panels/MembersPanel";
import MemberDetailPanel from "@/features/team/components/management/panels/MemberDetailPanel";
import FeatureHeader from '@/shared/components/FeatureHeader';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import ManagementTabs from '@/features/team/components/management/ManagementTabs';

type View = "overview" | "staff" | "players" | "teams" | "profile";

/**
 * ManagementPage – Intégré dans TeamLayout
 * Navigation par tabs + detail panel
 */
export default function ManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { team, membership, members, isLoading, refreshTeam } = useTeam();
  const showLoader = useMinimumLoader(isLoading || !team || !membership || !user, 800);

  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);

  // Hooks
  const permissions = useManagementPermissions({
    currentSteamId: user?.steamId ?? "",
    membership: membership ?? { role: 'PLAYER', isOwner: false },
  });

  const actions = useTeamActions({
    teamId: team?.id ?? "",
    currentUserSteamId: user?.steamId ?? "",
    isOwner: membership?.isOwner ?? false,
  });

  const profilePermissions = useProfilePermissions();

  // Load profile when viewing profile tab
  const loadOwnProfile = useCallback(async () => {
    if (activeView === "profile" && !userProfile) {
      try {
        const profile = await getMyProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
  }, [activeView, userProfile]);

  // Load profile when activeView changes
  useEffect(() => {
    loadOwnProfile();
  }, [loadOwnProfile]);

  // Vérifier après les hooks
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-neutral-400">{t("common.loading")}</div>
      </div>
    );
  }

  const staffMembers = members
    .filter((m) => m.role !== "PLAYER")
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  const playerMembers = members
    .filter((m) => m.role === "PLAYER")
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  const tabs = [
    { id: "overview" as View, label: t("management.overview"), icon: LayoutDashboard },
    { id: "staff" as View, label: t("management.staff"), icon: Shield, count: staffMembers.length },
    { id: "players" as View, label: t("management.players"), icon: Users, count: playerMembers.length },
    { id: "teams" as View, label: t("management.teams"), icon: Crown },
    { id: "profile" as View, label: t("management.profile"), icon: User },
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
        <ManagementTabs
          tabs={tabs}
          activeView={activeView}
          onChange={setActiveView}
          {...(user?.profileCompleted !== undefined
            ? { profileCompleted: user.profileCompleted }
            : {})}
          profileVerifiedLabel={t("profile.verified")}
          profileIncompleteLabel={t("profile.not_verified")}
        />
      </FeatureHeader>

      {/* Main content + Detail panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Content - Fixed width, no shrink */}
        <div
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable"
          )}
        >
          <FeatureBody className="max-w-5xl">
            {activeView === "overview" && (
              <TeamOverviewPanel
                team={team!}
                membership={membership!}
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
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMember?.steamId}
              />
            )}

            {activeView === "players" && (
              <MembersPanel
                members={playerMembers}
                staffMembers={[]}
                playerMembers={playerMembers}
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMember?.steamId}
              />
            )}

            {activeView === "teams" && (
              <TeamSettingsPanel
                team={team!}
                canEdit={permissions.canEditTeam()}
                canInvite={permissions.canInvite()}
              />
            )}

            {activeView === "profile" && userProfile && (
              <EditableProfileSection
                profile={userProfile}
                game={team?.game}
                canEdit={profilePermissions.canEditOwnProfile}
                onSuccess={() => refreshTeam()}
              />
            )}
          </FeatureBody>
        </div>

        {/* Overlay - Click to close */}
        {selectedMember && (
          <div
            className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
            onClick={handleCloseDetail}
          />
        )}

        {/* Detail Panel - Slide from right */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 h-full transition-all duration-300 ease-out border-l border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl z-40",
            selectedMember ? 'w-[550px] opacity-100 visible' : 'w-0 opacity-0 invisible'
          )}
        >
          {selectedMember && team && membership && (
            <MemberDetailPanel
              member={selectedMember}
              teamId={team.id}
              permissions={permissions}
              actions={actions}
              onClose={handleCloseDetail}
              team={team}
            />
          )}
        </div>
      </div>
    </div>
  );
}
