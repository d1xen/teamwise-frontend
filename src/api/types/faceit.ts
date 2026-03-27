// ============================================================================
// OAuth2 player linking
// ============================================================================

export type FaceitStatusDto = {
    linked: boolean;
    faceitNickname: string | null;
};

// ============================================================================
// Sync results
// ============================================================================

export type FaceitImportResultDto = {
    imported: number;
    skipped: number;
    failed: number;
};
