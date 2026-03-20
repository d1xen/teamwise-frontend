import { apiClient } from "@/api/client/apiClient";

export type AuthResponseDto = {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    hasTeam: boolean;
    profileCompleted: boolean;
};

export const STEAM_AUTH_URL = "/api/auth/steam";

export function getMe(): Promise<AuthResponseDto> {
    return apiClient<AuthResponseDto>("/api/auth/me");
}
