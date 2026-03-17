import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { removeMember, transferOwnership } from "@/api/endpoints/team.api";
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

    const kickMember = async (member: TeamMember) => {
        const confirmed = window.confirm(
            t("management.confirm_kick", { nickname: member.nickname })
        );
        if (!confirmed) return;

        try {
            await removeMember(teamId, member.steamId);
            toast.success(t("management.member_kicked"));
            await refreshTeam();
        } catch {
            toast.error(t("common.error"));
        }
    };

    const promoteToOwner = async (member: TeamMember) => {
        const confirmed = window.confirm(
            t("management.confirm_transfer_owner", {
                nickname: member.nickname,
            })
        );
        if (!confirmed) return;

        try {
            await transferOwnership(teamId, member.steamId);
            toast.success(t("management.owner_transferred"));
            await refreshTeam();
        } catch {
            toast.error(t("common.error"));
        }
    };

    const leaveTeam = async () => {
        if (isOwner) {
            toast.error(t("management.owner_must_transfer"));
            return;
        }

        const confirmed = window.confirm(t("management.confirm_leave"));
        if (!confirmed) return;

        try {
            await removeMember(teamId, currentUserSteamId);
            resetTeam();
            window.location.href = "/select-team";
        } catch {
            toast.error(t("common.error"));
        }
    };

    return {
        kickMember,
        promoteToOwner,
        leaveTeam,
    };
}
