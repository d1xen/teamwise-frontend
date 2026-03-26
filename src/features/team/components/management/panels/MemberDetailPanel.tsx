import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole, Team } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import type { useTeamActions } from "@/features/team/hooks/useTeamActions";
import type { InGameRole } from "@/api/types/team";
import { getUserProfile, updateUserProfile } from "@/api/endpoints/profile.api";
import { updateMemberRole, updateMemberRoster } from "@/api/endpoints/team.api";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { Toggle } from "@/shared/components/Toggle";
import { UserAvatar } from "@/shared/components/UserAvatar";
import ImageUpload from "@/shared/components/ImageUpload";
import { getAvatarUrl } from "@/shared/utils/avatarUtils";
import { uploadMemberAvatar, deleteMemberAvatar } from "@/api/endpoints/profile.api";
import BirthDateSelect from "@/shared/components/BirthDateSelect";
import PhoneInput from "@/shared/components/PhoneInput";
import { getAvailableInGameRoles, IN_GAME_ROLE_LABELS, getMaxActivePlayers, getValidLinksForGame } from "@/shared/config/gameConfig";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Loader, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import DropdownMenu from "@/shared/components/DropdownMenu";
import type { DropdownMenuItem } from "@/shared/components/DropdownMenu";
import { cn } from "@/design-system";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { toast } from "react-hot-toast";
import Flag from "react-world-flags";

export interface MemberDetailPanelProps {
  member: TeamMember;
  teamId: string;
  permissions: ReturnType<typeof useManagementPermissions>;
  actions: ReturnType<typeof useTeamActions>;
  onClose: () => void;
  team?: Team;
}

const ROLE_OPTIONS: TeamRole[] = ["PLAYER", "COACH", "ANALYST", "MANAGER"];
const COUNTRY_LABELS: Record<string, string> = {
  FR: "France", BE: "Belgium", CH: "Switzerland", DE: "Germany", GB: "United Kingdom",
  US: "United States", CA: "Canada", ES: "Spain", IT: "Italy", NL: "Netherlands",
  PT: "Portugal", PL: "Poland", SE: "Sweden", DK: "Denmark", FI: "Finland",
  NO: "Norway", BR: "Brazil", RU: "Russia", TR: "Turkey", UA: "Ukraine",
  CZ: "Czech Republic", RO: "Romania", HU: "Hungary", AU: "Australia",
};

function calcAge(bd: string | null | undefined): number | null {
  if (!bd) return null;
  const b = new Date(bd), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

const INPUT_CLASS = "w-full h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors";

function formatDateDisplay(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Grid cell — label above value. Works for read and edit mode. */
function Cell({
  label, value, editing, onChange, type = "text", placeholder, full, locale, required, blurred,
}: {
  label: string;
  value: string | null | undefined;
  editing?: boolean;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
  locale?: string | undefined;
  required?: boolean | undefined;
  blurred?: boolean | undefined;
}) {
  const filled = Boolean(value && (typeof value === "string" ? value.trim() !== "" : true));
  const emailError = editing && type === "email" && value && !isValidEmail(value);
  const dot = required
    ? (filled ? "bg-emerald-400" : "bg-amber-400")
    : null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 mb-1">
        {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />}
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        {emailError && <span className="text-[9px] text-red-400">format invalide</span>}
      </div>
      {editing && onChange ? (
        type === "date" ? (
          <BirthDateSelect value={value ?? ""} onChange={onChange} />
        ) : type === "phone" ? (
          <PhoneInput value={value ?? ""} onChange={onChange} defaultCountry={locale} />
        ) : (
          <input
            type="text"
            value={value ?? ""}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? "—"}
            className={cn(INPUT_CLASS, emailError && "border-red-500/50 focus:border-red-500/50")}
          />
        )
      ) : (
        <p className={cn("h-7 flex items-center text-sm px-1", blurred ? "text-neutral-200 blur-[3px] select-none" : (filled ? "text-neutral-200" : "text-neutral-700"))}>
          {blurred ? (label.length > 8 ? "•••••" : label.length < 6 ? "••••••• •••••" : "••• •••••••• ••••• •• ••••••") : (type === "date" ? (formatDateDisplay(value, locale ?? "en") ?? "—") : (value || "—"))}
        </p>
      )}
    </div>
  );
}


