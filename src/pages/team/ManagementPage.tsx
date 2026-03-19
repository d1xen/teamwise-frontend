import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { useTeam } from "@/contexts/team/useTeam";
import type { TeamMember } from "@/contexts/team/team.types";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { useTeamActions } from "@/features/team/hooks/useTeamActions";
import { LayoutDashboard, Users, User, Crown } from "lucide-react";
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
import { Button } from '@/design-system/components';

type View = "overview" | "members" | "teams" | "profile";

/**
 * ManagementPage – Intégré dans TeamLayout
 * Navigation par tabs + detail panel
 */
export default function ManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { team, membership, members, isLoading, isReady, refreshTeam } = useTeam();
  // Loader uniquement pendant le chargement initial (isReady=false)
  // refreshTeam() est silencieux et ne doit pas relancer le loader global
  const showLoader = useMinimumLoader(!isReady || !user, 800);

  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [profileRetryCount, setProfileRetryCount] = useState(0);

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

  // Chargement du profil uniquement quand on ouvre l'onglet profil.
  // On évite d'inclure userProfile/isLoadingProfile dans les deps
  // pour ne pas créer de boucle quand le fetch échoue ou se termine.
  // La relance manuelle passe par profileRetryCount.
  useEffect(() => {
    if (activeView !== "profile") return;
    // Ne pas recharger si déjà disponible (sauf retry explicite)
    if (userProfile !== null) return;

    let cancelled = false;
    setIsLoadingProfile(true);
    setProfileError(false);

    getMyProfile()
      .then((profile) => { if (!cancelled) setUserProfile(profile); })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        if (!cancelled) setProfileError(true);
      })
      .finally(() => { if (!cancelled) setIsLoadingProfile(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, profileRetryCount]);

  // Vérifier après les hooks
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-neutral-400">{t("common.loading")}</div>
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
    { id: "overview" as View, label: t("management.overview"), icon: LayoutDashboard },
    { id: "members" as View, label: t("management.members"), icon: Users, count: members.length },
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
                staffCount={members.filter((m) => m.role !== "PLAYER").length}
                playerCount={members.filter((m) => m.role === "PLAYER").length}
              />
            )}

            {activeView === "members" && (
              <MembersPanel
                members={members}
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMember?.steamId}
              />
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

            {activeView === "profile" && (
              isLoadingProfile ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-sm text-neutral-400">{t("common.loading")}</div>
                </div>
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
                <EditableProfileSection
                  profile={userProfile}
                  game={team?.game}
                  canEdit={profilePermissions.canEditOwnProfile}
                  onSuccess={() => refreshTeam()}
                />
              ) : null
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
