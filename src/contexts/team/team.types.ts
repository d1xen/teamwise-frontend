import type { Game, TeamLinkType, TeamMemberLinkType, InGameRole } from "@/api/types/team";
import type { TeamNationality } from "@/shared/utils/countryUtils";

export interface TeamLink {
    type: TeamLinkType;
    url: string;
}

export interface TeamMemberLink {
    type: TeamMemberLinkType;
    url: string;
}

export type TeamRole = "PLAYER" | "COACH" | "ANALYST" | "MANAGER";

export interface MembersOverview {
    totalMembers: number;
    verifiedProfilesCount: number;
}

export interface Team {
    id: string;
    name: string;
    tag?: string;
    game?: Game;
    logoUrl?: string;
    links?: TeamLink[];
    invitationToken?: string;
    membersOverview?: MembersOverview;
    // Métadonnées enrichies (optionnelles, à venir du backend)
    createdAt?: string;      // Date de création ISO 8601
    updatedAt?: string;      // Dernière mise à jour ISO 8601
    description?: string;    // Description de l'équipe
    nationality?: TeamNationality | null; // Nationalité calculée basée sur les joueurs
}

export interface TeamMembership {
    role: TeamRole;
    isOwner: boolean;
}

export interface TeamMember {
    steamId: string;
    nickname: string;
    role: TeamRole;
    isOwner: boolean;
    avatarUrl?: string;
    profileImageUrl?: string;
    profileCompleted?: boolean;
    discord?: string;
    twitter?: string;
    inGameRole?: InGameRole;
    activePlayer?: boolean;
    links?: TeamMemberLink[];
    // Données enrichies pour TeamPage Premium
    firstName?: string;
    lastName?: string;
    birthDate?: string;      // Format ISO 8601
    countryCode?: string;    // Code pays ISO (FR, US, etc.)
    customUsername?: string; // Pseudo personnalisé
}

export interface TeamContextType {
    team: Team | null;
    membership: TeamMembership | null;
    members: TeamMember[];
    isLoading: boolean;
    isReady: boolean;
    resetTeam: () => void;
    refreshTeam: () => Promise<void>;
    updateMemberActiveStatus: (steamId: string, activePlayer: boolean) => void;
}
