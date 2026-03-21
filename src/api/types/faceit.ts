// ============================================================================
// OAuth2 player linking
// ============================================================================

export type FaceitStatusDto = {
    linked: boolean;
    faceitNickname: string | null;
};

// ============================================================================
// Sync configuration
// ============================================================================

export type SyncConfig = {
    /** How many months back to search for match history. */
    months: number;
    /**
     * Steam IDs of players to use as the team core for match qualification.
     * Empty array = all linked players (default behaviour).
     */
    corePlayerSteamIds: string[];
};

// ============================================================================
// Team competition overview
// ============================================================================

export type CompetitionCategory =
    | "ESEA_REGULAR_SEASON"
    | "ESEA_PLAYOFF"
    | "ESEA_QUALIFIER"
    | "PLAYOFF"
    | "QUALIFIER"
    | "CUP"
    | "CHAMPIONSHIP";

export type CompetitionSummaryDto = {
    competitionId: string;
    competitionName: string | null;
    competitionType: string | null;
    category: CompetitionCategory;
    season: string | null;
    region: string | null;
    division: string | null;
    isCurrent: boolean;
    /** Completed (finished) matches in this competition */
    matchCount: number;
    /** Upcoming (scheduled) matches in this competition */
    upcomingCount: number;
    /** How many are already imported into match history */
    importedCount: number;
    /** FACEIT match UUIDs — passed back to the import endpoint */
    matchIds: string[];
    /** Epoch seconds of the earliest team match. Null if no matches played. */
    firstMatchAt: number | null;
    /** Epoch seconds of the most recent team match. Null if no matches played. */
    lastMatchAt: number | null;
    /** Steam IDs of team members who participated in at least one match. */
    participatingSteamIds: string[];
};

export type TeamFaceitOverviewDto = {
    linkedPlayersCount: number;
    totalPlayersCount: number;
    /** All FACEIT match UUIDs already persisted in the team's history */
    importedFaceitMatchIds: string[];
    competitions: CompetitionSummaryDto[];
};

// ============================================================================
// Import
// ============================================================================

export type FaceitImportRequest = {
    faceitMatchIds: string[];
};

export type FaceitImportResultDto = {
    imported: number;
    skipped: number;
    failed: number;
};

export type FaceitDeimportResultDto = {
    removed: number;
};
