export interface AuthUser {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    hasTeam: boolean;
    profileCompleted: boolean;
}

