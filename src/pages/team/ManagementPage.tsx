import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { useTeam } from "@/contexts/team/useTeam";
import type { TeamMember } from "@/contexts/team/team.types";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { useTeamActions } from "@/features/team/hooks/useTeamActions";
import { Users, User, Crown } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import FaceitOverview from "@/features/faceit/components/FaceitOverview";


// Profile & Team components
import EditableProfileSection from "@/features/profile/components/EditableProfileSection";
import TeamActionsSection from "@/features/profile/components/TeamActionsSection";
import type { TeamActionModal } from "@/features/profile/components/TeamActionsSection";
import type { DropdownMenuItem } from "@/shared/components/DropdownMenu";
import InlineLoader from "@/shared/components/InlineLoader";
import TeamSettingsPanel from "@/features/team/components/management/panels/TeamSettingsPanel";
import { useProfilePermissions } from "@/features/profile/hooks/useProfilePermissions";
import { getMyProfile } from "@/api/endpoints/profile.api";

import MembersPanel from "@/features/team/components/management/panels/MembersPanel";
import MemberDetailPanel from "@/features/team/components/management/panels/MemberDetailPanel";
import FeatureHeader from '@/shared/components/FeatureHeader';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import ManagementTabs from '@/features/team/components/management/ManagementTabs';
import type { ManagementTabId } from '@/features/team/components/management/ManagementTabs';
import { Button } from '@/design-system/components';

type View = ManagementTabId;

const MANAGEMENT_VIEWS: View[] = ["members", "teams", "profile", "faceit"];

function isManagementView(value: string | null): value is View {
  return value !== null && MANAGEMENT_VIEWS.includes(value as View);
}

/**
 * ManagementPage – Intégré dans TeamLayout
 * Navigation par tabs + detail panel
 */
