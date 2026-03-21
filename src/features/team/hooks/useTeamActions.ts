import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { removeMember, transferOwnership, deleteTeam as deleteTeamApi } from "@/api/endpoints/team.api";
import { useTeam } from "@/contexts/team/useTeam";

type UseTeamActionsParams = {
    teamId: string;
    currentUserSteamId: string;
    isOwner: boolean;
};

export function useTeamActions({
    teamId,
    currentUserSteamId,
    isOwner,
}: UseTeamActionsParams) {
    const { t } = useTranslation();
    const { refreshTeam, resetTeam } = useTeam();

    /** Kick a member — no confirmation, caller handles it via ConfirmModal. */
    const kickMember = async (steamId: string): Promise<boolean> => {
        try {
            await removeMember(teamId, steamId);
            toast.success(t("management.member_kicked"));
            await refreshTeam();
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    /** Transfer ownership — no confirmation, caller handles it. */
    const transferOwnershipTo = async (targetSteamId: string): Promise<boolean> => {
        try {
            await transferOwnership(teamId, targetSteamId);
            toast.success(t("management.ownership_transferred"));
            await refreshTeam();
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    /** Leave team — no confirmation, caller handles it. */
    const leaveTeamConfirmed = async (): Promise<boolean> => {
        try {
            await removeMember(teamId, currentUserSteamId);
            toast.success(t("management.leave_success"));
            resetTeam();
            window.location.href = "/select-team";
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    /** Transfer ownership + leave in one flow. */
    const transferAndLeave = async (targetSteamId: string): Promise<boolean> => {
        try {
            await transferOwnership(teamId, targetSteamId);
            await removeMember(teamId, currentUserSteamId);
            toast.success(t("management.leave_success"));
            resetTeam();
            window.location.href = "/select-team";
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    /** Delete team — no confirmation, caller handles it. */
    const deleteTeamConfirmed = async (): Promise<boolean> => {
        try {
            await deleteTeamApi(teamId);
            toast.success(t("management.delete_success"));
            resetTeam();
            window.location.href = "/select-team";
            return true;
        } catch {
            toast.error(t("management.delete_error"));
            return false;
        }
    };

    return {
        kickMember,
        transferOwnershipTo,
        leaveTeamConfirmed,
        transferAndLeave,
        deleteTeamConfirmed,
        isOwner,
    };
}
