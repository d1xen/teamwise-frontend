import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole, Team } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import type { useTeamActions } from "@/features/team/hooks/useTeamActions";
import type { InGameRole } from "@/api/types/team";
import { getUserProfile, updateUserProfile } from "@/api/endpoints/profile.api";
import { updateMemberRole, updateMemberRoster } from "@/api/endpoints/team.api";
import type { UserProfileDto, UserProfileUpdateDto } from "@/api/endpoints/profile.api";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { Toggle } from "@/shared/components/Toggle";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { getAvailableInGameRoles, IN_GAME_ROLE_LABELS, getMaxActivePlayers, getValidLinksForGame } from "@/shared/config/gameConfig";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Crown, Loader, UserMinus, ArrowRightLeft, CheckCircle2, Circle, Lock, X } from "lucide-react";
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

type TabId = "info" | "role" | "private";

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
const VALUE_CLASS_FILLED = "h-7 flex items-center text-sm truncate text-neutral-200 px-1";
const VALUE_CLASS_EMPTY  = "h-7 flex items-center text-sm truncate text-neutral-700 px-1";

const MONTHS_LIST = [
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
  { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];

function formatDateDisplay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const month = MONTHS_LIST[parseInt(m, 10) - 1];
  return `${parseInt(d, 10)} ${month?.label ?? m} ${y}`;
}

function DateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = (value || "").split("-");
  const year = parts[0] ?? "", month = parts[1] ?? "", day = parts[2] ?? "";
  const update = (y: string, m: string, d: string) => {
    if (y.length === 4 && m && d) onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    else if (!y && !m && !d) onChange("");
  };
  const numCls = "h-7 text-sm text-center text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] outline-none focus:border-indigo-500/50 caret-indigo-400 transition-colors placeholder:text-neutral-600 tabular-nums";
  const selCls = "h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors";

  return (
    <div className="flex items-center gap-1.5">
      <input value={day} onChange={e => update(year, month, e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder="DD" maxLength={2} className={cn(numCls, "w-[40px]")} />
      <select value={month} onChange={e => update(year, e.target.value, day)} className={cn(selCls, "w-[64px]")}>
        <option value="">—</option>
        {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <input value={year} onChange={e => update(e.target.value.replace(/\D/g, "").slice(0, 4), month, day)}
        placeholder="YYYY" maxLength={4} className={cn(numCls, "w-[52px]")} />
    </div>
  );
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Grid cell — label above value. Works for read and edit mode. */
function Cell({
  label, value, editing, onChange, type = "text", placeholder, full,
}: {
  label: string;
  value: string | null | undefined;
  editing?: boolean;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  const filled = Boolean(value);
  const emailError = editing && type === "email" && value && !isValidEmail(value);
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        {emailError && <span className="text-[9px] text-red-400">format invalide</span>}
      </div>
      {editing && onChange ? (
        type === "date" ? (
          <DateEditor value={value ?? ""} onChange={onChange} />
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
        <p className={filled ? VALUE_CLASS_FILLED : VALUE_CLASS_EMPTY}>
          {type === "date" ? (formatDateDisplay(value) ?? "—") : (value || "—")}
        </p>
      )}
    </div>
  );
}

// ── Private tab with inline edit ──────────────────────────────────────────────

function PrivateTab({
  profile, canEdit, isSelf, isSaving, onSave, t, extraCells,
}: {
  profile: UserProfileDto;
  canEdit: boolean;
  isSelf: boolean;
  isSaving: boolean;
  onSave: (data: UserProfileUpdateDto) => Promise<void>;
  t: (key: string) => string;
  extraCells?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    birthDate: profile.birthDate ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    zipCode: profile.zipCode ?? "",
    city: profile.city ?? "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    await onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthDate: form.birthDate,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      zipCode: form.zipCode.trim(),
      city: form.city.trim(),
    });
    setEditing(false);
  };

  return (
    <div>
      {/* Action bar */}
      {(canEdit || isSelf) && (
        <div className="flex justify-end mb-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                {isSaving && <Loader className="w-3 h-3 animate-spin" />}
                {isSaving ? t("common.saving") : t("common.save")}
              </button>
              <button onClick={() => setEditing(false)} disabled={isSaving}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                {t("common.cancel")}
              </button>
            </div>
          ) : canEdit ? (
            <button onClick={() => setEditing(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              {t("common.edit")}
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-neutral-600">
              <Lock className="w-2.5 h-2.5" />{t("member_detail.edit_from_profile")}
            </span>
          )}
        </div>
      )}

      {/* Grid — same 2-col layout in read & edit */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Cell label={t("profile.first_name")} value={editing ? form.firstName : profile.firstName}
          editing={editing} onChange={v => set("firstName", v)} placeholder="John" />
        <Cell label={t("profile.last_name")} value={editing ? form.lastName : profile.lastName}
          editing={editing} onChange={v => set("lastName", v)} placeholder="Doe" />
        <Cell label={t("profile.birth_date")} value={editing ? form.birthDate : profile.birthDate}
          editing={editing} onChange={v => set("birthDate", v)} type="date" />
        <Cell label={t("profile.email")} value={editing ? form.email : profile.email}
          editing={editing} onChange={v => set("email", v)} type="email" placeholder="john@example.com" />
        <Cell label={t("profile.phone")} value={editing ? form.phone : profile.phone}
          editing={editing} onChange={v => set("phone", v)} placeholder="+33 6 12 34 56 78" />
        <Cell label={t("profile.address")} value={editing ? form.address : profile.address}
          editing={editing} onChange={v => set("address", v)} placeholder="123 Main Street" />
        <Cell label={t("profile.zip_code")} value={editing ? form.zipCode : profile.zipCode}
          editing={editing} onChange={v => set("zipCode", v)} placeholder="75001" />
        <Cell label={t("profile.city")} value={editing ? form.city : profile.city}
          editing={editing} onChange={v => set("city", v)} placeholder="Paris" />
        {extraCells}
      </div>
    </div>
  );
}

export default function MemberDetailPanel({
  member, teamId, permissions, actions, onClose, team,
}: MemberDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { refreshTeam, members, updateMemberActiveStatus } = useTeam();

  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [memberProfile, setMemberProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [currentRole, setCurrentRole] = useState<TeamRole>(member.role);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isChangingInGameRole, setIsChangingInGameRole] = useState(false);
  const [activePlayerState, setActivePlayerState] = useState<boolean | undefined>(member.activePlayer);
  const [inGameRole, setInGameRole] = useState<InGameRole | null | undefined>(member.inGameRole);

  const isSelf = member.steamId === user?.steamId;
  const canEditRole = permissions.canEditMemberRole();
  const canViewPrivate = permissions.canViewPersonalInfo(member);
  const canEditPrivate = permissions.canEditMemberProfile(member);
  const canKick = permissions.canKickMember(member);
  const canTransfer = permissions.canTransferOwnership(member);

  const validLinks = getValidLinksForGame(team?.game);
  const displayName = member.customUsername || member.nickname;
  const firstName = memberProfile?.firstName ?? member.firstName;
  const lastName = memberProfile?.lastName ?? member.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const customUser = memberProfile?.customUsername ?? member.customUsername;
  const countryCode = memberProfile?.countryCode ?? member.countryCode;
  const age = calcAge(memberProfile?.birthDate ?? member.birthDate);

  const tabs: { id: TabId; label: string }[] = [
    { id: "info", label: t("member_detail.tab_info") },
    { id: "role", label: t("member_detail.tab_role") },
    ...(canViewPrivate ? [{ id: "private" as TabId, label: t("member_detail.tab_private") }] : []),
  ];

  useEffect(() => {
    let c = false;
    setIsLoadingProfile(true);
    getUserProfile(member.steamId, teamId)
      .then(p => { if (!c) setMemberProfile(p); })
      .catch(e => console.error("Profile load error:", e))
      .finally(() => { if (!c) setIsLoadingProfile(false); });
    return () => { c = true; };
  }, [member.steamId, teamId]);

  const handleToggleActive = async () => {
    const next = !activePlayerState;
    if (next) { const max = getMaxActivePlayers(team?.game); const cnt = members.filter(m => m.activePlayer !== false).length; if (cnt >= max) { toast.error(t("management.max_active_players_reached", { max, current: cnt })); return; } }
    setActivePlayerState(next); setIsTogglingActive(true);
    try { await updateMemberRoster(teamId, member.steamId, { activePlayer: next }); updateMemberActiveStatus(member.steamId, next); }
    catch { setActivePlayerState(!next); } finally { setIsTogglingActive(false); }
  };
  const handleChangeRole = async (role: TeamRole) => {
    if (role === currentRole) return; setIsChangingRole(true);
    try {
      await updateMemberRole(teamId, member.steamId, { role });
      setCurrentRole(role);
      // Moving from PLAYER to staff → backend clears roster, sync local state
      if (currentRole === "PLAYER" && role !== "PLAYER") {
        setActivePlayerState(false);
        setInGameRole(null);
      }
      await refreshTeam();
    } catch {} finally { setIsChangingRole(false); }
  };
  const handleChangeInGameRole = async (r: InGameRole | null) => {
    if (r === inGameRole) return; setIsChangingInGameRole(true);
    try { await updateMemberRoster(teamId, member.steamId, { inGameRole: r }); setInGameRole(r); await refreshTeam(); }
    catch { setInGameRole(member.inGameRole); } finally { setIsChangingInGameRole(false); }
  };
  const [confirmAction, setConfirmAction] = useState<"kick" | "transfer" | null>(null);

  const handleConfirmKick = async () => {
    if (await actions.kickMember(member.steamId)) { setConfirmAction(null); onClose(); }
  };
  const handleConfirmTransfer = async () => {
    if (await actions.transferOwnershipTo(member.steamId)) { setConfirmAction(null); onClose(); }
  };
  const handleSaveProfile = async (data: UserProfileUpdateDto) => {
    setIsSavingProfile(true);
    try { const u = await updateUserProfile(member.steamId, data, teamId); setMemberProfile(u); toast.success(t("profile.save_profile")); void refreshTeam(); }
    catch { toast.error(t("profile.save_error")); } finally { setIsSavingProfile(false); }
  };

  const maxActive = getMaxActivePlayers(team?.game);
  const atCapacity = members.filter(m => m.activePlayer !== false).length >= maxActive;

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header ── */}
      <div className="shrink-0 border-b border-neutral-800">
        {/* Identity + actions */}
        <div className="flex gap-4 px-6 pt-5 pb-4">
          <UserAvatar profileImageUrl={member.profileImageUrl} avatarUrl={member.avatarUrl}
            nickname={displayName} size={56} className="ring-2 ring-neutral-700/50 shrink-0" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white truncate">{member.nickname}</span>
              {member.countryCode && <Flag code={member.countryCode} className="w-5 h-3.5 rounded-[2px] opacity-80 shrink-0" />}
            </div>
            {fullName && <p className="text-sm text-neutral-400 mt-0.5">{fullName}</p>}

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border", ROLE_BADGE_STYLES[currentRole])}>
                {t(`roles.${currentRole}`)}
              </span>
              {member.isOwner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Crown className="w-2.5 h-2.5" />Owner
                </span>
              )}
              {activePlayerState && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {t("management.roster_active")}
                </span>
              )}
              {inGameRole && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {IN_GAME_ROLE_LABELS[inGameRole]}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-0.5 shrink-0">
            {canTransfer && (
              <button onClick={() => setConfirmAction("transfer")} title={t("management.transfer_ownership")}
                className="p-2 rounded-lg text-neutral-600 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            )}
            {canKick && (
              <button onClick={() => setConfirmAction("kick")} title={t("management.kick_member")}
                className="p-2 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <UserMinus className="w-4 h-4" />
              </button>
            )}
            {(canTransfer || canKick) && <div className="w-px h-4 bg-neutral-800 mx-1 mt-2" />}
            <button onClick={onClose} className="p-2 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 -mb-px">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                activeTab === tab.id ? "text-white border-indigo-500" : "text-neutral-500 border-transparent hover:text-neutral-300"
              )}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-4 h-4 text-neutral-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Information ── */}
            {activeTab === "info" && (<>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Cell label={t("management.username")} value={customUser} />
                <Cell label={t("profile.country")} value={countryCode ? (COUNTRY_LABELS[countryCode] ?? countryCode) : null} />
                <Cell label={t("profile.first_name")} value={firstName} />
                <Cell label={t("profile.last_name")} value={lastName} />
                {age !== null && <Cell label={t("profile.age")} value={`${age} ${t("profile.years_old")}`} />}
                <Cell label={t("profile.email")} value={memberProfile?.email ?? member.email} />
                <Cell label={t("profile.phone")} value={memberProfile?.phone ?? member.phone} />
                {validLinks.includes("discord") && <Cell label="Discord" value={memberProfile?.discord ?? member.discord} />}
                {validLinks.includes("twitter") && <Cell label="Twitter / X" value={memberProfile?.twitter ?? member.twitter} />}
                {validLinks.includes("hltv") && <Cell label="HLTV" value={memberProfile?.hltv} />}
                <Cell label="Steam ID" value={member.steamId} full />
              </div>
            </>)}

            {/* ── Role & Roster ── */}
            {activeTab === "role" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{t("management.team_role")}</p>
                    {!canEditRole && <span className="text-[10px] text-neutral-700">{t("management.view_only")}</span>}
                  </div>
                  {canEditRole ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {ROLE_OPTIONS.map(role => (
                        <button key={role} onClick={() => handleChangeRole(role)} disabled={isChangingRole}
                          className={cn("px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50",
                            role === currentRole ? ROLE_BADGE_STYLES[role]
                              : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                          )}>{t(`roles.${role}`)}</button>
                      ))}
                    </div>
                  ) : (
                    <span className={cn("inline-flex px-2.5 py-1.5 rounded-lg text-xs font-semibold border", ROLE_BADGE_STYLES[currentRole])}>
                      {t(`roles.${currentRole}`)}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.roster_status")}</p>
                  <div className="flex items-center justify-between px-3 py-2 bg-neutral-800/30 border border-neutral-800 rounded-lg">
                    <span className={cn("text-xs font-medium", activePlayerState ? "text-emerald-300" : "text-neutral-400")}>
                      {activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}
                    </span>
                    {canEditRole && currentRole === "PLAYER" ? (
                      <Toggle checked={activePlayerState ?? false} onChange={handleToggleActive}
                        disabled={isTogglingActive || (!activePlayerState && atCapacity)} />
                    ) : (
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border uppercase",
                        activePlayerState ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-neutral-800 text-neutral-500 border-neutral-700"
                      )}>{activePlayerState ? t("management.roster_active") : t("management.roster_inactive")}</span>
                    )}
                  </div>
                </div>

                {activePlayerState && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.in_game_role")}</p>
                    {canEditRole ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        <button onClick={() => handleChangeInGameRole(null)} disabled={isChangingInGameRole}
                          className={cn("px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50",
                            inGameRole === null ? "bg-neutral-700 text-white border-neutral-600"
                              : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                          )}>—</button>
                        {getAvailableInGameRoles(team?.game).map(role => (
                          <button key={role} onClick={() => handleChangeInGameRole(role)} disabled={isChangingInGameRole}
                            className={cn("px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50",
                              role === inGameRole ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                            )}>{IN_GAME_ROLE_LABELS[role]}</button>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex px-2.5 py-1.5 rounded-lg text-xs bg-neutral-800/40 border border-neutral-800 text-neutral-200">
                        {inGameRole ? IN_GAME_ROLE_LABELS[inGameRole] : "—"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Private ── */}
            {activeTab === "private" && canViewPrivate && memberProfile && (
              <PrivateTab
                profile={memberProfile}
                canEdit={canEditPrivate}
                isSelf={isSelf}
                isSaving={isSavingProfile}
                onSave={handleSaveProfile}
                t={t}
                extraCells={<>
                  <Cell label={t("meta.created_label")}
                    value={memberProfile.createdAt ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(memberProfile.createdAt)) : null} />
                  <Cell label={t("meta.updated_label")}
                    value={memberProfile.updatedAt ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(memberProfile.updatedAt)) : null} />
                  <Cell label={t("meta.joined_label")}
                    value={member.joinedAt ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(member.joinedAt)) : null} />
                </>}
              />
            )}
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
    </div>
  );
}
