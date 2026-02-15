import { apiClient } from "@/api/client/apiClient";
import type {
    UserProfileDto,
    UserProfileUpdateDto,
} from "@/api/types/profile";

export type { UserProfileDto, UserProfileUpdateDto };

function buildTeamQuery(teamId: string | number): string {
    const params = new URLSearchParams({ teamId: String(teamId) });
    return `?${params.toString()}`;
}

export function getMyProfile(): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>("/api/users/me/profile");
}

export function getUserProfile(
    steamId: string,
    teamId: string | number
): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>(
        `/api/users/${steamId}/profile${buildTeamQuery(teamId)}`
    );
}

export function updateMyProfile(
    payload: UserProfileUpdateDto
): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>("/api/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function updateUserProfile(
    steamId: string,
    teamId: string | number,
    payload: UserProfileUpdateDto
): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>(
        `/api/users/${steamId}/profile${buildTeamQuery(teamId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}

