import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole, Team } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import type { useTeamActions } from "@/features/team/hooks/useTeamActions";
import type { InGameRole } from "@/api/types/team";
import { MemberProfileEditForm } from "./MemberProfileEditForm";
import { getUserProfile, updateUserProfile } from "@/api/endpoints/profile.api";
import { updateMemberRole, updateMemberRoster } from "@/api/endpoints/team.api";
import type { UserProfileDto, UserProfileUpdateDto } from "@/api/endpoints/profile.api";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { Toggle } from "@/shared/components/Toggle";
import { getAvailableInGameRoles, IN_GAME_ROLE_LABELS, getMaxActivePlayers, getValidLinksForGame } from "@/shared/config/gameConfig";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Crown, X, Loader, LogOut, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/design-system";
import { toast } from "react-hot-toast";
import Flag from "react-world-flags";

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

const COUNTRY_LABELS: Record<string, string> = {
  FR: "🇫🇷 France", BE: "🇧🇪 Belgium", CH: "🇨🇭 Switzerland", DE: "🇩🇪 Germany",
  GB: "🇬🇧 United Kingdom", US: "🇺🇸 United States", CA: "🇨🇦 Canada", ES: "🇪🇸 Spain",
  IT: "🇮🇹 Italy", NL: "🇳🇱 Netherlands", PT: "🇵🇹 Portugal", PL: "🇵🇱 Poland",
  SE: "🇸🇪 Sweden", DK: "🇩🇰 Denmark", FI: "🇫🇮 Finland", NO: "🇳🇴 Norway",
  BR: "🇧🇷 Brazil", RU: "🇷🇺 Russia", TR: "🇹🇷 Turkey", UA: "🇺🇦 Ukraine",
  CZ: "🇨🇿 Czech Republic", RO: "🇷🇴 Romania", HU: "🇭🇺 Hungary", AU: "🇦🇺 Australia",
};

function calcAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Compact inline field: label left, value right, one line ─────────────────

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-neutral-800/40 last:border-0">
      <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wide w-[90px] shrink-0 truncate">
        {label}
      </span>
      <span className={cn("text-xs flex-1 truncate", value ? "text-neutral-200" : "text-neutral-600 italic")}>
        {value || "—"}
      </span>
    </div>
  );
}

