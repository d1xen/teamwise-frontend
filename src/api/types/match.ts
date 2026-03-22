// ============================================================================
// Enums
// ============================================================================

export type MatchType = "OFFICIAL" | "SCRIM";
export type MatchContext = "TOURNAMENT" | "QUALIFIER" | "LAN" | "REGULAR_SEASON";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MatchState = "UPCOMING" | "TO_COMPLETE" | "COMPLETED" | "CANCELLED";
export type MatchResult = "WIN" | "LOSE" | "DRAW";
export type MatchFormat = "BO1" | "BO3" | "BO5";
export type MatchLevel = "S" | "A" | "B" | "C";
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
    context: MatchContext | null;
    opponentName: string | null;
    opponentLogo: string | null;
    matchUrl: string | null;
    scheduledAt: string;
    playedAt: string | null;
    status: MatchStatus;
    state: MatchState;
    result: MatchResult | null;
    format: MatchFormat;
    competitionName: string | null;
    competitionStage: string | null;
    level: MatchLevel | null;
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
    context: MatchContext | null;
    opponentName: string | null;
    opponentLogo?: string | null;
    matchUrl?: string | null;
    scheduledAt: string;
    format: MatchFormat;
    competitionName?: string | null;
    competitionStage?: string | null;
    level?: MatchLevel | null;
    notes?: string | null;
};

export type UpdateMatchRequest = {
    type?: MatchType;
    context?: MatchContext;
    opponentName?: string | null;
    opponentLogo?: string | null;
    matchUrl?: string | null;
    scheduledAt?: string;
    format?: MatchFormat;
    competitionName?: string | null;
    competitionStage?: string | null;
    level?: MatchLevel | null;
    notes?: string | null;
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
    context: MatchContext | "";
    format: MatchFormat | "";
    opponent: string;
    competition: string;
    dateRange: DateRange;
};
