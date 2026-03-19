import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { removeMember, transferOwnership, deleteTeam as deleteTeamApi } from "@/api/endpoints/team.api";
import type { TeamMember } from "@/contexts/team/team.types.ts";
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

    const kickMember = async (member: TeamMember): Promise<boolean> => {
        const confirmed = window.confirm(
            t("management.confirm_kick", { nickname: member.nickname })
        );
        if (!confirmed) return false;

        try {
            await removeMember(teamId, member.steamId);
            toast.success(t("management.member_kicked"));
            await refreshTeam();
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    const promoteToOwner = async (member: TeamMember): Promise<boolean> => {
        const confirmed = window.confirm(
            t("management.confirm_transfer", {
                nickname: member.nickname,
            })
        );
        if (!confirmed) return false;

        try {
            await transferOwnership(teamId, member.steamId);
            toast.success(t("management.ownership_transferred"));
            await refreshTeam();
            return true;
        } catch {
            toast.error(t("common.error"));
            return false;
        }
    };

    const leaveTeam = async () => {
        if (isOwner) {
            toast.error(t("management.leave_owner_error"));
            return;
        }

        const confirmed = window.confirm(t("management.leave_confirm"));
        if (!confirmed) return;

        try {
            await removeMember(teamId, currentUserSteamId);
            resetTeam();
            window.location.href = "/select-team";
        } catch {
            toast.error(t("common.error"));
        }
    };

    const deleteTeam = async (): Promise<boolean> => {
        const confirmed = window.confirm(t("management.delete_confirm"));
        if (!confirmed) return false;

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
        promoteToOwner,
        leaveTeam,
        deleteTeam,
        deleteTeamConfirmed,
    };
}
