// ============================================================================
// Enums
// ============================================================================

export type MatchType = "OFFICIAL" | "SCRIM";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MatchState = "UPCOMING" | "TO_COMPLETE" | "COMPLETED" | "CANCELLED";
export type MatchResult = "WIN" | "LOSE" | "DRAW";
export type MatchFormat = "BO1" | "BO3" | "BO5";
export type MatchSource = "MANUAL" | "FACEIT";

// ============================================================================
// Data Transfer Objects
// ============================================================================

export type MatchMapDto = {
    id: number;
    orderIndex: number;
    mapName: string | null;
    ourScore: number | null;
    theirScore: number | null;
};

export type MatchDto = {
    id: number;
    teamId: number;
    type: MatchType;
    opponentName: string | null;
    opponentLogo: string | null;
    matchUrl: string | null;
    scheduledAt: string;
    playedAt: string | null;
    status: MatchStatus;
    state: MatchState;
    result: MatchResult | null;
    format: MatchFormat;
    competitionId: number | null;
    competitionName: string | null;
    competitionType: string | null;
    competitionStage: string | null;
    notes: string | null;
    ignored: boolean;
    createdByNickname: string | null;
    updatedByNickname: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    maps: MatchMapDto[];
    source: MatchSource;
    faceitMatchId: string | null;
};

export type ToCompleteSection = {
    active: MatchDto[];
    ignored: MatchDto[];
};

export type MatchSummaryDto = {
    upcoming: MatchDto[];
    toComplete: ToCompleteSection;
    completed: MatchDto[];
};

// ============================================================================
// Request DTOs
// ============================================================================

export type CreateMatchRequest = {
    type: MatchType;
    opponentName: string | null;
    opponentLogo?: string | null;
    matchUrl?: string | null;
    scheduledAt: string;
    format: MatchFormat;
    competitionId?: number | null;
    notes?: string | null;
};

export type UpdateMatchRequest = {
    type?: MatchType | undefined;
    opponentName?: string | null | undefined;
    opponentLogo?: string | null | undefined;
    matchUrl?: string | null | undefined;
    scheduledAt?: string | undefined;
    format?: MatchFormat | undefined;
    competitionId?: number | null | undefined;
    notes?: string | null | undefined;
};

export type UpdateMapScoreRequest = {
    mapName?: string | null;
    ourScore: number | null;
    theirScore: number | null;
};

// ============================================================================
// Pagination
// ============================================================================

export type PagedMatchesDto = {
    content: MatchDto[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
};

export type MatchTab = "upcoming" | "to_complete" | "results" | "all";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

export type MatchFilters = {
    tab: MatchTab;
    type: MatchType | "";
    format: MatchFormat | "";
    opponent: string;
    competitionId: number | "";
    dateRange: DateRange;
};
