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
}

export interface TeamContextType {
    team: Team | null;
    membership: TeamMembership | null;
    members: TeamMember[];
    isLoading: boolean;
    isReady: boolean;
    resetTeam: () => void;
}
