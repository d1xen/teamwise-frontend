import { apiClient } from "@/api/client/apiClient";
import type {
    CompetitionDto,
    CompetitionSummaryDto,
    CreateCompetitionRequest,
    UpdateCompetitionRequest,
} from "@/api/types/competition";

export function getCompetitions(teamId: string | number): Promise<CompetitionDto[]> {
    return apiClient<CompetitionDto[]>(`/api/teams/${teamId}/competitions`);
}

export function getCompetition(teamId: string | number, competitionId: number): Promise<CompetitionDto> {
    return apiClient<CompetitionDto>(`/api/teams/${teamId}/competitions/${competitionId}`);
}

export function getActiveCompetitions(teamId: string | number): Promise<CompetitionSummaryDto[]> {
    return apiClient<CompetitionSummaryDto[]>(`/api/teams/${teamId}/competitions/active`);
}

export function searchCompetitions(teamId: string | number, query: string): Promise<CompetitionSummaryDto[]> {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    return apiClient<CompetitionSummaryDto[]>(`/api/teams/${teamId}/competitions/search${params}`);
}

export function createCompetition(teamId: string | number, payload: CreateCompetitionRequest): Promise<CompetitionDto> {
    return apiClient<CompetitionDto>(`/api/teams/${teamId}/competitions`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateCompetition(teamId: string | number, competitionId: number, payload: UpdateCompetitionRequest): Promise<CompetitionDto> {
    return apiClient<CompetitionDto>(`/api/teams/${teamId}/competitions/${competitionId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteCompetition(teamId: string | number, competitionId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/competitions/${competitionId}`, { method: "DELETE" });
}

// ── Notes ──

import type { NoteDto } from "@/api/types/common";

export function getCompetitionNotes(teamId: string | number, competitionId: number): Promise<NoteDto[]> {
    return apiClient<NoteDto[]>(`/api/teams/${teamId}/competitions/${competitionId}/notes`);
}

export function addCompetitionNote(teamId: string | number, competitionId: number, content: string): Promise<NoteDto> {
    return apiClient<NoteDto>(`/api/teams/${teamId}/competitions/${competitionId}/notes`, {
        method: "POST", body: JSON.stringify({ content }),
    });
}

export function deleteCompetitionNote(teamId: string | number, competitionId: number, noteId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/competitions/${competitionId}/notes/${noteId}`, { method: "DELETE" });
}
