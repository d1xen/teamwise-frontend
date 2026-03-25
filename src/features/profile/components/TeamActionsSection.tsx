import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut, Crown, X, AlertTriangle, Loader } from "lucide-react";
import type { TeamMember } from "@/contexts/team/team.types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { cn } from "@/design-system";

interface TeamActionsSectionProps {
  isOwner: boolean;
  members: TeamMember[];
  currentSteamId: string;
  teamName: string;
  onTransferOwnership: (targetSteamId: string) => Promise<boolean>;
  onLeave: () => Promise<boolean>;
  onTransferAndLeave: (targetSteamId: string) => Promise<boolean>;
  onDeleteTeam: () => Promise<boolean>;
}

type ModalType = "leave" | "transfer" | "ownerLeave" | "lastMember" | null;

export default function TeamActionsSection({
  isOwner, members, currentSteamId, teamName,
  onTransferOwnership, onLeave, onTransferAndLeave, onDeleteTeam,
}: TeamActionsSectionProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const otherMembers = members.filter(m => m.steamId !== currentSteamId);
  const isLastMember = otherMembers.length === 0;

  const handleLeaveClick = () => {
    if (isOwner && isLastMember) setModal("lastMember");
    else if (isOwner) setModal("ownerLeave");
    else setModal("leave");
  };

  const handleTransferClick = () => {
    setSelectedTarget(null);
    setModal("transfer");
  };

  const handleConfirmLeave = async () => {
    setIsLoading(true);
    await onLeave();
    setIsLoading(false);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTarget) return;
    setIsLoading(true);
    const ok = await onTransferOwnership(selectedTarget);
    setIsLoading(false);
    if (ok) setModal(null);
  };

  const handleConfirmTransferAndLeave = async () => {
    if (!selectedTarget) return;
    setIsLoading(true);
    await onTransferAndLeave(selectedTarget);
    setIsLoading(false);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await onDeleteTeam();
    setIsLoading(false);
  };

  const closeModal = () => { if (!isLoading) { setModal(null); setSelectedTarget(null); setDeleteInput(""); } };

  return (
    <>
      <div className="flex items-center gap-2">
        {isOwner && !isLastMember && (
          <button onClick={handleTransferClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium transition-colors">
            <Crown className="w-3 h-3" />
            {t("team_actions.transfer_ownership")}
          </button>
        )}
        <button onClick={handleLeaveClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors">
          <LogOut className="w-3 h-3" />
          {t("team_actions.leave_team")}
        </button>
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">

            {/* ── Simple leave (non-owner) ── */}
            {modal === "leave" && (
              <>
                <div className="flex items-start gap-3 px-6 py-5 border-b border-neutral-800">
                  <div className="p-2 bg-red-500/10 rounded-lg shrink-0 mt-0.5">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white">{t("team_actions.leave_title")}</h2>
                    <p className="text-xs text-neutral-400 mt-1">{t("team_actions.leave_confirm")}</p>
                  </div>
                  <button onClick={closeModal} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <div className="flex gap-3 px-6 py-4">
                  <button onClick={closeModal} disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-[4px] transition-colors">
                    {t("common.cancel")}
                  </button>
                  <button onClick={handleConfirmLeave} disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-50">
                    {isLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    {t("team_actions.leave_team")}
                  </button>
                </div>
              </>
            )}

            {/* ── Owner leave (must transfer first) ── */}
            {modal === "ownerLeave" && (
              <>
                <div className="flex items-start gap-3 px-6 py-5 border-b border-neutral-800">
                  <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 mt-0.5">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white">{t("team_actions.owner_leave_title")}</h2>
                    <p className="text-xs text-neutral-400 mt-1">{t("team_actions.owner_leave_desc")}</p>
                  </div>
                  <button onClick={closeModal} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <div className="px-6 py-4 space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                  {otherMembers.map(m => (
                    <button key={m.steamId} onClick={() => setSelectedTarget(m.steamId)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left",
                        selectedTarget === m.steamId
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-neutral-800/30 border-neutral-800 hover:border-neutral-700"
                      )}>
                      <UserAvatar avatarUrl={m.avatarUrl} profileImageUrl={m.profileImageUrl}
                        nickname={m.customUsername ?? m.nickname} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.customUsername ?? m.nickname}</p>
                        <p className="text-[11px] text-neutral-500">{m.role}</p>
                      </div>
                      {selectedTarget === m.steamId && (
                        <span className="text-[10px] font-semibold text-amber-400 uppercase">Owner</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
                  <button onClick={closeModal} disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-[4px] transition-colors">
                    {t("common.cancel")}
                  </button>
                  <button onClick={handleConfirmTransferAndLeave} disabled={isLoading || !selectedTarget}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-40">
                    {isLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    {t("team_actions.transfer_and_leave")}
                  </button>
                </div>
              </>
            )}

            {/* ── Transfer ownership (stay in team) ── */}
            {modal === "transfer" && (
              <>
                <div className="flex items-start gap-3 px-6 py-5 border-b border-neutral-800">
                  <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 mt-0.5">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white">{t("team_actions.transfer_title")}</h2>
                    <p className="text-xs text-neutral-400 mt-1">{t("team_actions.transfer_desc")}</p>
                  </div>
                  <button onClick={closeModal} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <div className="px-6 py-4 space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                  {otherMembers.map(m => (
                    <button key={m.steamId} onClick={() => setSelectedTarget(m.steamId)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left",
                        selectedTarget === m.steamId
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-neutral-800/30 border-neutral-800 hover:border-neutral-700"
                      )}>
                      <UserAvatar avatarUrl={m.avatarUrl} profileImageUrl={m.profileImageUrl}
                        nickname={m.customUsername ?? m.nickname} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.customUsername ?? m.nickname}</p>
                        <p className="text-[11px] text-neutral-500">{m.role}</p>
                      </div>
                      {selectedTarget === m.steamId && (
                        <span className="text-[10px] font-semibold text-amber-400 uppercase">Owner</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
                  <button onClick={closeModal} disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-[4px] transition-colors">
                    {t("common.cancel")}
                  </button>
                  <button onClick={handleConfirmTransfer} disabled={isLoading || !selectedTarget}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-40">
                    {isLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    {t("team_actions.confirm_transfer")}
                  </button>
                </div>
              </>
            )}

            {/* ── Last member (must delete team — full confirmation) ── */}
            {modal === "lastMember" && (
              <>
                <div className="flex items-start gap-3 px-6 py-5 bg-red-950/30 border-b border-red-900/30">
                  <div className="p-2 bg-red-500/15 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white">{t("team_actions.last_member_title")}</h2>
                    <p className="text-xs text-red-400/80 mt-0.5">{t("team_actions.last_member_desc")}</p>
                  </div>
                  <button onClick={closeModal} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-neutral-400">{t("management.delete_confirm")}</p>
                  <ul className="space-y-2">
                    {(["delete_consequence_1", "delete_consequence_2", "delete_consequence_3"] as const).map(key => (
                      <li key={key} className="flex items-center gap-2.5 text-xs text-neutral-500">
                        <X className="w-3.5 h-3.5 text-red-500 shrink-0" />{t(`management.${key}`)}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs text-neutral-400">
                      {t("management.delete_type_to_confirm")}{" "}
                      <span className="font-mono font-semibold text-neutral-200">{teamName}</span>
                    </label>
                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                      placeholder={teamName} autoFocus
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-[4px] text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={closeModal} disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-[4px] transition-colors">
                    {t("common.cancel")}
                  </button>
                  <button onClick={handleConfirmDelete} disabled={isLoading || deleteInput !== teamName}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {isLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    {t("team_actions.delete_team")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
