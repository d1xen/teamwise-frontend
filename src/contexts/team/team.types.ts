export type TeamRole = "PLAYER" | "COACH" | "ANALYST" | "MANAGER";

export interface Team {
    id: string;
    name: string;
    tag?: string;
    game?: string;
    logoUrl?: string;
    hltvUrl?: string;
    faceitUrl?: string;
    twitterUrl?: string;
    invitationToken?: string;
    // Métadonnées enrichies (optionnelles, à venir du backend)
    createdAt?: string;      // Date de création ISO 8601
    updatedAt?: string;      // Dernière mise à jour ISO 8601
    description?: string;    // Description de l'équipe
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
    firstName?: string;
    lastName?: string;
    email?: string;
    // Données enrichies pour TeamPage Premium (optionnelles, à venir du backend)
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
}
