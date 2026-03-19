import type { TeamMember, TeamMembership } from "@/contexts/team/team.types.ts";

/**
 * Permissions hook – Contrat UX v1.1
 *
 * Règles :
 * - role ≠ isOwner (Owner peut avoir n'importe quel role)
 * - Manager peut modifier role/profil de tous (Owner inclus)
 * - Manager ne peut jamais modifier isOwner
 * - Owner ne peut pas quitter sans transférer
 * - Seul Owner peut transférer propriété
 * - Tout staff (MANAGER, COACH, ANALYST, OWNER) peut inviter
 */
export function useManagementPermissions({
    currentSteamId,
    membership,
}: {
    currentSteamId: string;
    membership: TeamMembership;
}) {
    const isOwner = membership.isOwner;
    const isManager = membership.role === "MANAGER";
    const isPlayer = membership.role === "PLAYER";

    /* ─────────────────────────────────────────────────── */
    /* TEAM ACTIONS                                         */
    /* ─────────────────────────────────────────────────── */

    /** Éditer infos équipe (nom, tag, URLs, logo) */
    const canEditTeam = (): boolean => isOwner || isManager;

    /** Générer lien invitation — tous les membres staff (MANAGER, COACH, ANALYST, OWNER) */
    const canInvite = (): boolean => isOwner || !isPlayer;

    /* ─────────────────────────────────────────────────── */
    /* MEMBER PROFILE ACTIONS                              */
    /* ─────────────────────────────────────────────────── */

    /** Éditer profil d'un membre (firstName, lastName, email, etc.) */
    const canEditMemberProfile = (member: TeamMember): boolean => {
        // Éditer son propre profil
        if (member.steamId === currentSteamId) return true;
        // Owner peut éditer tous les profils
        if (isOwner) return true;
        // Manager peut éditer tous les profils (Owner inclus)
        if (isManager) return true;
        return false;
    };

    /* ─────────────────────────────────────────────────── */
    /* MEMBER ROLE ACTIONS                                 */
    /* ─────────────────────────────────────────────────── */

    /** Modifier le role d'un membre (PLAYER, COACH, ANALYST, MANAGER) */
    const canEditMemberRole = (): boolean => {
        // Owner peut modifier tous les roles
        if (isOwner) return true;
        // Manager peut modifier tous les roles (Owner inclus)
        if (isManager) return true;
        return false;
    };

    /* ─────────────────────────────────────────────────── */
    /* MEMBER OWNERSHIP ACTIONS                            */
    /* ─────────────────────────────────────────────────── */

    /** Transférer propriété à un membre */
    const canTransferOwnership = (member: TeamMember): boolean => {
        // Seul Owner peut transférer
        if (!isOwner) return false;
        // Cible ne doit pas être déjà Owner
        if (member.isOwner) return false;
        // Pas se transférer à soi-même
        if (member.steamId === currentSteamId) return false;
        return true;
    };

    /* ─────────────────────────────────────────────────── */
    /* MEMBER KICK/LEAVE ACTIONS                           */
    /* ─────────────────────────────────────────────────── */

    /** Exclure un membre (kick) */
    const canKickMember = (member: TeamMember): boolean => {
        // Ne peut pas se kick soi-même (utiliser canLeave)
        if (member.steamId === currentSteamId) return false;
        // Ne peut pas exclure Owner
        if (member.isOwner) return false;
        // Owner peut kick
        if (isOwner) return true;
        // Manager peut kick
        if (isManager) return true;
        return false;
    };

    /** Quitter l'équipe (leave) */
    const canLeave = (member: TeamMember): boolean => {
        // Doit être soi-même
        if (member.steamId !== currentSteamId) return false;
        // Owner ne peut pas quitter (doit transférer d'abord)
        if (member.isOwner) return false;
        return true;
    };

    /* ─────────────────────────────────────────────────── */
    /* HELPERS                                              */
    /* ─────────────────────────────────────────────────── */

    /** Vérifie si un membre a au moins une action possible */
    const hasAnyAction = (member: TeamMember): boolean =>
        canKickMember(member) ||
        canTransferOwnership(member) ||
        canLeave(member);

    return {
        // Status courant
        isOwner,
        isManager,

        // Team actions
        canEditTeam,
        canInvite,

        // Member profile
        canEditMemberProfile,

        // Member role
        canEditMemberRole,

        // Member ownership
        canTransferOwnership,

        // Member kick/leave
        canKickMember,
        canLeave,

        // Helpers
        hasAnyAction,

        // Aliases pour rétrocompatibilité
        canPromoteOwner: canTransferOwnership,
        canLeaveTeam: (member: TeamMember) =>
            member.steamId === currentSteamId && canLeave(member),
    };
}
