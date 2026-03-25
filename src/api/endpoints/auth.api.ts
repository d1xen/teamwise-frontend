import { apiClient } from "@/api/client/apiClient";
import { buildApiUrl } from "@/config/appConfig";

export type AuthResponseDto = {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    hasTeam: boolean;
    profileCompleted: boolean;
};

export const STEAM_AUTH_URL = buildApiUrl("/api/auth/steam");

export function getMe(): Promise<AuthResponseDto> {
    return apiClient<AuthResponseDto>("/api/auth/me");
}
