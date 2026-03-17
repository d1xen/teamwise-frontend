import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole, Team } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import type { useTeamActions } from "@/features/team/hooks/useTeamActions";
import type { InGameRole } from "@/api/types/team";
import { MemberProfileEditForm } from "./MemberProfileEditForm";
import { getUserProfile } from "@/api/endpoints/profile.api";
import { updateMemberRole, updateMemberRoster } from "@/api/endpoints/team.api";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { Toggle } from "@/shared/components/Toggle";
import { MAX_ACTIVE_PLAYERS } from "@/shared/constants/teamConstants";
import { getAvailableInGameRoles, IN_GAME_ROLE_LABELS } from "@/shared/utils/inGameRoles";
import { ROLE_COLORS } from "@/shared/constants/roleStyles";
import { Crown, X, Loader, LogOut } from "lucide-react";

interface MemberDetailPanelProps {
  member: TeamMember;
  teamId: string;
  permissions: ReturnType<typeof useManagementPermissions>;
  actions: ReturnType<typeof useTeamActions>;
  onClose: () => void;
  team?: Team;
}

type TabId = "information" | "role" | "details";

const ROLE_OPTIONS: TeamRole[] = ["PLAYER", "COACH", "ANALYST", "MANAGER"];

export default function MemberDetailPanel({
  member,
  teamId,
  permissions,
  actions,
  onClose,
  team,
}: MemberDetailPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshTeam, members } = useTeam();

  const [activeTab, setActiveTab] = useState<TabId>("information");
  const [memberProfile, setMemberProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isChangingInGameRole, setIsChangingInGameRole] = useState(false);
  const [activePlayerState, setActivePlayerState] = useState<boolean | undefined>(member.activePlayer);
  const [inGameRole, setInGameRole] = useState<InGameRole | null | undefined>(member.inGameRole);

  const canEditRole = permissions.canEditMemberRole();
  const canKick = permissions.canKickMember(member);
  const canTransfer = permissions.canTransferOwnership(member);
  const canLeave = permissions.canLeave(member);

  // Vérifier si c'est le joueur lui-même
  const isCurrentUser = user?.steamId === member.steamId;

  // Details tab accessible si Manager/Owner OU joueur lui-même
  const canAccessDetails = canEditRole || isCurrentUser;

  // Charger le profil au mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(member.steamId, teamId);
        setMemberProfile(profile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [member.steamId, teamId]);

  const handleToggleActivePlayer = async () => {
    const newActiveState = !activePlayerState;

    if (newActiveState) {
      const activeCount = members.filter((m) => m.activePlayer !== false).length;
      if (activeCount >= MAX_ACTIVE_PLAYERS) {
        alert(t("management.max_active_players_reached", { max: 5, current: activeCount }));
        return;
      }
    }

    setActivePlayerState(newActiveState);
    setIsTogglingActive(true);

    try {
      await updateMemberRoster(teamId, member.steamId, { activePlayer: newActiveState });
    } catch (error) {
      console.error("Failed to update player active status:", error);
      setActivePlayerState(!newActiveState);
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleChangeRole = async (role: TeamRole) => {
    if (role === member.role) return;
    setIsChangingRole(true);
    try {
      await updateMemberRole(teamId, member.steamId, { role });
      await refreshTeam();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleChangeInGameRole = async (newInGameRole: InGameRole | null) => {
    if (newInGameRole === inGameRole) return;
    setIsChangingInGameRole(true);
    try {
      await updateMemberRoster(teamId, member.steamId, { inGameRole: newInGameRole });
      setInGameRole(newInGameRole);
      await refreshTeam();
    } catch (error) {
      console.error("Failed to update in-game role:", error);
      setInGameRole(member.inGameRole);
    } finally {
      setIsChangingInGameRole(false);
    }
  };

  const handleTransfer = () => {
    if (confirm(t("management.confirm_transfer", { nickname: member.nickname }))) {
      actions.promoteToOwner(member);
      onClose();
    }
  };

  const handleKick = () => {
    if (confirm(t("management.confirm_kick", { nickname: member.nickname }))) {
      actions.kickMember(member);
      onClose();
    }
  };

  const handleLeave = () => {
    if (confirm(t("management.confirm_leave"))) {
      actions.leaveTeam();
      onClose();
    }
  };

  const handleSaveProfile = async (updatedData: Partial<UserProfileDto>) => {
    setIsSavingProfile(true);
    try {
      // TODO: Implement profile update API call
      // await updateMemberProfile(teamId, member.steamId, updatedData);
      setMemberProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-6 py-5 z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1" />
          <div className="flex gap-2 items-center">
            {canKick && (
              <button
                onClick={handleKick}
                className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                title={t("management.kick_member")}
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            )}
            {canLeave && (
              <button
                onClick={handleLeave}
                className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                title={t("management.leave_team")}
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <img
            src={member.avatarUrl || "https://via.placeholder.com/60"}
            alt={member.nickname}
            className="w-14 h-14 rounded border border-neutral-700 object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white">{member.nickname}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {/* Profil incomplet */}
              {!member.profileCompleted && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                  {t("management.profile_incomplete")}
                </span>
              )}
              {/* Rôle */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-current border-opacity-20 ${ROLE_COLORS[member.role]}`}>
                {member.role}
              </span>
              {/* Statut Actif */}
              {activePlayerState && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {t("management.roster_active")}
                </span>
              )}
              {/* Rôle in-game */}
              {member.inGameRole && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {member.inGameRole}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800 flex bg-neutral-900/50">
        <button
          onClick={() => setActiveTab("information")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "information"
              ? "text-white border-neutral-400 bg-neutral-800/50"
              : "text-neutral-400 border-transparent hover:text-neutral-300"
          }`}
        >
          {t("management.information")}
        </button>
        <button
          onClick={() => setActiveTab("role")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "role"
              ? "text-white border-neutral-400 bg-neutral-800/50"
              : "text-neutral-400 border-transparent hover:text-neutral-300"
          }`}
        >
          {t("management.role")}
        </button>
        {canAccessDetails && (
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "text-white border-neutral-400 bg-neutral-800/50"
                : "text-neutral-400 border-transparent hover:text-neutral-300"
            }`}
          >
            {t("management.details")}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Information Tab */}
          {activeTab === "information" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                  <div className="text-xs text-neutral-500 mb-1">SteamID</div>
                  <div className="text-sm text-white font-mono">{member.steamId}</div>
                </div>
                <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                  <div className="text-xs text-neutral-500 mb-1">{t("management.username")}</div>
                  <div className="text-sm text-white">{member.customUsername || "—"}</div>
                </div>
                <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                  <div className="text-xs text-neutral-500 mb-1">Discord</div>
                  <div className="text-sm text-white">{member.discord || "—"}</div>
                </div>
                <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                  <div className="text-xs text-neutral-500 mb-1">Twitter/X</div>
                  <div className="text-sm text-white">{member.twitter || "—"}</div>
                </div>
                {isLoadingProfile ? (
                  <>
                    <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                      <div className="text-xs text-neutral-500 mb-1">{t("profile.first_name")}</div>
                      <div className="text-sm text-neutral-400">{t("common.loading")}</div>
                    </div>
                    <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                      <div className="text-xs text-neutral-500 mb-1">{t("profile.last_name")}</div>
                      <div className="text-sm text-neutral-400">{t("common.loading")}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                      <div className="text-xs text-neutral-500 mb-1">{t("profile.first_name")}</div>
                      <div className="text-sm text-white">{memberProfile?.firstName || "—"}</div>
                    </div>
                    <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                      <div className="text-xs text-neutral-500 mb-1">{t("profile.last_name")}</div>
                      <div className="text-sm text-white">{memberProfile?.lastName || "—"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Role Tab */}
          {activeTab === "role" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{t("management.team_role")}</h3>
                  {!canEditRole && (
                    <span className="text-xs text-neutral-500">{t("management.view_only")}</span>
                  )}
                </div>
                {canEditRole ? (
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleChangeRole(role)}
                        disabled={isChangingRole}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors border ${
                          role === member.role
                            ? `${ROLE_COLORS[role]} border-current border-opacity-20`
                            : "text-neutral-400 bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800"
                        } disabled:opacity-50`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                    <div className="text-sm text-white">{member.role}</div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{t("management.roster_status")}</p>
                    <p className="text-xs text-neutral-500">
                      {activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}
                    </p>
                  </div>
                  {canEditRole && member.role === "PLAYER" ? (
                    <Toggle
                      checked={activePlayerState ?? false}
                      onChange={handleToggleActivePlayer}
                      disabled={
                        isTogglingActive ||
                        (!activePlayerState && members.filter((m) => m.activePlayer !== false).length >= MAX_ACTIVE_PLAYERS)
                      }
                    />
                  ) : (
                    <div className="text-sm font-medium text-white">
                      {activePlayerState ? "✓" : "✗"}
                    </div>
                  )}
                </div>
                {!activePlayerState && canEditRole && members.filter((m) => m.activePlayer !== false).length >= MAX_ACTIVE_PLAYERS && (
                  <p className="text-xs text-red-400">{MAX_ACTIVE_PLAYERS}/{MAX_ACTIVE_PLAYERS} {t("management.active")}</p>
                )}
              </div>

              {activePlayerState && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">{t("management.in_game_role")}</h3>
                    {!canEditRole && (
                      <span className="text-xs text-neutral-500">{t("management.view_only")}</span>
                    )}
                  </div>
                  {canEditRole ? (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Option pour effacer le rôle */}
                      <button
                        onClick={() => handleChangeInGameRole(null)}
                        disabled={isChangingInGameRole}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors border ${
                          inGameRole === null
                            ? "bg-neutral-700 text-white border-neutral-600"
                            : "text-neutral-400 bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800"
                        } disabled:opacity-50`}
                      >
                        —
                      </button>
                      {/* Options pour les rôles disponibles */}
                      {getAvailableInGameRoles(team?.game).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleChangeInGameRole(role)}
                          disabled={isChangingInGameRole}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors border ${
                            role === inGameRole
                              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                              : "text-neutral-400 bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800"
                          } disabled:opacity-50`}
                        >
                          {IN_GAME_ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                      <div className="text-sm text-white">{inGameRole ? IN_GAME_ROLE_LABELS[inGameRole] : "—"}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && canAccessDetails && (
            <>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-5 h-5 text-neutral-400 animate-spin" />
                </div>
              ) : memberProfile ? (
                isEditingProfile ? (
                  <MemberProfileEditForm
                    profile={memberProfile}
                    onSave={handleSaveProfile}
                    onCancel={() => setIsEditingProfile(false)}
                    isSaving={isSavingProfile}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                      <h3 className="text-sm font-semibold text-white">{t("profile.profile")}</h3>
                      {canEditRole && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {t("common.edit")}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("profile.first_name")}</div>
                        <div className="text-sm text-white">{memberProfile.firstName || "—"}</div>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("profile.last_name")}</div>
                        <div className="text-sm text-white">{memberProfile.lastName || "—"}</div>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("common.email")}</div>
                        <div className="text-sm text-white break-all">{memberProfile.email || "—"}</div>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("management.phone")}</div>
                        <div className="text-sm text-white">{memberProfile.phone || "—"}</div>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("profile.city")}</div>
                        <div className="text-sm text-white">{memberProfile.city || "—"}</div>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded">
                        <div className="text-xs text-neutral-500 mb-1">{t("profile.country")}</div>
                        <div className="text-sm text-white">{memberProfile.countryCode || "—"}</div>
                      </div>
                    </div>
                  </div>
                )
              ) : null}

              {canTransfer && (
                <div className="border-t border-neutral-800 pt-6">
                  <button
                    onClick={handleTransfer}
                    className="w-full px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-medium rounded transition-colors border border-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    {t("management.transfer_to_member")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}





















