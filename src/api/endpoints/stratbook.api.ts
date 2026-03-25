import { apiClient } from "@/api/client/apiClient";
import type {
    CreateStratNoteRequest,
    CreateStratRequest,
    PagedStratsDto,
    StratDto,
    StratFilters,
    StratSummaryDto,
    UpdateStratRequest,
} from "@/api/types/stratbook";
import type { NoteDto } from "@/api/types/common";

export function getStrats(
    teamId: string | number,
    filters: StratFilters,
    page: number,
    size = 20
): Promise<PagedStratsDto> {
    const params = new URLSearchParams();
    if (filters.map)        params.set("map", filters.map);
    if (filters.side)       params.set("side", filters.side);
    if (filters.type)       params.set("type", filters.type);
    if (filters.status)     params.set("status", filters.status);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.search)     params.set("search", filters.search.trim());
    if (filters.tag)        params.set("tag", filters.tag);
    if (filters.favoritesOnly) params.set("favoritesOnly", "true");
    params.set("page", String(page));
    params.set("size", String(size));
    return apiClient<PagedStratsDto>(`/api/teams/${teamId}/strats?${params.toString()}`);
}

export function getStrat(stratId: number): Promise<StratDto> {
    return apiClient<StratDto>(`/api/strats/${stratId}`);
}

export function createStrat(teamId: string | number, payload: CreateStratRequest): Promise<StratDto> {
    return apiClient<StratDto>(`/api/teams/${teamId}/strats`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateStrat(stratId: number, payload: UpdateStratRequest): Promise<StratDto> {
    return apiClient<StratDto>(`/api/strats/${stratId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteStrat(stratId: number): Promise<void> {
    return apiClient<void>(`/api/strats/${stratId}`, { method: "DELETE" });
}

export function duplicateStrat(stratId: number): Promise<StratDto> {
    return apiClient<StratDto>(`/api/strats/${stratId}/duplicate`, { method: "POST" });
}

export function addStratNote(stratId: number, payload: CreateStratNoteRequest): Promise<NoteDto> {
    return apiClient<NoteDto>(`/api/strats/${stratId}/notes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function deleteStratNote(stratId: number, noteId: number): Promise<void> {
    return apiClient<void>(`/api/strats/${stratId}/notes/${noteId}`, { method: "DELETE" });
}

export function toggleFavorite(stratId: number): Promise<{ favorited: boolean }> {
    return apiClient<{ favorited: boolean }>(`/api/strats/${stratId}/favorite`, { method: "POST" });
}

export function getFavoriteStrats(teamId: string | number): Promise<StratSummaryDto[]> {
    return apiClient<StratSummaryDto[]>(`/api/teams/${teamId}/strats/favorites`);
}
