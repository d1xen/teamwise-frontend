export interface AuthUser {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    hasTeam: boolean;
    profileCompleted: boolean;
}

