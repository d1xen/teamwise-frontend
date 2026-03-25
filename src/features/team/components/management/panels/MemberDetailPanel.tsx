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
import { getAvailableInGameRoles, IN_GAME_ROLE_LABELS, getMaxActivePlayers, getValidLinksForGame } from "@/shared/config/gameConfig";
import { ROLE_BADGE_STYLES } from "@/shared/constants/roleStyles";
import { Crown, Loader, ArrowLeft } from "lucide-react";
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


export default function MemberDetailPanel({
  member, teamId, permissions, actions, onClose, team,
}: MemberDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { refreshTeam, members, updateMemberActiveStatus } = useTeam();

  const [editing, setEditing] = useState(false);
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
    setCurrentRole(role);
    if (currentRole === "PLAYER" && role !== "PLAYER") {
      setActivePlayerState(false);
      setInGameRole(null);
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

      // Save role if changed
      if (currentRole !== roleBeforeEdit.current.role) {
        await updateMemberRole(teamId, member.steamId, { role: currentRole });
      }
      // Save roster if changed
      if (activePlayerState !== roleBeforeEdit.current.active) {
        await updateMemberRoster(teamId, member.steamId, { activePlayer: activePlayerState ?? false });
        updateMemberActiveStatus(member.steamId, activePlayerState ?? false);
      }
      // Save in-game role if changed
      if (inGameRole !== roleBeforeEdit.current.inGameRole) {
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

      {/* ── Header ── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl mb-4">
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
          <div className="flex items-start gap-2 shrink-0">
            {canEdit && !editing && (
              <button onClick={startEditing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-colors">
                {t("common.edit")}
              </button>
            )}
            {editing && (
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  if (currentRole !== roleBeforeEdit.current.role) {
                    setConfirmAction("save_role_change");
                  } else {
                    handleSave();
                  }
                }} disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                  {isSavingProfile && <Loader className="w-3 h-3 animate-spin" />}
                  {t("common.save")}
                </button>
                <button onClick={cancelEditing} disabled={isSavingProfile}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors">
                  {t("common.cancel")}
                </button>
              </div>
            )}
            {!editing && canTransfer && (
              <button onClick={() => setConfirmAction("transfer")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800/60 border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                {t("management.transfer_ownership")}
              </button>
            )}
            {!editing && canKick && (
              <button onClick={() => setConfirmAction("kick")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
                {t("management.kick_member")}
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoadingProfile ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-4 h-4 text-neutral-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">

          {/* ── Information ── */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-6 py-5">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">{t("member_detail.tab_info")}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Cell label={t("management.username")} value={editing ? form.customUsername : customUser}
                editing={editing} onChange={v => setForm(p => ({ ...p, customUsername: v }))} />
              <Cell label={t("profile.country")} value={countryCode ? (COUNTRY_LABELS[countryCode] ?? countryCode) : null} />
              <Cell label={t("profile.first_name")} value={editing ? form.firstName : firstName}
                editing={editing} onChange={v => setForm(p => ({ ...p, firstName: v }))} placeholder="John" />
              <Cell label={t("profile.last_name")} value={editing ? form.lastName : lastName}
                editing={editing} onChange={v => setForm(p => ({ ...p, lastName: v }))} placeholder="Doe" />
              {!editing && age !== null && <Cell label={t("profile.age")} value={`${age} ${t("profile.years_old")}`} />}
              <Cell label={t("profile.email")} value={editing ? form.email : (memberProfile?.email ?? "")}
                editing={editing} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" placeholder="john@example.com" />
              <Cell label={t("profile.phone")} value={editing ? form.phone : (memberProfile?.phone ?? "")}
                editing={editing} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+33 6 12 34 56 78" />
              {validLinks.includes("discord") && <Cell label="Discord" value={editing ? form.discord : (memberProfile?.discord ?? member.discord)}
                editing={editing} onChange={v => setForm(p => ({ ...p, discord: v }))} />}
              {validLinks.includes("twitter") && <Cell label="Twitter / X" value={editing ? form.twitter : (memberProfile?.twitter ?? member.twitter)}
                editing={editing} onChange={v => setForm(p => ({ ...p, twitter: v }))} />}
              {validLinks.includes("hltv") && <Cell label="HLTV" value={editing ? form.hltv : (memberProfile?.hltv)}
                editing={editing} onChange={v => setForm(p => ({ ...p, hltv: v }))} />}
              <Cell label="Steam ID" value={member.steamId} full />
            </div>
          </div>

          {/* ── Role & Roster ── */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-6 py-5">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">{t("member_detail.tab_role")}</p>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">{t("management.team_role")}</p>
                {editing && canEditRole ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {ROLE_OPTIONS.map(role => (
                      <button key={role} onClick={() => handleChangeRole(role)} disabled={isSavingProfile}
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
                  {editing && canEditRoster && currentRole === "PLAYER" ? (
                    <Toggle checked={activePlayerState ?? false} onChange={handleToggleActive}
                      disabled={isSavingProfile || (!activePlayerState && atCapacity)} />
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
                  {editing && canEditRoster ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      <button onClick={() => handleChangeInGameRole(null)} disabled={isSavingProfile}
                        className={cn("px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50",
                          inGameRole === null ? "bg-neutral-700 text-white border-neutral-600"
                            : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                        )}>—</button>
                      {getAvailableInGameRoles(team?.game).map(role => (
                        <button key={role} onClick={() => handleChangeInGameRole(role)} disabled={isSavingProfile}
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
          </div>

          {/* ── Private ── */}
          {canViewPrivate && memberProfile && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-6 py-5">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">{t("member_detail.tab_private")}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Cell label={t("profile.birth_date")} value={editing ? form.birthDate : memberProfile.birthDate}
                  editing={editing} onChange={v => setForm(p => ({ ...p, birthDate: v }))} type="date" />
                <Cell label={t("profile.address")} value={editing ? form.address : memberProfile.address}
                  editing={editing} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="123 Main Street" />
                <Cell label={t("profile.zip_code")} value={editing ? form.zipCode : memberProfile.zipCode}
                  editing={editing} onChange={v => setForm(p => ({ ...p, zipCode: v }))} placeholder="75001" />
                <Cell label={t("profile.city")} value={editing ? form.city : memberProfile.city}
                  editing={editing} onChange={v => setForm(p => ({ ...p, city: v }))} placeholder="Paris" />
                <Cell label={t("meta.created_label")}
                  value={memberProfile.createdAt ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(memberProfile.createdAt)) : null} />
                <Cell label={t("meta.joined_label")}
                  value={member.joinedAt ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(member.joinedAt)) : null} />
              </div>
            </div>
          )}
        </div>
      )}

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
