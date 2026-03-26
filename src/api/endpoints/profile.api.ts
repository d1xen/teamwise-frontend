import { apiClient } from "@/api/client/apiClient";
import type {
    UserProfileDto,
    UserProfileUpdateDto,
} from "@/api/types/profile";

export type { UserProfileDto, UserProfileUpdateDto };

function buildTeamQuery(teamId?: string | number): string {
    if (!teamId) return "";
    const params = new URLSearchParams({ teamId: String(teamId) });
    return `?${params.toString()}`;
}

export function getMyProfile(): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>("/api/users/me/profile");
}

export function getUserProfile(
    steamId: string,
    teamId?: string | number,
    includePrivate?: boolean
): Promise<UserProfileDto> {
    const query = buildTeamQuery(teamId);
    const sep = query ? '&' : '?';
    const privatePart = includePrivate ? `${sep}includePrivate=true` : '';
    return apiClient<UserProfileDto>(
        `/api/users/${steamId}/profile${query}${privatePart}`
    );
}

export function updateMyProfile(
    payload: UserProfileUpdateDto,
    teamId?: string | number
): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>(
        `/api/users/me/profile${buildTeamQuery(teamId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}

export function updateUserProfile(
    steamId: string,
    payload: UserProfileUpdateDto,
    teamId?: string | number
): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>(
        `/api/users/${steamId}/profile${buildTeamQuery(teamId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}

export function uploadAvatar(file: File): Promise<UserProfileDto> {
    const body = new FormData();
    body.append("file", file);
    return apiClient<UserProfileDto>("/api/users/me/avatar", { method: "POST", body });
}

export function deleteAvatar(): Promise<UserProfileDto> {
    return apiClient<UserProfileDto>("/api/users/me/avatar", { method: "DELETE" });
}

