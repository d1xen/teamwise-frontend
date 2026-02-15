import { apiClient } from "@/api/client/apiClient";
import type {
    CreateTeamRequest,
    TeamDto,
    TeamMemberDto,
    UpdateMemberRoleRequest,
    UpdateTeamRequest,
} from "@/api/types/team";

function buildTeamUpdateBody(payload: UpdateTeamRequest): BodyInit {
    if (payload.logo instanceof File) {
        const body = new FormData();
        if (typeof payload.name !== "undefined") body.append("name", payload.name);
        if (typeof payload.tag !== "undefined") body.append("tag", payload.tag);
        if (typeof payload.game !== "undefined") body.append("game", payload.game);
        if (typeof payload.hltvUrl !== "undefined") body.append("hltvUrl", payload.hltvUrl ?? "");
        if (typeof payload.faceitUrl !== "undefined") body.append("faceitUrl", payload.faceitUrl ?? "");
        if (typeof payload.twitterUrl !== "undefined") body.append("twitterUrl", payload.twitterUrl ?? "");
        body.append("logo", payload.logo);
        return body;
    }

    return JSON.stringify(payload);
}

export function getMyTeams(): Promise<TeamDto[]> {
    return apiClient<TeamDto[]>("/api/teams");
}

export function getTeam(teamId: string | number): Promise<TeamDto> {
    return apiClient<TeamDto>(`/api/teams/${teamId}`);
}

export function createTeam(payload: CreateTeamRequest): Promise<TeamDto> {
    return apiClient<TeamDto>("/api/teams", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateTeam(
    teamId: string | number,
    payload: UpdateTeamRequest
): Promise<TeamDto | void> {
    return apiClient<TeamDto | void>(`/api/teams/${teamId}`,
        {
            method: "PUT",
            body: buildTeamUpdateBody(payload),
        }
    );
}

export function deleteTeam(teamId: string | number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}`, { method: "DELETE" });
}

export function getMembers(teamId: string | number): Promise<TeamMemberDto[]> {
    return apiClient<TeamMemberDto[]>(`/api/teams/${teamId}/members`);
}

export function updateMemberRole(
    teamId: string | number,
    steamId: string,
    payload: UpdateMemberRoleRequest
): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/members/${steamId}/role`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function transferOwnership(
    teamId: string | number,
    steamId: string
): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/owner/${steamId}`, {
        method: "PUT",
    });
}

export function removeMember(
    teamId: string | number,
    steamId: string
): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/members/${steamId}`, {
        method: "DELETE",
    });
}