function PrivateRow({ label, value }: { label: string; value: string | null | undefined }) {
  const filled = Boolean(value);
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-neutral-800/40 last:border-0">
      {filled
        ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        : <Circle className="w-3 h-3 text-neutral-700 shrink-0" />}
      <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wide w-[86px] shrink-0 truncate">
        {label}
      </span>
      <span className={cn("text-xs flex-1 truncate", filled ? "text-neutral-200" : "text-neutral-600 italic")}>
        {value || "—"}
      </span>
    </div>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{children}</p>
      {action}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

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
  const { refreshTeam, members, updateMemberActiveStatus } = useTeam();

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
  const canAccessDetails = canEditRole;

  const validLinks = getValidLinksForGame(team?.game);
  const displayName = member.customUsername || member.nickname;

  useEffect(() => {
    let cancelled = false;
    setIsLoadingProfile(true);
    getUserProfile(member.steamId, teamId)
      .then((p) => { if (!cancelled) setMemberProfile(p); })
      .catch((err) => { console.error("Failed to load profile:", err); })
      .finally(() => { if (!cancelled) setIsLoadingProfile(false); });
    return () => { cancelled = true; };
  }, [member.steamId, teamId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleActivePlayer = async () => {
    const next = !activePlayerState;
    if (next) {
      const maxActive = getMaxActivePlayers(team?.game);
      const activeCount = members.filter((m) => m.activePlayer !== false).length;
      if (activeCount >= maxActive) {
        alert(t("management.max_active_players_reached", { max: maxActive, current: activeCount }));
        return;
      }
    }
    setActivePlayerState(next);
    setIsTogglingActive(true);
    try {
      await updateMemberRoster(teamId, member.steamId, { activePlayer: next });
      updateMemberActiveStatus(member.steamId, next);
    } catch {
      setActivePlayerState(!next);
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
    } catch { /* stays unchanged */ } finally {
      setIsChangingRole(false);
    }
  };

  const handleChangeInGameRole = async (r: InGameRole | null) => {
    if (r === inGameRole) return;
    setIsChangingInGameRole(true);
    try {
      await updateMemberRoster(teamId, member.steamId, { inGameRole: r });
      setInGameRole(r);
      await refreshTeam();
    } catch {
      setInGameRole(member.inGameRole);
    } finally {
      setIsChangingInGameRole(false);
    }
  };

  const handleTransfer = async () => {
    const ok = await actions.promoteToOwner(member);
    if (ok) onClose();
  };

  const handleKick = async () => {
    const ok = await actions.kickMember(member);
    if (ok) onClose();
  };

  const handleSaveProfile = async (data: UserProfileUpdateDto) => {
    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile(member.steamId, data, teamId);
      setMemberProfile(updated);
      toast.success(t("profile.save_profile"));
      setIsEditingProfile(false);
      void refreshTeam();
    } catch {
      toast.error(t("profile.save_error"));
      throw new Error("save failed");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const resolvedFirstName    = memberProfile?.firstName    ?? member.firstName;
  const resolvedLastName     = memberProfile?.lastName     ?? member.lastName;
  const resolvedCustomUser   = memberProfile?.customUsername ?? member.customUsername;
  const resolvedCountryCode  = memberProfile?.countryCode  ?? member.countryCode;
  const resolvedDiscord      = memberProfile?.discord      ?? member.discord;
  const resolvedTwitter      = memberProfile?.twitter      ?? member.twitter;
  const resolvedHltv         = memberProfile?.hltv;
  const age                  = calcAge(memberProfile?.birthDate ?? member.birthDate);

  const tabs: TabId[] = ["information", "role", ...(canAccessDetails ? ["details" as TabId] : [])];
  const maxActive = getMaxActivePlayers(team?.game);
  const activeCount = members.filter((m) => m.activePlayer !== false).length;
  const atCapacity = activeCount >= maxActive;

  return (
    <div className="h-full flex flex-col bg-neutral-900 overflow-hidden">

      {/* ── Compact header ── */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-900 px-5 pt-4 pb-0">

        {/* Row 1: avatar + identity + close */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 ring-1 ring-neutral-700/60">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={displayName} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-base font-black text-neutral-500">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Name + country */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white truncate leading-tight">{member.nickname}</span>
              {member.countryCode && (
                <Flag code={member.countryCode} className="w-3.5 h-2.5 rounded-[2px] opacity-70 shrink-0" />
              )}
            </div>
            {resolvedCustomUser && resolvedCustomUser !== member.nickname && (
              <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">@{resolvedCustomUser}</p>
            )}
          </div>

          {/* Right: kick/leave + close */}
          <div className="flex items-center gap-1 shrink-0">
            {canKick && (
              <button
                onClick={handleKick}
                title={t("management.kick_member")}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            {canLeave && (
              <button
                onClick={() => actions.leaveTeam()}
                title={t("management.leave_team")}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
            ROLE_BADGE_STYLES[member.role]
          )}>
            {t(`roles.${member.role}`)}
          </span>
          {member.isOwner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Crown className="w-2.5 h-2.5" />Owner
            </span>
          )}
          {activePlayerState && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {t("management.roster_active")}
            </span>
          )}
          {inGameRole && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
              {IN_GAME_ROLE_LABELS[inGameRole]}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex -mx-5 px-5 border-t border-neutral-800/60">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors -mb-px border-b-2",
                activeTab === tab
                  ? "text-white border-indigo-500"
                  : "text-neutral-500 hover:text-neutral-300 border-transparent"
              )}
            >
              {t(`management.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">

          {/* ── Information tab ── */}
          {activeTab === "information" && (
            <div>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-10">
                  <Loader className="w-4 h-4 text-neutral-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <SectionLabel>{t("profile.identity")}</SectionLabel>
                    <Row
                      label={`${t("profile.first_name")} / ${t("profile.last_name")}`}
                      value={[resolvedFirstName, resolvedLastName].filter(Boolean).join(" ") || null}
                    />
                    <Row label={t("management.username")} value={resolvedCustomUser} />
                    <Row
                      label={t("profile.country")}
                      value={resolvedCountryCode ? (COUNTRY_LABELS[resolvedCountryCode] ?? resolvedCountryCode) : null}
                    />
                    {age !== null && (
                      <Row label={t("profile.age")} value={`${age} ${t("profile.years_old")}`} />
                    )}
                  </div>

                  <div>
                    <SectionLabel>{t("profile.gaming")}</SectionLabel>
                    {validLinks.includes("discord") && <Row label="Discord" value={resolvedDiscord} />}
                    {validLinks.includes("twitter") && <Row label="Twitter / X" value={resolvedTwitter} />}
                    {validLinks.includes("hltv")    && <Row label="HLTV" value={resolvedHltv} />}
                    <Row label="Steam ID" value={member.steamId} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Role tab ── */}
          {activeTab === "role" && (
            <div className="space-y-4">

              {/* Team role */}
              <div>
                <SectionLabel>
                  {t("management.team_role")}
                  {!canEditRole && (
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wide">{t("management.view_only")}</span>
                  )}
                </SectionLabel>
                {canEditRole ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleChangeRole(role)}
                        disabled={isChangingRole}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
                          role === member.role
                            ? ROLE_BADGE_STYLES[role]
                            : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-700",
                          "disabled:opacity-50"
                        )}
                      >
                        {t(`roles.${role}`)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={cn("px-3 py-2 rounded-lg text-xs font-semibold border", ROLE_BADGE_STYLES[member.role])}>
                    {t(`roles.${member.role}`)}
                  </div>
                )}
              </div>

              {/* Roster toggle */}
              <div>
                <SectionLabel>{t("management.roster_status")}</SectionLabel>
                <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-800/30 border border-neutral-800 rounded-lg">
                  <p className={cn(
                    "text-xs font-medium",
                    activePlayerState ? "text-emerald-300" : "text-neutral-400"
                  )}>
                    {activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}
                  </p>
                  {canEditRole && member.role === "PLAYER" ? (
                    <Toggle
                      checked={activePlayerState ?? false}
                      onChange={handleToggleActivePlayer}
                      disabled={isTogglingActive || (!activePlayerState && atCapacity)}
                    />
                  ) : (
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide",
                      activePlayerState
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-800 text-neutral-500 border-neutral-700"
                    )}>
                      {activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}
                    </span>
                  )}
                </div>
                {!activePlayerState && canEditRole && atCapacity && (
                  <p className="text-[11px] text-amber-500 mt-1.5">
                    {maxActive}/{maxActive} {t("management.active")}
                  </p>
                )}
              </div>

              {/* In-game role */}
              {activePlayerState && (
                <div>
                  <SectionLabel>
                    {t("management.in_game_role")}
                    {!canEditRole && (
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wide">{t("management.view_only")}</span>
                    )}
                  </SectionLabel>
                  {canEditRole ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleChangeInGameRole(null)}
                        disabled={isChangingInGameRole}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
                          inGameRole === null
                            ? "bg-neutral-700 text-white border-neutral-600"
                            : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-700",
                          "disabled:opacity-50"
                        )}
                      >—</button>
                      {getAvailableInGameRoles(team?.game).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleChangeInGameRole(role)}
                          disabled={isChangingInGameRole}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
                            role === inGameRole
                              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-700",
                            "disabled:opacity-50"
                          )}
                        >
                          {IN_GAME_ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-neutral-800/40 border border-neutral-800 rounded-lg">
                      <span className="text-xs text-neutral-200">{inGameRole ? IN_GAME_ROLE_LABELS[inGameRole] : "—"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Details tab ── */}
          {activeTab === "details" && canAccessDetails && (
            <div className="space-y-4">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-10">
                  <Loader className="w-4 h-4 text-neutral-600 animate-spin" />
                </div>
              ) : memberProfile ? (
                isEditingProfile ? (
                  <MemberProfileEditForm
                    profile={memberProfile}
                    game={team?.game}
                    onSave={handleSaveProfile}
                    onCancel={() => setIsEditingProfile(false)}
                    isSaving={isSavingProfile}
                  />
                ) : (
                  <>
                    <div>
                      <SectionLabel
                        action={
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide font-semibold"
                          >
                            {t("common.edit")}
                          </button>
                        }
                      >
                        {t("profile.identity")}
                      </SectionLabel>
                      <PrivateRow label={t("profile.first_name")}  value={memberProfile.firstName} />
                      <PrivateRow label={t("profile.last_name")}   value={memberProfile.lastName} />
                      <PrivateRow label={t("profile.birth_date")}  value={memberProfile.birthDate} />
                      <PrivateRow label={t("profile.country")}     value={memberProfile.countryCode} />
                    </div>

                    <div>
                      <SectionLabel>{t("profile.contact")}</SectionLabel>
                      <PrivateRow label={t("profile.email")}    value={memberProfile.email} />
                      <PrivateRow label={t("profile.phone")}    value={memberProfile.phone} />
                      <PrivateRow label={t("profile.address")}  value={memberProfile.address} />
                      <PrivateRow
                        label={`${t("profile.zip_code")} / ${t("profile.city")}`}
                        value={[memberProfile.zipCode, memberProfile.city].filter(Boolean).join(" ") || null}
                      />
                    </div>

                    <div>
                      <SectionLabel>{t("profile.gaming")}</SectionLabel>
                      <PrivateRow label={t("management.username")} value={memberProfile.customUsername} />
                      {validLinks.includes("discord") && <PrivateRow label="Discord"     value={memberProfile.discord} />}
                      {validLinks.includes("twitter") && <PrivateRow label="Twitter / X" value={memberProfile.twitter} />}
                      {validLinks.includes("hltv")    && <PrivateRow label="HLTV"        value={memberProfile.hltv} />}
                    </div>
                  </>
                )
              ) : null}

              {canTransfer && !isEditingProfile && (
                <div className="pt-2 border-t border-neutral-800">
                  <button
                    onClick={handleTransfer}
                    className="w-full px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    {t("management.transfer_to_member")}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
