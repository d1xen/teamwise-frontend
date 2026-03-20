import { apiClient } from "@/api/client/apiClient";
import type {
    CreateMatchRequest,
    MatchDto,
    MatchFilters,
    MatchMapDto,
    MatchState,
    MatchSummaryDto,
    PagedMatchesDto,
    UpdateMapScoreRequest,
    UpdateMatchRequest,
} from "@/api/types/match";
import { dateRangeToFrom } from "@/shared/utils/dateUtils";

export function getMatches(teamId: string | number): Promise<MatchSummaryDto> {
    return apiClient<MatchSummaryDto>(`/api/teams/${teamId}/matches`);
}

export function createMatch(teamId: string | number, payload: CreateMatchRequest): Promise<MatchDto> {
    return apiClient<MatchDto>(`/api/teams/${teamId}/matches`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getMatch(matchId: number): Promise<MatchDto> {
    return apiClient<MatchDto>(`/api/matches/${matchId}`);
}

export function updateMatch(matchId: number, payload: UpdateMatchRequest): Promise<MatchDto> {
    return apiClient<MatchDto>(`/api/matches/${matchId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function cancelMatch(matchId: number): Promise<void> {
    return apiClient<void>(`/api/matches/${matchId}/cancel`, { method: "PATCH" });
}

export function ignoreMatch(matchId: number): Promise<void> {
    return apiClient<void>(`/api/matches/${matchId}/ignore`, { method: "PATCH" });
}

export function unignoreMatch(matchId: number): Promise<void> {
    return apiClient<void>(`/api/matches/${matchId}/unignore`, { method: "PATCH" });
}

export function deleteMatch(matchId: number): Promise<void> {
    return apiClient<void>(`/api/matches/${matchId}`, { method: "DELETE" });
}

export function getMaps(matchId: number): Promise<MatchMapDto[]> {
    return apiClient<MatchMapDto[]>(`/api/matches/${matchId}/maps`);
}

export function updateMapScore(matchId: number, mapId: number, payload: UpdateMapScoreRequest): Promise<MatchMapDto> {
    return apiClient<MatchMapDto>(`/api/matches/${matchId}/maps/${mapId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function getMatchesPaginated(
    teamId: string | number,
    filters: MatchFilters,
    page: number,
    size = 20
): Promise<PagedMatchesDto> {
    const params = new URLSearchParams();

    const stateMap: Record<MatchFilters["tab"], MatchState | null> = {
        upcoming: "UPCOMING",
        to_complete: "TO_COMPLETE",
        results: "COMPLETED",
        all: null,
    };
    const state = stateMap[filters.tab];
    if (state) params.set("state", state);
    if (filters.type)     params.set("type", filters.type);
    if (filters.context)  params.set("context", filters.context);
    if (filters.format)   params.set("format", filters.format);
    if (filters.opponent) params.set("opponent", filters.opponent.trim());

    if (filters.dateRange !== "all") {
        const from = dateRangeToFrom(filters.dateRange);
        if (from) params.set("from", from);
    }

    params.set("page", String(page));
    params.set("size", String(size));

    return apiClient<PagedMatchesDto>(`/api/teams/${teamId}/matches/paginated?${params.toString()}`);
}
