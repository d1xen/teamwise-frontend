import { apiClient } from "@/api/client/apiClient";
import type {
    CreateTeamRequest,
    SetMemberFaceitRequest,
    TeamDto,
    TeamMemberDto,
    UpdateMemberRoleRequest,
    UpdateMemberRosterRequest,
    UpdateTeamRequest,
} from "@/api/types/team";
import type { InvitationUrlResponse } from "@/api/types/invitation";

function buildTeamUpdateBody(payload: UpdateTeamRequest): BodyInit {
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

export function updateMemberRoster(
    teamId: string | number,
    steamId: string,
    payload: UpdateMemberRosterRequest
): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/members/${steamId}/roster`, {
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

export function joinTeamByInvitation(invitationToken: string): Promise<{ id: number; name: string }> {
    return apiClient<{ id: number; name: string }>(`/api/teams/join/${invitationToken}`, {
        method: "POST",
    });
}

export function createInvitation(teamId: string | number): Promise<InvitationUrlResponse> {
    return apiClient<InvitationUrlResponse>("/api/invitations", {
        method: "POST",
        body: JSON.stringify({ teamId: Number(teamId) }),
    });
}

export function uploadTeamLogo(teamId: string | number, file: File): Promise<TeamDto> {
    const body = new FormData();
    body.append("file", file);
    return apiClient<TeamDto>(`/api/teams/${teamId}/logo`, { method: "POST", body });
}

export function deleteTeamLogo(teamId: string | number): Promise<TeamDto> {
    return apiClient<TeamDto>(`/api/teams/${teamId}/logo`, { method: "DELETE" });
}

export function setMemberFaceit(
    teamId: string | number,
    steamId: string,
    payload: SetMemberFaceitRequest
): Promise<TeamMemberDto> {
    return apiClient<TeamMemberDto>(`/api/teams/${teamId}/members/${steamId}/faceit-id`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}
