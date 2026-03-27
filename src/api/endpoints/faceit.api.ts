import { apiClient } from "@/api/client/apiClient";
import type {
    FaceitImportResultDto,
    FaceitStatusDto,
} from "@/api/types/faceit";

// ── OAuth2 player linking ────────────────────────────────────────────────────

export function initiateFaceitConnect(returnPath: string): Promise<{ authorizationUrl: string }> {
    return apiClient<{ authorizationUrl: string }>(
        `/api/faceit/connect?returnPath=${encodeURIComponent(returnPath)}`
    );
}

export function getFaceitStatus(): Promise<FaceitStatusDto> {
    return apiClient<FaceitStatusDto>("/api/faceit/connect/status");
}

export function disconnectFaceit(): Promise<void> {
    return apiClient<void>("/api/faceit/connect", { method: "DELETE" });
}

// ── FACEIT sync ──────────────────────────────────────────────────────────────

export function triggerFaceitSync(
    teamId: string | number,
    months = 1
): Promise<{ competitions: number; imported: number }> {
    return apiClient<{ competitions: number; imported: number }>(`/api/teams/${teamId}/faceit/sync?months=${months}`, {
        method: "POST",
    });
}

export function discoverFaceitCompetition(
    teamId: string | number,
    url: string
): Promise<FaceitImportResultDto> {
    return apiClient<FaceitImportResultDto>(`/api/teams/${teamId}/faceit/discover`, {
        method: "POST",
        body: JSON.stringify({ url }),
    });
}
