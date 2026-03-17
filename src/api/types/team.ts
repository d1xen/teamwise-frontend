// ============================================================================
// Enums
// ============================================================================

export type Game = "CS2" | "VALORANT";

export type TeamRole = "PLAYER" | "COACH" | "ANALYST" | "MANAGER";

export type InGameRole = "RIFLER" | "SNIPER" | "IGL";

export type TeamLinkType = "HLTV" | "FACEIT" | "TWITTER";

export type TeamMemberLinkType = "HLTV" | "FACEIT";

// ============================================================================
// Data Transfer Objects
// ============================================================================

export type TeamLink = {
    type: TeamLinkType;
    url: string;
};

export type TeamMemberLink = {
    type: TeamMemberLinkType;
    url: string;
};

export type TeamMembershipDto = {
    role: TeamRole;
    isOwner: boolean;
};

export type MembersOverviewDto = {
    totalMembers: number;
    verifiedProfilesCount: number;
};

export type TeamDto = {
    id: number;
    name: string;
    tag?: string | null;
    game?: Game | null;
    logoUrl?: string | null;
    links?: TeamLink[] | null;
    membership?: TeamMembershipDto;
    membersOverview?: MembersOverviewDto | null;
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
    profileCompleted?: boolean;
    discord?: string | null;
    twitter?: string | null;
    inGameRole?: InGameRole | null;
    activePlayer?: boolean;
    links?: TeamMemberLink[] | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: string | null; // ISO 8601 date (YYYY-MM-DD)
    countryCode?: string | null; // ISO 2 letters (FR, US, GB...)
    customUsername?: string | null;
};

// ============================================================================
// Request DTOs
// ============================================================================

export type CreateTeamRequest = {
    name: string;
    tag: string;
    game: Game;
    logoUrl?: string | null;
    links?: TeamLink[];
};

export type UpdateTeamRequest = {
    name?: string;
    tag?: string;
    logoUrl?: string | null;
    links?: TeamLink[];
    logo?: File | null; // For form-based upload
};

export type UpdateMemberRoleRequest = {
    role: TeamRole;
};

export type UpdateMemberRosterRequest = {
    inGameRole?: InGameRole | null;
    activePlayer?: boolean;
};