export default function ManagementPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { team, membership, members, isLoading, isReady, refreshTeam } = useTeam();
  // Loader uniquement pendant le chargement initial (isReady=false)
  // refreshTeam() est silencieux et ne doit pas relancer le loader global
  const showLoader = useMinimumLoader(!isReady || !user, 800);

  const tabFromUrl = searchParams.get("tab");
  const resolvedTab: View = isManagementView(tabFromUrl) ? tabFromUrl : "members";
  const hasFaceitCallbackParams = searchParams.has("faceit_result");

  const activeView: View = resolvedTab;
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Keep selectedMember in sync with context members after refreshTeam()
  useEffect(() => {
    if (selectedMember) {
      const fresh = members.find(m => m.steamId === selectedMember.steamId);
      if (fresh) setSelectedMember(fresh);
      else setSelectedMember(null); // member was kicked
    }
  }, [members]); // eslint-disable-line react-hooks/exhaustive-deps

  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [profileRetryCount, setProfileRetryCount] = useState(0);

  const handleChangeView = (view: View) => {
    if (view === activeView) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", view);
    setSearchParams(nextParams, { replace: true });
  };

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
  const [teamActionModal, setTeamActionModal] = useState<TeamActionModal>(null);

  const isOwner = membership?.isOwner ?? false;
  const otherMembers = members.filter(m => m.steamId !== user?.steamId);
  const isLastMember = otherMembers.length === 0;

  const profileMenuItems: DropdownMenuItem[] = [
    ...(isOwner && !isLastMember ? [{
      label: t("team_actions.transfer_ownership"),
      onClick: () => setTeamActionModal("transfer"),
    }] as DropdownMenuItem[] : []),
    {
      label: t("team_actions.leave_team"),
      onClick: () => {
        if (isOwner && isLastMember) setTeamActionModal("lastMember");
        else if (isOwner) setTeamActionModal("ownerLeave");
        else setTeamActionModal("leave");
      },
      variant: 'danger' as const,
    },
  ];

  // Reload profile each time the profile tab becomes active
  useEffect(() => {
    if (activeView !== "profile") return;

    let cancelled = false;
    let retryTimer: number | null = null;
    setIsLoadingProfile(true);
    setProfileError(false);

    // Après retour OAuth Faceit, le backend peut mettre un court instant
    // avant que /users/me/profile réponde de manière stable.
    const maxAttempts = hasFaceitCallbackParams ? 4 : 1;
    const fetchProfile = (attempt: number) => {
      getMyProfile()
        .then((profile) => {
          if (cancelled) return;
          setUserProfile(profile);
          setIsLoadingProfile(false);
        })
        .catch((err) => {
          if (cancelled) return;
          if (attempt < maxAttempts) {
            retryTimer = window.setTimeout(() => fetchProfile(attempt + 1), 500);
            return;
          }
          console.error("Failed to load profile:", err);
          setProfileError(true);
          setIsLoadingProfile(false);
        });
    };

    fetchProfile(1);

    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [activeView, hasFaceitCallbackParams, profileRetryCount]);

  // Deep-link: open member detail from URL param
  useEffect(() => {
    const memberIdFromUrl = searchParams.get("memberId");
    if (memberIdFromUrl && !selectedMember && members.length > 0) {
      const found = members.find(m => m.steamId === memberIdFromUrl);
      if (found) {
        setSelectedMember(found);
      } else {
        const next = new URLSearchParams(searchParams);
        next.delete("memberId");
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, selectedMember, members, setSearchParams]);

  // Vérifier après les hooks
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <InlineLoader />
      </div>
    );
  }

  if (!team || !membership || !user) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center shadow-xl">
          <h2 className="text-lg font-semibold text-white">{t("common.error")}</h2>
          <p className="mt-2 text-sm text-neutral-400">{t("common.try_again")}</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => void refreshTeam()} isLoading={isLoading}>
              {t("common.try_again")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "members" as View, label: t("management.members"), icon: Users },
    { id: "teams" as View, label: t("management.teams"), icon: Crown },
    { id: "profile" as View, label: t("management.profile"), icon: User },
    ...(team.game === "CS2" ? [{ id: "faceit" as View, label: "FACEIT", icon: FaceitIcon }] : []),
  ];

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    const next = new URLSearchParams(searchParams);
    next.set("memberId", member.steamId);
    setSearchParams(next, { replace: true });
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
    const next = new URLSearchParams(searchParams);
    next.delete("memberId");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <FeatureHeader
        title={t("pages.management.title")}
        subtitle={t("pages.management.subtitle")}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
          <FeatureBody className="max-w-5xl">
            <div className="mb-5 pb-4 border-b border-neutral-800/60">
              <ManagementTabs
                tabs={tabs}
                activeView={activeView}
                onChange={handleChangeView}
              />
            </div>
            {activeView === "members" && (
              selectedMember ? (
                <MemberDetailPanel
                  member={selectedMember}
                  teamId={team.id}
                  permissions={permissions}
                  actions={actions}
                  onClose={handleCloseDetail}
                  team={team}
                />
              ) : (
                <MembersPanel
                  members={members}
                  onSelectMember={handleSelectMember}
                  selectedMemberId={undefined}
                />
              )
            )}

            {activeView === "teams" && (
              <TeamSettingsPanel
                team={team!}
                canEdit={permissions.canEditTeam()}
                canInvite={permissions.canInvite()}
                canDelete={permissions.isOwner}
                actions={actions}
              />
            )}

            {activeView === "faceit" && team.game === "CS2" && (
              <FaceitOverview teamId={team.id} />
            )}

            {activeView === "profile" && (
              isLoadingProfile ? (
                <InlineLoader />
              ) : profileError ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-neutral-400">{t("common.try_again")}</p>
                    <Button
                      onClick={() => {
                        setUserProfile(null);
                        setProfileError(false);
                        setProfileRetryCount(c => c + 1);
                      }}
                      size="sm"
                    >
                      {t("common.try_again")}
                    </Button>
                  </div>
                </div>
              ) : userProfile ? (
                <div className="space-y-4">
                  <EditableProfileSection
                    profile={userProfile}
                    game={team?.game}
                    canEdit={profilePermissions.canEditOwnProfile}
                    onSuccess={() => refreshTeam()}
                    menuItems={profileMenuItems}
                  />
                  <TeamActionsSection
                    members={members}
                    currentSteamId={user?.steamId ?? ""}
                    teamName={team?.name ?? ""}
                    onTransferOwnership={actions.transferOwnershipTo}
                    onLeave={actions.leaveTeamConfirmed}
                    onTransferAndLeave={actions.transferAndLeave}
                    onDeleteTeam={actions.deleteTeamConfirmed}
                    openModal={teamActionModal}
                    onModalClose={() => setTeamActionModal(null)}
                  />
                </div>
              ) : null
            )}
          </FeatureBody>

      </div>
    </div>
  );
}
