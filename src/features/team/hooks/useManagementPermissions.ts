import type { TeamMember, TeamMembership } from "@/contexts/team/team.types.ts";

/**
 * Permissions hook – Contrat UX v1.2
 *
 * Règles :
 * - Owner = statut de propriété (indépendant du rôle)
 * - Owner a tous les droits
 * - Manager peut changer les rôles (y compris celui d'un owner)
 * - Manager ne peut PAS transférer/prendre la propriété
 * - Tout staff (MANAGER, COACH, ANALYST) peut : modifier roster, voir infos privées, modifier in-game role
 * - Seuls Owner + Manager peuvent : changer les rôles, kick, modifier profil d'un autre
 * - Tout staff peut inviter
 */
export function useManagementPermissions({
    currentSteamId,
    membership,
}: {
    currentSteamId: string;
    membership: TeamMembership;
}) {
    const isOwner = membership.isOwner;
    const isStaff = membership.role !== "PLAYER";
    const isManager = membership.role === "MANAGER";

    /* ── TEAM ── */

    const canEditTeam = (): boolean => isOwner || isManager;
    const canInvite = (): boolean => isOwner || isStaff;

    /* ── MEMBER PROFILE ── */

    /** Voir les informations personnelles (nom, email, téléphone, adresse) */
    const canViewPersonalInfo = (member: TeamMember): boolean => {
        if (member.steamId === currentSteamId) return true;
        return isOwner || isStaff;
    };

    /** Éditer profil d'un membre — Owner + Manager (pas soi-même, utiliser page profil) */
    const canEditMemberProfile = (member: TeamMember): boolean => {
        if (member.steamId === currentSteamId) return false;
        return isOwner || isManager;
    };

    /* ── MEMBER ROLE ── */

    /** Modifier le rôle d'un membre — Owner + Manager uniquement */
    const canEditMemberRole = (): boolean => isOwner || isManager;

    /* ── ROSTER ── */

    /** Modifier roster (actif/inactif, in-game role) — tout staff */
    const canEditRoster = (): boolean => isOwner || isStaff;

    /* ── OWNERSHIP ── */

    const canTransferOwnership = (member: TeamMember): boolean => {
        if (!isOwner) return false;
        if (member.isOwner) return false;
        if (member.steamId === currentSteamId) return false;
        return true;
    };

    /* ── KICK/LEAVE ── */

    const canKickMember = (member: TeamMember): boolean => {
        if (member.steamId === currentSteamId) return false;
        if (member.isOwner) return false;
        return isOwner || isManager;
    };

    const canLeave = (member: TeamMember): boolean => {
        if (member.steamId !== currentSteamId) return false;
        if (member.isOwner) return false;
        return true;
    };

    /* ── HELPERS ── */

    const hasAnyAction = (member: TeamMember): boolean =>
        canKickMember(member) ||
        canTransferOwnership(member) ||
        canLeave(member);

    return {
        isOwner,
        isManager,
        isStaff,
        canEditTeam,
        canInvite,
        canViewPersonalInfo,
        canEditMemberProfile,
        canEditMemberRole,
        canEditRoster,
        canTransferOwnership,
        canKickMember,
        canLeave,
        hasAnyAction,
    };
}
