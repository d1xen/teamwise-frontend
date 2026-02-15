export interface Team {
    id: string;
    name: string;
    logoUrl?: string | undefined;
}

export interface TeamMembership {
    role: string;
    isOwner: boolean;
}

export interface TeamMember {
    steamId: string;
    nickname: string;
    role: string;
    isOwner: boolean;
    avatarUrl?: string | undefined;
}

export interface TeamContextType {
    team: Team | null;
    membership: TeamMembership | null;
    members: TeamMember[];
    isLoading: boolean;
    isReady: boolean;
    resetTeam: () => void;
}
