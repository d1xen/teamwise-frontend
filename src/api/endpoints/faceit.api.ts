import { apiClient } from "@/api/client/apiClient";
import type {
    FaceitDeimportResultDto,
    FaceitImportRequest,
    FaceitImportResultDto,
    FaceitStatusDto,
    SyncConfig,
    TeamFaceitOverviewDto,
} from "@/api/types/faceit";

// ── OAuth2 player linking ────────────────────────────────────────────────────

/** Returns the FACEIT authorization URL. The frontend opens it in a popup. */
export function initiateFaceitConnect(returnPath: string): Promise<{ authorizationUrl: string }> {
    return apiClient<{ authorizationUrl: string }>(
        `/api/faceit/connect?returnPath=${encodeURIComponent(returnPath)}`
    );
}

/** Returns the current FACEIT link status for the authenticated user. */
export function getFaceitStatus(): Promise<FaceitStatusDto> {
    return apiClient<FaceitStatusDto>("/api/faceit/connect/status");
}

/** Unlinks the FACEIT account from the authenticated user. */
export function disconnectFaceit(): Promise<void> {
    return apiClient<void>("/api/faceit/connect", { method: "DELETE" });
}

// ── Team competition overview ────────────────────────────────────────────────

/**
 * Returns the aggregated FACEIT competition history for a team.
 * Reconstructed from players' match histories — requires at least 3 linked players.
 */
export function getTeamFaceitOverview(
    teamId: string | number,
    refresh = false,
    config?: SyncConfig
): Promise<TeamFaceitOverviewDto> {
    const params = new URLSearchParams();
    if (refresh) params.set("refresh", "true");
    if (config) {
        params.set("months", String(config.months));
        config.corePlayerSteamIds.forEach(id => params.append("corePlayerSteamIds", id));
    }
    const query = params.toString();
    return apiClient<TeamFaceitOverviewDto>(
        `/api/teams/${teamId}/faceit/overview${query ? `?${query}` : ""}`
    );
}

export function importFaceitMatches(
    teamId: string | number,
    faceitMatchIds: string[]
): Promise<FaceitImportResultDto> {
    const body: FaceitImportRequest = { faceitMatchIds };
    return apiClient<FaceitImportResultDto>(`/api/teams/${teamId}/faceit/import`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function deimportFaceitMatches(
    teamId: string | number,
    faceitMatchIds: string[]
): Promise<FaceitDeimportResultDto> {
    const body: FaceitImportRequest = { faceitMatchIds };
    return apiClient<FaceitDeimportResultDto>(`/api/teams/${teamId}/faceit/import`, {
        method: "DELETE",
        body: JSON.stringify(body),
    });
}
