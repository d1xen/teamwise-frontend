export type TeamRole = "PLAYER" | "COACH" | "ANALYST" | "MANAGER";

export type TeamMembershipDto = {
    role: TeamRole;
    isOwner: boolean;
};

export type TeamDto = {
    id: number;
    name: string;
    tag?: string | null;
    game?: string | null;
    logoUrl?: string | null;
    hltvUrl?: string | null;
    faceitUrl?: string | null;
    twitterUrl?: string | null;
    membership?: TeamMembershipDto;
    createdAt?: string | null; // ISO 8601 date-time
    updatedAt?: string | null; // ISO 8601 date-time
    description?: string | null;
};

export type TeamMemberDto = {
    steamId: string;
    nickname: string;
    role: TeamRole;
    isOwner: boolean;
    avatarUrl?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: string | null; // ISO 8601 date (YYYY-MM-DD)
    countryCode?: string | null; // ISO 2 letters (FR, US, GB...)
    customUsername?: string | null;
};

export type CreateTeamRequest = {
    name: string;
    tag: string;
    game: string;
    hltvUrl?: string | null;
    faceitUrl?: string | null;
    twitterUrl?: string | null;
};

export type UpdateTeamRequest = {
    name?: string;
    tag?: string;
    game?: string;
    hltvUrl?: string | null;
    faceitUrl?: string | null;
    twitterUrl?: string | null;
    logo?: File | null;
};

export type UpdateMemberRoleRequest = {
    role: TeamRole;
};

