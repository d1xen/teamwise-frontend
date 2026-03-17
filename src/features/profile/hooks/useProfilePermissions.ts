import { useAuth } from "@/contexts/auth/useAuth";
import type { TeamMember, TeamMembership } from "@/contexts/team/team.types";

interface ProfileEditPermissions {
    canEditOwnProfile: boolean;
    canEditOthersProfile: (member: TeamMember, membership: TeamMembership) => boolean;
    canViewProfile: boolean;
}

/**
 * Hook pour déterminer les permissions d'édition de profil
 * Basé sur le contrat API:
 * - Si steamId == user.steamId : édition autorisée
 * - Sinon : OWNER/MANAGER requis
 */
export function useProfilePermissions(): ProfileEditPermissions {
    const { user } = useAuth();

    const canEditOwnProfile = !!user;

    const canEditOthersProfile = (
        member: TeamMember,
        membership: TeamMembership
    ): boolean => {
        if (!user) return false;
        if (member.steamId === user.steamId) return true;

        // Seuls OWNER et MANAGER peuvent éditer les autres
        const isManagerOrOwner =
            membership.isOwner ||
            (membership.role === "MANAGER");

        return isManagerOrOwner;
    };

    const canViewProfile = !!user;

    return {
        canEditOwnProfile,
        canEditOthersProfile,
        canViewProfile,
    };
}