export default function MemberDetailPanel({
  member, teamId, permissions, actions, onClose, team,
}: MemberDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { refreshTeam, members, updateMemberActiveStatus } = useTeam();

  const [editing, setEditing] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [privateLoaded, setPrivateLoaded] = useState(false);
  const [form, setForm] = useState({ customUsername: "", firstName: "", lastName: "", email: "", phone: "", discord: "", twitter: "", hltv: "", birthDate: "", address: "", zipCode: "", city: "" });
  const [memberProfile, setMemberProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentRole, setCurrentRole] = useState<TeamRole>(member.role);
  const [activePlayerState, setActivePlayerState] = useState<boolean | undefined>(member.activePlayer);
  const [inGameRole, setInGameRole] = useState<InGameRole | null | undefined>(member.inGameRole);

  // Sync local state when member prop changes (e.g. after refreshTeam or remount)
  useEffect(() => {
    if (!editing) {
      setCurrentRole(member.role);
      setActivePlayerState(member.activePlayer);
      setInGameRole(member.inGameRole);
    }
  }, [member.role, member.activePlayer, member.inGameRole, editing]);

  const isSelf = member.steamId === user?.steamId;
  const canEditRole = permissions.canEditMemberRole();
  const canEditRoster = permissions.canEditRoster();
  const canViewPrivate = permissions.canViewPersonalInfo(member);
  const canEditPrivate = permissions.canEditMemberProfile(member);
  const canKick = permissions.canKickMember(member);
  const canTransfer = permissions.canTransferOwnership(member);
  const canEdit = canEditRole || canEditRoster || canEditPrivate;

  const validLinks = getValidLinksForGame(team?.game);
  const displayName = member.customUsername || member.nickname;
  const firstName = memberProfile?.firstName ?? member.firstName;
  const lastName = memberProfile?.lastName ?? member.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const customUser = memberProfile?.customUsername ?? member.customUsername;
  const countryCode = memberProfile?.countryCode ?? member.countryCode;
  const age = calcAge(memberProfile?.birthDate ?? member.birthDate);


  useEffect(() => {
    let c = false;
    setIsLoadingProfile(true);
    getUserProfile(member.steamId, teamId)
      .then(p => { if (!c) setMemberProfile(p); })
      .catch(e => console.error("Profile load error:", e))
      .finally(() => { if (!c) setIsLoadingProfile(false); });
    return () => { c = true; };
  }, [member.steamId, teamId]);

  // Local-only during editing — saved on handleSave
  const handleToggleActive = () => {
    const next = !activePlayerState;
    if (next) { const max = getMaxActivePlayers(team?.game); const cnt = members.filter(m => m.activePlayer !== false).length; if (cnt >= max) { toast.error(t("management.max_active_players_reached", { max, current: cnt })); return; } }
    setActivePlayerState(next);
  };
  const handleChangeRole = (role: TeamRole) => {
    if (role === currentRole) return;
    const oldRole = currentRole;
    setCurrentRole(role);
    if (oldRole === "PLAYER" && role !== "PLAYER") {
      setActivePlayerState(false);
      setInGameRole(null);
    }
    if (oldRole !== "PLAYER" && role === "PLAYER") {
      setActivePlayerState(true);
    }
  };
  const handleChangeInGameRole = (r: InGameRole | null) => {
    setInGameRole(r);
  };
  const [confirmAction, setConfirmAction] = useState<"kick" | "transfer" | "save_role_change" | null>(null);

  const handleConfirmKick = async () => {
    if (await actions.kickMember(member.steamId)) { setConfirmAction(null); onClose(); }
  };
  const handleConfirmTransfer = async () => {
    if (await actions.transferOwnershipTo(member.steamId)) { setConfirmAction(null); onClose(); }
  };

  // Snapshot of role/roster state before editing, for cancel rollback
  const roleBeforeEdit = useRef({ role: currentRole, active: activePlayerState, inGameRole });

  const startEditing = () => {
    const p = memberProfile;
    setForm({
      customUsername: p?.customUsername ?? member.customUsername ?? "",
      firstName: p?.firstName ?? member.firstName ?? "",
      lastName: p?.lastName ?? member.lastName ?? "",
      email: p?.email ?? "",
      phone: p?.phone ?? "",
      discord: p?.discord ?? member.discord ?? "",
      twitter: p?.twitter ?? member.twitter ?? "",
      hltv: p?.hltv ?? "",
      birthDate: p?.birthDate ?? "",
      address: p?.address ?? "",
      zipCode: p?.zipCode ?? "",
      city: p?.city ?? "",
    });
    roleBeforeEdit.current = { role: currentRole, active: activePlayerState, inGameRole };
    setEditing(true);
  };
  const cancelEditing = () => {
    setCurrentRole(roleBeforeEdit.current.role);
    setActivePlayerState(roleBeforeEdit.current.active);
    setInGameRole(roleBeforeEdit.current.inGameRole);
    setEditing(false);
  };
  const handleSave = async () => {
    setIsSavingProfile(true);
    try {
      // Save profile fields
      const u = await updateUserProfile(member.steamId, {
        customUsername: form.customUsername.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        discord: form.discord.trim(),
        twitter: form.twitter.trim(),
        hltv: form.hltv.trim(),
        birthDate: form.birthDate,
        address: form.address.trim(),
        zipCode: form.zipCode.trim(),
        city: form.city.trim(),
      }, teamId);
      setMemberProfile(u);
      setForm({
        customUsername: u.customUsername ?? '', firstName: u.firstName ?? '',
        lastName: u.lastName ?? '', email: u.email ?? '',
        phone: u.phone ?? '', discord: u.discord ?? '',
        twitter: u.twitter ?? '', hltv: u.hltv ?? '',
        birthDate: u.birthDate ?? '', address: u.address ?? '',
        zipCode: u.zipCode ?? '', city: u.city ?? '',
      });

      // Save role if changed
      const roleChanged = currentRole !== roleBeforeEdit.current.role;
      if (roleChanged) {
        await updateMemberRole(teamId, member.steamId, { role: currentRole });
      }
      // Save roster if changed (always send after role change to ensure consistency)
      if (roleChanged || activePlayerState !== roleBeforeEdit.current.active) {
        await updateMemberRoster(teamId, member.steamId, { activePlayer: activePlayerState ?? false });
        updateMemberActiveStatus(member.steamId, activePlayerState ?? false);
      }
      // Save in-game role if changed
      if (roleChanged || inGameRole !== roleBeforeEdit.current.inGameRole) {
        await updateMemberRoster(teamId, member.steamId, { inGameRole: inGameRole ?? null });
      }

      setEditing(false);
      toast.success(t("profile.save_profile"));
      await refreshTeam();
    } catch { toast.error(t("profile.save_error")); }
    finally { setIsSavingProfile(false); }
  };

  const maxActive = getMaxActivePlayers(team?.game);
  const atCapacity = members.filter(m => m.activePlayer !== false).length >= maxActive;

  return (
    <div>
      {/* ── Back button ── */}
      <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("common.back")}
      </button>

      {/* ── Single card: Header + Content — same pattern as EditableProfileSection ── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl">
        <div className="flex items-start gap-4 px-5 py-4 border-b border-neutral-800">
          <div className="shrink-0 mt-1">
            {canEdit ? (
              <ImageUpload
                currentUrl={getAvatarUrl({ profileImageUrl: memberProfile?.profileImageUrl ?? member.profileImageUrl ?? null, avatarUrl: member.avatarUrl ?? null })}
                alt={displayName} shape="square" size={64} disabled={false}
                onUpload={async (file) => {
                  try {
                    const u = await uploadMemberAvatar(member.steamId, teamId, file);
                    setMemberProfile(u);
                    toast.success(t("profile.avatar_updated"));
                    await refreshTeam();
                    return u.profileImageUrl ?? u.avatarUrl ?? null;
                  } catch { toast.error(t("upload.error_generic")); return null; }
                }}
                {...((memberProfile?.profileImageUrl ?? member.profileImageUrl) ? {
                  onDelete: async () => {
                    const u = await deleteMemberAvatar(member.steamId, teamId);
                    setMemberProfile(u);
                    toast.success(t("profile.avatar_deleted"));
                    await refreshTeam();
                  }
                } : {})}
              />
            ) : (
              <UserAvatar profileImageUrl={member.profileImageUrl} avatarUrl={member.avatarUrl}
                nickname={displayName} size={64} className="ring-2 ring-neutral-700/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1: Nickname + Actions */}
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white truncate">{member.nickname}</h2>
              {member.countryCode && <Flag code={member.countryCode} className="w-5 h-3.5 rounded-[2px] opacity-80 shrink-0" />}
              {member.faceitNickname && (
                <a href={`https://www.faceit.com/en/players/${member.faceitNickname}`}
                  target="_blank" rel="noopener noreferrer"
                  title={`FACEIT · ${member.faceitNickname}`}
                  className="shrink-0 hover:opacity-80 transition-opacity">
                  <FaceitIcon className="w-4 h-4 text-orange-400" />
                </a>
              )}
              {fullName && <span className="text-sm text-neutral-400 truncate">{fullName}</span>}
              <div className="flex-1" />
              {editing ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => {
                    if (currentRole !== roleBeforeEdit.current.role) {
                      setConfirmAction("save_role_change");
                    } else {
                      handleSave();
                    }
                  }} disabled={isSavingProfile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                    {isSavingProfile && <Loader className="w-3 h-3 animate-spin" />}
                    {t("common.save")}
                  </button>
                  <button onClick={cancelEditing} disabled={isSavingProfile}
                    className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <DropdownMenu items={[
                  ...(canEdit ? [{ label: t("common.edit"), onClick: startEditing }] as DropdownMenuItem[] : []),
                  ...(canTransfer ? [{ label: t("management.transfer_ownership"), onClick: () => setConfirmAction("transfer") }] as DropdownMenuItem[] : []),
                  ...(canKick ? [{ label: t("management.kick_member"), onClick: () => setConfirmAction("kick"), variant: 'danger' as const }] : []),
                ]} />
              )}
            </div>
            {/* Row 2: Badges — profil → owner → role/status → in-game */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                member.profileCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                <CheckCircle2 className="w-2.5 h-2.5" />
                {member.profileCompleted ? t("profile.verified") : t("profile.not_verified")}
              </span>
              {member.isOwner && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Owner
                </span>
              )}
              {currentRole === "PLAYER" ? (
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                  activePlayerState
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-neutral-800 text-neutral-600 border-neutral-700"
                )}>
                  {activePlayerState ? t("management.player_active") : t("management.player_inactive")}
                </span>
              ) : (
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border", ROLE_BADGE_STYLES[currentRole])}>
                  {t(`roles.${currentRole}`)}
                </span>
              )}
              {inGameRole && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {IN_GAME_ROLE_LABELS[inGameRole]}
                </span>
              )}
            </div>
          </div>
        </div>

      {isLoadingProfile ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-4 h-4 text-neutral-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── 3-column layout — same as EditableProfileSection ── */}
          <div className="grid grid-cols-3 divide-x divide-neutral-800">

            {/* Column 1: Identity */}
            <div className="p-5 space-y-2.5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t("profile.identity")}</p>
              <Cell label={t("profile.first_name")} value={editing ? form.firstName : firstName}
                editing={editing} onChange={v => setForm(p => ({ ...p, firstName: v }))} placeholder="John" required />
              <Cell label={t("profile.last_name")} value={editing ? form.lastName : lastName}
                editing={editing} onChange={v => setForm(p => ({ ...p, lastName: v }))} placeholder="Doe" required />
              <Cell label={t("profile.country")} value={countryCode ? (COUNTRY_LABELS[countryCode] ?? countryCode) : null} required />
              <Cell label={t("management.username")} value={editing ? form.customUsername : customUser}
                editing={editing} onChange={v => setForm(p => ({ ...p, customUsername: v }))} />
              {!editing && age !== null && <Cell label={t("profile.age")} value={`${age} ${t("profile.years_old")}`} />}
              <Cell label="Steam ID" value={member.steamId} />
              {memberProfile?.createdAt && (
                <Cell label={t("meta.created_label")}
                  value={new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(memberProfile.createdAt))} />
              )}
              {member.joinedAt && (
                <Cell label={t("meta.joined_label")}
                  value={new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(member.joinedAt))} />
              )}
            </div>

            {/* Column 2: Contact + Private (blurred) */}
            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{t("profile.contact")}</p>
                {canViewPrivate && !editing && (
                  <button onClick={async () => {
                    if (!showPrivate && !privateLoaded) {
                      try {
                        const p = await getUserProfile(member.steamId, teamId, true);
                        setMemberProfile(p);
                        setPrivateLoaded(true);
                      } catch { toast.error(t("common.error")); return; }
                    }
                    setShowPrivate(prev => !prev);
                  }}
                    className="p-1 rounded text-neutral-600 hover:text-neutral-400 transition-colors"
                    title={showPrivate ? t("common.hide") : t("common.show")}>
                    {showPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <Cell label={t("profile.email")} value={editing ? form.email : (memberProfile?.email ?? "")}
                editing={editing} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" placeholder="john@example.com" required />
              <Cell label={t("profile.phone")} value={editing ? form.phone : (memberProfile?.phone ?? "")}
                editing={editing} onChange={v => setForm(p => ({ ...p, phone: v }))} type="phone" locale={memberProfile?.countryCode ?? member.countryCode ?? undefined} required />
              {canViewPrivate && memberProfile && (
                <>
                  <Cell label={t("profile.birth_date")} value={editing ? form.birthDate : memberProfile.birthDate}
                    editing={editing} onChange={v => setForm(p => ({ ...p, birthDate: v }))} type="date" locale={i18n.language} required />
                  {/* Private fields — values blurred unless toggled or editing */}
                  <Cell label={t("profile.address")} value={editing ? form.address : memberProfile.address}
                    editing={editing} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="123 Main Street" required blurred={!editing && !showPrivate} />
                  <Cell label={t("profile.zip_code")} value={editing ? form.zipCode : memberProfile.zipCode}
                    editing={editing} onChange={v => setForm(p => ({ ...p, zipCode: v }))} placeholder="75001" required blurred={!editing && !showPrivate} />
                  <Cell label={t("profile.city")} value={editing ? form.city : memberProfile.city}
                    editing={editing} onChange={v => setForm(p => ({ ...p, city: v }))} placeholder="Paris" required blurred={!editing && !showPrivate} />
                </>
              )}
            </div>

            {/* Column 3: Role & Roster + Links */}
            <div className="p-5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t("member_detail.tab_role")}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.team_role")}</p>
                  {editing && canEditRole ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {ROLE_OPTIONS.map(role => (
                        <button key={role} onClick={() => handleChangeRole(role)} disabled={isSavingProfile}
                          className={cn("px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all disabled:opacity-50",
                            role === currentRole ? ROLE_BADGE_STYLES[role]
                              : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                          )}>{t(`roles.${role}`)}</button>
                      ))}
                    </div>
                  ) : (
                    <span className={cn("inline-flex px-2 py-1 rounded-lg text-[10px] font-semibold border", ROLE_BADGE_STYLES[currentRole])}>
                      {t(`roles.${currentRole}`)}
                    </span>
                  )}
                </div>

                {currentRole === "PLAYER" && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.roster_status")}</p>
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-800/30 border border-neutral-800 rounded-lg">
                      <span className={cn("text-[11px] font-medium", activePlayerState ? "text-emerald-300" : "text-neutral-400")}>
                        {activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}
                      </span>
                      {editing && canEditRoster ? (
                        <Toggle checked={activePlayerState ?? false} onChange={handleToggleActive}
                          disabled={isSavingProfile || (!activePlayerState && atCapacity)} />
                      ) : (
                        <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase",
                          activePlayerState ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-neutral-800 text-neutral-500 border-neutral-700"
                        )}>{activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}</span>
                      )}
                    </div>
                  </div>
                )}

                {currentRole === "PLAYER" && activePlayerState && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.in_game_role")}</p>
                    {editing && canEditRoster ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button onClick={() => handleChangeInGameRole(null)} disabled={isSavingProfile}
                          className={cn("px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all disabled:opacity-50",
                            inGameRole === null ? "bg-neutral-700 text-white border-neutral-600"
                              : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                          )}>—</button>
                        {getAvailableInGameRoles(team?.game).map(role => (
                          <button key={role} onClick={() => handleChangeInGameRole(role)} disabled={isSavingProfile}
                            className={cn("px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all disabled:opacity-50",
                              role === inGameRole ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                            )}>{IN_GAME_ROLE_LABELS[role]}</button>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-lg text-[10px] bg-neutral-800/40 border border-neutral-800 text-neutral-200">
                        {inGameRole ? IN_GAME_ROLE_LABELS[inGameRole] : "—"}
                      </span>
                    )}
                  </div>
                )}

              </div>

              {/* Links & Socials */}
              {(validLinks.includes("discord") || validLinks.includes("twitter") || validLinks.includes("hltv")) && (
                <div className="pt-6 mt-8 -mx-5 px-5 border-t border-neutral-800 space-y-2.5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{t("management.links")}</p>
                  {editing ? (
                    <>
                      {validLinks.includes("discord") && <Cell label="Discord" value={form.discord}
                        editing onChange={v => setForm(p => ({ ...p, discord: v }))} placeholder="pseudo#1234" />}
                      {validLinks.includes("twitter") && <Cell label="Twitter / X" value={form.twitter}
                        editing onChange={v => setForm(p => ({ ...p, twitter: v }))} placeholder="https://twitter.com/..." />}
                      {validLinks.includes("hltv") && <Cell label="HLTV" value={form.hltv}
                        editing onChange={v => setForm(p => ({ ...p, hltv: v }))} placeholder="https://hltv.org/..." />}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      {validLinks.includes("discord") && (() => {
                        const val = memberProfile?.discord ?? member.discord;
                        return (
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase w-14 shrink-0">Discord</span>
                            {val ? <span className="text-sm text-indigo-300 font-mono">#{val}</span>
                              : <span className="text-sm text-neutral-700">—</span>}
                          </div>
                        );
                      })()}
                      {validLinks.includes("twitter") && (() => {
                        const val = memberProfile?.twitter ?? member.twitter;
                        return (
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase w-14 shrink-0">Twitter</span>
                            {val ? <a href={val.startsWith("http") ? val : `https://twitter.com/${val}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm text-indigo-300 hover:text-indigo-200 truncate transition-colors">
                              {val.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@")}
                            </a> : <span className="text-sm text-neutral-700">—</span>}
                          </div>
                        );
                      })()}
                      {validLinks.includes("hltv") && (() => {
                        const val = memberProfile?.hltv;
                        return (
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase w-14 shrink-0">HLTV</span>
                            {val ? <a href={val.startsWith("http") ? val : `https://hltv.org/player/${val}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm text-indigo-300 hover:text-indigo-200 truncate transition-colors">
                              {val.replace(/^https?:\/\/(www\.)?hltv\.org\//, "")}
                            </a> : <span className="text-sm text-neutral-700">—</span>}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>

      {confirmAction === "kick" && (
        <ConfirmModal
          title={t("management.kick_member")}
          description={t("management.confirm_kick", { nickname: member.customUsername ?? member.nickname })}
          confirmLabel={t("management.kick_member")}
          cancelLabel={t("common.cancel")}
          variant="danger"
          onConfirm={handleConfirmKick}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "transfer" && (
        <ConfirmModal
          title={t("management.transfer_ownership")}
          description={t("management.confirm_transfer", { nickname: member.customUsername ?? member.nickname })}
          confirmLabel={t("team_actions.confirm_transfer")}
          cancelLabel={t("common.cancel")}
          variant="default"
          onConfirm={handleConfirmTransfer}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "save_role_change" && (() => {
        const nickname = member.customUsername ?? member.nickname;
        const oldRole = roleBeforeEdit.current.role;
        const newRole = currentRole;
        return (
          <ConfirmModal
            title={t("management.role_change_confirm_title")}
            description={isSelf
              ? t("management.role_change_confirm_self", { oldRole: t(`roles.${oldRole}`), newRole: t(`roles.${newRole}`) })
              : t("management.role_change_confirm_other", { nickname, oldRole: t(`roles.${oldRole}`), newRole: t(`roles.${newRole}`) })
            }
            confirmLabel={t("common.confirm")}
            cancelLabel={t("common.cancel")}
            variant="warning"
            onConfirm={async () => { setConfirmAction(null); await handleSave(); }}
            onCancel={() => setConfirmAction(null)}
          >
            <div className="flex items-center justify-center gap-3 py-2">
              <span className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border", ROLE_BADGE_STYLES[oldRole])}>
                {t(`roles.${oldRole}`)}
              </span>
              <span className="text-neutral-600 text-xs">→</span>
              <span className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border", ROLE_BADGE_STYLES[newRole])}>
                {t(`roles.${newRole}`)}
              </span>
            </div>
          </ConfirmModal>
        );
      })()}
    </div>
  );
}
