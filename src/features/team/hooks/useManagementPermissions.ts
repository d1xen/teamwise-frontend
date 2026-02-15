import type { TeamMember, TeamMembership } from "@/contexts/team/team.types.ts";

export function useManagementPermissions({
                                             currentSteamId,
                                             membership,
                                         }: {
    currentSteamId: string;
    membership: TeamMembership;
}) {
    const isOwner = membership.isOwner;
    const isManager = membership.role === "MANAGER";

    /* -------------------------------------------------- */
    /* Team                                                */
    /* -------------------------------------------------- */

    // OWNER + MANAGER peuvent éditer l’équipe
    const canEditTeam = () => isOwner || isManager;

    /* -------------------------------------------------- */
    /* Member – Profile                                    */
    /* -------------------------------------------------- */

    const canEditMemberProfile = (member: TeamMember) => {
        if (member.steamId === currentSteamId) return true;
        if (isOwner) return true;
        if (isManager && !member.isOwner) return true;
        return false;
    };

    /* -------------------------------------------------- */
    /* Member – Role                                       */
    /* -------------------------------------------------- */

    const canEditMemberRole = (member: TeamMember) => {
        if (isOwner) return true;
        if (isManager && !member.isOwner) return true;
        return false;
    };

    /* -------------------------------------------------- */
    /* Member – Actions                                    */
    /* -------------------------------------------------- */

    const canKickMember = (member: TeamMember) => {
        if (member.steamId === currentSteamId) return false;
        if (member.isOwner) return false;
        if (isOwner) return true;
        if (isManager) return true;
        return false;
    };

    const canPromoteOwner = (member: TeamMember) =>
        isOwner && !member.isOwner && member.steamId !== currentSteamId;

    const canLeaveTeam = (member: TeamMember) =>
        member.steamId === currentSteamId && !member.isOwner;

    const hasAnyAction = (member: TeamMember) =>
        canKickMember(member) ||
        canPromoteOwner(member) ||
        canLeaveTeam(member);

    return {
        isOwner,
        isManager,

        canEditTeam,
        canEditMemberProfile,
        canEditMemberRole,

        canKickMember,
        canPromoteOwner,
        canLeaveTeam,
        hasAnyAction,
    };
}
